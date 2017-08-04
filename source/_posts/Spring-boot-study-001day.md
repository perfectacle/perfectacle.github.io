---
title: (Spring) 스타트 스프링 부트 001일차 - 스프링(부트), 빌드툴, VO, Lombok, 어노테이션, Jackson, ORM, JPA, Hibernate 
category: [Note, Spring Boot]
tag: [Java, Spring, Spring Boot, VO, Bean, Lombok, Jackson, ORM, JPA, Hibernate, Ant, Maven, Gradle]
date: 2017-08-02 10:02:06
---
![](thumb.png)  
자바에 대한 근본도 없고, MVC, Servelet/JSP에 대한 이해도 제대로 없는데 이런 걸 해도 될런지 모르겠지만... 일단은 시작!  
나머지는 병행해가면서 해보자...  

## 스프링 vs 스프링 부트
* 스프링: 프론트로 치면 웹팩, 바벨, 걸프 설정 등등을 처음부터 내가 다 짜줘야함.  
* 스프링 부트: CRA(Create React App) or Vue-CLI와 같이 알아서 설정을 도와줌.  
IntelliJ에서 프로젝트를 만들 때 Sprign Initializer를 선택하면 된다.  
보이지 않는다면 최신버전으로 업뎃하고 플러그인에서 Spring Boot가 제대로 설치/활성화 됐는지 확인하자.  

## 스프링이란?  
1.0이 2004년에 나왔고 2011년에는 3.x가 나왔다.  
처음에는 light-weight(경량)화됐으나 지금은 매우 무겁다...  
Servlet/JSP에서 진보된 웹 개발 방식?이라고 해야하려나...  
여튼 스프링은 프레임워크이다.  
스프링 부트는 루비의 RoR(Ruby on Rails), 파이썬의 Flask, Django 등의 마이크로 프레임워크를 보고 영감을 얻은 것 같다.  
이런 마이크로 프레임워크들은 프로젝트 생성과 동시에 필요한 라이브러리를 초기화 해주며, 템플릿 등을 제공해줘 개발의 생산성을 높였다.  
스프링 부트는 기존 스프링의 복잡한 설정 과정이나 버전 충돌 등의 불편한 점을 제거하고 빠르고 쉬언 서버/테스트 환경을 제공해준다.  
또한 내부에 WAS(Web Application Server)인 Tomcat을 내장하고 있어서 따로 Tomcat을 설치할 필요가 없는 것 같다.  

## Ant, Maven, Gradle  
나중에 더 자세히 조사해봐야겠지만 일단은 정리.  
빌드 툴이란다.  
빌드는 컴파일 내에 속하는 것(?) 같은데 그 중간에 해줘야하는 복잡한 과정들을 기술한 것 같다.  
프론트로 치면 Task Runner인 Gulp와 Grunt, 그리고 npm scripts 정도...??  
또한 이 안에는 의존성이 주입(?)된 라이브러리도 기술돼있으므로 npm도 포함하는 개념인 것 같다.  
프론트도 d3 홈페이지가서 js 파일 받고, jQuery 홈페이지가서 js 파일 받고 수동으로 해서 이걸 편하게 하기 위해(?) npm이 나왔 듯  
백엔드도 라이브러리 홈피가서 zip 파일 받아서 zip 파일 풀고 jar 파일 import 하는 게 귀찮아서인지 이런 툴들이 나온 것 같다.  

## Java Bean VS VO(Variable Object)
Java Bean은 일종의 스펙이고 VO는 특정한 의도를 달성하기 위해 Java Bean을 준수한 것 같다.  

Java Bean은 다음과 같은 스펙을 준수한 클래스를 칭하는 것 같다.(내가 아는 수준만 적어보았다.)  
1. 모든 변수는 private 접근 지정자를 지정해줘야한다.  
2. 해당 변수에 접근하기 위한 getter와 setter가 있어야한다.  

이외에도 더 많은 것 같은데 나중에 다시 한 번 공부를 해보고 지금 내가 당장 이해한 수준은 위와 같다.  

VO는 Java Bean 스펙을 준수했는데 값 자체를 나타내며 불변(immutable)이란다.  
또 아래 내용을 인용했는데 이쪽이 더 이해하기 쉬운 것 같다.  
출처: [vo하고 bean의 차이가 무엇인가요?](https://okky.kr/article/271453)
>> 자바 빈은 특정 형태의 클래스를 가르키는 말이고 VO는 주로 계층형 구조에서 계층간 값을 전달하기 위해 자바 빈의 형태로 구현한 클래스입니다.
그래서 지금 시점에서는 그냥 퍼블릭 생성자와 속성(컨벤션에 맞는 getter/setter 조합)을 갖는 클래스를 가르키는 뜻으로 쓰이는 만큼, POJO(Plain Old Java Object)와도 거의 동일한 개념으로 이해해도 무방합니다.

## Lombok
이것도 라이브러리? 플러그인? 같은데 Sass가 CSS 전처리기라면 Lombok은 어노테이션 전처리기란다.  
프로젝트를 만들 때 Core에서 Lombok을 설정해줘야한다.  
IntelliJ에서 플러그인에서 설치를 해줘야하고(그래야 IDE에서 오류로 처리하지 않는다. 아마...??), 
또 실제로 작동하게 하려면 Setting으로 가서 ... > Compiler > Annotation Processors로 가서 Enable 시켜주기.    

일반 IDE에서는 아래와 같이 getter와 setter를 자동으로 만들어주기도 해서 굳이 Lombok을 쓸 필요가 있냐고 주장하는 사람도 있다.  
```java
public class SampleVO {
    private String val1;
    private String val2;
    private String val3;

    public void setVal1(String val1) {
        this.val1 = val1;
    }

    public void setVal2(String val2) {
        this.val2 = val2;
    }

    public void setVal3(String val3) {
        this.val3 = val3;
    }

    public String getVal1() {
        return val1;
    }

    public String getVal2() {
        return val2;
    }

    public String getVal3() {
        return val3;
    }
}
```

Lombok을 쓰면 아래와 같이 간단해진다.  
```java
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SampleVO {
    private String val1;
    private String val2;
    private String val3;
}
```

하지만 Lombok을 쓰면 Setter에 로직을 심을 수 없다는 단점이 존재해서 간단한 getter/setter나 기타 어노테이션 정도만 써야겠다.  
기타 어노테이션은 [(Lombok)사용 설명](http://lahuman.jabsiri.co.kr/124)을 참고하자.  

## 스프링의 어노테이션
ES.Next에도 어노테이션과 비슷한 데코레이터라는 게 있는데 아직도 어떻게 동작하는지 제대로 이해하지 못했다.  
자바의 정석을 차근차근 진도 빼면서 익혀봐야겠다.  
아 그리고 클래스나 메소드를 감싸(?)는 게 어노테이션이므로 클래스와 메소드를 먼저 작성하고 추후에 어노테이션을 뭘 쓸지 고민하고 사용하자.  
여튼 스프링에서 REST API를 구현하기 위해 사용한 어노테이션을 조금 익혀보자.  

* @RestController  
컨트롤러 클래스에 붙이는 어노테이션, REST API를 담당하는 Controller라는 뜻인 것 같다.  
또한 이렇게 하면 스프링의 빈(Bean)으로 등록된단다.  
기존 스프링에서는 어노테이션을 사용해도 \<component-scan\> 등과 같은 별도의 설정이 필요했지만 스프링 부트에서는 그런 귀찮은 작업이 필요없다.  
```java
package com.example.exo.controller;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloWorld {
    
}
```

* @ComponentScan  
만약 스프링 앱(main 메소드가 있고 run 하는 *.java 파일)과 같은 패키지, 혹은 자식패키지에 존재하지 않고 다른 패키지에 존재한다면  
해당 어노테이션을 사용해서 클래스들을 스프링에 인식시켜야한다.  
```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.example.demo", "com.example.exo",})
public class DemoApplication {
	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}
}
```
주의 사항으로 @ComponentScan 어노테이션을 쓰지 않으면 현재 패키지 내에 있는 모든 클래스를 스프링에 등록하지만  
@ComponentScan을 사용해서 다른 패키지를 등록하는 순간 현재 패키지는 제외된다.  
따라서 @ComponentScan 어노테이션을 사용한다고 하면 현재 패키지까지 추가를 무조건 해줘야한다.

* @GetMapping
REST API 중 http method인 get에 매핑되는 녀석에 해당하는 어노테이션이다.  
@PostMapping, @PutMapping, @DeleteMapping도 물론 존재한다.  
```java
package com.example.exo.controller;

import com.example.exo.vo.SampleVO;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class HelloWorld {
    @GetMapping("/hello")
    public String sayHello() {
        return "Hello World";
    }
}
```

## Jackson  
VO의 toString()한 일반 문자열을 JSON 형태로 뿌려주는 라이브러리인 것 같다.  
Spring Boot에서 기본적으로 깔린다.  

## JPA와 Hibernate  
JPA는 Java Persistence API의 줄임말이고, 이 JPA를 스프링에서 쓰기 편하게 한 라이브러리가 Spring Data JPA이다.  

그럼 Hibernate는 무엇일까?  
이 관계를 ECMAScript와 Javascript로 풀어보았다.  
ECMAScript는 스펙이고 Javascript는 그 스펙을 준수해서 구현한 구현체(?)이다.  
JPA는 스펙이고 Hibernate는 그 스펙을 준수해서 구현한 구현체(?)이다.  
맞을라나 모르겠다.  
Hibernate 말고 JPA의 구현체는 EclipseLink, DataNucleus 등등이 있다.  

그럼 이 JPA는 뭘까? ORM을 자바라는 언어로 구현(?)한 것이라고 나는 본다.  
ORM(Object Relational Mapping)은 객체지향에서 말하는 객체와 DB에서 말하는 개체가 상당히 유사하다는 입장에서 시작했다.  
회원정보를 객체(클래스)로 표현한 것과 개체(Entity, DB의 Table이라고 보면 될 것 같다)로 표현한 것이 매우 유사하다는 점이다.  
이러한 ORM은 언어에 종속적인 게 아니라서 Java에서는 JPA가 있 듯이, Javascript 진영에는 [Sequelize](http://docs.sequelizejs.com/)라는 녀석이 존재한다.  

마지막으로 ORM의 장단점을 정리해보자.  
* 장점  
    1. DB 관련 코드에 대해 유연함을 얻을 수 있다.  
    DB가 변경되면 우리가 사용하는 Java 코드도 다 고쳐야하는데 ORM을 이용하면 모델 부분?만 고쳐주면 된단다.  
    2. DB와 독립적 관계이다.  
    RDB, NoSQL을 가리치 않는다는 소리 같다.  
    3. Join 관계가 매우 복잡해지면 쌩 SQL보다 가독성이 좋다고 한다.  

* 단점  
    1. 학습 곡선(Learning curve)가 크다.  
    2. 객체 지향에 대한 이해가 제대로 돼야 제대로 된 설계가 가능하다.  
    3. 특정 DB의 특성을 이용할 수 없다.  
    장점의 2를 보면 특정 DB에 의존적이지 않다는 것은 특정 DB의 특성을 이용하지 않고 범용적인 부분만 사용한다는 것이다.  
    이러한 특성을 못 살리다 보니 튜닝이라던지 퍼포먼스 측면에서 Natvie SQL보다는 구리다는 단점이 존재한다.  
    따라서 ORM과 Native SQL을 케바케로 잘 섞어 써야하는 것 같다.  
