---
title: (Jackson) LocalDate, LocalTime, LocalDateTime 뽀개기 - Deserialize
date: 2018-01-15 23:24:07
tags: [Java, Spring Boot, Jackson, JSON]
---

![](thumb.png)

[잭슨](https://github.com/FasterXML/jackson)은 JSON -> Java 클래스로 Deserialize, Java 클래스 -> JSON으로 Serialize 할 때 매우 유용한 라이브러리다.  

하지만 잭슨이 나온 이후에 자바 8이 나왔는지 모르겠는데 LocalDate, LocalTime, LocalDateTime 등등의 클래스를 기본적으로 깔끔하게 처리해주지 못한다.  
따라서 이번에는 어렵지는 않지만 새로 프로젝트 구성할 때마다 매번 까먹어서 찾아 헤매던 케이스들을 정리해봤다.  
또한 예제의 설명은 스프링 부트를 기준으로 설명하겠다.  

## Parameter
파라미터로 데이터를 받는 api를 만들어보자.  
```java
@RestController
public class Controller {
    @GetMapping("/")
    public void get(@RequestParam LocalDate date, @RequestParam LocalTime time, @RequestParam LocalDateTime dateTime) {}
}
```

`GET /?date=2011-11-11&time=11:11:11&dateTime=2017-11-11 11:11:11`으로 요청을 날려보면 아래와 같은 응답을 받을 수 있다.  
```json
{
    "timestamp": 1516027261943,
    "status": 400,
    "error": "Bad Request",
    "exception": "org.springframework.web.method.annotation.MethodArgumentTypeMismatchException",
    "message": "Failed to convert value of type 'java.lang.String' to required type 'java.time.LocalDate'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [@org.springframework.web.bind.annotation.RequestParam java.time.LocalDate] for value '2011-11-11'; nested exception is java.lang.IllegalArgumentException: Parse attempt failed for value [2011-11-11]",
    "path": "/get"
}
```

파라미터로 넘긴 값들을 String으로 인식해서 TypeMismatchException이 발생했다.  
이럴 땐 @DateTimeFormat 어노테이션을 파라미터에 달아주면 된다.  

```java
@RestController
public class Controller {
    @GetMapping("/")
    public DateType get(@RequestParam
                        @DateTimeFormat(pattern = "yyyy-MM-dd")
                        LocalDate date,
                        @RequestParam
                        @DateTimeFormat(pattern = "HH:mm:ss")
                        LocalTime time,
                        @RequestParam
                        @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
                        LocalDateTime dateTime) {}
}
```

**@RequestParam 어노테이션을 붙여서 파라미터로 넘긴 경우에는 잭슨의 Deserialize와는 관련이 없는 것 같다.**

## Deserialize
### Parameter(Command 객체)
그럼 파라미터로 데이터를 받으면서 잭슨의 Deserializer를 태울려면 어떻게 해야할까?  
아래와 같이 컨트롤러를 수정해주면 된다.  
```java
@RestController
@RequestMapping("/")
public class Controller {
    @GetMapping
    public void get(DateType dateType) {}
}
```

@RequestParam으로 받던 데이터들을 하나의 클래스로 퉁쳤다. 
[what is the command object in spring framework](https://stackoverflow.com/questions/7583577/what-is-the-command-object-in-spring-framework)
에 따르면 Command Object는 그냥 VO/POJO/JavaBean/기타 등등을 일컫는 것 같다.   
이제 그 커맨드 객체를 만들어보자.  
```java
public class DateType {
    private LocalDate date;
    private LocalTime time;
    private LocalDateTime dateTime;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public DateType(LocalDate date, LocalTime time, LocalDateTime dateTime) {
        this.date = date;
        this.time = time;
        this.dateTime = dateTime;
    }
}
```

`GET /?date=2011-11-11&time=11:11:11&dateTime=2017-11-11 11:11:11`으로 요청을 날려보면 아래와 같은 응답을 받게 된다.  
```json
{
    "timestamp": 1516036778600,
    "status": 500,
    "error": "Internal Server Error",
    "exception": "org.springframework.beans.BeanInstantiationException",
    "message": "Failed to instantiate [com.example.demo.DateType]: No default constructor found; nested exception is java.lang.NoSuchMethodException: com.example.demo.DateType.<init>()",
    "path": "/"
}
```

커맨드 객체로 받는 클래스에는 무조건 기본 생성자가 있어야한다.  
하지만 위에 매개변수를 3개 받는 생성자를 만들었기에 아무런 매개변수도 받지 않는 생성자를 만들어야한다.
```java
public class DateType {
    private LocalDate date;
    private LocalTime time;
    private LocalDateTime dateTime;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public DateType(LocalDate date, LocalTime time, LocalDateTime dateTime) {
        this.date = date;
        this.time = time;
        this.dateTime = dateTime;
    }

    public DateType() {}
}
```

다시 동일한 요청을 보내면 아래와 같은 응답을 받게 된다.  
```json
{
    "timestamp": 1516036927928,
    "status": 400,
    "error": "Bad Request",
    "exception": "org.springframework.validation.BindException",
    "errors": [
        {
            "codes": [
                "typeMismatch.dateType.date",
                "typeMismatch.date",
                "typeMismatch.java.time.LocalDate",
                "typeMismatch"
            ],
            "arguments": [
                {
                    "codes": [
                        "dateType.date",
                        "date"
                    ],
                    "arguments": null,
                    "defaultMessage": "date",
                    "code": "date"
                }
            ],
            "defaultMessage": "Failed to convert property value of type 'java.lang.String' to required type 'java.time.LocalDate' for property 'date'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [java.time.LocalDate] for value '2011-11-11'; nested exception is java.lang.IllegalArgumentException: Parse attempt failed for value [2011-11-11]",
            "objectName": "dateType",
            "field": "date",
            "rejectedValue": "2011-11-11",
            "bindingFailure": true,
            "code": "typeMismatch"
        },
        {
            "codes": [
                "typeMismatch.dateType.dateTime",
                "typeMismatch.dateTime",
                "typeMismatch.java.time.LocalDateTime",
                "typeMismatch"
            ],
            "arguments": [
                {
                    "codes": [
                        "dateType.dateTime",
                        "dateTime"
                    ],
                    "arguments": null,
                    "defaultMessage": "dateTime",
                    "code": "dateTime"
                }
            ],
            "defaultMessage": "Failed to convert property value of type 'java.lang.String' to required type 'java.time.LocalDateTime' for property 'dateTime'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [java.time.LocalDateTime] for value '2017-11-11 11:11:11'; nested exception is java.lang.IllegalArgumentException: Parse attempt failed for value [2017-11-11 11:11:11]",
            "objectName": "dateType",
            "field": "dateTime",
            "rejectedValue": "2017-11-11 11:11:11",
            "bindingFailure": true,
            "code": "typeMismatch"
        },
        {
            "codes": [
                "typeMismatch.dateType.time",
                "typeMismatch.time",
                "typeMismatch.java.time.LocalTime",
                "typeMismatch"
            ],
            "arguments": [
                {
                    "codes": [
                        "dateType.time",
                        "time"
                    ],
                    "arguments": null,
                    "defaultMessage": "time",
                    "code": "time"
                }
            ],
            "defaultMessage": "Failed to convert property value of type 'java.lang.String' to required type 'java.time.LocalTime' for property 'time'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [java.time.LocalTime] for value '11:11:11'; nested exception is java.lang.IllegalArgumentException: Parse attempt failed for value [11:11:11]",
            "objectName": "dateType",
            "field": "time",
            "rejectedValue": "11:11:11",
            "bindingFailure": true,
            "code": "typeMismatch"
        }
    ],
    "message": "Validation failed for object='dateType'. Error count: 3",
    "path": "/"
}
```
역시나 String으로 인식해서 발생하는 문제다.  
@DateTimeFormat을 사용하자.  
```java
public class DateType {
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    @DateTimeFormat(pattern = "HH:mm:ss")
    private LocalTime time;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dateTime;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public DateType(LocalDate date, LocalTime time, LocalDateTime dateTime) {
        this.date = date;
        this.time = time;
        this.dateTime = dateTime;
    }

    public DateType() {}
}
```

이제 다시 GET 요청을 보내면 정상적으로 Deserialize 돼서 오류가 나지 않는다.  

### Body (JSON)
Requset Body로 보낼 객체는 위에서 만든 커맨드 객체를 재활용해서 api를 만들어보자.  
```java
@RestController
public class Controller {
    @PostMapping("/")
    public void post(@RequestBody DateType dateType) {}
}
```

`POST /`

```json
{
	"date": "2011-11-11",
	"time": "11:11:11",
	"dateTime": "2011-11-11 11:11:11"
}
```
으로 요청을 날려보면 아래와 같은 응답을 받을 수 있다.  
```json
{
    "timestamp": 1516031758629,
    "status": 400,
    "error": "Bad Request",
    "exception": "org.springframework.http.converter.HttpMessageNotReadableException",
    "message": "JSON parse error: Can not construct instance of java.time.LocalDate: no String-argument constructor/factory method to deserialize from String value ('2011-11-11'); nested exception is com.fasterxml.jackson.databind.JsonMappingException: Can not construct instance of java.time.LocalDate: no String-argument constructor/factory method to deserialize from String value ('2011-11-11')\n at [Source: java.io.PushbackInputStream@405079af; line: 2, column: 10] (through reference chain: com.example.demo.DateType[\"date\"])",
    "path": "/"
}
```

웬일인지 모르겠지만 문제가 발생한다.  

#### [JSR-310](https://jcp.org/en/jsr/detail?id=310) (Java Specification Request - Date and Time API)  
[Spring Jpa java8 date (LocalDateTime) 와 Jackson](http://wonwoo.ml/index.php/post/1008)을 참고했을 때  
Java8이 나오기 전에는 Date 클래스가 좀 허접했다고 한다.  
그 이전에는 [Joda Time](http://www.joda.org/joda-time/)이라는 라이브러리를 사용했다고 한다.  
이 JSR-310 스펙은 조다 타임의 창시자도 같이 제정했다고 하니 아주 믿을만(?)한 스펙인 거 같다.  
이 스펙의 구현체가 LocalDate, LocalTime, LocalDateTime 등등인 것 같다.  

잭슨에서 제대로 저런 날짜/시간 관련 클래스를 (De)Serialize 하려면 [Jackson Datatype: JSR310](https://mvnrepository.com/artifact/com.fasterxml.jackson.datatype/jackson-datatype-jsr310)을 Dependency에 추가해줘야한다.  
Maven이나 Gradle에 추가해주자.  

그리고 나서 다시 서버를 띄워보면 다음과 같은 응답이 날아온다.  
```json
{
    "timestamp": 1516032507565,
    "status": 400,
    "error": "Bad Request",
    "exception": "org.springframework.http.converter.HttpMessageNotReadableException",
    "message": "JSON parse error: Can not deserialize value of type java.time.LocalDateTime from String \"2011-11-11 11:11:11\": Text '2011-11-11 11:11:11' could not be parsed at index 10; nested exception is com.fasterxml.jackson.databind.exc.InvalidFormatException: Can not deserialize value of type java.time.LocalDateTime from String \"2011-11-11 11:11:11\": Text '2011-11-11 11:11:11' could not be parsed at index 10\n at [Source: java.io.PushbackInputStream@c126518; line: 4, column: 14] (through reference chain: com.example.demo.DateType[\"dateTime\"])",
    "path": "/"
}
```

어떤 이유에선지 LocalDateTime만 제대로 Deserialize 못 하고 있다.  
아래와 같이 request body를 수정해주면 된다.  

```json
{
	"date": "2011-11-11",
	"time": "11:11:11",
	"dateTime": "2011-11-11T11:11:11"
}
```

하지만 날짜와 시간 사이에 존재하는 저 T가 꼴불견이다.  
저 T를 날리기 위해서는 잭슨의 어노테이션인 @JsonFormat을 쓰면 된다.
```java
public class DateType {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime time;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dateTime;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public DateType(LocalDate date, LocalTime time, LocalDateTime dateTime) {
        this.date = date;
        this.time = time;
        this.dateTime = dateTime;
    }

    public DateType() {
        this.date = LocalDate.now();
    }
}
```

이렇게 하고 T를 뺀 상태로 응답을 보내면 아주 잘 날아온다.  

### Custom Deserializer
하지만 이렇게 되면 날짜/시간 클래스에게 일일이 어노테이션을 달아줘야하니 귀챠니즘이 상당해진다.  
이럴 때 잭슨의 기본 Deserializer를 오버라이딩한 Custom Deserializer를 사용하게 설정을 수정해주면 된다.  

```java
@Configuration
public class JacksonConfig {
    @Bean
    public Module jsonMapperJava8DateTimeModule() {
        SimpleModule module = new SimpleModule();

        module.addDeserializer(LocalDate.class, new JsonDeserializer<LocalDate>() {
            @Override
            public LocalDate deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException {
                return LocalDate.parse(jsonParser.getValueAsString(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            }
        });

        module.addDeserializer(LocalTime.class, new JsonDeserializer<LocalTime>() {
            @Override
            public LocalTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException {
                return LocalTime.parse(jsonParser.getValueAsString(), DateTimeFormatter.ofPattern("HH:mm:ss"));
            }
        });

        module.addDeserializer(LocalDateTime.class, new JsonDeserializer<LocalDateTime>() {
            @Override
            public LocalDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException {
                return LocalDateTime.parse(jsonParser.getValueAsString(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            }
        });

        return module;
    }
}
```

그리고 DateType 클래스에서 @JsonFormat 어노테이션을 빼주자.
```java
public class DateType {
    private LocalDate date;
    private LocalTime time;
    private LocalDateTime dateTime;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public DateType(LocalDate date, LocalTime time, LocalDateTime dateTime) {
        this.date = date;
        this.time = time;
        this.dateTime = dateTime;
    }

    public DateType() {
        this.date = LocalDate.now();
    }
}
```

사실 Custom Deserializer를 쓰면 jackson-datatype-jsr310은 필요 없긴 하다.  
(하지만 나중에 Serialize를 위해서는 또 필요하기 때문에 지우진 말자.)  
이렇게 하면 이제 @DateTimeFormat이나 @JsonFormat은 무력화되는 것 같다.  

만약 특정 필드만 오버라이딩한 Deserializer를 안 쓰려면 아래와 같이 하면 된다.  
```java
public class DateType {
    private LocalDate date;
    private LocalTime time;
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy/MM/dd kk:mm:ss")
    private LocalDateTime dateTime;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public DateType(LocalDate date, LocalTime time, LocalDateTime dateTime) {
        this.date = date;
        this.time = time;
        this.dateTime = dateTime;
    }

    public DateType() {
        this.date = LocalDate.now();
    }
}
```
@JsonFormat 대신에 @DateTimeFormat을 쓰면 아무런 효과가 없다.  

이제 아래와 같이 요청을 보내보자.
`POST /`

```json
{
	"date": "2011-11-11",
	"time": "11:11:11",
	"dateTime": "2011/11/11 11:11:11"
}
```

정상적으로 요청이 들어갔다면 성공한 것이다.

원래 Serialize까지 이번 시간에 뽀개려고 했는데 시간이 너무 늦어서...  
출근도 해야하고... ㅠㅠ  
시간이 날 때 다시 정리를 해야할 것 같다.  
