---
title: (Spring) 자바 빈즈 객체를 XML 파일로 관리하면서 DI하기 - 기본
date: 2017-09-04 09:35:22
tags: [Java, DI, Spring]
categories: [Back-end, Spring]
---
![](spring-di-v1/thumb.png)

일반 자바를 가지고 DI를 해본 [v3](/2017/09/04/di-v3/)에서는 Car 클래스를 자바 빈즈 스펙을 제대로 준수해서 만들지 않았다.  
따라서 한 번 자바 빈즈 스펙에 맞춰 바꿔보자.  
```java
public class Car {
    private Tire tire;
    public Car() {}
    public Car(Tire tire) {
        this.tire = tire; 
    }
    public Tire getTire() {
        return tire;
    }
    public void setTire(Tire tire) {
        this.tire = tire;
    }
}
```
getter/setter와 기본 생성자가 있어야 자바 빈즈 스펙을 준수한 것이었는데 저번에는 기본 생성자가 없어서 추가했다.  
그럼 이제 beans.xml 파일을 만들고 자바 빈즈 객체들을 등록해보자.  
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="tire" class="KoreanTire"/>
    <bean id="americanTire" class="AmericanTire"/>
    <bean id="car" class="Car"/>
</beans>
```

id 부분에는 식별할 수 있는 이름을 적고, class에는 패키지와 클래스명 포함 풀 경로를 적어주면 된다.  

```java
// Driver.java
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;

public class Driver {
    public static void main(String[] args) {
        ApplicationContext context = new FileSystemXmlApplicationContext("/src/beans.xml");
        Car car = (Car)context.getBean("car");
        Tire tire = (Tire)context.getBean("tire");
        car.setTire(tire);

        car.getTire().wheel();
    }
}
```
xml에서 id가 tire인 애만 바꾸면 컴파일을 다시 하지 않아도 타이어의 교체가 가능해진다.  
하지만 여기서 코드가 더 줄어들을 수 있다.  
[v2](/2017/09/05/spring-di-v2/)에서 확인해보자~  

참조 블로그 - [스프링을 통한 의존성 주입 - XML 파일 사용](http://expert0226.tistory.com/192)
