---
title: (Spring) 자바 빈즈 객체를 XML 파일로 관리하면서 DI하기 - property 태그
date: 2017-09-05 09:35:53
tags: [Java, DI, Spring]
categories: [Back-end, Spring]
---
![](spring-di-v2/thumb.png)

beans.xml 파일을 수정해보자.  
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="koreanTire" class="KoreanTire"/>
    <bean id="americanTire" class="AmericanTire"/>
    <bean id="car" class="Car">
        <property name="tire2" ref="koreanTire"/>
    </bean>
</beans>
```
beans의 property는 getter/setter와 매핑이 된다.  
Car.java를 수정해보자.  
```java
// Car.java
public class Car {
    private Tire tire;
    public Car() {}
    public Car(Tire tire) {
        this.tire = tire;
    }
    public Tire getTire2() {
        return tire;
    }
    public void setTire2(Tire tire) {
        this.tire = tire;
    }
}
```
Driver.java를 수정해보자.  
```java
// Driver.java
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;

public class Driver {
    public static void main(String[] args) {
        ApplicationContext context = new FileSystemXmlApplicationContext("/src/beans.xml");
        Car car = (Car)context.getBean("car");

        car.getTire2().wheel();
    }
}
```
property를 지정했기 때문에 koreanTire가 DI됐다.  

참조 블로그 - [스프링을 통한 의존성 주입 - 스프링 설정 파일(xml)에서 속성 주입](http://expert0226.tistory.com/193)
