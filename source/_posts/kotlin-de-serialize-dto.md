---
title: (Kotlin) De/Serialize DTO 뽀개서 뿌셔버리기
tags: [Kotlin, Spring]
category: [Note, Kotlin]
date: 2019-09-16 00:30:06
---
연차 대비 너무너무 느린 개발 속도를 향상시키기 위해 나만의 Cheetsheet를 하나씩 만들어야겠다.  
처음 접하는 코틀린 환경에서 자바에서는 좀 할만했던 DTO의 (De)Serialize 관련해서 적어보았다.  
모든 설명은 **JSON으로 request와 response를 주고받는 HTTP API 기반**으로 진행하기 때문에 엄밀히 따지면 부정확한 내용들이 많다.

## 용어 설명
간단하게 용어들을 집고 넘어가자.

### DTO(Data Transfer Object)
데이터를 전송하는데 사용하는 객체  

쉽게 말해서 HTTP API에서 사용하는 JSON 타입 등등의 **Request Body**와 **Response Body**를 떠올리면 된다.  
자바스크립트에서는 JSON이 자바스크립트의 Object 리터럴과 매우 유사해서 파싱하는데 크게 무리가 없지만,  
JVM 진영에서는 꽤나 큰 이슈이다. (잘 몰라서 삽질을 하는 계기가 된다.)  

### Deserialize
쉽게 말하면 JSON 형태의 Request Body를 코틀린 등등의 Object로 파싱하는 작업을 의미한다.  
**Setter에 해당 로직이 들어간다.**

Request Body는 클라이언트가 서버로 던지는 내용이다.  
따라서 서버의 권한 밖이기 때문에 Kotlin이 non-null type을 지원한들 아래와 같은 문제를 마주치게 된다.

1. non-null tpye이고, default value가 없는데 client에서 필드를 넘겨주지 않으면 (`{}`)
2. non-null tpye이고, default value가 있는데 client에서 null을 넘기면 (`{"field": null}`)

위와 같은 경우에 아래 오류와 마주치게 된다. (컴파일 타임에 클라이언트가 어떻게 던질지 모르므로 **런타임 에러**로 발생한다.)
`JSON property name due to missing (therefore NULL) value for creator parameter name which is a non-nullable type`

**따라서 클라이언트가 우리 말을 잘 듣는다는 보장이 없으므로 Request Body DTO의 필드들은 nullable type으로 지정해주자!**

### Serialize
쉽게 말하면 코틀린 등등의 Object를 JSON 형태의 Response Body로 파싱하는 작업을 의미한다.  
**Getter에 해당 로직이 들어간다.**

## 기본적인 형태
가장 기본적인 형태들의 DTO를 파싱해보자.  

### Request Body를 Deserialize 할 때와 Response Body를 Serialize 할 때 필드명이 똑같은 경우
```kotlin
/**
 * deserialize from (request body)
 * {name: "name"}
 *
 * serialize to (response body)
 * {name: "name"}
 * */
class DTO(val name: String?)
```

#### 코틀린의 필드명과는 다른 경우
```kotlin
/**
 * deserialize from (request body)
 * {n: "name"}
 *
 * serialize to (response body)
 * {n: "name"}
 * */
class DTO(@JsonProperty("n") val name: String?)
```

### Request Body를 Deserialize 할 때와 Response Body를 Serialize 할 때 필드명이 다른 경우
dto field name: name  
request body's key: n  
response body's key: name
```kotlin
/**
 * deserialize from (request body)
 * {n: "name"}
 *
 * serialize to (response body)
 * {name: "name"}
 * */
class DTO(name: String?) {
    var name = name
        @JsonProperty(access = JsonProperty.Access.READ_ONLY) get
        @JsonProperty(value = "n", access = JsonProperty.Access.WRITE_ONLY) set
}
```

dto field name: name  
request body's key: name  
response body's key: n
```kotlin
/**
 * deserialize from (request body)
 * {name: "name"}
 *
 * serialize to (response body)
 * {n: "name"}
 * */
class DTO(name: String?) {
    var name = name
        @JsonProperty(value = "n", access = JsonProperty.Access.READ_ONLY) get
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) set
}
```

dto field name: name  
request body's key: names  
response body's key: n
```kotlin
/**
 * deserialize from (request body)
 * {name: "name"}
 *
 * serialize to (response body)
 * {n: "name"}
 * */
class DTO(name: String?) {
    var name = name
        @JsonProperty(value = "n", access = JsonProperty.Access.READ_ONLY) get
        @JsonProperty(value = "names", access = JsonProperty.Access.WRITE_ONLY) set
}
```

## LocalDateTime 3형제 다루기
보기 좋은 포맷으로 serialize하려면 `jackson-modules-java8`을 디펜던시에 추가해줘야한다.   

LocalDate, LocalTime, LocalDateTime 3형제를 다뤄보자.  
모든 클라이언트가 ISO 8601을 따라서 Request Body를 만들어서 주면 좋겠지만 그렇지 않은 경우가 많기 때문에 직접 파싱해야할 경우가 있다.  

### 기본 파싱 규칙 (ISO 8601)
```kotlin
/**
 * deserialize from (request body)
 * {"date": "2019-08-08", "time": "19:21:33", "dateTime": "2019-08-08T19:21:33"}
 *
 * serialize to (response body)
 * {"date": "2019-08-08", "time": "19:21:33", "dateTime": "2019-08-08T19:21:33"}
 * */
class DTO(
    val date: LocalDate?,
    val time: LocalTime?,
    val dateTime: LocalDateTime?
)
```

### Request Body를 Deserialize 할 때와 Response Body를 Serialize 할 때 동일한 파싱 규칙을 사용하는 경우
```kotlin
/**
 * deserialize from (request body)
 * {"date": "2019/08/08", "time": "19시 21분 33초", "dateTime": "2019/08/08 19시 21분 33초"}
 *
 * serialize to (response body)
 * {"date": "2019/08/08", "time": "19시 21분 33초", "dateTime": "2019/08/08 19시 21분 33초"}
 * */
class DTO(
    @JsonFormat(pattern = "yyyy/MM/dd") val date: LocalDate?,
    @JsonFormat(pattern = "HH시 mm분 ss초") val time: LocalTime?,
    @JsonFormat(pattern = "yyyy/MM/dd HH시 mm분 ss초") val dateTime: LocalDateTime?
)
```

### Request Body를 Deserialize 할 때와 Response Body를 Serialize 할 때 다른 파싱 규칙을 사용하는 경우
```kotlin
/**
 * deserialize from (request body)
 * {"date": "2019/08/08", "time": "19시 21분 33초", "dateTime": "2019/08/08 19시 21분 33초"}
 *
 * serialize to (response body)
 * {"date": "2019-08-08", "time": "19:21:33", "dateTime": "2019-08-08T19:21:33"}
 * */
class DTO(
    date: LocalDate?,
    time: LocalTime?,
    dateTime: LocalDateTime?
) {
    var date = date
        @JsonFormat(pattern = "yyyy-MM-dd") get
        @JsonFormat(pattern = "yyyy/MM/dd") set
    var time = time
        @JsonFormat(pattern = "HH:mm:ss") get
        @JsonFormat(pattern = "HH시 mm분 ss초") set
    var dateTime = dateTime
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") get
        @JsonFormat(pattern = "yyyy/MM/dd HH시 mm분 ss초") set
}
```

## 세계 시간 다루기
보기 좋은 포맷으로 serialize하려면 `jackson-modules-java8`을 디펜던시에 추가해줘야한다.  

Local 시리즈는 타임존이 없다.  
저 시간/날짜가 영국 기준인지, 한국 기준인지 모른다.  
**생일**과 같이 타임존에 관계를 받지 않는 시간/날짜에 사용해야한다.  

**스포츠 중계**와 같이 전세계에서 동시에 진행되는 경우에는 타임존이 필수다.  
그럼 타임존을 가지고 있는 OffsetDateTime, ZonedDateTime, Instant를 다뤄보자.  

OffsetDateTime은 Timezone만 가지고 있는 반면, ZonedDateTime은 Timezone + Zone의 특성(Summer Time 여부 등등)도 가지고 있다.  
Instant는 Unix Timestamp를 다룰 때 용이하다.

application.yaml에 아래 설정을 넣지 않으면 Deserialize해서 다루는 DTO 객체와 Response Body에 Timezone이 UTC로 고정된다.
```yaml
spring:
  jackson:
    deserialization:
      adjust_dates_to_context_time_zone: false
```

### 기본 파싱 규칙 (ISO 8601)
```kotlin
/**
 * deserialize from (request body)
 * {"offsetDateTime": "2019-08-08T19:21:33+09:00", "zonedDateTime": "2019-08-08T19:21:33+09:00[Asia/Seoul]", "unixTime": 1568558972}
 *
 * serialize to (response body)
 * {"offsetDateTime": "2019-08-08T19:21:33+09:00", "zonedDateTime": "2019-08-08T19:21:33+09:00", "unixTime": "2019-09-15T14:49:32Z"}
 * */
class DTO(
    val offsetDateTime: OffsetDateTime?,
    val zonedDateTime: ZonedDateTime?,
    val unixTime: Instant?
)
```

### Request Body를 Deserialize 할 때와 Response Body를 Serialize 할 때 동일한 파싱 규칙을 사용하는 경우
```kotlin
/**
 * deserialize from (request body)
 * {"offsetDateTime": "2019/08/08 19시 21분 33초 +09:00", "zonedDateTime": "2019/08/08 19시 21분 33초 +09:00 [Asia/Seoul]", "unixTime": 1568558972}
 *
 * serialize to (response body)
 * {"offsetDateTime": "2019/08/08 19시 21분 33초 +09:00", "zonedDateTime": "2019/08/08 19시 21분 33초 +09:00 [KST]", "unixTime": "2019-09-15T14:49:32Z"}
 * */
class DTO(
    @JsonFormat(pattern = "yyyy/MM/dd HH시 mm분 ss초 XXX") val offsetDateTime: OffsetDateTime?,
    @JsonFormat(pattern = "yyyy/MM/dd HH시 mm분 ss초 XXX '['z']'") val zonedDateTime: ZonedDateTime?,
    val unixTime: Instant?
)
```

### Request Body를 Deserialize 할 때와 Response Body를 Serialize 할 때 다른 파싱 규칙을 사용하는 경우
```kotlin
/**
 * deserialize from (request body)
 * {"offsetDateTime": "2019/08/08 19시 21분 33초 +09:00", "zonedDateTime": "2019/08/08 19시 21분 33초 +09:00 [Asia/Seoul]", "unixTime": "2019/08/08 19시 21분 33초 +09:00"}
 *
 * serialize to (response body)
 * {"offsetDateTime": "2019-08-08T19:21:33+09:00", "zonedDateTime": "2019-08-08T19:21:33+09:00[KST]", "unixTime": 1565259693}
 * */
class ZonedDateTimeDTO3(
    offsetDateTime: OffsetDateTime?,
    zonedDateTime: ZonedDateTime?,
    unixTime: Instant?
) {
    var offsetDateTime = offsetDateTime
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") get
        @JsonFormat(pattern = "yyyy/MM/dd HH시 mm분 ss초 XXX") set
    var zonedDateTime = zonedDateTime
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX'['z']'") get
        @JsonFormat(pattern = "yyyy/MM/dd HH시 mm분 ss초 XXX '['z']'") set
    var unixTime = unixTime
        @JsonFormat(pattern = "yyyy/MM/dd HH시 mm분 ss초 XXX") set

    fun getUnixTime() = unixTime?.epochSecond
}
```