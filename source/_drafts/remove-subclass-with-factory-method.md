---
title: (TDD) 하위 클래스에 직접적인 접근을 없애서 중복 제거하기
tags: [TDD]
category: [Note, Study]
date: 2020-06-09 19:02:38
---
[TDD By Example](https://book.naver.com/bookdb/book_detail.nhn?bid=7443642) 책을 보다가 감명 받은 부분을 정리해봤다.
기본적으로 아래 4가지 원칙을 따라 진행한다.
1. Red - **실패**하는 **작은** 테스트를 작성(최초에는 컴파일 조차 되지 않음)
2. Green - **빨리** 테스트가 **통과**하게 끔 수정(이를 위해선 어떠한 **죄악**도 용서됨)
3. Refactoring - 모든 **중복**을 **제거**(2번에서 수행한 죄악들을 청산)

책에서는 달러($)와 프랑(CHF, 스위스 통화)의 연산에 대한 조그만 테스트를 시작으로 두 통화 사이의 중복을 제거해나갔다.  
해당 포스트는 [클라이언트에 영향 없이 상속 구조를 마음껏 고칠 수 있는 방법](/2020/06/09/change-inheritance-hierarchy-without-affecting-client/#more)에서 제거하지 못한 중복인 plus 메서드를 제거하는 것으로 시작한다. 
(기본적으로 코틀린, JUnit5, kotest를 사용했다)

## 각 하위 클래스에 있는 plus 메서드 제거하기
기본적으로 소스 코드는 아래와 같다.
```kotlin
abstract class Money(protected val amount: Int) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Money

        if (amount != other.amount) return false

        return true
    }
    abstract operator fun plus(money: Money): Money
}
``` 

```kotlin
class Dollar(amount: Int): Money(amount) {
    override operator fun plus(money: Money): Money {
        return Dollar(this.amount + money.amount)
    }
}
```

```kotlin
class Franc(amount: Int): Money(amount) {
    override operator fun plus(money: Money): Money {
        return Franc(this.amount + money.amount)
    }
}
```

우선 Dollar와 Franc 클래스는 그 자체만으로 Currency(통화) 정보를 포함하는 클래스인데 Money 클래스는 그러지 못한다.  
따라서 Money 클래스에 currency 필드를 추가해보자.
```kotlin
abstract class Money(
    val amount: Int,
    private val currency: String
) {
    // ...
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Money

        if (amount != other.amount) return false
        if (currency != other.currency) return false

        return true
    }
    // ...
}
```

바뀐 생성자에 맞게 상속하는 부분을 수정하자
```kotlin
class Dollar(amount: Int): Money(amount, "USD") {
    override operator fun times(multiplier: Int): Money {
        return Dollar(amount * multiplier)
    }
}
```

```kotlin
class Franc(amount: Int): Money(amount, "CHF") {
    override operator fun times(multiplier: Int): Money {
        return Franc(amount * multiplier)
    }
}
```
