---
title: (Spring Boot) spring-boot-configuration-processor 활용하기
categories: [Spring Boot]
tag: [Spring Boot]
date: 2021-11-21 14:43:06
---
## Configuration Metadata
[https://docs.spring.io/spring-boot/docs/current/reference/html/configuration-metadata.html](https://docs.spring.io/spring-boot/docs/current/reference/html/configuration-metadata.html)
> Spring Boot jars include metadata files that provide details of all supported configuration properties.
> The files are designed to let IDE developers offer contextual help and “code completion” as users are working with `application.properties` or `application.yml` files.

Configuration Metadata는 IDE에서 yml 혹은 properties에서 사용하는 Configuration의 자동완성을 도와주는 메타데이터이다. (소스코드에는 영향을 1도 안 미친다.)

![application.yml을 작성하다보면 spring 관련 configuration들은 자동완성이 잘 된다.](spring-boot-configuration-processor/configuration-metadata-auto-completion.png)
![해당 configuration에서 Command + B를 누르면 실제 Properties 클래스로 이동까지 된다.](spring-boot-configuration-processor/configuration-metadata-navigate.png)
![이걸 가능하게 하는 것은 META-INF/spring-configuration-metadata.json 파일의 존재 때문이다.](spring-boot-configuration-processor/spring-boot-configuration-metadata-json.png![img.png](img.png))

## 커스텀 Configuration Metadata 정의

![커스텀한 프로퍼티는 인식을 하지 못하는 것 같다.](spring-boot-configuration-processor/custom-property.png)
![Configuration Property 클래스에서도 Spring Boot Configuration Annotation Processor가 설정돼지 않았다고 한다.](spring-boot-configuration-processor/turn-off-spring-boot-configuration-processor.png)
![자동완성을 위해서는 resources/META-INF/spring-configuration-metadata.json을 작성하면 된다.](spring-boot-configuration-processor/custom-spring-boot-configuration-metadata-json.png)
![이제 자동완성 및 어떤 클래스에서 사용하고 있는지 추적까지 잘 된다.](spring-boot-configuration-processor/custom-property-auto-completion.png)
![네비게이션은 잘 되지만 아직까지도 Spring Boot Configuration Annotation Processor가 설정돼지 않았다고 보여준다.](spring-boot-configuration-processor/turn-off-spring-boot-configuration-processor.png)

## 자동으로 Configuration Metadata 생성하기 (spring-boot-configuration-processor)
[https://docs.spring.io/spring-boot/docs/current/reference/html/configuration-metadata.html#configuration-metadata.annotation-processor](https://docs.spring.io/spring-boot/docs/current/reference/html/configuration-metadata.html#configuration-metadata.annotation-processor)

> You can easily generate your own configuration metadata file from items annotated with `@ConfigurationProperties` by using the `spring-boot-configuration-processor` jar.
> The jar includes a Java annotation processor which is invoked as your project is compiled.

@ConfigurationProperties 어노테이션이 붙은 클래스에 대한 Configuration Metadata File은 spring-boot-configuration-processor를 통해 생성할 수 있다고 한다.

build.gradle.kts에 [kapt](https://kotlinlang.org/docs/kapt.html) 플러그인을 활성화시켜준다. (코틀린 컴파일러로 컴파일하기 때문에 자바로 작성한 어노테이션을 해석하지 못하기 때문)
```kotlin
kotlin("kapt") version "1.6.0"
```

build.gradle.kts에 아래 디펜던시들을 추가해준다. (멀티 모듈인 경우 모든 모듈에 일일이 추가하는 게 귀찮으니 루트의 build.gradle.kts에 추가해주는 것이 좋다.)
```kotlin
annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
kapt("org.springframework.boot:spring-boot-configuration-processor")
```

![생성된 metadata를 업데이트하려면 Spring Boot Configuration Annotation Processor를 다시 돌리라고 나온다. (하지만 몇 번이고 어노테이션 프로세서를 돌려도 해당 알림을 사라지지 않기 때문에 그냥 숨기는 걸 추천한다.)](spring-boot-configuration-processor/re-run-spring-boot-configuration-processor.png)
![Annotation Processor를 돌리려면 kaptKotlin 태스크를 실행시키면 된다. (자바 프로젝트에서는 compileJava 태스크를 실행시키면 된다.)](spring-boot-configuration-processor/run-gradle-kapt-task.png)
![annotation processor에 의해 메타데이터가 생성되었다.](spring-boot-configuration-processor/generated-configuration-metadata-json-location.png)
![description 같은 건 없지만 나름 쓸만하게 뽑혔다.](spring-boot-configuration-processor/generated-configuration-metadata-json.png)
![자동완성이나 네비게이션도 잘 된다.](spring-boot-configuration-processor/custom-property-navigate.png)

다만 몇 가지 한계점이 있는데 아래와 같다.

1. @ConfigurationProperties에 대해서만 동작하기 때문에 @Value와 같이 단순하게 사용한 경우에는 해당 configuration에 대해서 metadata가 생성되지 않는다.
2. properties나 yml에 정의만 해놓고 @ConfigurationProperties 클래스를 생성하지 않은 경우에는 해당 configuration에 대해서 metadata가 생성되지 않는다.
3. properties나 yml의 위치하는 모듈과 @ConfigurationProperties 클래스가 위치하는 모듈이 다른 경우에는 해당 configuration에 대해서 metadata가 생성되지 않는다. 소스코드가 돌아가는데는 전혀 문제가 없지만 올바른 설계인지 고민을 한 번 해보는 것이 좋다.
