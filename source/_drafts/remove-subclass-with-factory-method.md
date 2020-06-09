---
title: (TDD) 하위 클래스에 직접적인 접근을 없애서 중복 제거하기
tags: [TDD]
category: [Note, Study]
date: 2020-06-09 19:02:38
---

이전 포스트에서 제거하지 못한 중복인 times 메서드를 제거해보자.
```kotlin
abstract class Money(protected val amount: Int) {
    // ...
    abstract operator fun times(multiplier: Int): Money
    // ...
}
``` 

```kotlin
class Dollar(amount: Int): Money(amount) {
    override operator fun times(multiplier: Int): Money {
        return Dollar(amount * multiplier)
    }
}
```

```kotlin
class Franc(amount: Int): Money(amount) {
    override operator fun times(multiplier: Int): Money {
        return Franc(amount * multiplier)
    }
}
```

우선 Dollar와 Franc 클래스는 그 자체만으로 Currency 정보를 포함하는 클래스인데 Money 클래스는 그러지 못한다.  
따라서 Money 클래스에 currency를 추가해보자.
```kotlin
abstract class Money(
    protected val amount: Int,
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
