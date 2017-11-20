---
title: Dependency Injection(의존성 주입)을 알아보자 - 막코딩 하기
date: 2017-09-04 09:05:54
tags: [Java, DI]
category: [Middle-end, Pattern]
---
![](thumb.png)

이 글은 의존성 주입을 전혀 적용하지 않은, 의존성 주입이 뭔지 모르는 상태로 짠 코드이다.  
우선 문제점을 먼저 파악해봐야 뭐가 되지 않을까 싶어서 막코딩을 해봤다고 가정해보자.  
우선 미국산 타이어가 장착된 자동차, 한국산 타이어가 장착된 자동차를 만들어야한다고 생각해보자.  
그럼 우선 미국산, 한국산 타이어 클래스 두 개가 필요할 것이다.
```java
// KoreanTire.java
public class KoreanTire {
    public void wheel() {
        System.out.println("구르다");
    }
}
```
```java
// AmericanTrie.java
public class AmericanTrie {
    public void wheel() {
        System.out.println("wheel");
    }
}
```

그리고 각각 미국산 타이어를 장착한 자동차, 한국산 타이어를 장착한 자동차 클래스 두 개를 만들면 끝난다.  
```java
// KoreanCar.java
public class KoreanCar {
    KoreanTire koreanTire;
    KoreanCar() {
        koreanTire = new KoreanTire();
    }
}

```
```java
// AmericanCar.java
public class AmericanCar {
    AmericanTire AmericanTire;
    AmericanCar() {
        AmericanTire = new AmericanTire();
    }
}
```

그리고 이제 이 차를 운전할 사람들을 만들어보자.(한국차를 구매한다고 가정)  
```java
// Driver.java
public class Driver {
    public static void main(String[] args) {
        KoreanCar koreanCar = new KoreanCar();
        koreanCar.koreanTire.wheel(); // 구르다
    }
}
```
프로그램은 완성됐고 개발은 끝났다.  
하지만 영국, 일본, 중국, 태국, 방글라데시, 보스니아 헤르체고비나 등등의 타이어를 장착한 자동차를 만들어야한다면...?  
클래스는 기하 급수적으로 늘어날 것이고 동일한 코드들이 반복되는데도 불구하고 재사용이 불가능한 코드이므로 계속 자동차, 드라이버 클래스들을 만들어야한다.  
이런 코드를 보고 유연하지 못하다고 한다. (사교성이 안 좋은 코드이기도 하다 ㅎㅎ...)  
그럼 [v2](/2017/09/04/di-v2/)에서는 이러한 문제점을 개선해보도록 하자.  

참조 블로그 - [프로그래밍에서 의존성이란?](http://expert0226.tistory.com/189)