---
title: 어노테이션이 달린 빈의 자동 스캔 (Without Spring Boot)
tags:
  - Spring
  - Bean
category:
  - Back-end
  - Spring
date: 2019-06-23 12:08:10
---

![](/images/auto-scanning-annotation-based-bean/thumb.png)

스프링 부트부터 접한 스프링 알못이라 스프링에 대해 공부를 하다보니 너무나 모르고 있는 게 많아서 정리해봤다.  
되게 간단한 건데 스프링 부트부터 접하면 몰라도 코드 짜는데는 문제가 없지만 개인적으로는 알고 있으면 너무나 좋은 내용같다.

## 어노테이션 없이 빈 설정
스프링이 관리하는 객체인 빈으로 생성하기 위해서 아래와 같은 어노테이션이 필수**인 줄 알았**다. 
@Component, @Configuration, @Bean, @Service, @Controller, @Repository

하지만 직접 코딩을 해보니 이 생각은 거짓이었다.

우선 느슨한 결합을 위해 인터페이스를 하나 선언한다.
```java
public interface OrderService {}
```

인터페이스의 구현체도 하나 만들어준다.
```java
public class TimonOrderService implements OrderService {}
```

해당 구현체를 의존성으로 갖는 다른 구현체도 만들어보자.
```java
public class CoupangOrderService implements OrderService {
    private OrderService otherService;

    // 스프링 4.3부터 생성자가 하나이면 @Autowired 어노테이션이 생략 가능하다.
    public CoupangOrderService(OrderService orderSe) {
        this.otherService = orderSe;
    }

    // 의존성 주입이 제대로 됐는지 테스트하기 위한 용도의 getter
    public OrderService getOtherService() {
        return otherService;
    }
}
```

이제 CoupangOrderService 빈이 제대로 생성되는지 테스트 코드를 작성해보자. (JUnit5를 사용하였다.)  
```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {CoupangOrderService.class})
class ApplicationContextTest {
    @Autowired
    private CoupangOrderService coupangOrderService;

    @Test
    void test() {
        assertNotNull(coupangOrderService);
        assertNotNull(coupangOrderService.getOtherService());
    }
}
```

위 테스트를 실행하면 circular reference(순환 참조) 때문에 빈을 생성할 수 없는 오류가 난다.
`Caused by: org.springframework.beans.factory.BeanCurrentlyInCreationException: Error creating bean with name 'coupangOrderService': Requested bean is currently in creation: Is there an unresolvable circular reference?`  

CoupangOrderService는 OrderService 인터페이스를 의존성으로 받는데 그 구현체가 CoupangOrderService 자신 밖에 없기 때문이다.  
(@ContextConfiguration(classes = {CoupangOrderService.class})에 의해 ApplicationContext에서는 CoupangOrderService 밖에 모르기 때문이다.)

그럼 ApplicationContext가 OrderService의 다른 구현체인 TimonOrderService까지 알게 해주자.  
```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {CoupangOrderService.class, TimonOrderService.class})
class ApplicationContextTest {
    @Autowired
    private CoupangOrderService coupangOrderService;

    @Test
    void test() {
        assertNotNull(coupangOrderService);
        assertNotNull(coupangOrderService.getOtherService());
    }
}
```
이제 테스트는 성공한다.  
우리는 빈에 대한 어노테이션을 인터페이스나 구현체 어디에도 사용을 하지 않았는데 빈의 생성도 잘 이뤄졌고, 의존성 주입도 아주 잘 되었다.    
CoupangOrderService에서 OrderService를 의존성 주입 받는데 OrderService의 구현체는 CoupangOrderService와 TimonOrderService 두 개이다.  
하지만 스프링에서는 똑똑하게 순환참조 이슈를 피하려고 본인을 제외하고 빈을 찾기 때문에 순환참조 오류가 안 났다.  

한 번 위 가설이 맞는지 검증해보자.  
OrderService의 구현체를 하나 더 만들어보자.  
```java
public class WeMakePriceOrderService implements OrderService {}
```

이제 테스트를 돌려보면 아래와 같이 CoupangOrderService에 OrderService를 주입하는데 TimonOrderService를 주입해야할지, WeMakePriceOrderService를 주입해야할지 모른다는 오류가 나온다.  
```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {CoupangOrderService.class, TimonOrderService.class, WeMakePriceOrderService.class})
class ApplicationContextTest {
    @Autowired
    private CoupangOrderService coupangOrderService;

    @Test
    void test() {
        assertNotNull(coupangOrderService);
        assertNotNull(coupangOrderService.getOtherService());
    }
}
```

`Caused by: org.springframework.beans.factory.NoUniqueBeanDefinitionException: No qualifying bean of type 'OrderService' available: expected single matching bean but found 2: timonOrderService,weMakePriceOrderService`

OrderService의 구현체는 세 개인데 당연스레 본인(CoupangOrderService)는 빼고 의존성 주입을 시도한 것이다.  
그럼 위 테스트는 왜 실패한 것인가?  
기본적으로 스프링은 아래와 같은 순서로 DI를 하게 된다.  
1. 빈의 타입으로 빈을 검색해서 주입한다.  
2. 해당 빈의 타입이 두 개 이상이면 빈의 이름으로 검색해서 주입한다.

```java
public CoupangOrderService(OrderService orderSe) {
    this.otherService = orderSe;
}
```
OrderService의 빈은 2개(CoupangOrderService 본인을 제외하고)라서 빈의 이름으로 검색을해야하는데 **orderSe**라는 이름의 빈은 없기 때문이다.  
빈의 이름은 기본적으로 클래스 이름을 기반으로 생성된다. ~~(규칙은 나중에 찾아보는 걸로...)~~  

이제 테스트가 성공하게 제대로 된 빈의 이름으로 바꿔주자.  
```java
public class CoupangOrderService implements OrderService {
    private OrderService otherService;

    // 스프링 4.3부터 생성자가 하나이면 @Autowired 어노테이션이 생략 가능하다.
    // 파라미터로 넘긴 변수 이름이 빈의 이름이 된다.
    public CoupangOrderService(OrderService timonOrderService) {
        this.otherService = timonOrderService;
    }

    public OrderService getOtherService() {
        return otherService;
    }
}
```

## 빈 자동 스캔
우리가 생성한 빈이 많으면 많을 수록 @ContextConfiguration에 다 등록해주기도 부담이다.  
이럴 때 쓰는 게 @Service, @Component, @Configuration, @Bean과 같은 어노테이션들이다.

우선 인터페이스와 구현체 어디다 쓰는 게 좋은지 모르니 다 붙여놓자.
```java
@Service
public interface OrderService {}
```

```java
@Service
public class TimonOrderService implements OrderService {}
```

```java
@Service
public class WeMakePriceOrderService implements OrderService {}
```

```java
@Service
public class CoupangOrderService implements OrderService {
    private OrderService otherService;

    public CoupangOrderService(OrderService timonOrderService) {
        this.otherService = timonOrderService;
    }

    public OrderService getOtherService() {
        return otherService;
    }
}
```

그리고 빈을 자동으로 스캔해주는 빈을 만들어주자.
```java
@ComponentScan("some.package")
public class ComponentScanConfig {}
```
해당 패키지에 있는 @Service, @Component, @Configuration, @Bean 요런 어노테이션들이 붙은 빈들은 자동으로 스캔하고 생성해주는 어노테이션이다. 
~~(자세한 건 나중에 또 알아보자 ㅠㅠ)~~

이제 테스트에서 Bean 클래스들을 한땀 한땀 넣어주는 부분을 수정해보자.
```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {ComponentScanConfig.class})
class ApplicationContextTest {
    @Autowired
    private CoupangOrderService coupangOrderService;

    @Test
    void test() {
        assertNotNull(coupangOrderService);
        assertNotNull(coupangOrderService.getOtherService());
    }
}
```

Config 파일 하나로 코드가 너무나 쾌적해졌다.  
이렇게 빈을 자동으로 스캔하고 생성할 때는 **@ComponentScan** 어노테이션이 엄청 큰 도움이 된다.  

## 어노테이션은 인터페이스에? 구현체에?
```java
@Service
public interface OrderService {}
```
어노테이션을 인터페이스에**만** 붙이면 구현체 타입으로 DI를 받을 수 없다.

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {ComponentScanConfig.class})
class ApplicationContextTest {
//    CoupangOrderService 타입의 빈은 @Service 어노테이션이 안 달려있어서 @ComponentScan에서 검색되지 못한다.    
//    @Autowired
//    private CoupangOrderService coupangOrderService;

    @Autowired
    private OrderService coupangOrderService;

    @Test
    void test() {
        assertNotNull(coupangOrderService);
//        OrderService 인터페이스에는 getOtherService() 메서드가 없다.
//        assertNotNull(coupangOrderService.getOtherService());
    }
}
```

하지만 이번엔 빈을 생성하지 못한다는 에러가 나온다.  
`Caused by: org.springframework.beans.factory.NoSuchBeanDefinitionException: No qualifying bean of type 'example.domain.OrderService' available: expected at least 1 bean which qualifies as autowire candidate. Dependency annotations: {@org.springframework.beans.factory.annotation.Autowired(required=true)}`  
왜냐면 인터페이스만 @Service 어노테이션을 붙여서 빈으로 생성이 되는데 인터페이스는 객체로 생성이 불가능하기 때문에 위와 같은 오류가 나는 것이다.  

그럼 이번엔 구현체에만 @Service 어노테이션을 붙이면 어떻게 될까?  
```java
@Service
public class CoupangOrderService implements OrderService {
    private OrderService otherService;

    public CoupangOrderService(OrderService timonOrderService) {
        this.otherService = timonOrderService;
    }

    public OrderService getOtherService() {
        return otherService;
    }
}
```

이제 테스트를 고쳐보자.
```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {ComponentScanConfig.class})
class ApplicationContextTest {
//    CoupangOrderService는 OrderService를 구현한 것이므로 OrderService 타입으로도 DI 받을 수 있다.
//    @Autowired
//    private OrderService coupangOrderService;

    @Autowired
    private CoupangOrderService coupangOrderService;

    @Test
    void test() {
        assertNotNull(coupangOrderService);
        assertNotNull(coupangOrderService.getOtherService());
    }
}
```
테스트를 돌리면 또 순환참조 오류로 실패한다.  
`Caused by: org.springframework.beans.factory.BeanCurrentlyInCreationException: Error creating bean with name 'coupangOrderService': Requested bean is currently in creation: Is there an unresolvable circular reference?`

다른 OrderService 구현체에도 @Service 어노테이션을 붙여주자.  
```java
@Service
public class TimonOrderService implements OrderService {}
```

```java
@Service
public class WeMakePriceOrderService implements OrderService {}
```

이제 테스트를 돌리면 정상적으로 돌아간다.

인터페이스에 어노테이션 안 붙여도 인터페이스 타입으로 느슨하게 결합해서 DI도 가능하고, 특정 구현체에 기능이 쓰고 싶다면 해당 구현체 타입으로 DI도 가능하고...
따라서 내가 봤을 때는 인터페이스에 어노테이션을 붙여놓는 건 딱히 의미가 없는 것 같다. 