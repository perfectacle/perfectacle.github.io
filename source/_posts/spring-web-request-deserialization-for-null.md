---
title: (Spring) Request 객체를 만들 때 null을 주의하자
tags:
  - Spring
  - Web
  - Jackson
category:
  - Spring
date: 2021-09-20 02:04:28
---


소스코드 외부 세계에서 내부 세계로 데이터를 전달하기 위해서는 미리 정해진 프로토콜 및 API를 통해 데이터를 주고받게 된다.  
일반적으로 우리가 많이 사용하는 Restful API(혹은 HTTP API)는 대부분 json의 형태로 데이터를 주고 받게 된다.  
그럼 json 문자열이 우리가 정의한 Request 객체로 매핑을 할 때 null을 어떻게 핸들링 해야할까에 집중해서 간단히 정리해보았다.  

## 코틀린
코틀린은 nullable을 지원하다보니 소스코드에서 null에 대한 체크를 매번하지 않아도 돼서 매우 편하다.  
하지만 이건 우리 소스코드 내부의 사정이고 소스코드 외부에서 들어오는 데이터의 경우에는 단정지을 수 없다.  
그 단적인 예가 네트워크를 통해 들어오는 HTTP API의 요청이다.  
```kotlin
class RequestV1(
    val number: Int,
    val text: String
)

@RestController
class Controller {
    @PostMapping
    fun api(@RequestBody request: RequestV1) {}
}
```

이런 요청 객체와 API가 있다고 할 때 과연 number와 text는 non-null을 100% 보장할 수 있을까??  
```kotlin
@WebMvcTest
@AutoConfigureMockMvc
internal class ControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `요청 객체 전송 시에 non-null 필드를 누락하면 HttpMessageNotReadableException 예외를 던진다`() {
        val expected = HttpMessageNotReadableException::class.java

        val actual = mockMvc.post("/") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"number": 13}"""
        }.andExpect {
            status { isBadRequest() }
        }.andReturn().resolvedException

        assertThat(actual).isInstanceOf(expected)
    }
}
```

클라이언트에서 http 요청을 보낼 때 충분히 필수 필드를 누락할 수 있고, 이 때 서버에서 HttpMessageNotReadableException 예외를 던지게 된다.
`org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Cannot construct instance of ... problem: Parameter specified as non-null is null: method example.web.mvc.RequestV1.<init>, parameter text`
기본적으로 이 경우에는 DefaultHandlerExceptionResolver에서 예외를 핸들링하여 warn 로그를 찍게 된다.  
이런 경우에는 HttpMessageNotReadableException 보다는 MethodArgumentNotValidException 예외를 던지는 것이 더 적합해보인다.  

그러면 아래와 같이 코드를 개선해볼 수 있다.  
```kotlin
class RequestV2(
    number: Int?,
    text: String?
) {
    @Min(1)
    val number = number ?: 0
    @NotBlank
    val text = text ?: ""
}

@RestController
class Controller {
    @PostMapping
    fun api(@RequestBody @Valid request: RequestV2) {}
}
```
우선 생성자를 전부 nullable로 정의해서 객체의 성공을 보장하고, 멤버변수는 전부 기본값을 정의해서 non-null을 보장하였다.
생성자의 인자를 기준으로 요청을 검증하는 게 아니라 이미 생성된 객체를 기준으로 검증을 하기 때문에 멤버변수에 할당된 기본값 기준으로 어노테이션을 설정해야한다.

```kotlin
@Test
fun `요청 객체 전송 시에 유효하지 않은 필드가 존재하면 MethodArgumentNotValidException 예외를 던진다`() {
    val expected = MethodArgumentNotValidException::class.java

    val actual = mockMvc.post("/") {
        contentType = MediaType.APPLICATION_JSON
        content = """{"number": 13}"""
    }.andDo { print() }.andExpect {
        status { isBadRequest() }
        // 응답으로 어떤 필드가 유효하지 않은지 추가하려면 @ExceptionHandler를 사용하여 MethodArgumentNotValidException를 핸들링 해야한다.
        content { string("") }
    }.andReturn().resolvedException

    assertThat(actual).isInstanceOf(expected)
}
```

혹시나 Data Class를 꼭 사용해야한다면 아래와 같이도 할 수 있다.
```kotlin
data class RequestV3(
    @field:Min(1)
    val number: Int,
    @field:NotBlank
    val text: String
) {
    @JsonCreator
    constructor(number: Int?, text: String?) : this(
        number = number ?: 0,
        text = text ?: ""
    )
}
```

생성자 함수가 아닌 멤버변수에 어노테이션을 설정하기 위해 @field이라고 정확히 명시했다.
(참고: [Annotation use-site targets](https://kotlinlang.org/docs/annotations.html#annotation-use-site-targets))

## 자바
자바에서도 똑같이 null에 대한 검증을 모두 끝마친 깔끔한 request dto 객체를 원할 것이다.  
```java
public class Request {
    @Min(1)
    public final int number;
    @NotNull
    public final String text;

    @JsonCreator
    public Request(final Integer number, final String text) {
        this.number = number == null ? 0 : number;
        this.text = text == null ? "" :text;
    }
}
```
기본적으로 요청 객체를 수정하는 행위는 소스코드의 예측력을 떨어뜨리므로 불변객체로 만들고,  
불변객체이므로 getter를 사용하나 필드에 직접 접근하나 재할당하지 못한다는 사실은 똑같기 때문에 불필요하게 getter 메서드를 사용하지 않고, 접근이 필요한 필드의 경우에만 public 접근 지정자를 사용하여 직접 필드를 참조하도록 하였다.
jackson은 기본 생성자를 리플렉션하여 객체를 생성하는데 기본 생성자가 없으니 객체 생성을 위해 사용할 생성자에 @JsonCreator 어노테이션을 달아주었다.
또한 클라이언트로부터 어떤 요청이 들어올지 모르니 일단 생성자에서는 전부 null을 허용하고 기본값을 할당하였다.  
생성된 요청 객체의 멤버변수에는 적절한 벨리데이션을 위한 어노테이션을 추가하면 된다.
