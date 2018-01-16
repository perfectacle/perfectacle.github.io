---
title: (Jackson) LocalDate, LocalTime, LocalDateTime 뽀개기 - Serialize
date: 2018-01-16 10:54:25
tags: [Java, Spring Boot, Jackson, JSON]
---

![](thumb.png)

[잭슨](https://github.com/FasterXML/jackson)은 JSON -> Java 클래스로 Deserialize, Java 클래스 -> JSON으로 Serialize 할 때 매우 유용한 라이브러리다.  

하지만 잭슨이 나온 이후에 자바 8이 나왔는지 모르겠는데 LocalDate, LocalTime, LocalDateTime 등등의 클래스를 기본적으로 깔끔하게 처리해주지 못한다.  
따라서 이번에는 어렵지는 않지만 새로 프로젝트 구성할 때마다 매번 까먹어서 찾아 헤매던 케이스들을 정리해봤다.  
또한 예제의 설명은 스프링 부트를 기준으로 설명하겠다.  

우선 [Deserialize](/2018/01/15/jackson-local-date-time-deserialize/)를 안 본 사람은 해당 내용에서 이어지는 포스트이기 때문에 보고 오도록 하자.  

## Serialize
우선 아래와 같이 api를 만들자.  
```java
@RestController
public class Controller {
    @GetMapping("/")
    public DateType get(DateType dateType) {
        return new DateType();
    }
}
```

이제 JSON으로 Serialize할 클래스를 만들자.  
```java
public class DateType {
    private LocalDate date = LocalDate.now();
    private LocalTime time = LocalTime.now();
    private LocalDateTime dateTime = LocalDateTime.now();

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
}
```

그럼 아래와 같이 응답이 드럽게(?) 온다.  
```json
{
    "date": {
        "year": 2018,
        "month": "JANUARY",
        "dayOfMonth": 16,
        "dayOfWeek": "TUESDAY",
        "era": "CE",
        "dayOfYear": 16,
        "leapYear": false,
        "monthValue": 1,
        "chronology": {
            "id": "ISO",
            "calendarType": "iso8601"
        }
    },
    "time": {
        "hour": 11,
        "minute": 4,
        "second": 9,
        "nano": 754000000
    },
    "dateTime": {
        "year": 2018,
        "month": "JANUARY",
        "dayOfMonth": 16,
        "dayOfWeek": "TUESDAY",
        "dayOfYear": 16,
        "monthValue": 1,
        "hour": 11,
        "minute": 4,
        "second": 9,
        "nano": 754000000,
        "chronology": {
            "id": "ISO",
            "calendarType": "iso8601"
        }
    }
}
```

혹시 @DateTimeFormat을 안 붙여서 그런가...??  
```java
public class DateType {
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate date = LocalDate.now();
    @DateTimeFormat(pattern = "kk:mm:ss")
    private LocalTime time = LocalTime.now();
    @DateTimeFormat(pattern = "yyyy-MM-dd kk:mm:ss")
    private LocalDateTime dateTime = LocalDateTime.now();

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
}
```

그래도 응답오는 건 똑같다...  
이번엔 @JsonFormat으로 바꿔보자.

```java
public class DateType {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date = LocalDate.now();
    @JsonFormat(pattern = "kk:mm:ss")
    private LocalTime time = LocalTime.now();
    @JsonFormat(pattern = "yyyy-MM-dd kk:mm:ss")
    private LocalDateTime dateTime = LocalDateTime.now();

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
}
```

그래도 똑같이 응답이 온다...  
아마 잭슨이 LocalDate 보다 먼저 나와서 대응을 제대로 못하는 거 같다.  

### [JSR-310](https://jcp.org/en/jsr/detail?id=310) (Java Specification Request - Date and Time API)
이전 포스트에서 봤다 싶이 JSR-310을 잭슨에서 대응(?)한 [Jackson Datatype: JSR310](https://mvnrepository.com/artifact/com.fasterxml.jackson.datatype/jackson-datatype-jsr310)을 Dependency에 추가해주자.
그리고 다시 java 클래스에는 어노테이션을 한 번 없애보자.  
그리고 다시 요청을 보내보면 아래와 같이 응답이 온다.
```json
{
    "date": [
        2018,
        1,
        16
    ],
    "time": [
        11,
        19,
        9,
        274000000
    ],
    "dateTime": [
        2018,
        1,
        16,
        11,
        19,
        9,
        274000000
    ]
}
```

아까 보다는 보기 깔끔해졌지만 저렇게 배열로 담겨서 오는 건 우리가 원하는 형태가 아니다.  
@DateTimeFormat을 달아보면 위와 똑같은 응답이다...  
그렇다면 @JsonFormat을 달아보자.  

```java
public class DateType {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date = LocalDate.now();
    @JsonFormat(pattern = "kk:mm:ss")
    private LocalTime time = LocalTime.now();
    @JsonFormat(pattern = "yyyy-MM-dd kk:mm:ss")
    private LocalDateTime dateTime = LocalDateTime.now();

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
}
```

그럼 우리가 원하는 형태로 아래와 같이 응답이 온다.  
```json
{
    "date": "2018-01-16",
    "time": "11:21:10",
    "dateTime": "2018-01-16 11:21:10"
}
```

@JsonFormat을 일일이 달아주기 귀찮은 경우에는 Custom Serializer를 만들기 전에 아래 내용도 고려해보자.  
Spring Boot의 profile에 아래 내용을 추가해주자.  
```properties
spring.jackson.serialization.WRITE_DATES_AS_TIMESTAMPS=false
```

그리고 DateType 클래스에서 @JsonFormat 어노테이션을 제거하면 아래와 같이 응답이 온다.  
```json
{
    "date": "2018-01-16",
    "time": "11:23:02.215",
    "dateTime": "2018-01-16T11:23:02.215"
}
```

아무런 어노테이션을 안 썼을 때보다는 볼만하지만 그래도 저렇게 상세한 정보까지는 원치 않을 것이다.  
@DateTimeFormat 어노테이션을 달아도 마찬가지고, @JsonFormat 어노테이션을 달면 원하는 형태로 날아오지만 그럼 profile에 추가하나 마찬가지다.  
이 속성은 그냥 저렇게 상세한 시각이 필요할 때만 쓰면 될 거 같다.  

### Custom Serializer
이제 저번 포스트에 Custom Deserializer를 만들었 듯이 이번에는 Custom Serializer를 만들어보자.  
```java
@Configuration
public class JacksonConfig {
    @Bean
    public Module jsonMapperJava8DateTimeModule() {
        SimpleModule module = new SimpleModule();

        module.addSerializer(LocalDate.class, new JsonSerializer<LocalDate>() {
            @Override
            public void serialize(
                    LocalDate localDate, JsonGenerator jsonGenerator, SerializerProvider serializerProvider)
                    throws IOException {
                jsonGenerator.writeString(DateTimeFormatter.ofPattern("yyyy-MM-dd").format(localDate));
            }
        });


        module.addSerializer(LocalTime.class, new JsonSerializer<LocalTime>() {
            @Override
            public void serialize(
                    LocalTime localTime, JsonGenerator jsonGenerator, SerializerProvider serializerProvider)
                    throws IOException {
                jsonGenerator.writeString(DateTimeFormatter.ofPattern("kk:mm:ss").format(localTime));
            }
        });


        module.addSerializer(LocalDateTime.class, new JsonSerializer<LocalDateTime>() {
            @Override
            public void serialize(
                    LocalDateTime localDateTime, JsonGenerator jsonGenerator, SerializerProvider serializerProvider)
                    throws IOException {
                jsonGenerator.writeString(DateTimeFormatter.ofPattern("yyyy-MM-dd kk:mm:ss").format(localDateTime));
            }
        });

        return module;
    }
}
```

이렇게 했을 때 아래와 같은 요소들이 없어도 우리가 원하는 대로 잘 작동한다.  
* jackson-datatype-jsr310  
* spring.jackson.serialization.WRITE_DATES_AS_TIMESTAMPS=false  
* @DateTimeFormat, @JsonFormat

하지만 특정 필드에 대해서는 다르게 Serialize 해야할 수 있으니 jackson-datatype-jsr310은 살려두자.  
이제 특정 필드에만 다른 Serializer를 적용해보자.  

```java
public class DateType {
    @JsonSerialize(using = LocalDateSerializer.class)
    private LocalDate date = LocalDate.now();
    @JsonSerialize(using = LocalTimeSerializer.class)
    private LocalTime time = LocalTime.now();
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    private LocalDateTime dateTime = LocalDateTime.now();

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
}
```

사실상 @DateTimeFormat 어노테이션은 위에서 있으나 마나 한 사실을 알게 되었다.  
이렇게 했을 땐 잭슨의 기본 LocalDateTime Serializer를 쓰기 때문에 아래와 같이 나온다.  
```json
{
    "date": [
        2018,
        1,
        16
    ],
    "time": [
        11,
        48,
        25,
        189000000
    ],
    "dateTime": [
        2018,
        1,
        16,
        11,
        48,
        25,
        189000000
    ]
}
```

profile에 `spring.jackson.serialization.WRITE_DATES_AS_TIMESTAMPS=false`을 넣으면 아래와 같은 내용을 받게 된다.  
```json
{
    "date": "2018-01-16",
    "time": "11:50:19.917",
    "dateTime": "2018-01-16T11:50:19.917"
}
```

좀 더 깔끔하게 출력하기 위해 @DateTimeFormat을 써보자.  
```java
public class DateType {
    @JsonSerialize(using = LocalDateSerializer.class)
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate date = LocalDate.now();
    @JsonSerialize(using = LocalTimeSerializer.class)
    @DateTimeFormat(pattern = "kk:mm:ss")
    private LocalTime time = LocalTime.now();
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @DateTimeFormat(pattern = "yyyy-MM-dd kk:mm:ss")
    private LocalDateTime dateTime = LocalDateTime.now();

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
}
```

요청 응답 오는 건 전혀 다르지 않다. 완전 무쓸모넹... ㅠㅠ  
그럼 profile에서 `spring.jackson.serialization.WRITE_DATES_AS_TIMESTAMPS=false`을 빼고 @JsonFormat 어노테이션으로 바꿔보자.  
