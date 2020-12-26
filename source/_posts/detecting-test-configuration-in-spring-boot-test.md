---
title: Spring Boot Test에서 Test Configuration 감지하기
tags: [Spring Boot, Test, JUnit]
category: [Spring Boot]
date: 2020-12-27 03:00:37
---
[Spring Boot Reference의 Testing - Detecting Test Configuration 파트](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-testing-spring-boot-applications-detecting-config)를 보면 다음과 같은 내용이 나온다.  
> If you are familiar with the Spring Test Framework, you may be used to using @ContextConfiguration(classes=…​) in order to specify which Spring @Configuration to load. Alternatively, you might have often used nested @Configuration classes within your test.
> When testing Spring Boot applications, this is often not required. Spring Boot’s @*Test annotations search for your primary configuration automatically whenever you do not explicitly define one.
> The search algorithm works up from the package that contains the test until it finds a class annotated with @SpringBootApplication or @SpringBootConfiguration.

Detecting Test Configuration을 위해서 스프링에 친숙하다면 @ContextConfiguration이나 Nested @Configuration이 필요하다고 하고,
Spring Boot를 사용하면 @*Test(@SpringBootTest, @WebMvcTest, @DataJpaTest, etc.)에서 별다른 설정을 하지 않았다면 primary configuration을 찾아나간다고 한다.  
우선 Spring Boot의 코어인 Spring의 관점에서 @ContextConfiguration, nested @Configuration를 살펴보자.

## N줄 요약
글이 길어지다보니 아무도 안 볼 거 같고, 집중을 하고 소스코드를 따라가면서 읽어야해서 우선 먼저 요약을 적어놓는다.

TestContext를 로딩하기 위한 Test Configuaration은 다음과 같은 우선순위를 가진다.
1. @ContextConfiguration 또는 @ContextHierarchy(여러 @ContextConfiguration을 포함)
2. Nested @Configuration
3. @SpringBootConfiguration (@SpringBootApplication 어노테이션이 @SpringBootConfiguration 어노테이션을 포함하고 있음)
4. Nested @TestConfiguration

1, 2, 3 중 하나는 필수이며 셋 중에 하나만 적용된다.  
Nested @TestConfiguration은 Nested @ContextConfiguration을 사용했을 때는 적용되지 않고, Nested @Configuration이나 @SpringBootConfiguration에 추가로 적용된다고 보면 된다.
Nested @Configuration은 여러 개 만들어도 전부 적용되고, Nested @TestConfiguration도 여러 개 만들어도 전부 추가로 적용된다. 

## @ContextConfiguration
[Spring 3.1](https://spring.io/blog/2011/06/21/spring-3-1-m2-testing-with-configuration-classes-and-profiles)에 추가된 기능으로 해당 블로그를 보면 아래와 같이 나와있다.
> At its core, the TestContext framework allows you to annotate test classes with @ContextConfiguration to specify which configuration files to use to load the ApplicationContext for your test.

@ContextConfiguration 어노테이션에 기술한 configuration file들이 ApplicationContext에 로딩되는 걸 TestContext framework에서 해준다는 내용이다.  
그럼 @ContextConfiguration에 기술할 수 있는 configuration file에는 무엇이 있을까?
[ContextConfiguration Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/context/ContextConfiguration.html)을 보면 다음과 같이 나와있다.  
> Component Classes
  The term component class can refer to any of the following.
  -A class annotated with @Configuration
  -A component (i.e., a class annotated with @Component, @Service, @Repository, etc.)
  -A JSR-330 compliant class that is annotated with javax.inject annotations
  -Any class that contains @Bean-methods
  -Any other class that is intended to be registered as a Spring component (i.e., a Spring bean in the ApplicationContext), potentially taking advantage of automatic autowiring of a single constructor without the use of Spring annotations

빈에 관련된 설정(@Configuration) 파일이나 빈에 등록될 수 있는 어노테이션(@Component, @Service, @Repository 등등)은 기본적으로 기술할 수 있다고 보면 된다.

테스트 코드를 통해 간단히 확인해보자
우선 src/main에 인터페이스를 하나 만들자.
```kotlin
interface SomeInterface
```

그리고 src/test에 구현체를 하나 만들어주자.
```kotlin
class SomeInterfaceInContextConfiguration : SomeInterface
```

이제 테스트 클래스를 작성해서 @ContextConfiguration의 간단한 동작을 검증해보자.
참고로 Spring Boot 2.1.x 미만에서는 @ExtendWith(SpringExtension::class)를 추가해줘야한다.  
또한 Spring Boot 2.2.x 미만에서는 @TestConstructor 어노테이션이 없기 때문에 생성자 안의 파라미터 마다 @Autowired 어노테이션을 추가해줘야한다.
그리고 JUnit 4에서는 Field Injection 밖에 지원하지 않기 때문에 Constructor Injection을 사용하려면 JUnit 5를 사용해야한다.
```kotlin
@SpringBootTest
@ContextConfiguration(classes = [SomeInterfaceInContextConfiguration::class])
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
internal class ContextConfigurationTest2(
    private val someInterface: SomeInterface
) {
    @Test
    internal fun `@ContextConfiguration에 기술된 Component Classes들이 Test Configuration으로 사용된다`() {
        assertThat(someInterface).isExactlyInstanceOf(SomeInterfaceInContextConfiguration::class.java)
    }
}
```

실제 어떻게 동작하는지 하나씩 찾아나가보자.
[@SpringBootTest 어노테이션](https://github.com/spring-projects/spring-boot/blob/master/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTest.java#L81)을 보면 그 안에 @ExtendWith(SpringExtension.class) 어노테이션이 포함돼있다.
또한 @BootstrapWith 어노테이션을 통해 어떤 클래스를 통해 Spring TestContext Framework를 부트스트랩할 지 명시하고 있다.  
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@BootstrapWith(SpringBootTestContextBootstrapper.class)
@ExtendWith(SpringExtension.class)
public @interface SpringBootTest {
``` 

그리고 [SpringExtension 클래스의 beforeAll 메서드](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L113)를 보면 testContextManager를 가져오고 있다.  
```java
@Override
public void beforeAll(ExtensionContext context) throws Exception {
    getTestContextManager(context).beforeTestClass();
}
```

그리고 그 안에서 [TestContextManager를 초기화](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L294)하고 있다.
```java
private static TestContextManager getTestContextManager(ExtensionContext context) {
    Assert.notNull(context, "ExtensionContext must not be null");
    Class<?> testClass = context.getRequiredTestClass();
    Store store = getStore(context);
    return store.getOrComputeIfAbsent(testClass, TestContextManager::new, TestContextManager.class);
}
```

[TestContextManager 생성자](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/TestContextManager.java#L122)에서는 TestContextBootstrapper를 resolving하고 있다.
```java
public TestContextManager(Class<?> testClass) {
    this(BootstrapUtils.resolveTestContextBootstrapper(BootstrapUtils.createBootstrapContext(testClass)));
}
```

[BootstrapUtils.resolveTestContextBootstrapper 메서드 안에서는 resolveExplicitTestContextBootstrapper 메서드를 호출](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/BootstrapUtils.java#L130)하고 있다.
```java
static TestContextBootstrapper resolveTestContextBootstrapper(BootstrapContext bootstrapContext) {
    Class<?> testClass = bootstrapContext.getTestClass();

    Class<?> clazz = null;
    try {
        clazz = resolveExplicitTestContextBootstrapper(testClass);
```

resolveExplicitTestContextBootstrapper 메서드를 보면 testClass에 달려있는 BootstrapWith 어노테이션을 사용하는 걸 볼 수 있다.
```java
private static Class<?> resolveExplicitTestContextBootstrapper(Class<?> testClass) {
    Set<BootstrapWith> annotations = new LinkedHashSet<>();
    AnnotationDescriptor<BootstrapWith> descriptor =
            TestContextAnnotationUtils.findAnnotationDescriptor(testClass, BootstrapWith.class);
    while (descriptor != null) {
        annotations.addAll(descriptor.findAllLocalMergedAnnotations());
        descriptor = descriptor.next();
    }

    if (annotations.isEmpty()) {
        return null;
    }
    if (annotations.size() == 1) {
        return annotations.iterator().next().value();
    }

    // Allow directly-present annotation to override annotations that are meta-present.
    BootstrapWith bootstrapWith = testClass.getDeclaredAnnotation(BootstrapWith.class);
    if (bootstrapWith != null) {
        return bootstrapWith.value();
    }

    throw new IllegalStateException(String.format(
            "Configuration error: found multiple declarations of @BootstrapWith for test class [%s]: %s",
            testClass.getName(), annotations));
}
```
1. testClass에 BootstrapWith 어노테이션을 찾는다.  
2. 없으면 null을 반환한다.
3. 하나만 있으면 어노테이션의 value에 기술된 TestContextBootstrapper 클래스를 반환한다.
4. 두 개 이상이면 테스트 클래스에 직접적으로 기술된 BootstrapWith 어노테이션을 찾는다.
5. 있으면 value에 기술된 TestContextBootstrapper 클래스를 반환한다.
6. 없으면 우선순위 충돌로 인해 multiple @BootstrapWith 어노테이션을 발견했다는 에러를 반환한다.

우리는 @SpringBootTest 어노테이션에 있는 @BootstrapWith(SpringBootTestContextBootstrapper.class) 하나만 기술돼있기 때문에 SpringBootTestContextBootstrapper가 반환된다 

이제 testContextBootstrapper를 구했으면 인자로 넘겨서 TestContextManager를 초기화 하고 있는데 [TestContextManager 생성자](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/TestContextManager.java#L136) 안에서는 testContext를 만들고 있다.
```java
public TestContextManager(TestContextBootstrapper testContextBootstrapper) {
    this.testContext = testContextBootstrapper.buildTestContext();
    registerTestExecutionListeners(testContextBootstrapper.getTestExecutionListeners());
}
```

그리고 메서드를 쭉쭉 타고 들어가다보면 [AbstractTestContextBootstrapper 클래스의 buildMergedContextConfiguration 메서드에서 ContextConfiguration 어노테이션 유무를 판단](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/support/AbstractTestContextBootstrapper.java#L265)하고 처리하고 있다.
```java
public final MergedContextConfiguration buildMergedContextConfiguration() {
    Class<?> testClass = getBootstrapContext().getTestClass();
    CacheAwareContextLoaderDelegate cacheAwareContextLoaderDelegate = getCacheAwareContextLoaderDelegate();

    if (TestContextAnnotationUtils.findAnnotationDescriptorForTypes(
            testClass, ContextConfiguration.class, ContextHierarchy.class) == null) {
        return buildDefaultMergedContextConfiguration(testClass, cacheAwareContextLoaderDelegate);
    }

    if (TestContextAnnotationUtils.findAnnotationDescriptor(testClass, ContextHierarchy.class) != null) {
        // ...
    } 
    else {
        return buildMergedContextConfiguration(testClass,
                            ContextLoaderUtils.resolveContextConfigurationAttributes(testClass),
                            null, cacheAwareContextLoaderDelegate, true);
    }
}
```

1. testClass에 ContextConfiguration 어노테이션이나 ContextHierarchy 어노테이션이 포함됐는지 확인한다.
2. 포함됐으면 ContextHierarchy 어노테이션이 포함됐는지 확인 후에 처리한 걸 반환한다.
3. ContextConfiguration 어노테이션이 포함됐는지 확인 후에 처리한 걸 반환한다.  

3번에 의해 동작이 되는 거라고 보면 된다.  
@ContextHierarchy 어노테이션은 @ContextConfiguration을 배열로 가지는 어노테이션으로 여러 @ContextConfiguration이 필요할 때 사용하면 된다.

## Nested @Configuration
우선 동작하는 코드를 간단히 살펴보자.
src/test에 인터페이스의 구현체를 하나 더 추가해보자.  
```kotlin
class SomeInterfaceInNestedConfiguration : SomeInterface
```

그리고 테스트 코드를 통해 검증해보자
```kotlin
@SpringBootTest
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
internal class NestedConfigurationTest(
    private val someInterface: SomeInterface
) {
    @Configuration
    internal class Config {
        @Bean
        fun someInterface() = SomeInterfaceInNestedConfiguration()
    }

    @Test
    internal fun `@ContextConfiguration 어노테이션 다음으로는 Nested @Configuration 클래스가 Test Configuration으로 사용된다`() {
        assertThat(someInterface).isExactlyInstanceOf(SomeInterfaceInNestedConfiguration::class.java)
    }
}
```

이제 실제로 어떻게 동작하는지 또 알아보자.
기본적으로 위에 설정한 동작방식 그대로를 쫓아가다가 분기문에서 갈라진다고 보면 된다.  
[AbstractTestContextBootstrapper 클래스의 buildMergedContextConfiguration 메서드에서 ContextConfiguration 어노테이션 유무를 판단](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/support/AbstractTestContextBootstrapper.java#L265)하고 있는 걸 위에서 살펴보았다.
```java
public final MergedContextConfiguration buildMergedContextConfiguration() {
    Class<?> testClass = getBootstrapContext().getTestClass();
    CacheAwareContextLoaderDelegate cacheAwareContextLoaderDelegate = getCacheAwareContextLoaderDelegate();

    if (TestContextAnnotationUtils.findAnnotationDescriptorForTypes(
            testClass, ContextConfiguration.class, ContextHierarchy.class) == null) {
        return buildDefaultMergedContextConfiguration(testClass, cacheAwareContextLoaderDelegate);
    }
    // ...
}
```

우리 클래스에서는 해당 어노테이션이 없기 때문에 buildDefaultMergedContextConfiguration 메서드를 쭉쭉 타고 보면 [buildMergedContextConfiguration 메서드](https://github.com/spring-projects/spring-framework/blob/885f6dbab94712fa76545276058a62216e17881e/spring-test/src/main/java/org/springframework/test/context/support/AbstractTestContextBootstrapper.java#L338)까지 가게 된다.  
```kotlin
private MergedContextConfiguration buildMergedContextConfiguration(Class<?> testClass,
        List<ContextConfigurationAttributes> configAttributesList, @Nullable MergedContextConfiguration parentConfig,
        CacheAwareContextLoaderDelegate cacheAwareContextLoaderDelegate,
        boolean requireLocationsClassesOrInitializers) {

    Assert.notEmpty(configAttributesList, "ContextConfigurationAttributes list must not be null or empty");

    // @BootstrapWith(SpringBootTestContextBootstrapper.class)에 의해 SpringBootTestContextBootstrapper의 getDefaultContextLoaderClass 메서드를 호출하여
    // SpringBootContextLoader가 resolving 됨
    ContextLoader contextLoader = resolveContextLoader(testClass, configAttributesList); 
    List<String> locations = new ArrayList<>();
    List<Class<?>> classes = new ArrayList<>();
    List<Class<?>> initializers = new ArrayList<>();

    for (ContextConfigurationAttributes configAttributes : configAttributesList) {
        if (logger.isTraceEnabled()) {
            logger.trace(String.format("Processing locations and classes for context configuration attributes %s",
                    configAttributes));
        }

        if (contextLoader instanceof SmartContextLoader) {  // SpringBootContextLoader는 SmartContextLoader의 구현체이다 
            SmartContextLoader smartContextLoader = (SmartContextLoader) contextLoader;
            smartContextLoader.processContextConfiguration(configAttributes);
``` 

그리고 [SpringBootContextLoader의 processContextConfiguration 메서드를 보면 detectDefaultConfigurationClasses를 호출](https://github.com/spring-projects/spring-boot/blob/master/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootContextLoader.java#L204)하고 있다.  
(우리의 테스트 코드에서는 resource가 비어있는데 그거까지 이 포스트에서 다루기에는 너무 방대해져서 생략했다.)
```java
@Override
public void processContextConfiguration(ContextConfigurationAttributes configAttributes) {
    super.processContextConfiguration(configAttributes);
    if (!configAttributes.hasResources()) {
        Class<?>[] defaultConfigClasses = detectDefaultConfigurationClasses(configAttributes.getDeclaringClass());
        configAttributes.setClasses(defaultConfigClasses);
    }
}
```

메서드를 또 쭉쭉 타고 들어가다 보면 [AnnotationConfigContextLoaderUtils 클래스의 detectDefaultConfigurationClasses 메서드](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/support/AnnotationConfigContextLoaderUtils.java#L62)를 호출하고 있다.  
```java
public static Class<?>[] detectDefaultConfigurationClasses(Class<?> declaringClass) {
    Assert.notNull(declaringClass, "Declaring class must not be null");

    List<Class<?>> configClasses = new ArrayList<>();

    for (Class<?> candidate : declaringClass.getDeclaredClasses()) {
        if (isDefaultConfigurationClassCandidate(candidate)) {
            configClasses.add(candidate);
        }
        // ..
    }
    // ..
    return ClassUtils.toClassArray(configClasses);
}
```

그리고 그 안에는 testClass(declaringClass)에 [getDeclaredClasses 메서드](https://docs.oracle.com/javase/8/docs/api/java/lang/Class.html#getDeclaredClasses--)를 호출하고 있다.
해당 메서드는 클래스에 정의된 클래스 객체를 반환하는 메서드라고 보면 된다.  
따라서 Nested class들을 전부 반환하게 되는데 이 class 들을 for-loop 돌면서 isDefaultConfigurationClassCandidate 메서드를 호출해서 DefaultConfigurationClassCandidate라면 추가한 후에 반환하고 있다.

[isDefaultConfigurationClassCandidate 메서드](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/support/AnnotationConfigContextLoaderUtils.java#L107)를 보면 static이면서 private이 아니고, final이 아닌 클래스인데 @Configuration 어노테이션이 붙어있는지 판단하고 있다.
```java
private static boolean isDefaultConfigurationClassCandidate(@Nullable Class<?> clazz) {
    return (clazz != null && isStaticNonPrivateAndNonFinal(clazz) &&
            AnnotatedElementUtils.hasAnnotation(clazz, Configuration.class));
}
```

이렇게 Nested @Configuration 클래스를 추가했으면 그 다음에 또 메서드를 쭉쭉 타고 들어가다보면 [SpringBootTestContextBootstrapper 클래스의 getOrFindConfigurationClasses 메서드](https://github.com/spring-projects/spring-boot/blob/8cd07dbc60f6146891a686967c9209edb053dd38/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTestContextBootstrapper.java#L229)를 호출하고 있다.
```java
protected Class<?>[] getOrFindConfigurationClasses(MergedContextConfiguration mergedConfig) {
    Class<?>[] classes = mergedConfig.getClasses();
    if (containsNonTestComponent(classes) || mergedConfig.hasLocations()) {
        return classes;
    }
    // ...
}
```

그리고 [containsNonTestComponent 메서드](https://github.com/spring-projects/spring-boot/blob/8cd07dbc60f6146891a686967c9209edb053dd38/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTestContextBootstrapper.java#L242)에서는 Nested @Configuration classes 중에 @TestConfiguration 어노테이션이 붙지 않은 클래스가 하나라도 존재하면 Nested @Configuration classes들을 merge 하여 Test Configuration으로 사용하고 있다.
즉 Nested @Configuration 클래스가 2개여도 두 @Configuration을 하나로 머지하여 사용한다고 보면 된다.  
```java
private boolean containsNonTestComponent(Class<?>[] classes) {
    for (Class<?> candidate : classes) {
        if (!MergedAnnotations.from(candidate, SearchStrategy.INHERITED_ANNOTATIONS)
                .isPresent(TestConfiguration.class)) {
            return true;
        }
    }
    return false;
}
```
 
## @SpringBootConfiguration
스프링 부트의 primary configuration은 @SpringBootConfiguration이다.  
하지만 @SpringBootConfiguration을 직접 사용하는 경우는 아직까지 보지 못했고 @SpringBootApplication을 사용하면 그 안에 포함돼있다.  
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = { @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
        @Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
public @interface SpringBootApplication {
```

src/main에 @SpringBootApplication 클래스를 하나 추가해주자.  
```kotlin
@SpringBootApplication
class DemoApplication
```

그리고 SomeInterface의 구현체도 하나 작성해주자
```kotlin
class SomeInterfaceInConfiguration : SomeInterface
```

해당 클래스를 빈으로 등록해줄 Config 클래스도 작성하자.
```kotlin
@Configuration
class SomeInterfaceConfig {
    @Bean
    fun someInterface() = SomeInterfaceInConfiguration()
}
```

그리고 테스트를 통해 해당 빈이 주입되는지 검증해보자.

```kotlin
@SpringBootTest
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
internal class SpringBootConfigurationTest(
    private val someInterface: SomeInterface
) {
    @Test
    internal fun `테스트용 설정이 없으면 기본적으로 @SpringBootApplication 클래스가 Test Configuration으로 사용된다`() {
        assertThat(someInterface).isExactlyInstanceOf(SomeInterfaceInConfiguration::class.java)
    }
}
```

이제 실제로 왜 이렇게 동작하는지 알아보자.
위에 살펴봤던 것과 같이 [SpringBootTestContextBootstrapper 클래스의 getOrFindConfigurationClasses 메서드](https://github.com/spring-projects/spring-boot/blob/8cd07dbc60f6146891a686967c9209edb053dd38/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTestContextBootstrapper.java#L229)를 호출하고 있다.
그리고 Nested @Configuration 클래스가 하나라도 존재하는지 containsNonTestComponent 메서드를 통해 검증했었다.  
하지만 이번에는 하나도 설정한 게 없으므로 그 아래에 있는 부분을 탄다.
```java
protected Class<?>[] getOrFindConfigurationClasses(MergedContextConfiguration mergedConfig) {
    Class<?>[] classes = mergedConfig.getClasses();
    if (containsNonTestComponent(classes) || mergedConfig.hasLocations()) {
        return classes;
    }
    Class<?> found = new AnnotatedClassFinder(SpringBootConfiguration.class)
            .findFromClass(mergedConfig.getTestClass());
    Assert.state(found != null, "Unable to find a @SpringBootConfiguration, you need to use "
            + "@ContextConfiguration or @SpringBootTest(classes=...) with your test");
    logger.info("Found @SpringBootConfiguration " + found.getName() + " for test " + mergedConfig.getTestClass());
    return merge(found, classes);
}
```
1. nested @Configuration 클래스를 가져온다.
2. nested @TestConfiguration이 아닌 nested @Configuration 클래스가 하나라도 존재한다면 nested @Configuration(nested @TestConfiguration 포함) 클래스들을 반환한다.
3. @SpringBootConfiguration 어노테이션이 붙은 클래스를 가져온다.  
4. 3에서 클래스를 찾지 못했다면 @SpringBootConfiguration이 붙은 클래스를 찾지 못하여 @ContextConfiguration이나 @SpringBootTest에 component classes를 명시하라고 에러를 뱉는다.  
5. 3에서 찾은 클래스와 nested @Configuration 클래스를 머지한다.

이렇게 nested @Configuration 클래스가 없다면 디폴트로 @SpringBootConfiguration이 붙은 @SpringBootApplication이 붙은 클래스가 Test Configuration으로 사용된다고 보면 된다.

## Nested @TestConfiguration
[SpringBootTestContextBootstrapper 클래스의 getOrFindConfigurationClasses 메서드](https://github.com/spring-projects/spring-boot/blob/8cd07dbc60f6146891a686967c9209edb053dd38/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTestContextBootstrapper.java#L229)를 보면 [containsNonTestComponent](https://github.com/spring-projects/spring-boot/blob/8cd07dbc60f6146891a686967c9209edb053dd38/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTestContextBootstrapper.java#L242) 메서드를 호출하고 있다.
즉, Nested @TestConfiguration이 아닌 Nested @Configuration 클래스가 하나라도 존재하는지 찾는 것인데...
Nested @TestConfiguration 클래스는 어떤 역할을 하는 걸까??

src/test에 SomeInterface의 구현체를 하나 더 추가해보자
```kotlin
class SomeInterfaceInNestedTestConfiguration : SomeInterface
```

그리고 해당 빈이 주입되도록 Nested @TestConfiguration을 사용하여 테스트를 작성해보자.
```kotlin
@SpringBootTest
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class NestedTestConfigurationTest(
    private val someInterface: SomeInterface,
    private val someInterface2: SomeInterface,
) {
    @TestConfiguration
    internal class Config {
        @Bean
        fun someInterface2() = SomeInterfaceInNestedTestConfiguration()
    }

    @Test
    internal fun `@SpringBootConfiguration에 의해 src에 있는 @Configuration 클래스에 있는 빈이 주입된다`() {
        assertThat(someInterface).isExactlyInstanceOf(SomeInterfaceInConfiguration::class.java)
    }

    @Test
    internal fun `@SpringBootConfiguration에 없는 건 @TestConfiguration 클래스에 있는 빈이 주입된다`() {
        assertThat(someInterface2).isExactlyInstanceOf(SomeInterfaceInNestedTestConfiguration::class.java)
    }
}
```
실제로 src/main에 있는 @Configuration도 주입되고, Nested @TestConfiguration도 주입된 걸 볼 수 있다.  
Nested @TestConfiguration의 용도는 원래 Configuration(@SpringBootConfigurtion 또는 Nested @Configuration)에 추가적으로 설정할 Configuration을 위해 사용한다고 보면 된다.

위에 살펴봤던 것과 같이 [SpringBootTestContextBootstrapper 클래스의 getOrFindConfigurationClasses 메서드](https://github.com/spring-projects/spring-boot/blob/8cd07dbc60f6146891a686967c9209edb053dd38/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTestContextBootstrapper.java#L229)를 호출하고 있다.
그리고 Nested @Configuration 클래스가 하나라도 존재하는지 containsNonTestComponent 메서드를 통해 검증했었다.  
이번에는 Nested @TestConfiguration 클래스를 설정했으므로 그 관점에서 바라보자.
```java
protected Class<?>[] getOrFindConfigurationClasses(MergedContextConfiguration mergedConfig) {
    Class<?>[] classes = mergedConfig.getClasses();
    if (containsNonTestComponent(classes) || mergedConfig.hasLocations()) {
        return classes;
    }
    Class<?> found = new AnnotatedClassFinder(SpringBootConfiguration.class)
            .findFromClass(mergedConfig.getTestClass());
    Assert.state(found != null, "Unable to find a @SpringBootConfiguration, you need to use "
            + "@ContextConfiguration or @SpringBootTest(classes=...) with your test");
    logger.info("Found @SpringBootConfiguration " + found.getName() + " for test " + mergedConfig.getTestClass());
    return merge(found, classes);
}
```
1. nested @Configuration 클래스를 가져온다.
2. nested @TestConfiguration이 아닌 nested @Configuration 클래스가 하나라도 존재한다면 nested @Configuration(nested @TestConfiguration 포함) 클래스들을 반환한다.
3. @SpringBootConfiguration 어노테이션이 붙은 클래스를 가져온다.  
4. 3에서 클래스를 찾지 못했다면 @SpringBootConfiguration이 붙은 클래스를 찾지 못하여 @ContextConfiguration이나 @SpringBootTest에 component classes를 명시하라고 에러를 뱉는다.  
5. 3에서 찾은 클래스와 nested @Configuration 클래스를 머지한다.

[@TestConfiguration 어노테이션](https://github.com/spring-projects/spring-boot/blob/8cd07dbc60f6146891a686967c9209edb053dd38/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/TestConfiguration.java#L45)이 @Configuration을 포함하고 있으므로 `mergedConfig.getClasses()`에서는 Nested @Configuration과 Nested @TestConfiguration 클래스가 나온다고 보면 된다.  
```kotlin
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Configuration
@TestComponent
public @interface TestConfiguration {
```

그리고 우리는 Nested @Configuration 클래스는 하나도 없으므로 `containsNonTestComponent(classes)`에서 false를 뱉고
그 아래에서 `Class<?> found = new AnnotatedClassFinder(SpringBootConfiguration.class).findFromClass(mergedConfig.getTestClass());`로 찾아온 @SpringBootApplication 클래스와 Nested @TestConfiguration 클래스가 머지된다고 보면 된다.  
실제로 [merge()](https://github.com/spring-projects/spring-boot/blob/8cd07dbc60f6146891a686967c9209edb053dd38/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTestContextBootstrapper.java#L252) 메서드에서는 두 Configuration들을 머지하고 있다.
```java
private Class<?>[] merge(Class<?> head, Class<?>[] existing) {
    Class<?>[] result = new Class<?>[existing.length + 1];
    result[0] = head;
    System.arraycopy(existing, 0, result, 1, existing.length);
    return result;
}
```

참고로 @ContextConfiguration을 사용할 때는 Nested @Configuration/@TestConfiuration이 먹히지 않는다. (물론 @SpringBootConfiguration도 씹힌다.)
```kotlin
@SpringBootTest
@ContextConfiguration(classes = [SomeInterfaceInContextConfiguration::class])
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
internal class ContextConfigurationTest(
    private val someInterface: SomeInterface,
    private val someInterface2: SomeInterface,
    private val someInterface3: SomeInterface,
) {
    @Configuration
    internal class NestConfiguration {
        @Bean
        fun someInterface2() = SomeInterfaceInNestedConfiguration()
    }

    @TestConfiguration
    internal class NestedTestConfiguration {
        @Bean
        fun someInterface3() = SomeInterfaceInNestedTestConfiguration()
    }

    @Test
    internal fun `@ContextConfiguration에 기술된 Component Classes들이 Test Configuration으로 사용된다`() {
        assertThat(someInterface).isExactlyInstanceOf(SomeInterfaceInContextConfiguration::class.java)
    }

    @Test
    internal fun `@ContextConfiguratio을 적용했으면 Nested @Configuration은 무시된다`() {
        assertThat(someInterface2).isNotExactlyInstanceOf(SomeInterfaceInNestedConfiguration::class.java)
        assertThat(someInterface2).isExactlyInstanceOf(SomeInterfaceInContextConfiguration::class.java)
    }

    @Test
    internal fun `@ContextConfiguratio을 적용했으면 Nested @TestConfiguration은 무시된다`() {
        assertThat(someInterface3).isNotExactlyInstanceOf(SomeInterfaceInNestedTestConfiguration::class.java)
        assertThat(someInterface3).isExactlyInstanceOf(SomeInterfaceInContextConfiguration::class.java)
    }
}
```