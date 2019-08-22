---
title: (Spring) Spring Boot 2.0 with Gradle에서 환경 별로 profile 쪼개기
tags: [Spring, Gradle]
category: [Back-end, Spring]
date: 2018-07-22 15:31:41
---
![](/images/spring-boot-2-env/thumb.png)  

Spring Boot 1.x와 달리 Spring Boot 2.0에서는 Profile 설정하는 게 좀 달라졌다.  
알아보자.  
최종 결과물은 [github 저장소](https://github.com/perfectacle/spring-boot-2-env-starter)에서 확인할수 있다.

## 디펜던시
우선 아래 이유로 Lombok을 추가할 것이다.
1. Facade 패턴을 이용해서 어떤 로깅 라이브러리에서도 동작할 수 있게 만들어주는 @Slf4j
2. DI 할 때 코딩할 양을 줄여줘서 우리의 생산성을 조금이나마 높여주는 @RequiredArgsConstructor

```groovy
dependencies {
    compile('org.springframework.boot:spring-boot-starter')
    compileOnly('org.projectlombok:lombok')
    testCompile('org.springframework.boot:spring-boot-starter-test')
}
```

## 실행 환경에 따라 분리하기
우선 패키지 구조는 아래와 같이 돼있다고 가정하자.  
```
- src
  - main
    - java
    - resources
      - application-core.properties
    - resources-env
      - local
        - application.properties
      - dev
        - application.properties
      - prod
        - application.properties
```

먼저 local 환경을 위해서 local 디렉토리의 application.properties를 아래와 같이 수정해주자.  
```properties
spring.profiles.active=local
spring.profiles.include=core

val=local
```

그 다음에 개발 서버 환경을 위해서 dev 디렉토리의 application.properties를 아래와 같이 수정해주자.
```properties
spring.profiles.active=dev
spring.profiles.include=core

val=dev
```

그 다음에 프로덕션 서버 환경을 위해서 prod 디렉토리의 application.properties를 아래와 같이 수정해주자.
```properties
spring.profiles.active=prod
spring.profiles.include=core

val=prod
```

그 다음에 이제 공통으로 쓸 application-core.properties를 정의하자.
```properties
val2=core
```

spring.profiles.active=local,core 이렇게 해도 똑같은 결과가 나오는데
spring.profiles.include로 추가적으로 포함될 profile을 설정하는 게 좀 더 의미에 부합하는 것 같아서 설정했다.  


그리고 spring boot 2.0의 profile은 기본적으로
1. resources/config 디렉토리의 application.properties(혹은 application.yaml 파일)
2. resources 디렉토리의 application.properties(혹은 application.yaml 파일)
3. classpath/config 디렉토리의 application.properties(혹은 application.yaml 파일)
4. classpath 디렉토리의 application.properties(혹은 application.yaml 파일)
을 찾는다.  

이제 같은 directory 내에서도 다음과 같은 우선순위로 경쟁을 한다.  
1. application.properties(application.yaml)를 찾는다.  
2. application.properties(application.yaml)에서 spring.profiles.active, spring.profiles.include가 설정돼있지 않다면
기본적으로 profile에 default가 setting 되고, 아래와 같은 로그를 볼 수 있다.  
`No active profile set, falling back to default profiles: default`  
3. 설정된 profile에 따라서 application-{profile}.properties(application-{profile}.yaml)을 찾는다.  
`spring.profiles.active=local, spring.profiles.include=core`의 경우에는
`application-local.properties(application-local.yaml), application-core.properties(application-core.yaml)`

Environment 별로 디렉토리를 쪼개 놨으니 이 디렉토리를 잘 사용하게 끔 build.gradle을 수정하자.  
```groovy
ext.profile = (!project.hasProperty('profile') || !profile) ? 'local' : profile

sourceSets {
    main {
        resources {
            srcDirs "src/main/resources", "src/main/resources-env/${profile}"
        }
    }
}
```

argument로 profile을 넘기는데 없으면 local이 기본으로 profile 변수에 할당된다.  
그리고 resources directory는 기본적으로 core property가 포함된 src/main/resources는 디폴트로 포함시키고,  
profile에 넘긴 값에 따라서 resources 디렉토리를 설정해서 쓸 데 없는 디렉토리(application.properties 파일도)가 포함되는 걸 방지하게 만들었다.  

## 실행 환경에 따라 코드 작성하기
이제 한 번 각 env 별로 다른 값/클래스를 쓰도록 코드를 작성해보자.
기본이 되는 인터페이스를 만들자.
```java
package com.example.demo;

import org.springframework.stereotype.Service;

@Service
public interface OrderService {
    void order();
}
```

local env 전용 서비스 구현체를 만들자.
```java
package com.example.demo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Profile("local")
public class LocalOrderService implements OrderService {
    @Value("${val}")
    private String val;

    @Value("${val2}")
    private String val2;

    @Override
    public void order() {
        log.info(val);
        log.info(val2);
    }
}
```

dev env 전용 서비스 구현체를 만들자.
```java
package com.example.demo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Profile("dev")
public class DevOrderService implements OrderService {
    @Value("${val}")
    private String val;

    @Value("${val2}")
    private String val2;

    @Override
    public void order() {
        log.info(val);
        log.info(val2);
    }
}
```

prod env 전용 서비스 구현체를 만들자.
```java
package com.example.demo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Profile("prod")
public class ProdOrderService implements OrderService {
    @Value("${val}")
    private String val;

    @Value("${val2}")
    private String val2;

    @Override
    public void order() {
        log.info(val);
        log.info(val2);
    }
}
```

어떤 profile에 있는 값을 쓸 것인지 @Profile로 구분할 수 있다.  
이 @Profile 어노테이션을 안 쓸거라면 사실상 application.properties에서 spring.profiles.active는 없어도 된다.  

간단하게 해당 서비스를 쓰는 코드를 작성해보자.  
```java
package com.example.demo;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import javax.annotation.PostConstruct;

@SpringBootApplication
@RequiredArgsConstructor
public class DemoApplication {
    private final OrderService orderService;

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @PostConstruct
    public void test() {
        orderService.order();
    }
}
```

@RequiredArgsConstructor의 이름을 풀이해보면...  
1. final이 붙어있으면 무조건(Required) 초기화를 해야하고,
2. 생성자(Constructor)를 이용한 DI를 하게 돼서 나중에 모킹할 때도 좋다.  

@PostConstruct는 아래와 같은 설명을 보면 된다.  
> The PostConstruct annotation is used on a method that needs to be executed
after dependency injection is done to perform any initialization.

즉 DI 이후에 실행되는 메서드라고 보면 된다.  

## 실행 환경에 따라 실행하기
project의 specific gradle을 실행하는 Gradle Wrapper를 통해 실행해보자.  
터미널을 키고 프로젝트 루트 디렉토리로 이동해서 아래 커맨드를 실행하자.  
```bash
# local
./gradlew bootRun

# dev
./gradlew bootRun -Pprofile=dev

# prod
./gradlew bootRun -Pprofile=prod
```

위와 같이 실행하면 profile에 따라 아래와 같은 로그를 볼 수 있다.  
```log
2018-07-22 18:46:00.338  INFO 37955 --- [           main] com.example.demo.ProdOrderService        : prod
2018-07-22 18:46:00.339  INFO 37955 --- [           main] com.example.demo.ProdOrderService        : core
```

IntelliJ IDEA에서는 아래와 같이 하면 된다.  
![IDEA 우측 상단에서 Edit Configurations를 클릭하자.](/images/spring-boot-2-env/edit-configurations.png)  
![좌측 상단에 있는 + 버튼을 눌러서 Gradle을 선택하자.](/images/spring-boot-2-env/add-gradle-task.png)  
![default로 설정한 profile이 local이기 때문에 딱히 profile argument를 넘겨주지 않아도 된다.](/images/spring-boot-2-env/boot-run-local.png)  
![dev profile argument를 넘겨주자.](/images/spring-boot-2-env/boot-run-dev.png)  
![prod profile argument를 넘겨주자.](/images/spring-boot-2-env/boot-run-prod.png)  

## test profile
```
- test
  - java
    - com
      - example
        - demo
  - resources
```
테스트 패키지 구조가 위와 같다고 했을 때 resources 디렉토리에 application.properties를 만들자.  
```properties
spring.profiles.active=test
spring.profiles.include=core

val=test
```

그리고 ApplicationTests 클래스에 test 클래스를 사용하도록 수정하자.  
```java
package com.example.demo;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
@ActiveProfiles("test")
public class DemoApplicationTests {
    @Test
    public void contextLoads() {}
}
```

그리고 test 용 OrderService 서비스를 구현해보자.  
```java
package com.example.demo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Profile("test")
public class TestOrderService implements OrderService {
    @Value("${val}")
    private String val;

    @Value("${val2}")
    private String val2;

    @Override
    public void order() {
        log.info(val);
        log.info(val2);
    }
}
```

contextLoads 메서드를 테스트 해보면 아래와 같이 원하는 결과가 로깅돼서 나온다.  
```log
2018-07-22 19:45:31.941  INFO 38688 --- [           main] com.example.demo.TestOrderService        : test
2018-07-22 19:45:31.941  INFO 38688 --- [           main] com.example.demo.TestOrderService        : core
```