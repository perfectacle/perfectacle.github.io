---
title: Dependency Injection(의존성 주입)을 알아보자 - 생성자 함수
date: 2017-09-04 00:20:46
tags: [Java, DI]
category: [Middle-end, Pattern]
---
![](thumb.png)

[v1](/2017/09/04/di-v1/)에는 재사용 가능한 코드가 있음에도 불구하고 미묘(?)한 차이 때문에 계속 각국의 타이어를 장착한 자동차 클래스를 만들어야하는 단점이 있었다.  
이는 자동차를 만들 때 이미 타이어를 만드는 방법이 결정되어 있기 때문에 발생하는 문제이다.  
(**자동차(전체)**가 **타이어(부분)**에 **의존**하고 있는 코드)  
즉, 자동차를 만들 때 타이어를 만드는 방법을 결정하면 되는 사항이다.  
(**의존하는 부분(타이어)**을 **전체(자동차)**에 **주입**시키는 패턴)  

```java
// Tire.java
public interface Tire {
    void wheel();
}
```
```java
// KoreanTire.java
public class KoreanTire implements Tire {
    public void wheel() {
        System.out.println("구르다");
    }
}
```
```java
// AmericanTrie.java
public class AmericanTire implements Tire {
    public void wheel() {
        System.out.println("wheel");
    }
}
```

```java
// Car.java
public class Car {
    Tire tire;
    Car(Tire tire) { // 매개변수의 다형성을 사용
        this.tire = tire;
    }
}
```
```java
public class Driver {
    public static void main(String[] args) {
        KoreanTire koreanTire = new KoreanTire();
        AmericanTire americanTire = new AmericanTire();
        Car car = new Car(koreanTire);
        car.tire.wheel(); // 구르다
        
        car.tire = americanTire;
        // 아래와 같은 것도 되니 바로 멤버 변수에 접근해서 설정하는 것은 추천하지 않는다.
        // car.tire = null;
        car.tire.wheel(); // wheel
    }
}
```

이렇게 되면 Tire 클래스들만 쭉쭉 추가하면 되고 Car 클래스는 각국 별로 만들 필요가 없어지게 된다.  
또한 tire 교체도 가능하지만 올바른 값이 들어왔는지 유효성 검사할 방법이 없다.  
그럼 [v3](/2017/09/04/di-v3/)에서는 이러한 문제점을 개선해보도록 하자.

참조 블로그 - [생성자를 통한 의존성 주입](http://expert0226.tistory.com/190)