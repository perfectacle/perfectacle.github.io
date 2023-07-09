---
title: (Spring) Transactional은 어떻게 적용되는 걸까??
tags:
  - Transactional
categories:
  - Back-end
  - Spring
---

우리가 만든 빈에 @Transactional 어노테이션을 사용하면 로직을 실행하기 전에 TransactionInterceptor를 타게 된다.  
심지어 @Transactional 어노테이션이 없이 우리가 만든 Repository 인터페이스의 메서드도 마찬가지이다.  
어떻게 이런 일들이 일어나는 걸까??

## [RepositoryProxyPostProcessor](https://github.com/spring-projects/spring-data-commons/blob/main/src/main/java/org/springframework/data/repository/core/support/RepositoryProxyPostProcessor.java#L27)
우선 Repository 인터페이스는 어떻게 TransactionInterceptor가 적용되는지 [RepositoryFactoryBeanSupport 클래스](https://github.com/spring-projects/spring-data-commons/blob/main/src/main/java/org/springframework/data/repository/core/support/RepositoryFactoryBeanSupport.java#L58)를 살펴보자.  

```java
public abstract class RepositoryFactoryBeanSupport<T extends Repository<S, ID>, S, ID>
    implements InitializingBean, RepositoryFactoryInformation<S, ID>, FactoryBean<T>, BeanClassLoaderAware,
    BeanFactoryAware, ApplicationEventPublisherAware {
    // ...
    private final Class<? extends T> repositoryInterface;
    private RepositoryFactorySupport factory;
    private Lazy<T> repository;
    private boolean lazyInit = false;
    // ...
    /**
     * Creates a new {@link RepositoryFactoryBeanSupport} for the given repository interface.
     *
     * @param repositoryInterface must not be {@literal null}.
     */
    protected RepositoryFactoryBeanSupport(Class<? extends T> repositoryInterface) {

        Assert.notNull(repositoryInterface, "Repository interface must not be null!");
        this.repositoryInterface = repositoryInterface;
    }
    // ...
    public T getObject() {
        return this.repository.get();
    }

    public Class<? extends T> getObjectType() {
        return repositoryInterface;
    }

    public boolean isSingleton() {
        return true;
    }
    
    public void afterPropertiesSet() {
    
        this.factory = createRepositoryFactory();
        this.factory.setQueryLookupStrategyKey(queryLookupStrategyKey);
        this.factory.setNamedQueries(namedQueries);
        this.factory.setEvaluationContextProvider(
                evaluationContextProvider.orElseGet(() -> QueryMethodEvaluationContextProvider.DEFAULT));
        this.factory.setBeanClassLoader(classLoader);
        this.factory.setBeanFactory(beanFactory);

        if (publisher != null) {
            this.factory.addRepositoryProxyPostProcessor(new EventPublishingRepositoryProxyPostProcessor(publisher));
        }

        repositoryBaseClass.ifPresent(this.factory::setRepositoryBaseClass);

        RepositoryFragments customImplementationFragment = customImplementation //
                .map(RepositoryFragments::just) //
                .orElseGet(RepositoryFragments::empty);

        RepositoryFragments repositoryFragmentsToUse = this.repositoryFragments //
                .orElseGet(RepositoryFragments::empty) //
                .append(customImplementationFragment);

        this.repositoryMetadata = this.factory.getRepositoryMetadata(repositoryInterface);

        // Make sure the aggregate root type is present in the MappingContext (e.g. for auditing)
        this.mappingContext.ifPresent(it -> it.getPersistentEntity(repositoryMetadata.getDomainType()));

        this.repository = Lazy.of(() -> this.factory.getRepository(repositoryInterface, repositoryFragmentsToUse));

        if (!lazyInit) {
            this.repository.get();
        }
    }
}
```
[FactoryBean](https://spring.io/blog/2011/08/09/what-s-a-factorybean) 을 스프링에서 설명하기로 객체의 생성 로직을 캡슐화한 패턴이라고 한다.
> A FactoryBean is a pattern to encapsulate interesting object construction logic in a class.

실제 빈이 주입될 때 호출될 때 사용되는 getObject() 메서드를 보면 repository를 가져와서 반환하고 있다.  
그리고 [InitializingBean](https://github.com/spring-projects/spring-framework/blob/main/spring-beans/src/main/java/org/springframework/beans/factory/InitializingBean.java)을 상속받고 있기 때문에 빈 생성 이후 afterPropertiesSet 메서드를 호출하는데 repository를 lazy하게 로딩할 때  
`this.repository = Lazy.of(() -> this.factory.getRepository(repositoryInterface, repositoryFragmentsToUse));` 요 부분이 사용된다.

```java
public abstract class RepositoryFactorySupport implements BeanClassLoaderAware, BeanFactoryAware {
    // ...
    private final List<RepositoryProxyPostProcessor> postProcessors;
    // ...
    public <T> T getRepository(Class<T> repositoryInterface, RepositoryFragments fragments) {
        // ...
        // Create proxy
        ProxyFactory result = new ProxyFactory();
        // ...
        postProcessors.forEach(processor -> processor.postProcess(result, information));
        // ...
        T repository = (T) result.getProxy(classLoader);
        // ...
        return repository;
    }
}
```
실제로 호출되는 메서드는 [RepositoryFactorySupport의 getRepository 메서드](https://github.com/spring-projects/spring-data-commons/blob/main/src/main/java/org/springframework/data/repository/core/support/RepositoryFactorySupport.java#L271)인데 여기서 프록시 객체를 만들고 postProcessors를 for-loop 돌면서 뭔가 처리하고 있다.

```java
/**
 * Callback interface used during repository proxy creation. Allows manipulating the {@link ProxyFactory} creating the
 * repository.
 *
 * @author Oliver Gierke
 */
public interface RepositoryProxyPostProcessor {

	/**
	 * Manipulates the {@link ProxyFactory}, e.g. add further interceptors to it.
	 *
	 * @param factory will never be {@literal null}.
	 * @param repositoryInformation will never be {@literal null}.
	 */
	void postProcess(ProxyFactory factory, RepositoryInformation repositoryInformation);
}
```
Repository 프록시 객체를 만들 때 콜백으로 호출해주는 메서드라고 한다.  
그 중에 주목할 구현체는 [TransactionalRepositoryProxyPostProcessor](https://github.com/spring-projects/spring-data-commons/blob/main/src/main/java/org/springframework/data/repository/core/support/TransactionalRepositoryProxyPostProcessor.java)이다.

```java
/**
 * {@link RepositoryProxyPostProcessor} to add transactional behaviour to repository proxies. Adds a
 * {@link PersistenceExceptionTranslationInterceptor} as well as an annotation based {@link TransactionInterceptor} to
 * the proxy.
 *
 * @author Oliver Gierke
 * @author Christoph Strobl
 * @author Mark Paluch
 */
class TransactionalRepositoryProxyPostProcessor implements RepositoryProxyPostProcessor {
    public void postProcess(ProxyFactory factory, RepositoryInformation repositoryInformation) {
    
        TransactionInterceptor transactionInterceptor = new TransactionInterceptor();
        transactionInterceptor.setTransactionAttributeSource(
                new RepositoryAnnotationTransactionAttributeSource(repositoryInformation, enableDefaultTransactions));
        transactionInterceptor.setTransactionManagerBeanName(transactionManagerName);
        transactionInterceptor.setBeanFactory(beanFactory);
        transactionInterceptor.afterPropertiesSet();

        factory.addAdvice(transactionInterceptor);
    }
}
``` 
프록시 객체를 인자로 받아서 TransactionInterceptor를 advice에 추가하고 있다.  
이렇기 때문에 @Transactional이 없는 Repository의 메서드를 사용하더라도 프록시 객체 생성 시에 TransactionInterceptor를 advice에 추가되기 때문에 TransactionInterceptor를 타는 현상을 볼 수 있다.

## [BeanFactoryTransactionAttributeSourceAdvisor](https://github.com/spring-projects/spring-framework/blob/main/spring-tx/src/main/java/org/springframework/transaction/interceptor/BeanFactoryTransactionAttributeSourceAdvisor.java)

