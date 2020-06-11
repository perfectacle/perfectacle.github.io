---
title: (TDD) 클라이언트에 영향 없이 상속 구조를 마음껏 고칠 수 있는 방법
tags: [TDD]
category: [Note, Study]
date: 2020-06-09 18:21:29
---
[TDD By Example](https://book.naver.com/bookdb/book_detail.nhn?bid=7443642) 책을 보다가 감명 받은 부분을 정리해봤다.
기본적으로 아래 4가지 원칙을 따라 진행한다.
1. Red - **실패**하는 **작은** 테스트를 작성(최초에는 컴파일 조차 되지 않음)
2. Green - **빨리** 테스트가 **통과**하게 끔 수정(이를 위해선 어떠한 **죄악**도 용서됨)
3. Refactoring - 모든 **중복**을 **제거**(2번에서 수행한 죄악들을 청산)

책에서는 달러($)와 프랑(CHF, 스위스 통화)의 연산에 대한 조그만 테스트를 시작으로 두 통화 사이의 중복을 제거해나갔다.  
해당 포스트도 위 두가지 통화에 대해 덧셈 연산을 테스트 하는 작은 코드로 시작한다. 
(기본적으로 코틀린, JUnit5, kotest를 사용했다)
앞의 내용은 내가 감명깊게 느낀 부분을 설명하기 위해 TDD로 진행해나가는 과정이고 실제 이 포스트의 핵심은 [하위 클래스의 직접적인 참조 줄이기](#하위-클래스의-직접적인-참조-줄이기)를 보면 된다.

## Dollar 클래스 구현하기
```kotlin
class DollarTest {
    @Test
    fun `$5 + $2 = $7`() {
        // Given
        val five = Dollar(5)
        val two = Dollar(2)

        // When
        val actual = five + two

        // Then
        val expected = Dollar(7)
        actual shouldBe expected
    }
}
```
이제 위 코드가 실패하게 끔 컴파일이 되도록 클래스를 만들어주자. (컴파일만 되게 끔 아주 빠르게 만들면 된다)

```kotlin
class Dollar(amount: Int) {
    operator fun plus(dollar: Dollar): Dollar {
        TODO("Not yet implemented")
    }
}
```
아주 빠르게 만들다보니 아래와 같은 죄악을 저질렀다.
1. 생성자의 매개변수인 amount를 멤버변수로 할당하지 않았다.  
2. plus 메서드 내부를 TODO로 비워뒀다.

하지만 우리에겐 실패하는 테스트를 돌려보는 게 제일 중요기 때문에 위와 같은 죄악은 전혀 중요치 않다.

아무 생각없이 IDE의 도움을 받아서 우선 가장 빠르게 컴파일이 되도록 만든 후에 테스트를 돌려보면 당연히 테스트는 실패한다.
`kotlin.NotImplementedError: An operation is not implemented: Not yet implemented`

우선 첫 번째 단계인 Red를 만족하였다.  
그럼 다음 단게인 Green 단계를 만족시키기 위해 테스트를 성공 시키는 강력범죄를 저지르러 가자.  

```kotlin
class Dollar(amount: Int) {
    override fun equals(other: Any?): Boolean {
        return true
    }

    operator fun plus(dollar: Dollar): Dollar {
        return Dollar(0)
    }
}
```

테스트를 돌려보면 테스트가 통과했다는 Green 표시를 보게 된다.  
우리는 테스트를 가장 빠르게 통과시키기 위해 **가짜로 구현하기** 기법을 사용했다.  
가짜로 구현하기는 우선 **상수**를 반환시켜서 테스트를 통과시키고 **단계적**으로 **변수**를 사용하도록 점진시켜나가는 과정이다.

우선 하나의 테스트만 가지고는 제대로 구현했는지 검증이 안 되므로 plus 메서드의 결과가 일치하지 않는 것에 대한 테스트도 작성해보자.
```kotlin
@Test
fun `$5 + $2 != $10`() {
    // Given
    val five = Dollar(5)
    val two = Dollar(2)

    // When
    val actual = five + two

    // Then
    val notExpected = Dollar(10)
    actual shouldNotBe notExpected
}
```
Dollar 클래스의 equals 메서드는 무조건 true를 반환하므로 테스트는 성공하지 못한다.
equality를 비교하려면 해당 클래스의 내부 상태를 검사하는 값 객체(Value Object) 패턴을 사용해야한다.

```kotlin
class Dollar(private val amount: Int) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Dollar

        if (amount != other.amount) return false

        return true
    }

    operator fun plus(dollar: Dollar): Dollar {
        return Dollar(0)
    }
}
```
우선 값 객체로 사용하기 위해 amount를 멤버 변수로 할당하고, IDE의 도움을 받아 equals 메서드를 제대로 구현했다.
테스트를 돌려보면 `$5 + $2 != $10`은 통과하는데 `$5 + $2 = $7`은 plus 메서드를 제대로 구현하지 않았기 때문에 실패한다.
이제 `$5 + $2 = $7` 메서드를 통과시키도록 plus 메서드의 구현부를 바꿔보자.

```kotlin
operator fun plus(dollar: Dollar): Dollar {
    return Dollar(7)
}
```
테스트가 통과되는 가장 빠른 길을 택하기 위해 상수를 사용하는 죄악을 저질렀다.
우선 테스트는 잘 통과된다.  
하지만 하나의 테스트 셋만 가지고는 제대로 구현했는지 검증이 안 되므로 JUnit5의 Dynamic Test를 이용하여 검증해보자.
```kotlin
@TestFactory
fun `test addition`() = listOf(
    Pair(5, 2),
    Pair(6, 3)
).map { (augendAmount, addendAmount) ->
    dynamicTest("$${augendAmount} * $${addendAmount} = $${augendAmount + addendAmount}") {
        // Given
        val augend = Dollar(augendAmount)
        val addend = Dollar(addendAmount)

        // When
        val actual = augend + addend

        // Then
        val expected = Dollar(augendAmount * addendAmount)
        actual shouldBe expected
    }
}
```

$6 + 3 = $9 테스트에서 실패한다.
`org.opentest4j.AssertionFailedError: expected:<9> but was:<7>`

plus 메서드의 반환값을 Dollar(`7`)이라는 상수를 박았기 때문에 실패했다.  
따라서 7이라는 상수를 변수로 변환시켜보면 아래와 같이 **중복을 제거**할 수 있다.
```kotlin
operator fun plus(dollar: Dollar): Dollar {
    return Dollar(this.amount + dollar.amount)
}
```

이제 테스트를 돌려보면 모든 테스트가 통과한다.  
그냥 상수에서 변수로 바꾼 것 뿐인데 어느 부분이 중복이었길래 중복이 제거됐다고 하는지 의아해 할 수 있다.  
우리의 뇌가 너무 똑똑해서 머릿 속에서 연산이 순식간에 일어나서 중복이 아니라고 생각할 수 있는데 찬찬히 해체해보면 중복이 보인다.
```kotlin
operator fun plus(dollar: Dollar): Dollar {
    return Dollar(7)
}
```

우선 상수를 사용하던 코드로 돌아가서 Dollar(`7`) 부분을 좀 더 집중해서 보면 우리 머릿 속에서 엄청 빠른 연산이 일어나서 7이란 값이 나온 거지 사실은 연산을 거치기 전에는 아래와 같다.
```kotlin
operator fun plus(dollar: Dollar): Dollar {
    return Dollar(5 + 2)
}
```
바로 테스트의 `val expected = Dollar(augendAmount + addendAmount)` 부분(**augendAmount + addendAmount**)과 중복되는 걸 볼 수 있다.  
따라서 우리는 Dollar 클래스의 **amount** 필드와 plus 메서드의 매개변수의 필드인 **dollar.amount**를 사용하여 중복을 제거했다.  
하나의 특별한 사례(`$5 + $2 = $7`)에서만 동작하게 끔 상수(`7`)를 박았다가 다른 여러 사례(`$6 + $3 = $9` 등)에 대해서도 작동할 수 있도록 변수(`this.amount + dollar.amount`)를 사용하여 일반화 시킴으로써 중복을 제거한 것이다.  
이렇게 성공하는 테스트를 먼저 작성해놓고 보면(일부는 실패했지만) 테스트의 수정없이(퍼블릭 API의 변경 없이) 소스코드의 수정이 매우 자유로워진다.  
즉, 테스트만 깨지지 않으면 되기 때문에 리팩토링하기 매우 좋은 환경이 제공된다.

## Franc 클래스 구현하기
Franc 클래스도 Dollar 클래스와 내용이 별반 다를 게 없으므로 우선 테스트를 복붙해주자. (어떻게 구현할지 명확해지면 좀 더 보폭을 넓혀도 된다.)

```kotlin
class FrancTest {
    @TestFactory
    fun `test addition`() = listOf(
        Pair(5, 2),
        Pair(6, 3)
    ).map { (augendAmount, addendAmount) ->
        dynamicTest("${augendAmount}CHF * ${addendAmount}CHF = ${augendAmount + addendAmount}CHF") {
            // Given
            val augend = Franc(augendAmount)
            val addend = Franc(addendAmount)
    
            // When
            val actual = augend + addend
    
            // Then
            val expected = Franc(augendAmount * addendAmount)
            actual shouldBe expected
        }
    }

    @Test
    fun `5CHF + 2CHF != 10CHF`() {
        // Given
        val five = Franc(5)
        val two = Franc(2)
    
        // When
        val actual = five + two
    
        // Then
        val notExpected = Franc(10)
        actual shouldNotBe notExpected
    }
}
```

이제 컴파일이 되도록 하면 되는데 우리는 어떻게 구현해야할지 Dollar 클래스의 테스트를 작성하면서 명확해졌으므로 Dollar 클래스의 구현체도 복붙하자.
```kotlin
class Franc(private val amount: Int) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Franc

        if (amount != other.amount) return false

        return true
    }

    operator fun plus(franc: Franc): Franc {
        return Franc(this.amount + franc.amount)
    }
}
```

컴파일이 가능해짐과 동시에 모든 테스트가 성공한다.  
모든 부분을 Dollar 테스트를 통해 검증했던 부분을 그대로 복붙한 것이므로 딱히 손 볼 곳이 없다.

## Dollar/Franc 중복 제거하기
우선 두 클래스의 plus/equals 메서드를 보면 반환 타입만 다르거나 타입 캐스팅하는 부분만 다를 뿐, 로직은 동일하다.  
이 로직의 중복을 제거하려면 어떻게 해야할까?  
가장 빠르게 떠오른 방법은 두 클래스의 중복을 묶어줄(?) 상위 클래스가 있으면 될 거 같다.  

우선 DollarTest에서 Money 타입을 사용하도록 아래와 같이 수정해보자.
```kotlin
class DollarTest {
    @TestFactory
    fun `test addition`() = listOf(
        Pair(5, 2),
        Pair(6, 3)
    ).map { (augendAmount, addendAmount) ->
        dynamicTest("$${augendAmount} * $${addendAmount} = $${augendAmount + addendAmount}") {
            // Given
            val augend: Money = Dollar(augendAmount)
            val addend: Money = Dollar(addendAmount)
    
            // When
            val actual: Money = augend + addend
    
            // Then
            val expected: Money = Dollar(augendAmount * addendAmount)
            actual shouldBe expected
        }
    }
    
    @Test
    fun `$5 + $2 != $10`() {
        // Given
        val five: Money = Dollar(5)
        val two: Money = Dollar(2)
    
        // When
        val actual: Money = five + two
    
        // Then
        val notExpected: Money = Dollar(10)
        actual shouldNotBe notExpected
    }
}
```

[상속은 죄악](https://www.notion.so/perfectacle/f06f6cd942e54d5f86e657b1452eb243)이라고 하니까 우선 Money 인터페이스로 빼서 컴파일 되게 구현해보자.
```kotlin
interface Money {
    val amount: Int
    operator fun plus(money: Money): Money
}
```

그 다음엔 Dollar 클래스가 Money 인터페이스를 구현하게 끔 수정해보자
```kotlin
class Dollar(override val amount: Int): Money {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Dollar

        if (amount != other.amount) return false

        return true
    }

    override operator fun plus(money: Money): Money {
        return Dollar(this.amount + money.amount)
    }
}
```

우선 테스트가 통과하긴 하는데... 이렇게 해선 plus/equals 메서드를 Dollar 클래스에서 제거할 수 없다. (Franc 클래스에서도 마찬가지일 것이다.)  
인터페이스의 plus/equals 메서드를 디폴트 메서드로 빼면 되긴 하는데 개인적으로 인터페이스의 취지에 적합하지 않다고 판단하여 적당히 타협하여 인터페이스를 추상 클래스로 변경해보자.
```kotlin
abstract class Money(private val amount: Int) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Money

        if (amount != other.amount) return false

        return true
    }

    operator fun plus(money: Money): Money {
        return Dollar(this.amount + money.amount)
    }
}
```

Dollar 클래스를 Money 인터페이스 구현에서 추상 클래스 상속으로 변경해주자.
```kotlin
class Dollar(amount: Int): Money(amount)
```

오! 모든 테스트가 통과하고 드디어 Dollar 클래스에서 plus/equals 메서드를 제거했고, Dollar 클래스만 봤을 때 딱히 하는 일이 없어 보인다.  
뭔가 냄새...가 나지만 아직은 좀 참고, Franc 메서드의 plus/equals도 제거해보자.  
우선은 FrancTest에서 Franc 대신에 Money를 사용하게 끔 수정해보자.
```kotlin
class FrancTest {
    @TestFactory
    fun `test addition`() = listOf(
        Pair(5, 2),
        Pair(6, 3)
    ).map { (augendAmount, addendAmount) ->
        dynamicTest("${augendAmount}CHF * ${addendAmount}CHF = ${augendAmount + addendAmount}CHF") {
            // Given
            val augend: Money = Franc(augendAmount)
            val addend: Money = Franc(addendAmount)
    
            // When
            val actual: Money = augend + addend
    
            // Then
            val expected: Money = Franc(augendAmount * addendAmount)
            actual shouldBe expected
        }
    }

    @Test
    fun `5CHF + 2CHF != 10CHF`() {
        // Given
        val five: Money = Franc(5)
        val two: Money = Franc(2)
    
        // When
        val actual: Money = five + two
    
        // Then
        val notExpected: Money = Franc(10)
        actual shouldNotBe notExpected
    }
}
```

이제 Franc 클래스가 Money 추상 클래스를 상속하도록 수정하자.
```kotlin
class Franc(amount: Int): Money(amount)
```

오! 드디어 Franc에서도 plus/equals 메서드를 제거했다.
하지만 테스트를 돌려보면 test addition 테스트가 깨진다.
`org.opentest4j.AssertionFailedError: expected:<com.example.demo.Franc@3e08ff24> but was:<com.example.demo.Dollar@70ed52de>`

Money 클래스의 plus 메서드가 Dollar 구체 클래스를 반환하기 때문에 발생하는 문제다.
일단 테스트가 깨졌기 때문에 한 발짝 물러서서 Dollar, Franc, Money 클래스와 테스트 코드를 전부 롤백하고 다시 보폭을 줄여보자.  

## 하위 클래스의 직접적인 참조 줄이기
책 88P에는 아래와 같이 나와있다.
> **하위 클래스**에 대한 **직접적인 참조**가 적어진다면 하위 클래스를 제거하기 위해 한 발짝 더 다가섰다고 할 수 있겠다.

DollarTest 클래스에서 Money의 하위 클래스인 Dollar 클래스에 직접적으로 접근하는 부분은 **생성자**를 통해 객체를 생성하는 부분과 **plus 메서드의 반환타입**이다.
생성자는 팩토리 메서드를 통해 직접 참조를 제거하면 되고, plus 메서드의 반환타입은 Money를 반환하게 끔 수정하면 된다.
```kotlin
class DollarTest {
    @TestFactory
    fun `test addition`() = listOf(
        Pair(5, 2),
        Pair(6, 3)
    ).map { (augendAmount, addendAmount) ->
        dynamicTest("$${augendAmount} * $${addendAmount} = $${augendAmount + addendAmount}") {
            // Given
            val augend: Money = Money.dollar(augendAmount)
            val addend: Money = Money.dollar(addendAmount)
    
            // When
            val actual: Money = augend + addend
    
            // Then
            val expected: Money = Money.dollar(augendAmount * addendAmount)
            actual shouldBe expected
        }
    }
    
    @Test
    fun `$5 + $2 != $10`() {
        // Given
        val five: Money = Money.dollar(5)
        val two: Money = Money.dollar(2)
    
        // When
        val actual: Money = five + two
    
        // Then
        val notExpected: Money = Money.dollar(10)
        actual shouldNotBe notExpected
    }
}
```

이제 컴파일이 되도록 수정해보자.
```kotlin
abstract class Money {
    companion object {
        fun dollar(amount: Int): Money = Dollar(amount)
    }
    
    // 팩토리 메서드가 부모 클래스 타입을 리턴하도록 변경하였으므로 부모 클래스 API에 plus 메서드가 추가돼야한다.
    // Money 클래스에서 plus 메서드를 구현하면 Dollar/Franc 구체 클래스 중 하나를 선택해야하는데
    // 그러면 Dollar나 Franc의 equals 메서드에 대한 테스트가 깨져버리므로 우선 자식 클래스에게 위임해두자. 
    abstract operator fun plus(money: Money): Money
}
```
Money에 Dollar 객체를 생성하는 static factory method를 추가했고 plus 추상 메서드도 추가했다.
다시 Dollar에서 Money를 상속 받게 끔 하자.

```kotlin
class Dollar(private val amount: Int): Money() {
    // ...
    override operator fun plus(money: Money): Money {
        return Dollar(this.amount + money.amount)
    }
    // ..
}
```
테스트를 돌리면 성공한다.  

이번에는 FrancTest에서 Franc(Money의 하위클래스)에 대한 참조를 없애보자.
```kotlin
class FrancTest {
    @TestFactory
    fun `test addition`() = listOf(
        Pair(5, 2),
        Pair(6, 3)
    ).map { (augendAmount, addendAmount) ->
        dynamicTest("${augendAmount}CHF * ${addendAmount}CHF = ${augendAmount + addendAmount}CHF") {
            // Given
            val augend: Money = Money.franc(augendAmount)
            val addend: Money = Money.franc(addendAmount)
    
            // When
            val actual: Money = augend + addend
    
            // Then
            val expected: Money = Money.franc(augendAmount * addendAmount)
            actual shouldBe expected
        }
    }

    @Test
    fun `5CHF + 2CHF != 10CHF`() {
        // Given
        val five: Money = Money.franc(5)
        val two: Money = Money.franc(2)
    
        // When
        val actual: Money = five + two
    
        // Then
        val notExpected: Money = Money.franc(10)
        actual shouldNotBe notExpected
    }
}
```

이제 컴파일이 되도록 수정해보자.
```kotlin
abstract class Money {
    companion object {
        fun dollar(amount: Int): Money = Dollar(amount)
        fun franc(amount: Int): Money = Franc(amount)
    }
    
    // 팩토리 메서드가 부모 클래스 타입을 리턴하도록 변경하였으므로 부모 클래스 API에 plus 메서드가 추가돼야한다.
    // Money 클래스에서 plus 메서드를 구현하면 Dollar/Franc 구체 클래스 중 하나를 선택해야하는데
    // 그러면 Dollar나 Franc의 equals 메서드에 대한 테스트가 깨져버리므로 우선 자식 클래스에게 위임해두자.
    abstract operator fun plus(money: Money): Money
}
```
Money에 Franc 객체를 생성하는 static factory method를 추가했고 다시 Franc에서 Money를 상속 받게 끔 하자.

```kotlin
class Franc(private val amount: Int): Money() {
    // ...
    override operator fun plus(money: Money): Money {
        return Franc(this.amount * money.amount)
    }
    // ..
}
```

이제 모든 테스트가 통과한다.
외부에서 바라봤을 때는 객체의 생성이 **직접적인 생성자를 통한 생성**에서 **외부 클래스의 static factory method를 통한 생성**으로 바뀌었고, plus 메서드의 **반환 타입이 부모 클래스**로 바뀌었을 뿐이다.
이것이 무엇을 의미하는지는 책 90P에 나온다.
> 어떤 클라이언트(현재 우리 예제에서는 테스트) 코드도 Dollar(또는 Franc)라는 이름의 하위 클래스가 있다는 사실을 알지 못한다.
> **하위 클래스의 존재**를 **테스트에서 분리(decoupling)**함으로써 **어떤 모델 코드에도 영향**을 주지 않고 **상속 구조를 마음대로 변경**할 수 있게 됐다.

외부에서는 Money 클래스 밖에 모르므로 상속 구조가 마음껏 바뀌어도 끽해봐야 Money 타입이기 때문에 클라이언트 측에는 전혀 영향을 미치지 않는 것이다.
하위 클래스의 직접 참조를 제거한 것만으로 하위 클래스 제거에 큰 한 걸음을 나간 것이나 마찬가지다.  
여기서 멈추지 말고 각 하위 클래스에 있는 equals 메서드를 부모 클래스로 올려서 하위 클래스에서 제거해보자.  

```kotlin
abstract class Money(protected val amount: Int) {
    // ...
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Money

        if (amount != other.amount) return false

        return true
    }
    // ...
}
```

이제 각 하위 클래스에서 컴파일이 되도록 수정하고, equals 메서드도 제거해보자.
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
        return Franc(this.amount * money.amount)
    }
}
```

다시 모든 테스트를 돌려보면 전부 통과한다.

## 마치며
plus 메서드를 제거하지 못한 건 아쉽지만, plus 메서드를 제거하려면 통화를 다뤄야하므로 내용이 훨씬 길어질 것 같아서 여기서 잘랐다.
그래도 하위 클래스에 대한 직접적인 참조를 제거하면 외부(클라이언트)에 영향 없이 상속 구조를 마음껏 수정할 수 있다는 사실에 큰 감명을 받았다. 