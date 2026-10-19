---
title: Dependency Injection(의존성 주입)을 알아보자 - setter
date: 2017-09-04 09:20:46
tags: [Java, DI]
categories: [Middle-end, Pattern]
---
![](di-v3/thumb.png)

[v2](/2017/09/04/di-v2/)에는 자동차를 생산할 때 어떤 타이어를 만들지 정할 수 있고 새로운 타이어로 교체도 가능했다.  
하지만 올바른 값이 들어왔는지 유효성 검사할 방법이 없다.  
사실 변경할 수는 있지만 안전하지 않고 그닥 권장하는 방법이 아니다.  
```java
// Car.java
public class Car {
    private Tire tire;
    Car(Tire tire) {
        this.tire = tire;
    }
    // setter로 유효성 검사를 위해선 어쩔 수 없이(?) tire를 얻기 위해선 getter를 써야함.
    public Tire getTire() {
        return tire;
    }
    // setter로 다음과 같이 유효성 검사가 가능해짐.
    public void setTire(Tire tire) {
        
        if(tire == null) throw new NullPointerException();
        this.tire = tire;
   
    }
}
```
```java
// Driver.java
public class Driver {
    public static void main(String[] args) {
        KoreanTire koreanTire = new KoreanTire();
        AmericanTire americanTire = new AmericanTire();
        Car car = new Car(koreanTire);
        car.getTire().wheel(); // 구르다
        car.setTire(americanTire);
        car.getTire().wheel(); // wheel
    }
}
```
setter를 사용해 좀 더 안전하게(?) 타이어를 교체할 수 있게 되었다.  
대부분 getter/setter를 사용하는 이유는 아마 다음과 같을 것이다.  
1. 자바 빈즈 스펙이기 때문  
2. 유효성 검사나 get 하기 전에 처리할 내용이 있기 때문  
아마 생각 없이 1번 때문에, 아니면 getter와 setter가 그냥 습관이 된 경우가 대부분일 것이다.    
순수 자바라면 여기서 끝냈을테지만, 이 방법도 타이어를 교체하려면 계속 컴파일 해야한다는 단점이 있다.  
스프링으로 이런 자바 빈즈 객체를 XML 파일로 관리해서 DI 하는 방법을 쓰면 컴파일 하지 않고 타이어를 교체할 수 있다.  

참조 블로그 - [속성을 통한 의존성 주입](http://expert0226.tistory.com/191)
