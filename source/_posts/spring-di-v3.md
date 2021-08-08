---
title: (Spring) 자바 빈즈 객체를 XML 파일로 관리하면서 DI하기 - @Autowired
date: 2017-09-05 09:02:25
tags: [Java, DI, Spring]
category: [Back-end, Spring]
---
![](spring-di-v3/thumb.png)

Car 클래스를 수정해보자.  
```java
public class Car {
    @Autowired
    private Tire tire33;
    public Tire getTire() {
        return tire33;
    }
    public void setTire(Tire tire) {
        this.tire33 = tire;
    }
}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
  http://www.springframework.org/schema/beans/spring-beans.xsd
  http://www.springframework.org/schema/context
  http://www.springframework.org/schema/context/spring-context-3.1.xsd">
    <context:annotation-config />
    <bean id="tire33" class="KoreanTire"/>
    <bean id="americanTire" class="AmericanTire"/>
    <bean id="car" class="Car"/>
</beans>
```
@Autowired 한 멤버 변수와 bean의 id가 매칭되는 걸 볼 수 있다.  
또한 <context:annotation-config />을 추가해줘야하고, property 태그의 생략이 가능하다.  

참조 블로그 - [스프링을 통한 의존성 주입 - @Autowired 를 통한 속성 주입](http://expert0226.tistory.com/194)
