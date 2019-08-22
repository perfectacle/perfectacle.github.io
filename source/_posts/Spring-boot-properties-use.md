---
title: (Spring Boot) properties 값을 불러와보자
category: [Back-end, Spring]
tag: [Java, Spring, Spring Boot]
date: 2017-09-18 09:15:10
---
![](/images/Spring-boot-properties-use/thumb.png)  

근본없이 궁금한 부분만 찾아서 공부하다보니 아직 정리가 덜 된 글이다 보니 그 점은 감안하고 보길 바란다.  

## properties
Node.js로 서버를 구성하다보면 포트 등등의 설정 정보를 json으로 저장하듯이 스프링 부트에서는 properties 파일을 사용하는 것 같다.  
물론 YAML 파일로도 만들 수 있는 것 같은데 일단 아는 게 properties 파일이다보니 그걸로 진행해보겠다.  
우선 스프링 부트를 만들면 기본 파일인 application.properties 파일을 아래와 같이 구성해보자.  
```properties
key="asdf"
```

## properties 사용하는 클래스 만들기
이제 이걸 사용하는 클래스를 만들어보자.  
```java
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

@Component
public class Tests {
    @Value("${key}")
    private String key;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}
```

눈여겨 볼 어노테이션이 두 개 있다.  
* Component  
스프링에서 관리하는 빈이라는 걸 알려주기 위한 어노테이션인 것 같다.  
자바 빈과 스프링 빈은 차이가 있다.  
자바 빈은 기본 생성자가 있고, getter, setter 메소드가 있고 등등의 특징이 있는 클래스인 것 같다.  
스프링 빈은 스프링 컨테이너(?)에 의해 관리되는 객체들을 스프링 빈이라고 부르는 것 같다.  
(자세한 설명은 [Difference JavaBean and Spring bean](https://stackoverflow.com/questions/21866571/difference-javabean-and-spring-bean)을 참고하자.)  
여튼 properties에 있는 값을 사용하려면 둘이 스프링에 의해 같이 관리돼야하기 때문에  
클래스를 스프링 빈으로 등록해야하는 것 같다.  
자세하게는 모르겠다 ㅠㅠ  
[@Bean vs @Component](http://jojoldu.tistory.com/27)을 보면 둘 사이에도 명확한 차이가 있는 것 같은데 링크를 참조해보자. (나도 잘 모르니 ㅠㅠ)  

* Value
properties의 어느 속성을 적용할지 정하는 것 같다.  

## 테스트 코드로 테스트 하기
```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import javax.inject.Inject;

import static org.hamcrest.core.Is.is;
import static org.junit.Assert.*;

@RunWith(SpringRunner.class)
@SpringBootTest
public class TestsTest {
    @Inject private Tests tests;
    @Test public void test() {
        assertThat("asdf", is(tests.getKey()));
    }
}
```
`Test test = new Test();`와 같은 방식 대신에 @Inject 어노테이션을 사용했다.  
`@Autowired`와 동일한 역할을 한다고 한다.  
다만 Inject는 자바에서 지원하는 표준 어노테이션이고, Autowired는 스프링에서 지원해주는 것 같다.  
build.gradle의 dependency에 `compile('javax.inject:javax.inject:1')` 을 추가하면 된다.  
자세한 설명은 아래 링크를...
[Spring MVC 어노테이션 기반 설정 - 2 . @Autowired](http://deoki.tistory.com/28)  

## 결론
중요한 것은 @Component, @Value, @Inject(@Autowired) 라는 점을 생각하자!
