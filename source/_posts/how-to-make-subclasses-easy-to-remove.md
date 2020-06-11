---
title: (TDD) 하위 클래스를 제거하기 쉽게 만드는 방법
tags:
  - TDD
category:
  - Note
  - Study
date: 2020-06-11 16:03:32
---

[TDD By Example](https://book.naver.com/bookdb/book_detail.nhn?bid=7443642) 책을 보다가 감명 받은 부분을 정리해봤다.
기본적으로 아래 4가지 원칙을 따라 진행한다.
1. Red - **실패**하는 **작은** 테스트를 작성(최초에는 컴파일 조차 되지 않음)
2. Green - **빨리** 테스트가 **통과**하게 끔 수정(이를 위해선 어떠한 **죄악**도 용서됨)
3. Refactoring - 모든 **중복**을 **제거**(2번에서 수행한 죄악들을 청산)

책에서는 달러($)와 프랑(CHF, 스위스 통화)의 연산에 대한 조그만 테스트를 시작으로 두 통화 사이의 중복을 제거해나갔다.  
해당 포스트는 [클라이언트에 영향 없이 상속 구조를 마음껏 고칠 수 있는 방법](/2020/06/09/change-inheritance-hierarchy-without-affecting-client)에서 제거하지 못한 중복인 plus 메서드를 제거하는 것으로 시작한다. 
(기본적으로 코틀린, JUnit5, kotest를 사용했다)
기본적인 내용은 내가 감명깊게 느낀 부분을 설명하기 위해 TDD로 진행해나가는 과정이고 실제 이 포스트의 핵심은 [마치며](#마치며)를 보면 된다.

## 각 하위 클래스에 있는 plus 메서드 제거하기
기본적으로 소스 코드는 아래와 같다.
```kotlin
abstract class Money(val amount: Long) {
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
class Dollar(amount: Long): Money(amount) {
    override operator fun plus(money: Money): Money {
        return Dollar(this.amount + money.amount)
    }
}
```

```kotlin
class Franc(amount: Long): Money(amount) {
    override operator fun plus(money: Money): Money {
        return Franc(this.amount + money.amount)
    }
}
```

문제는 메서드에서는 구체 클래스인 Dollar나 Franc 밖에 반환하지 못하는데 공통된 구체 클래스를 반환하게 해야 중복(plus 메서드)을 제거할 수 있다.  
그럼 공통된 부모 클래스인 Money 클래스를 구체 클래스로 바꿔보고 Money 클래스를 리턴하게 끔 수정해보자.
```kotlin
open class Money(private val amount: Long) {
    companion object {
        fun dollar(amount: Long): Money = Dollar(amount)
        fun franc(amount: Long): Money = Franc(amount)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Money) return false

        if (amount != other.amount) return false

        return true
    }

    operator fun plus(money: Money): Money {
        return Money(this.amount + money.amount)
    }
}
```

이제 plus 메서드를 각 하위 클래스에서 제거해보자.
```kotlin
class Dollar(amount: Long): Money(amount)
```

```kotlin
class Franc(amount: Long): Money(amount)
```

모든 테스트를 돌려보면 통과하고 이제 Dollar와 Franc 클래스는 딱히 하는 일이 없어보이므로 삭제해도 될 거 같다는 생각이 든다.
과연 그럴까...??

## 통화(currency) 추가하기
Dollar와 Franc 클래스는 그 자체만으로 Currency(통화) 정보를 포함하는 클래스인데 Money 클래스는 그러지 못한다.
이게 정말 문제가 되는 건지 테스트를 통해 검증해보자.
```kotlin
class MoneyTest {
    @Test
    fun `$5 != 5CHF`() {
        val amount = 5
        val dollars = Money.dollar(amount)
        val francs = Money.franc(amount)
        dollars shouldNotBe francs
    }
}
```

흠... 테스트는 잘 통과한다.  
하지만 위 팩토리 메서드들은 Dollar와 Franc과 같은 하위 클래스를 반환하므로 문제가 안 생긴 것일 수도 있으니 Money를 반환하는 plus 메서드에 대해서도 검증을 추가해보자.

```kotlin
@Test
fun `$5 + $5 != 5CHF + 5CHF`() {
    val amount = 5
    val tenBucks = Money.dollar(amount) + Money.dollar(amount)
    val tenFrancs = Money.franc(amount) + Money.franc(amount)
    tenBucks shouldNotBe tenFrancs
}
```
우리가 예상했던 대로 위 테스트는 실패한다.  
따라서 Money 클래스에 currency 필드를 추가해보자.
```kotlin
open class Money(
    private val amount: Long,
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

    operator fun plus(money: Money): Money {
        return Money(this.amount + money.amount, this.currency)
    }
}
```

바뀐 생성자를 각 하위 클래스에 적용해주자.
```kotlin
class Dollar(amount: Long): Money(amount, "")
```

```kotlin
class Franc(amount: Long): Money(amount, "")
```
우선 Red 단계를 보기 위해 재빠르게 구현만 해주자.
그리고 테스트를 돌려보면 여전히 `$5 + $5 != 5CHF + 5CHF`에서 실패한다.  
그럼 Green을 보기 위해 알맞은 currency를 할당해주자.

```kotlin
class Dollar(amount: Long): Money(amount, "USD")
```

```kotlin
class Franc(amount: Long): Money(amount, "CHF")
```

이제 MoneyTest는 Green을 볼 수 있지만 다른 Test를 돌려보면 테스트가 깨진다.  
DollarTest와 FrancTest의 test addition 테스트가 아래와 같은 사유로 깨진다.  
`org.opentest4j.AssertionFailedError: expected:<com.example.demo.Dollar@1b919693> but was:<com.example.demo.Money@7fb4f2a9>`  
`org.opentest4j.AssertionFailedError: expected:<com.example.demo.Franc@12591ac8> but was:<com.example.demo.Money@5a7fe64f>`

문제는 factory method에서는 하위 클래스인 Dollar/Franc을 반환하고, plus 메서드에서는 부모 클래스인 Money를 반환하기 때문이다.  
이제 테스트를 통과하게 끔 factory method에서도 Money를 반환하게 끔 수정해보자.
```kotlin
open class Money(
    private val amount: Long,
    private val currency: String
) {
    // ...
    companion object {
        fun dollar(amount: Long): Money = Money(amount, "USD")
        fun franc(amount: Long): Money = Money(amount, "CHF")
    }
    // ...
}
```

이제 모든 테스트가 통과하게 된다.  
이제 Money가 가지고 있던 통화 문제도 해결했고, 하위 클래스인 Dollar와 Franc 클래스를 사용하는 곳은 완전히 사라졌다.  
위 두 클래스를 제거하고 이제 Money 클래스를 상속받는 클래스가 사라졌으므로 클래스를 상속받지 못하게 open 키워드를 제거해서 final 클래스로 만들어버리자.  
```kotlin
class Money(
    private val amount: Long,
    private val currency: String
) {
    // ...
}
```

## 마치며
만약 [클라이언트에 영향 없이 상속 구조를 마음껏 고칠 수 있는 방법](/2020/06/09/change-inheritance-hierarchy-without-affecting-client)에서처럼 하위 클래스에 직접적인 접근을 제거하지 않았으면 중복을 제거한 후에 하위 클래스를 제거할 때 애를 먹었을 것이다.  
해당 클래스들을 사용하는 부분(테스트 코드)에서 Dollar/Franc 생성자로 생성하는 부분을 전부 찾아서 Money 생성자로 바꿨을 것이다.  
하지만 **하위 클래스에 직접적인 접근하는 부분을 전부 제거**하고 **Money 내부에서만 직접적인 접근**을 하도록 두었기 때문에 **Money 클래스만 수정**함으로써 **하위 클래스를 제거하기가 훨씬 수월**했다.  
그리고 문제점에 대해 인식을 하고 먼저 테스트로 작성해뒀기 때문에 어떤 부분을 구현해야할 지 좀 더 명확했다.  
또한 자동화 된 테스트들을 작성해두다 보니 내가 수정한 부분이 어디까지 영향을 미쳤는지, 코드를 안전하게 수정한 건 지 확인할 수 있어서 안심하고 코드를 작성할 수 있었다.