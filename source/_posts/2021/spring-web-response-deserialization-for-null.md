---
title: (Spring) 외부 API의 Response 객체를 만들 때 null을 주의하자
tags:
  - Spring
  - Web
  - Jackson
categories:
  - Spring
date: 2021-09-20 02:57:30
---


소스코드 외부 세계에서 내부 세계로 데이터를 전달하기 위해서는 미리 정해진 프로토콜 및 API를 통해 데이터를 주고받게 된다.  
일반적으로 우리가 많이 사용하는 Restful API(혹은 HTTP API)는 대부분 json의 형태로 데이터를 주고 받게 된다.  
그럼 json 문자열이 우리가 정의한 Response 객체로 매핑을 할 때 null을 어떻게 핸들링 해야할까에 집중해서 간단히 정리해보았다.
해당 포스트와 연관성이 높은 [(Spring) 외부에서 호출하는 Request 객체를 만들 때 null을 주의하자](/2021/09/20/spring-web-request-deserialization-for-null)도 읽는 것을 추천한다.

## 코틀린
코틀린은 nullable을 지원하다보니 소스코드에서 null에 대한 체크를 매번하지 않아도 돼서 매우 편하다.  
하지만 이건 우리 소스코드 내부의 사정이고 소스코드 외부에서 들어오는 데이터의 경우에는 단정지을 수 없다.  
그 단적인 예가 네트워크를 통해 들어오는 HTTP API의 응답이다.
```kotlin
class ResponseV1(
    val number: Int,
    val text: String
)
```

이런 응답 객체가 있다고 할 때 과연 number와 text는 non-null을 100% 보장할 수 있을까??
```kotlin
@SpringBootTest
internal class ResponseTest {
    @Autowired
    private lateinit var restTemplateBuilder: RestTemplateBuilder
    private lateinit var restTemplate: RestTemplate
    private var init = false

    companion object {
        val mockHttpServer = WireMockServer(wireMockConfig().dynamicPort())

        @BeforeAll
        @JvmStatic
        internal fun beforeAll() {
            mockHttpServer.start()
        }

        @AfterAll
        @JvmStatic
        internal fun afterAll() {
            mockHttpServer.stop()
        }
    }

    @BeforeEach
    internal fun setUp() {
        if (init) {
            return
        }

        init = true
        restTemplate = restTemplateBuilder.rootUri("http://localhost:${mockHttpServer.port()}").build()
    }

    @Test
    fun `응답 객체 전송 시에 non-null 필드가 누락돼있으면 RestClientException을 던진다`() {
        mockHttpServer.givenThat(WireMock.any(UrlPattern.ANY).willReturn(WireMock.okJson("""{"number": 13}""")))
        val expected = HttpMessageNotReadableException::class.java

        val actual = assertThrows<RestClientException> { restTemplate.getForObject("/", ResponseV1::class.java) }.cause

        assertThat(actual).isInstanceOf(expected)
    }
}
```
외부 API의 응답을 모킹하기 위해 [wiremock](http://wiremock.org/)을 사용하였다.  
만약 외부 API의 응답 중 text 필드가 오지 않았더라면 RestClientException(cause exception은 HttpMessageNotReadableException)을 던지게 된다.  

그러면 아래와 같이 코드를 개선해볼 수 있다.
```kotlin
class ResponseV2(
    number: Int?,
    text: String?
) {
    val number = number ?: 0
    val text = text ?: ""
}
```
우선 생성자를 전부 nullable로 정의해서 객체의 성공을 보장하고, 멤버변수는 전부 기본값을 정의해서 non-null을 보장하였다.

```kotlin
@Test
fun `응답 객체 전송 시에 non-null 필드가 누락돼있으면 기본값이 할당된다`() {
    mockHttpServer.givenThat(WireMock.any(UrlPattern.ANY).willReturn(WireMock.okJson("""{"number": 13}""")))
    val expected = ""

    val actual = restTemplate.getForObject("/", ResponseV2::class.java)?.text

    assertThat(actual).isEqualTo(expected)
}
```

혹시나 Data Class를 꼭 사용해야한다면 아래와 같이도 할 수 있다.
```kotlin
data class ResponseV3(
    val number: Int,
    val text: String
) {
    @JsonCreator
    constructor(number: Int?, text: String?) : this(
        number = number ?: 0,
        text = text ?: ""
    )
}
```

jackson은 기본 생성자를 리플렉션하여 객체를 생성하는데 기본 생성자가 없으니 객체 생성을 위해 사용할 생성자에 @JsonCreator 어노테이션을 달아주었다.

## 자바
자바에서도 똑같이 null에 대한 검증을 모두 끝마친 깔끔한 response dto 객체를 원할 것이다.
```java
public class Response {
    public final int number;
    public final String text;

    @JsonCreator
    public Request(final Integer number, final String text) {
        this.number = number == null ? 0 : number;
        this.text = text == null ? "" :text;
    }
}
```
기본적으로 응답 객체를 수정하는 행위는 소스코드의 예측력을 떨어뜨리므로 불변객체로 만들고,  
불변객체이므로 getter를 사용하나 필드에 직접 접근하나 재할당하지 못한다는 사실은 똑같기 때문에 불필요하게 getter 메서드를 사용하지 않고, 접근이 필요한 필드의 경우에만 public 접근 지정자를 사용하여 직접 필드를 참조하도록 하였다.
jackson은 기본 생성자를 리플렉션하여 객체를 생성하는데 기본 생성자가 없으니 객체 생성을 위해 사용할 생성자에 @JsonCreator 어노테이션을 달아주었다.
또한 클라이언트로부터 어떤 요청이 들어올지 모르니 일단 생성자에서는 전부 null을 허용하고 기본값을 할당하였다.  
