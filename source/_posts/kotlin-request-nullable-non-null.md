---
title: (Kotlin) Request에서 Nullable? Non-Null?
tags: [Kotlin, Spring]
category: [Note, Kotlin]
date: 2019-09-18 01:23:39
---

코틀린의 장점을 하나 꼽자면 Non-null 타입을 지원한다는 것이다.  
모든 곳에 null을 없앨 수 있는데(100% 순수 코틀린 코드로만 짠다면)  
통제할 수 없는 부분은 클라이언트로부터 받는 Request이다.  

그래서 Request에는 어떤 타입을 써야할지 삽질을 해봤다.  

## 기본값을 사용하자.
```kotlin
class DTO(val name: String? = "")

@RestController
class Controller {
    @PostMapping
    fun test(@RequestBody dto: DTO) {}
}
```
위와 같을 때 request body의 name에 아무런 내용도 입력하지 않으면 name에 기본값 `""`이 잘 세팅된다.  
기본값이 없어서 null로 세팅되는 것보다는 한결 다루기 편할 것이다.

2. 무조건 nullable 타입을 사용하자.  
```kotlin
class DTO(val name: String = "123")

@RestController
class Controller {
    @PostMapping
    fun test(@RequestBody dto: DTO) {}
}
```

위와 같을 때 클라이언트에서 의도적으로 `{"name": null}`을 보내는 순간  
`failed for JSON property name due to missing (therefore NULL) value for creator parameter name which is a non-nullable type`
라는 오류와 함께 400 에러를 뱉는다. (**타입에 관련된 에러임**)  
따라서 nullable 타입을 사용하자.

3. Header와 Parameter의 default value는 어노테이션에 있는 설정을 쓴다.  
```kotlin
@RestController
class Controller {
    @GetMapping
    fun test(@RequestHeader(required = false, defaultValue = "11") test: Int?) {}
}
```
이 때 헤더에 아무런 값도 보내지 않으면 11이 세팅된다.  
하지만 아래와 같이 변수에 기본값을 세팅했다면 null이 세팅된다.
```kotlin
@RestController
class Controller {
    @GetMapping
    fun test(@RequestHeader(required = false) test: Int? = 11) {}
}
```