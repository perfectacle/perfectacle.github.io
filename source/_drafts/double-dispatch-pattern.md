---
title: Double Dispatch Pattern
tags: []
category: [Note, Study]
---

## 패턴이란?
패턴(디자인 패턴)은 **반복되는 문제**를 **특정 도메인에 얽히지 않고** **전문가의 전문성**을 빌려 해결하기 위해 나온 정형화된 규칙이다.  
마치 바로 옆에 전문가를 두고 일을 하는 경험이라고 한다. (그들의 경험을 토대로 만들었을테니...)  

그 중에 [Object Design: Roles, Responsibilities, and Collaborations](http://www.wirfs-brock.com/DesignBooks.html)에서 설명하고 있는
Double Dispatch Pattern을 간단하게 정리해보았다.

## Bad Smell
먼저 가위바위보 프로그램을 만든다고 생각해보자.  
우선 가위, 바위, 보 객체를 만들어야할텐데 각각은 `승리 여부(beats)`를 알아야할 책임을 가지고 있으니 이를 토대로 작성해보자.

```kotlin
interface GameObject {
    fun beats(gameObject: SealedGameObject): Boolean
}

sealed class SealedGameObject {
    object Rock : GameObject, SealedGameObject() {
        override fun beats(gameObject: SealedGameObject): Boolean =
                when (gameObject) {
                    is Rock -> false
                    is Paper -> false
                    is Scissors -> true
                    // 만약 GameObject가 하나 더 추가되면 beats라는 동작하는 메서드를 수정해야하는 큰 위험 부담이 생긴다.
                }
    }

    object Paper : GameObject, SealedGameObject() {
        override fun beats(gameObject: SealedGameObject): Boolean =
                when (gameObject) {
                    is Rock -> true
                    is Paper -> false
                    is Scissors -> false
                    // 만약 GameObject가 하나 더 추가되면 beats라는 동작하는 메서드를 수정해야하는 큰 위험 부담이 생긴다.
                }
    }

    object Scissors : GameObject, SealedGameObject() {
        override fun beats(gameObject: SealedGameObject): Boolean =
                when (gameObject) {
                    is Rock -> false
                    is Paper -> true
                    is Scissors -> false
                    // 만약 GameObject가 하나 더 추가되면 beats라는 동작하는 메서드를 수정해야하는 큰 위험 부담이 생긴다.
                }
    }
}

fun main() {
    val paper = SealedGameObject.Paper
    val scissors = SealedGameObject.Scissors

    val result = paper.beats(scissors)
    
    // Paper는 Scissors를 이기지 못한다.
    println(result) // false
}
```

문제는 새로운 GameObject가 추가됐을 때 각 object에 새롭게 분기문을 추가해야한다.  
`워킹하는 코드(beats 메서드)`를 손대야하는 건 심각한 버그를 발생키실 수 있다.  
이 문제는 Receiver(각 object들)가 Argument(메서드의 매개변수로 넘어온 gameObject)에 대해 너무 많이 알아야하기 때문에 발생한다.  
Argument로 넘어온 게 어떤 타입인지를 알아야한다는 건 굉장히 많은 정보를 알고 있다고 볼 수 있다.  
(사실 나도 뭐 이정도 쯤이야 알고 있을 수 있는 거 아니야? 라고 생각되긴 하지만 시스템이 복잡한 거 보다 단순하게 만들 수 있다면 단순하게 만드는 게 훨씬 유지보수하기 편할 것 같다.)

## Good Smell
```kotlin
interface GameObject {
    fun beats(gameObject: GameObject): Boolean
    fun beatsRock(): Boolean
    fun beatsPaper(): Boolean
    fun beatsScissors(): Boolean
    // 새로운 GameObject가 생기면 인터페이스에 메서드를 하나 추가하면 된다.
}

object Rock : GameObject {
    // 새로운 GameObject가 생겨도 제대로 동작 중인 메서드를 수정할 일은 없다.
    // 또한 Rock이 승패 여부를 판정하기 보다 Rock을 이기는지 아는지 알고 있는 Object에게
    override fun beats(gameObject: GameObject): Boolean = gameObject.beatsRock()
    override fun beatsRock(): Boolean = false
    override fun beatsPaper(): Boolean = false
    override fun beatsScissors(): Boolean = true
}

object Paper : GameObject {
    // 새로운 GameObject가 생겨도 제대로 동작 중인 메서드를 수정할 일은 없다.
    override fun beats(gameObject: GameObject): Boolean = gameObject.beatsPaper()
    override fun beatsRock(): Boolean = true
    override fun beatsPaper(): Boolean = false
    override fun beatsScissors(): Boolean = false
}

object Scissors : GameObject {
    // 새로운 GameObject가 생겨도 제대로 동작 중인 메서드를 수정할 일은 없다.
    override fun beats(gameObject: GameObject): Boolean = gameObject.beatsScissors()
    override fun beatsRock(): Boolean = false
    override fun beatsPaper(): Boolean = true
    override fun beatsScissors(): Boolean = false
}

fun main() {
    val paper = Paper
    val scissors = Scissors

    val result = paper.beats(scissors)
    
    // Paper는 Scissors를 이기지 못한다.
    println(result) // false
}
```

Double Dispatch Pattern을 사용하면 새롭게 GameObject가 추가된다 하더라도 현재 잘 동작하고 있는 메서드를 수정하지 않아도 된다.  
물론 GameObject 인터페이스에 메서드를 추가하고 각 GameObject 마다 이를 구현해야하는 수고로움이 추가되긴 하지만,  
잘 동작하고 있는 코드를 수정하지 않아도 된다는 건, 사이드 이펙트를 생성한다거나 기존에 잘 동작하던 코드가 이상하게 동작하는 버그를 줄일 수 있기 때문에 훨씬 감수할만 한 것 같다.  
Double Dispatch Pattern은 객체지향의 다형성(Polymorphism)이란 특성을 이용한다.

## Double Dispatch Pattern
Dispatch란 무엇일까...?  
>> Dispatch is the way a language links calls to function/method definitions.
   https://stackoverflow.com/questions/5508274/what-is-dispatching-in-java#comment6253225_5508274
   
그냥 간단하게 메서드 호출을 두고 Dispatch라고 부르는 것 같다.  
그럼 Double Dispatch는 메서드를 두 번 호출한다는 뜻이다.  

메인 메서드를 다시 한 번 살펴보자.  
```kotlin
fun main() {
    val paper = Paper
    val scissors = Scissors

    val result = paper.beats(scissors)
    println(result) // true
}
```

`paper.beats(scissors)`를 호출할 때 브레이크 포인트를 걸고 보면 사실은 두 번의 메서드 호출이 일어난다는 사실을 알 수 있다.  
1. paper.beats(scissors)에 의해 실제로 `Paper object의 fun beats(gameObject: GameObject): Boolean` 메서드가 호출된다.  
2. Paper object의 fun beats(gameObject: GameObject): Boolean 메서드 안에서 gameObject.beatsPaper() 메서드가 호출된다.  
실제로 호출되는 메서드는 Argument인 `Scissors object의 fun beatsPaper(): Boolean` 메서드가 호출된다.

Double Dispatch Pattern은 객체 지향 특성 중 다형성(Polymorphism)을 사용한다.  
`fun beats(gameObject: GameObject): Boolean`의 argument로 넘어오는 건 똑같은 GameObject이지만,
그 구현체가 Rock이면 `Rock object`의 메서드를,
Paper이면 `Paper object`의 메서드를,
Scissors이면 `Scissors object`의 메서드를 실행한다.  
이는 자바가 동적 디스패치(객체의 타입에 따라 동적으로 디스패치)를 허용하기 때문이다.


