---
title: Spring Boot + JUnit에서 의존성 주입하기
tags: [Spring, Spring Boot, JUnit]
categories: [Spring Boot]
date: 2020-12-25 02:55:29
---
## JUnt 4
Field Injection 밖에 되지 않음.
[Spring Boot 2.2.0](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.2-Release-Notes#junit-5)부터 JUnit 5가 기본으로 탑재되기 시작했고,
[Spring Boot 2.4.0](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.4-Release-Notes#junit-5s-vintage-engine-removed-from-spring-boot-starter-test)부터는 아예 JUnit 4 의존성이 제거됐기 때문에 `JUnit 4의 사용은 하지 말아야한다.`
```kotlin
@RunWith(SpringRunner::class)
@SpringBootTest
class SomeTest {
    @Autowired
    private lateinit var a: SomeComponent
    @Test
    fun contextLoad() {}
}
```

## JUnit 5
JUnit 5의 [@ExtendedWith](https://junit.org/junit5/docs/5.1.1/api/org/junit/jupiter/api/extension/ExtendWith.html) 어노테이션을 이용하면 테스트 전/후로 다양한 일을 할 수 있다.
@ExtendedWith 어노테이션은 어노테이션에 명시한 [Extension](https://junit.org/junit5/docs/5.1.1/api/org/junit/jupiter/api/extension/Extension.html)들을 실행하는 역할 뿐이 하지 않는다.
```java
@Repeatable(Extensions.class)
public @interface ExtendWith {
    /**
    * An array of one or more {@link Extension} classes to register.
    */
    Class<? extends Extension>[] value()
}
```

[AfterEachCallback](https://junit.org/junit5/docs/5.1.1/api/org/junit/jupiter/api/extension/AfterEachCallback.html)과 같은 다양한 Extension 인터페이스들을 직접 개발자가 구현하고 본인이 원하는 Extension만 넣으면 되는 구조다.
이렇게 함으로써 전/후 처리 해야되는 내용들은 Extnsion을 통해 직접 구현하고 @ExtendedWith에 기술함으로써 개발자가 좀 더 테스트에 집중할 수 있게 만들어준다.

[@SpringBootTest](https://github.com/spring-projects/spring-boot/blob/2.0.x/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTest.java#L75)처럼 어플리케이션 컨텍스트를 로딩해야하는 테스트를 작성할 때 컨텍스트 로딩하는 코드를 직접 테스트 코드에 삽입하지 않고,
여러 Extension을 구현한 [SpringExtension](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L78)을 사용하여 문제를 해결할 수 있다.
또한 SpringExtension을 사용하면 Constructor Injection도 지원하는데 SpringExtension이 [ParameterResolver](https://junit.org/junit5/docs/5.1.1/api/org/junit/jupiter/api/extension/ParameterResolver.html) Extension을 구현했기 때문이다.
```java
public class SpringExtension implements BeforeAllCallback, AfterAllCallback, TestInstancePostProcessor,
    BeforeEachCallback, AfterEachCallback, BeforeTestExecutionCallback, AfterTestExecutionCallback,
       ParameterResolver {
```

> ParameterResolver defines the API for Extensions that wish to dynamically resolve arguments for parameters at runtime.
  If a constructor for a test class or a @Test, @BeforeEach, @AfterEach, @BeforeAll, or @AfterAll method declares a parameter, an argument for the parameter must be resolved at runtime by a ParameterResolver.

ParameterResolver는 두 개의 API를 가지고 있는데 해당 파라미터의 리졸빙을 지원하는지를 판단하는 [supportsParameter](https://junit.org/junit5/docs/5.1.1/api/org/junit/jupiter/api/extension/ParameterResolver.html#supportsParameter-org.junit.jupiter.api.extension.ParameterContext-org.junit.jupiter.api.extension.ExtensionContext-) 메서드와 실제 리졸빙을 하는 [resolveParameter](https://junit.org/junit5/docs/5.1.1/api/org/junit/jupiter/api/extension/ParameterResolver.html#resolveParameter-org.junit.jupiter.api.extension.ParameterContext-org.junit.jupiter.api.extension.ExtensionContext-) 메서드가 있다.

### Spring Boot 2.0.x (Spring 5.0.x)
[Spring Boot 2.0.x는 Spring 5.0.x를 사용](https://github.com/spring-projects/spring-boot/blob/2.0.x/spring-boot-project/spring-boot-dependencies/pom.xml#L156)하기 때문에 [Spring Test 5.0.x의 SpringExtension 클래스](https://github.com/spring-projects/spring-framework/blob/5.0.x/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L60)를 보면 당연히 ParameterResolver Extension을 구현하였다.
[supportsParameter 메서드 로직 중에 @Autowired 어노테이션이 포함돼있는지를 판단](https://github.com/spring-projects/spring-framework/blob/5.0.x/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L161)하여 지원 여부를 구분하고
```java
@Override
public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
    Parameter parameter = parameterContext.getParameter();
    int index = parameterContext.getIndex();
    Executable executable = parameter.getDeclaringExecutable();
    return (executable instanceof Constructor &&
        AnnotatedElementUtils.hasAnnotation(executable, Autowired.class)) ||
        ParameterAutowireUtils.isAutowirable(parameter, index);
}
```
[resolveParameter 메서드에서는 ParameterAutowireUtils.resolveDependency 메서드를 호출](https://github.com/spring-projects/spring-framework/blob/5.0.x/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L179)하여 실제 리졸빙을 수행하고 있다.
```java
@Override
@Nullable
public Object resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
    Parameter parameter = parameterContext.getParameter();
    int index = parameterContext.getIndex();
    Class<?> testClass = extensionContext.getRequiredTestClass();
    ApplicationContext applicationContext = getApplicationContext(extensionContext);
    return ParameterAutowireUtils.resolveDependency(parameter, index, testClass, applicationContext);
}
```

그리고 [Spring Boot Test 2.0.x에서는 @SpringBootTest 어노테이션](https://github.com/spring-projects/spring-boot/blob/2.0.x/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTest.java#L75)에 @ExtendedWith(SpringExtension.class)가 포함돼있지 않다.
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@BootstrapWith(SpringBootTestContextBootstrapper.class)
public @interface SpringBootTest {
```

따라서 @ExtendedWith(SpringExtension.class)를 무조건 명시해주어야 어플리케이션 컨텍스트가 정상적으로 로딩된다.
```java
@ExtendedWith(SpringExtension::class)
@SpringBootTest
class SomeTest(
    @Autowired
    private val a: SomeComponent
) {
    @Test
    fun contextLoad() {}
}
```

### Spring Boot 2.1.x (Spring 5.1.x)
[Spring Boot 2.1.x는 Spring 5.1.x를 사용](https://github.com/spring-projects/spring-boot/blob/2.1.x/spring-boot-project/spring-boot-dependencies/pom.xml#L168)하기 때문에 [Spring Test 5.1.x의 SpringExtension 클래스의 supportsParameter 메서드를 보면 Autowired 어노테이션이 있는지 비교하는 부분](https://github.com/spring-projects/spring-framework/blob/5.1.x/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L161)은 똑같아서 큰 변화가 없다.
하지만 [Spring Boot Test 2.1.x에서는 @SpringBootTest 어노테이션에 @ExtendedWith(SpringExtension.class)가 포함](https://github.com/spring-projects/spring-boot/blob/2.1.x/spring-boot-project/spring-boot-test/src/main/java/org/springframework/boot/test/context/SpringBootTest.java#L78)됐다.
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@BootstrapWith(SpringBootTestContextBootstrapper.class)
@ExtendWith(SpringExtension.class)
public @interface SpringBootTest {
```

이는 어플리케이션 컨텍스트를 로딩하는 다른 테스트 [@WebMvcTest](https://github.com/spring-projects/spring-boot/blob/2.1.x/spring-boot-project/spring-boot-test-autoconfigure/src/main/java/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.java#L80), [@DataJpaTest](https://github.com/spring-projects/spring-boot/blob/2.1.x/spring-boot-project/spring-boot-test-autoconfigure/src/main/java/org/springframework/boot/test/autoconfigure/orm/jpa/DataJpaTest.java#L75), [@JsonTest](https://github.com/spring-projects/spring-boot/blob/2.1.x/spring-boot-project/spring-boot-test-autoconfigure/src/main/java/org/springframework/boot/test/autoconfigure/json/JsonTest.java#L68) 등등과 같은 Slice Test 류에도 동일하게 적용되었다.
따라서 테스트를 작성할 때 @ExtendWith가 생략 가능해졌다.
```java
@SpringBootTest
class SomeTest(
    @Autowired
    private val a: SomeComponent
) {
    @Test
    fun contextLoad() {}
}
```

### Spring Boot 2.2.x (Spring 5.2x)
[Spring Boot 2.2.x는 Spring 5.2.x](https://github.com/spring-projects/spring-boot/blob/2.2.x/spring-boot-project/spring-boot-dependencies/pom.xml#L194)를 사용하기 때문에 [Spring Test 5.2.x의 SpringExtension 클래스를 보면 supportsParameter 메서드](https://github.com/spring-projects/spring-framework/blob/5.2.x/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L166)의 로직이 달라져있다.
```java
@Override
public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
    Parameter parameter = parameterContext.getParameter();
    Executable executable = parameter.getDeclaringExecutable();
    Class<?> testClass = extensionContext.getRequiredTestClass();
    return (TestConstructorUtils.isAutowirableConstructor(executable, testClass) ||
        ApplicationContext.class.isAssignableFrom(parameter.getType()) ||
        ParameterResolutionDelegate.isAutowirable(parameter, parameterContext.getIndex()));
}
```

단순히 @Autowired 어노테이션이 있는지 검사하는 게 아니라 [TestConstructorUtils.isAutowirableConstructor 메서드](https://github.com/spring-projects/spring-framework/blob/5.2.x/spring-test/src/main/java/org/springframework/test/context/support/TestConstructorUtils.java#L60)를 호출하는 것으로 변하였다. 해당 메서드를 계속 추적하다보면 아래 메서드를 만나게 된다.
```java
public static boolean isAutowirableConstructor(Constructor<?> constructor, Class<?> testClass) {
    // Is the constructor annotated with @Autowired?
    if (AnnotatedElementUtils.hasAnnotation(constructor, Autowired.class)) {
            return true;
        }

    AutowireMode autowireMode = null;

    // Is the test class annotated with @TestConstructor?
    TestConstructor testConstructor = AnnotatedElementUtils.findMergedAnnotation(testClass, TestConstructor.class);
    if (testConstructor != null) {
        autowireMode = testConstructor.autowireMode();
    }
    else {
        // Custom global default?
        String value = SpringProperties.getProperty(TestConstructor.TEST_CONSTRUCTOR_AUTOWIRE_MODE_PROPERTY_NAME);
        if (value != null) {
            try {
                autowireMode = AutowireMode.valueOf(value.trim().toUpperCase());
            }
            catch (Exception ex) {
                if (logger.isDebugEnabled()) {
                    logger.debug(String.format("Failed to parse autowire mode '%s' for property '%s': %s", value,
                        TestConstructor.TEST_CONSTRUCTOR_AUTOWIRE_MODE_PROPERTY_NAME, ex.getMessage()));
                }
            }
        }
    }

    return (autowireMode == AutowireMode.ALL);
}
```

1. @Autowired 어노테이션이 달려있으면 true를 반환한다.
2. autowireMode 변수를 선언하고, null로 초기화한다.
3. [@TestConstructor 어노테이션](https://github.com/spring-projects/spring-framework/blob/5.2.x/spring-test/src/main/java/org/springframework/test/context/TestConstructor.java#L66)이 달려있는지 확인한다.
    1. 달려있으면 해당 어노테이션의 autowireMode 프로퍼티를 autowireMode 변수에 할단한다.
    2. 달려있지 않으면 아래 분기를 탄다.
        1.  클래스 패스에 있는 spring.properties 파일에서 spring.test.constructor.autowire.mode 프로퍼티를 가져온다.
        2. 프로퍼티를 AutowireMode enum으로 변환해보고 성공하면 autowireMode 변수에 할당한다.
4. autowireMode 변수가 AutowireMode.ALL과 같으면 true, 다르면 false를 반환한다.

#### @TestConstructor 어노테이션을 통한 @Autowired 어노테이션 생략
테스트 별로 설정이 다를 때 테스트 마다 @TestConstructor를 달고 안 달고 설정할 수 있다.
spring.properties에 spring.test.constructor.autowire.mode=all로 설정하지 않는 이상 @TestConstructor(autowireMode = TestConstructor.AutowireMode.NONE)이 기본 값처럼 동작하기 때문에 전역적으로 ALL로 설정한 게 아닌 이상 AutowireMode.NONE은 굳이 사용할 필요가 없다.

```kotlin
@SpringBootTest
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class SomeTest(
    private val a: SomeComponent
) {
    @Test
    fun contextLoad() {}
}
```

#### spring.properties 파일을 통한 @Autowired 어노테이션 생략
[TestConstructorUtils.isAutowirableConstructor 메서드](https://github.com/spring-projects/spring-framework/blob/5.2.x/spring-test/src/main/java/org/springframework/test/context/support/TestConstructorUtils.java#L60)에서 전역으로 설정된 값을 가져오기 위해 이런 부분이 있었다.
```java
public @interface TestConstructor {
	String value = SpringProperties.getProperty(TestConstructor.TEST_CONSTRUCTOR_AUTOWIRE_MODE_PROPERTY_NAME);
```

그리고 TestConstructor에는 TEST_CONSTRUCTOR_AUTOWIRE_MODE_PROPERTY_NAME이 있다.
```java
String TEST_CONSTRUCTOR_AUTOWIRE_MODE_PROPERTY_NAME = "spring.test.constructor.autowire.mode";
```

[SpringProperties 클래스의 getProperty 메서드](https://github.com/spring-projects/spring-framework/blob/5.2.x/spring-core/src/main/java/org/springframework/core/SpringProperties.java#L109)를 보면 localProperties 변수로부터 프로퍼티를 가져오고 있다.
```java
@Nullable
public static String getProperty(String key) {
    String value = localProperties.getProperty(key);
    if (value == null) {
```

그리고 localProperties는 static final 변수라서 다시 재할당 되지 않고, [static 초기화 블럭](https://github.com/spring-projects/spring-framework/blob/5.2.x/spring-core/src/main/java/org/springframework/core/SpringProperties.java#L58)에 의해 어떻게 초기화 되는지 봐보면
```java
private static final String PROPERTIES_RESOURCE_LOCATION = "spring.properties";
private static final Properties localProperties = new Properties();

static {
    try {
        ClassLoader cl = SpringProperties.class.getClassLoader();
        URL url = (cl != null ? cl.getResource(PROPERTIES_RESOURCE_LOCATION) :
        ClassLoader.getSystemResource(PROPERTIES_RESOURCE_LOCATION));
        if (url != null) {
            logger.debug("Found 'spring.properties' file in local classpath");
            InputStream is = url.openStream();
            try {
                localProperties.load(is);
            }
            finally {
                is.close();
            }
        }
    }
    catch (IOException ex) {
        if (logger.isInfoEnabled()) {
            logger.info("Could not load 'spring.properties' file from local classpath: " + ex);
        }
    }
}
```

PROPERTIES_RESOURCE_LOCATION 변수에 있는 리소스를 읽어들여서 localProperties에 로딩하는 걸 볼 수 있다.
PROPERTIES_RESOURCE_LOCATION 변수도 static final 변수이기 때문에 무조건 classpath 내에 존재하는 [spring.properties](/2020/12/25/spring-properties-file)라는 파일로부터 읽어들인다는 사실을 알 수 있다.

[Gradle의 java plugin](https://docs.gradle.org/current/userguide/java_plugin.html#sec:java_project_layout)을 사용하면 기본적으로 src/main/resources나 src/test/resources를 classpath에 등록해준다.
하지만 spring boot를 사용하기 위해 필수적으로 적용하는 [Spring Boot Gradle Plugin](https://docs.spring.io/spring-boot/docs/2.0.0.RELEASE/gradle-plugin/reference/html)을 사용하면 Spring Boot 2.0.0.RELEASE 이후부터는 기본적으로 java 플러그인이 적용되기 때문에 따로 적용할 필요가 없다.
> A typical Spring Boot project will apply the groovy, java, or org.jetbrains.kotlin.jvm plugin and the io.spring.dependency-management plugin as a minimum.

이 설정은 테스트용 설정이기 때문에 `src/test/resources에 spring.properties 파일`을 만들고 아래와 같이 프로퍼티를 설정하면 된다.
```
spring.test.constructor.autowire.mode=all
```

위와 같이 전역에 공통적으로 autowireMode를 설정하고 나면 테스트 코드에서 @TestConstructor 어노테이션을 사용하지 않아도 @Autowired 어노테이션 없이 생성자를 통한 의존성 주입을 받을 수 있다
```kotlin
@SpringBootTest
class SomeTest(
    private val a: SomeComponent
) {
    @Test
    fun contextLoad() {}
}
```

### Spring Boot 2.3.x (Spring 5.2.x)
[Spring Boot 2.3.x는 Spring 5.2.x를 사용](https://github.com/spring-projects/spring-boot/blob/2.3.x/spring-boot-project/spring-boot-dependencies/build.gradle#L1675)하는데 Spring Boot 2.2.x와 동일한 스프링 버전을 사용했기 때문인지 Junit 5에서 Dependency Injection을 위한 변화는 없었다.

### Spring Boot 2.4.x (Spring 5.3.2)
[Spring Boot 2.4.x는 Spring 5.3.x를 사용](https://github.com/spring-projects/spring-boot/blob/2.4.x/spring-boot-project/spring-boot-dependencies/build.gradle#L1567)하기 때문에 [Spring Test 5.3.x의 SpringExtension 클래스를 보면 supportsParameter](https://github.com/spring-projects/spring-framework/blob/master/spring-test/src/main/java/org/springframework/test/context/junit/jupiter/SpringExtension.java#L233) 메서드의 로직이 달라져있다.
```java
@Override
public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
    Parameter parameter = parameterContext.getParameter();
    Executable executable = parameter.getDeclaringExecutable();
    Class<?> testClass = extensionContext.getRequiredTestClass();
    PropertyProvider junitPropertyProvider = propertyName ->
    extensionContext.getConfigurationParameter(propertyName).orElse(null);
    return (TestConstructorUtils.isAutowirableConstructor(executable, testClass, junitPropertyProvider) ||
        ApplicationContext.class.isAssignableFrom(parameter.getType()) ||
        ParameterResolutionDelegate.isAutowirable(parameter, parameterContext.getIndex()));
}
```

이번엔 [TestConstructorUtils.isAutowirableConstructor 메서드](https://github.com/spring-projects/spring-framework/blob/65a395ef0e96c5e5ce28526d1fe975daaa566b0d/spring-test/src/main/java/org/springframework/test/context/support/TestConstructorUtils.java#L92)에 junitPropertyProvider까지 넘기고 있다.
그리고 해당 메서드를 계속 타고 들어가면 아래와 같이 로직이 바뀌어있는 걸 볼 수 있다.
```java
public static boolean isAutowirableConstructor(Constructor<?> constructor, Class<?> testClass,
@Nullable PropertyProvider fallbackPropertyProvider) {

    // Is the constructor annotated with @Autowired?
    if (AnnotatedElementUtils.hasAnnotation(constructor, Autowired.class)) {
            return true;
        }

    AutowireMode autowireMode = null;

    // Is the test class annotated with @TestConstructor?
    TestConstructor testConstructor = TestContextAnnotationUtils.findMergedAnnotation(testClass, TestConstructor.class);
    if (testConstructor != null) {
        autowireMode = testConstructor.autowireMode();
    }
    else {
        // Custom global default from SpringProperties?
        String value = SpringProperties.getProperty(TestConstructor.TEST_CONSTRUCTOR_AUTOWIRE_MODE_PROPERTY_NAME);
        autowireMode = AutowireMode.from(value);

        // Use fallback provider?
        if (autowireMode == null && fallbackPropertyProvider != null) {
            value = fallbackPropertyProvider.get(TestConstructor.TEST_CONSTRUCTOR_AUTOWIRE_MODE_PROPERTY_NAME);
            autowireMode = AutowireMode.from(value);
        }
    }

    return (autowireMode == AutowireMode.ALL);
}
```
1. @Autowired 어노테이션이 달려있으면 true를 반환한다.
2. autowireMode 변수를 선언하고, null로 초기화한다.
3. [@TestConstructor 어노테이션](https://github.com/spring-projects/spring-framework/blob/65a395ef0e96c5e5ce28526d1fe975daaa566b0d/spring-test/src/main/java/org/springframework/test/context/TestConstructor.java#L75)이 달려있는지 확인한다.
    1. 달려있으면 해당 어노테이션의 autowireMode 프로퍼티를 autowireMode 변수에 할단한다.
    2. 달려있지 않으면 아래 분기를 탄다.
        1.  클래스 패스에 있는 spring.properties 파일에서 spring.test.constructor.autowire.mode 프로퍼티를 가져온다.
        2. 가져온 프로퍼티를 AutowireMode enum으로 변환해서 autowireMode 변수에 할당한다.
        3. AutowireMode enum으로 변환에 실패했는데 fallbackPropertyProvider(junitPropertyProvider)가 존재하면 아래 분기를 탄다.
            1. junitPropertyProvider에서 spring.test.constructor.autowire.mode 프로퍼티를 가져온다.
            2. 프로퍼티를 AutowireMode enum으로 변환해서 autowireMode 변수에 할당한다.
4. autowireMode 변수가 AutowireMode.ALL과 같으면 true, 다르면 false를 반환한다.

junitPropertyProvider로부터 읽어오는 부분이 추가된 건데 추가하는 방법은 [스프링 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/testing.html#integration-testing-annotations-testconstructor)에 나와있다.
> Changing the default test constructor autowire mode
> The default test constructor autowire mode can be changed by setting the spring.test.constructor.autowire.mode JVM system property to all.
> Alternatively, the default mode may be set via the SpringProperties mechanism.
> As of Spring Framework 5.3, the default mode may also be configured as a JUnit Platform configuration parameter.

JUnit Platform configuration parameter를 설정하는 방법은 [JUnit 공식문서](https://junit.org/junit5/docs/current/user-guide/#running-tests-config-params)에 나와있고, junit-platform.properties 파일을 만들어서 클래스패스에 추가하면 적용이 된다.
> The JUnit Platform configuration file: a file named junit-platform.properties in the root of the class path that follows the syntax rules for a Java Properties file.

spring.properties는 테스트 전용 설정파일이 아닌데 반해 junit-platform.properties 파일은 테스트 전용 설정파일이기 때문에 우리가 설정하려는 값은 테스트 전용 값이라서 junit-platform.properties에 있는 게 더 좋다고 볼 수 있다.

`/src/test/resources에 junit-platform.properties 파일`을 만들어주자.
자바 표준 API인 Properties 문법을 따른다고 하니 아래와 같이 적어주면 된다.
```
spring.test.constructor.autowire.mode=all
```

위와 같이 전역에 공통적으로 autowireMode를 설정하고 나면 테스트 코드에서 @TestConstructor 어노테이션을 사용하지 않아도 @Autowired 어노테이션 없이 생성자를 통한 의존성 주입을 받을 수 있다.
```java
@SpringBootTest
class SomeTest(
    private val a: SomeComponent
) {
    @Test
    fun contextLoad() {}
}
```
