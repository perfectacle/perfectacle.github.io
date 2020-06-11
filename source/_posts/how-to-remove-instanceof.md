---
title: (TDD) 클래스의 명시적인 타입 검사를 제거하는 방법
tags: [TDD]
category: [Note, Study]
date: 2020-06-11 17:30:48
---
[TDD By Example](https://book.naver.com/bookdb/book_detail.nhn?bid=7443642) 책을 보다가 감명 받은 부분을 정리해봤다.
기본적으로 아래 4가지 원칙을 따라 진행한다.
1. Red - **실패**하는 **작은** 테스트를 작성(최초에는 컴파일 조차 되지 않음)
2. Green - **빨리** 테스트가 **통과**하게 끔 수정(이를 위해선 어떠한 **죄악**도 용서됨)
3. Refactoring - 모든 **중복**을 **제거**(2번에서 수행한 죄악들을 청산)
  
해당 포스트는 프랑(CHF, 스위스 통화)을 달러($)로 변환하는 간단한 테스트를 작성하는 것부터 시작한다.

## 프랑에서 달러로 변환하기
아래와 같은 간단한 코드들을 이번 예제에서 사용해보자.  
```kotlin
abstract class Money(
    val amount: Long,
    val currency: String
) {
    companion object {
        fun dollar(amount: Long): Money = Dollar(amount)
        fun franc(amount: Long): Money = Franc(amount)
    }
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Money

        if (amount != other.amount) return false
        if (currency != other.currency) return false

        return true
    }
}
```

```kotlin
class Dollar(amount: Long): Money(amount, "USD")
```

```kotlin
class Franc(amount: Long): Money(amount, "CHF")
```

프랑(스위스 통화)과 달러의 환율은 2:1이라고 가정했을 때 프랑으로부터 달러를 얻는 테스트는 다음과 같이 작성할 수 있다.  
```kotlin
class MoneyTest {
    @Test
    fun `10CHF = $5`() {
        // Given
        val tenFrancs = Money.franc(10)
        val expected = Money.dollar(5)
    
        // When
        val actual = tenFrancs.ofDollars()
    
        // Then
        actual shouldBe expected
    }
}
```
컴파일이 되도록 소스코드를 수정해보자.  

```kotlin
abstract class Money(
    val amount: Long,
    val currency: String
) {
    // ...
    fun ofDollars(): Dollar {
        TODO("Not yet implemented")
    }
    // ...
}
```

우선 컴파일은 가능해졌고 테스트를 돌리면 깨진다. (Red 단계)  
이제 테스트를 성공시켜 보자.  
```kotlin
fun ofDollars(): Dollar {
    return Dollar(5)
}
```

상수를 반환하게 하여 테스트를 통과하게 했지만 이번엔 달러에서 달러를 반환하는 테스트를 작성해서 일반화 시켜 나가보자.
```kotlin
@Test
fun `$10 = $10`() {
    // Given
    val tenBucks = Money.dollar(10)
    val expected = Money.dollar(10)

    // When
    val actual = tenBucks.ofDollars()

    // Then
    actual shouldBe expected
}
```
위 테스트는 깨진다.  
그럼 테스트를 통과할 수 있게 끔 ofDollars 메서드 구현을 상수에서 일반화시켜보자.  

```kotlin
fun ofDollars(): Dollar {
    if (this is Dollar) return this

    val amount = if (this is Franc) {
        this.amount / 2
    } else {
        throw UnsupportedOperationException("Unsupported Currency")
    }
    
    return Dollar(amount)
}
```
테스트는 전부 통과하지만, 통화가 늘어나면 저렇게 타입 검사하는 코드를 계속 추가해야하고, 실수로 타입 검사를 빼먹으면 예외를 만나게 될 것이다.  
이런 고통으로부터 벗어나려면 어떻게 해야할까...?

## 다형성을 이용하여 타입검사 제거하기  
**명시적으로 타입검사를 제거**하기 위해서는 **다형성(Polymorphism)**을 이용하면 된다.  

```kotlin
abstract class Money(
    val amount: Long,
    val currency: String
) {
    abstract fun ofDollars(): Dollar
}
```

```kotlin
class Dollar(amount: Long): Money(amount, "USD") {
    override fun ofDollars(): Dollar {
        return this
    }
}
```

```kotlin
class Franc(amount: Long): Money(amount, "CHF") {
    override fun ofDollars(): Dollar {
        return Dollar(this.amount / 2)
    }
}
```

Money에서 ofDollars 메서드를 추상메서드로 바꿨을 때 나타나는 장점은 세 가지가 있다.
1. 유저가 미지원 통화 오류를 만날 일이 사라졌다.  
이전에는 각 통화에 대한 분기를 추가하지 않는 실수를 할 수 있었고 그렇게 되면 예외를 만나게 됐는데 지금은 각 하위 클래스에서 구현을 하지 않으면 컴파일 조차 되지 않는다.  
컴파일 자체가 되지 않기 때문에 실수한 상태로 배포가 불가능하고, 적어도 유저가 장애를 경험할 일은 없다.  
2. 단일 책임 원칙을 준수하게 됐다. (해당 클래스가 변경돼야하는 사유는 해당 통화의 환율이 변경됐을 때 뿐이다.) 
기존 Money 클래스에 구현돼있을 때는 ofDollars 메서드에서 Money가 Dollar인 경우, Franc인 경우, 그 외의 통화인 경우를 전부 커버하고 있었다.  
그러다보니 Franc의 환율이 변경되도 Money를 수정해야하고, 그 외의 통화가 추가돼도 Money를 수정하다보니 Money의 소스가 비대해질 가능성이 있다보니 이해/수정하기도 힘들고, Franc의 환율을 수정했는데 다른 통화가 영향을 받을 수 있는 상황이었다.  
하지만 지금은 Franc의 환율이 변경되면 Franc만 수정하면 되고, Franc만 수정했으므로 그 변경의 여파가 다른 통화로 번지지 않기 때문에 수정할 때 더 안심할 수 있다.
3. **타입검사가 제거됐다.**    
외부에서는 Money란 사실만 알고 있고, 실제 구체 타입에 따라서 알아서 메서드를 실행한다.  
자바/코틀린에서는 언어 수준에서 다형성을 지원하기 때문에 분기를 마구 태우던 부분을 제거할 수 있었고 코드가 좀 더 단순해졌다.  

하지만 이로 인한 단점은 아래 두 가지가 있다.  
1. Dollar 클래스에 별로 하는 일도 없는 껍데기 메서드가 추가됐다.  
Dollar에서 구현한 ofDollars 메서드는 자기 자신(this)를 리턴한다.  
외부에서 분기를 없애기 위해서 다형성을 사용하다 보니 별로 하는 일도 없어보이는 듯한 메서드가 추가됐다.  
다형성을 위해서 이런 껍데기 같은 메서드들은 어쩔 수 없이 추가돼야하는 것 같다.
2. 실제 코드를 파악하려면 Money 클래스와 각 하위 클래스들을 파악해야한다.  
원래 분기를 태울 때는 Money 클래스만 봐도 돼서 코드가 한 눈에 들어왔다.  
하지만 지금은 하위 클래스에서 그 책임을 분할해서 지고 있다보니 각 하위 클래스들을 전부 봐야 모든 소스를 이해하게 되는 것이다.  
다형성을 너무 많이 활용하다보면 소스코드를 확인하기 위해서 엄청 많은 클래스들을 봐야할 수도 있다.  
이건 얼마나 추상화할 것인지, 적절한 밸런스를 가져가야할 것 같다.
