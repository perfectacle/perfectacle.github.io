---
title: (Spring Boot) get/post 리퀘스트를 다뤄보자.
category: [Back-end, Spring Boot]
tag: [Java, Spring, Spring Boot]
date: 2017-09-19 00:50:51
---
![](thumb.png)  

근본없이 궁금한 부분만 찾아서 공부하다보니 아직 정리가 덜 된 글이다 보니 그 점은 감안하고 보길 바란다.

## 컨트롤러를 만들자  
Node.js(+Express)의 Router와 매우 유사한 것 같다.  
URI와 http method, parameter만 매핑해주는 녀석이다.  
```java
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api")
public class Controller {
    @GetMapping("/")
    public Person sayHello(
            @RequestParam String name,
            @RequestParam int age,
            @RequestParam(required = false) String hobby
            ) {
        Person person = new Person();
        person.setHobby(hobby);
        person.setName(name);
        person.setAge(age);
        return person;
    }

    @PostMapping("/")
    public void sayHello(
            @RequestBody Person person
    ) {
        System.out.println(person.getAge());
        System.out.println(person.getHobby());
    }
}
```
[@RestController](http://highcode.tistory.com/24)에 대한 설명은 링크를 참조하자.  

get일 때는 파라미터를 URI에 실어서 보내고, post일 때는 body에 실어보내면 된다.  
나는 큰 착각을 한 게 post로 보낼 때는 대부분 json으로 보내는 경우가 많다보니  
json의 프로퍼티와 컨트롤러에 매핑된 함수의 파라미터가 유사할 줄 알았다.  
하지만 요청 json과 유사한 형태의 VO(Value Object)? TO(Transfer Object)? DO(Domain Object)?  
를 만들어야하는데 셋 중에 뭐가 맞는 말인지 모르겠다.  

## VO? TO? DO?
여튼 만들어보자.  
Person이라는 클래스를 만들면 된다.  
```java
public class Person {
    private String name;
    private int age;
    private String hobby;

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getHobby() {
        return hobby;
    }

    public void setHobby(String hobby) {
        this.hobby = hobby;
    }
}
```

이와 매핑되는 리퀘스트 json은 다음과 같을 것이다.  
```json
{
	"name": "양간장",
	"age": 20,
	"hobby": "자전거 타기"
}
```

## 요청/응답하기
실제 서버를 띄우고 이제 [포스트맨](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop)을 가지고 장난질을 해보자.  

요청 헤더: `get http://localhost:8080/api/?name=양권성&age=22`  
응답:
```json
{
    "age": 22,
    "hobby": null
}
```
왜 name은 안 뜨는 걸지 골똘히 고민해보자.  

요청 헤더: `post http://localhost:8080/api/ Content-Type=application/json`  
요청 바디:  
```json
{
	"name": "양간장",
	"age": 20,
	"hobby": "자전거 타기"
}
```

## 결론
Request Body에 json으로 데이터를 실어 보낼 때 주의해야한다.  
무조건 DO(아니면 VO 또는 TO)를 만들고 그걸 파라미터로 받자.  
multipart나 FormData로 전송하는 경우는 나중에 다뤄봐야겠다.  
