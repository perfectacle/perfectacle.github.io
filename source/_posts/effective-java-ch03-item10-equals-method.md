---
title: (이펙티브 자바 3판) 3장 - 모든 객체의 공통 메서드, equals는 일반 규약을 지켜 재정의하라
tags: [Java]
category: [Note, Java]
date: 2018-11-26 01:16:30
---
![](thumb.png)

Object 클래스는 인스턴스가 생성 가능한 Concrete class이지만 기본적으로 상속해서 사용하도록 설계됐다고 한다.
(그 이유는 모르겠지만... 그걸 찾으려면 또 이 장의 범위를 넘어서니 나중에 찾아보자.)  
따라서 final이 아닌 메서드([equals](#equals), hashCode, toString, clone, finalize는)는 모두 메서드 오버라이딩을 염두하고 설계된 메서드이다.  
따라서 해당 메서드를 오버라이딩 할 때는 각 메서드마다 지켜야할 규칙들이 존재한다.  
이 규칙을 지키지 않았을 때 뻑나는 경우가 있다.  
일반적인 클래스들(Collection Framework 등등)은 이러한 규칙들은 지켰겠지~ 하고 작성된 코드들이 많다.  
따라서 위와 같은 규칙을 지키지 않은 채 오버라이딩을 한 클래스를 사용하면 제대로 동작하지 않을 가능성이 존재한다.  

## 들어가기에 앞서...
equals 메서드를 오버라이딩 할 경우는 거의 없다.  
대부분 핵심 필드의 값이 일치하는지 파악하기 위해서 오버라이딩 할 것이다.  
그런 경우를 제외하고는 대부분 기본적인 레퍼런스 값 비교만으로도 충분히 비교가 가능하기 때문이다.  
equals 메서드를 오버라이딩 하는 건 그렇게 어렵지 않지만 몇가지 원칙이 있고, 글의 길이가 짧은 편도 아니고 얻는 수확이 크지 않다. (애초에 오버라이딩 할 일이 거의 없으니...)  
그래서 `지금 당장 오버라이딩을 해야한다!` 싶을 때는 두 가지 방법이 있다.  
~~내가 당신의 시간을 아껴주겠다.~~  
그래도 공부 측면 등등에서 꼭 알아야하는 내용임에는 틀림이 없는 것 같다.

1. 구글에서 만든 [AutoValue](https://github.com/google/auto/tree/master/value) 사용하기. (권장)  
아주 사용하기가 간단하다.  
바로 클래스 위에 `@AutoValue` 어노테이션만 달아주면 끝이다.  
(물론 equals, hashCode, toString 메서드까지 다 오버라이딩 해준다.)  
클래스가 변경돼도 hashCode 쪽 소스코드를 수정할 필요가 없다.  
얘는 자바 6부터 지원한다.  
1. IDEA가 생성해준 소스 코드 사용하기.  
사람이라면 실수를 하게 되니 IDE의 도움을 절실히 원하게 된다.  
하지만 클래스가 변하는 경우에 equals 코드도 계속해서 변경해줘야하니 구찮다...  
또 잘 짰는지 테스트 코드도 짜야하고... 테스트 코드도 변경해야하고...  

## equals
equals 메서드는 오버라이딩 하기 쉬워보이지만 자칫했다가는 규칙을 어길 가능성도 곳곳에 존재한다.  
따라서 책에서 이런 가능성을 없애는 가장 좋은 방법은 오버라이딩 하지 않는 것이라고 한다.  
나도 내가 딱히 이런 equals 메서드를 직접 정의해본 기억은 거의 없다.  

우선 우리가 오버라이딩 하지 않았을 때는 어떤 비즈니스 로직을 수행하고 있는지 모든 클래스의 부모 격인 Object 클래스의 equals 메서드를 까보자.  
```java
public boolean equals(Object obj) {
    return (this == obj);
}
```
정말 별 거 없다.  
그냥 == 연산을 통해 레퍼런스를 비교하는 정도이다.  
만약 클래스의 논리적 동치성(같은 레퍼런스가 아닐지라도 특정 필드의 값이 같다던지... 등등)을 확인하고 싶다면 equals 메서드를 오버라이딩 해야한다.  
가장 좋은 예가 Integer, String 클래스 등등이다.  
```java
public boolean equals(Object obj) {
    if (obj instanceof Integer) {
        return value == ((Integer)obj).intValue();
    }
    return false;
}
```
위 예는 Integer 클래스의 equals 메서드이다.  
레퍼런스를 가지고 비교하는 게 아니라 인스턴스가 가지고 있는 value(primitive type인 int)들끼리 비교하고 있다.  
혹은 인스턴스가 하나 뿐이라고 보장된 클래스(싱글턴)는 레퍼런스 비교만으로도 논리적 동치성을 보장하니 굳이 equals 메서드를 오버라이딩 할 필요가 없다.

그렇다면 equals에 어떤 규칙이 있는지는 아래 문서를 참고해 하나씩 알아보자.    
[https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object))  

### equivalence relation(동치 관계)
> The equals method implements an equivalence relation on non-null object references
  euqals 메서드는 non-null object 레퍼런스에 대해 equivalence relation(동치 관계)를 구현해야한다.
  https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)

아까부터 논리적 동치성이니, 동치 관계니, 계속 동치 동치 거리는데 일단 동치가 뭔지 알아보자.  
~~동치미도 아니고...~~~

책에서는 `동치 관계`에 대해 아래와 같이 설명하고 있다.  
> 집합을 서로 같은 원소들로 이뤄진 부분집합으로 나누는 연산이다.
  이 부분집합을 동치류(equivalence class; 동치 클래스)라 한다.
  equals 메서드가 쓸모 있으려면 모든 원소가 같은 동치류에 속한 어떤 원소와도 서로 교환할 수 있어야한다.

그냥 읽어선 뭔 소린지 모르겠다.  
그림으로 이해를 해보자. (마우스 없는 환경에서 그리려니까 너무 힘들다...)  
![](01.png)  
위 그림은 아래와 같은 기호를 통해 표현할 수 있다.  
`X = {a, b, c, a, b, c}`  
이제 이 집합 X를 서로 같은 원소들로 이뤄진 부분집합으로 나눠보자.  
![](02.png)  
위 그림은 아래와 같은 기호를 통해 표현할 수 있다.  
```
X = {a, b, c, a, b, c}
A = {a, a}
B = {b, b}
C = {c, c}
```
이제 이 부분집합 A, B, C는 서로 같은 원소들끼리 뭉쳐있으므로 동치류(equivalence class; 동치 클래스)라고 부를 수 있다.  
equals 메서드가 쓸모 있으려면 동치류에 속한 어떤 원소와도 서로 교환할 수 있어야한다고 한다.  

그냥 뭔소린지 모르겠고 그냥 둘이 같아야한다는 걸 뭘 어렵게 풀어쓴 거 같다.  
~~수학을 모르니 ㅠㅠ...~~
그럼 동치 관계가 가지는 특성에 대해 하나씩 알아보자.

#### Reflexive(반사성)
> for any non-null reference value x, x.equals(x) should return true.
  https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)
  
null이 아니고, 참조값 x에 대해서 x.equals(x)는 true를 반환해야한다.  
위 규칙을 어기는 코드를 바로 작성해보자.  
```java
public class NotReflexive {
    @Override
    public boolean equals(final Object o) {
        return false;
    }
}
```

그리고 아래와 같이 테스트 코드를 작성해서 위 규칙을 어겼는지 검증해보자.  
```java
@Test
void test() {
    final var x = new NotReflexive();
    assertNotEquals(x, x);
}
```
테스트는 깔끔하게 통과한다.  

그럼 이제 위 규칙을 어겼을 때 어떤 오동작을 유발하는지 살펴보자.  
```java
@Test
void test() {
    final var x = new NotReflexive();
    final var list = List.of(x);
    assertFalse(list.contains(x));
}
```
reflexive 하지 못한 인스턴스는 List(및 다른 Collection)에 포함돼었는지 제대로 파악할 수 없다.  
이유는 아래 보다싶이 List 클래스의 contains 메서드는 인스턴스의 equals 메서드를 활용하기 때문이다.  

```java
@Override
public boolean contains(Object o) {
    return indexOf(o) >= 0;
}

@Override
public int indexOf(Object o) {
    Objects.requireNonNull(o);
    for (int i = 0, s = size(); i < s; i++) {
        if (o.equals(get(i))) {
            return i;
        }
    }
    return -1;
}
```

이런 경우에는 딱히 필드도 없고(극단적인 경우지만) 하니 메서드 오버라이딩 자체를 하지 않으면 문제가 해결된다.

#### Symmetric(대칭성)
> for any non-null reference values x and y, x.equals(y) should return true if and only if y.equals(x) returns true.
  https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)
  
null이 아니고, 참조값 x와 y에 대해서 x.equals(y)가 true를 반환하면 y.equals(x)도 true를 반환해야한다.  
위 규칙을 어기는 코드를 바로 작성해보자.
```java
public class NotSymmetric {
    @Override
    public boolean equals(final Object o) {
        if(o instanceof NotSymmetric) return true;
        return o instanceof String;
    }
}
```

그리고 아래와 같이 테스트 코드를 작성해서 위 규칙을 어겼는지 검증해보자.  
```java
@Test
void test() {
    final var x = new NotSymmetric();
    
    // reflexive!!
    assertEquals(x, x);
    
    final var y = "";
    
    // not symmetric!!
    assertEquals(x, y);
    assertNotEquals(y, x);
}
```
테스트가 깔끔하게 통과한다.  
NotSymmetric은 String을 알지만, String은 NotSymmetric을 알지 못하기 때문이다.  

그럼 이제 위 규칙을 어겼을 때 어떤 오동작을 유발하는지 살펴보자.  
```java
@Test
void test() {
    final var x = new NotSymmetric();
    final var y = "";

    final var list = List.of(y);
    assertTrue(list.contains(x));
}
```
대칭성이 없는 인스턴스 역시 List(및 다른 Collection)에 포함돼었는지 제대로 파악할 수 없다.  
이유는 위에서 얘기했다싶이 List 클래스의 contains 메서드는 인스턴스의 equals 메서드를 활용하기 때문이다.  
x(NotSymmetric)의 잘못 구현된 equals 메서드를 사용하기 때문에 포함되지도 않았는데 포함됐다고 판단하고 있다.  

이런 경우에는 String에 대해 비교하는 구문을 아예 없애버리면 해결이된다.

#### Transitive(추이성)
> for any non-null reference values x, y, and z, if x.equals(y) returns true and y.equals(z) returns true, then x.equals(z) should return true.
  https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)  

null이 아니고, 참조값 x와 y, z에 대해서 x.equals(y)가 true를 반환하고 y.equals(z)가 true를 반환하면, x.equals(z)도 true를 반환해야한다.  
마치 3단 논법같은 이 명제를 부셔버리는 예제를 작성해보자.  

```java
public class Parent {
    @Override
    public boolean equals(final Object o) {
        return o instanceof Parent;
    }
}

public class NotTransitive extends Parent {
    private int a;

    public NotTransitive(final int a) {
        this.a = a;
    }

    @Override
    public boolean equals(final Object o) {
        if(!super.equals(o)) return false;

        // Parent 인스턴스 경우
        if(!(o instanceof NotTransitive)) return true;

        // NotTransitive 인스턴스인 경우
        return a == ((NotTransitive) o).a;
    }
}
```

이제 테스트 코드로 검증을 해보자.  
```java
@Test
void test() {
    final var x = new NotTransitive(1);

    // reflexive!!
    assertEquals(x, x);

    final var y = new Parent();

    // symmetric!!
    assertEquals(x, y);
    assertEquals(y, x);

    final var z = new NotTransitive(2);

    // not transitive!!
    assertEquals(x, y);
    assertEquals(y, z);
    assertNotEquals(x, z);
}
```

위와 같이 transitive하지 못한 경우에도 아래와 같이 당연히 오작동하기 마련이다.  
```java
@Test
void test() {
    final var x = new NotTransitive(1);
    final var y = new Parent();
    final var list = List.of(x);
    
    assertTrue(list.contains(y));
}
```

이를 해결하기 위해서는 Parent 클래스에 equals 메서드에서 instanceof 연산자 대신에 getClass() 메서드를 쓰면 해결된다. (정말?)
```java
public class Parent {
    @Override
    public boolean equals(final Object o) {
        return (o != null) && (o.getClass() == this.getClass());
    }
}
```

테스트 코드로 검증을 해보자.  
```java
@Test
void test() {
    final var x = new NotTransitive(1);
    
    // reflexive!!
    assertEquals(x, x);

    final var y = new Parent();

    // symmetric!!
    assertEquals(x, y);
    assertEquals(y, x);

    final var z = new NotTransitive(2);
    
    // transitive!!
    assertNotEquals(x, y);
    assertNotEquals(y, z);
    assertNotEquals(x, z);
    
    final var list = List.of(x);

    assertFalse(list.contains(y));
}
```
위 테스트에서 문제가 됐던 x.equals(y), y.equals(z), !x.equals(z) 문제는 발생하지 않았고,  
list.contains() 메서드에서 말썽이 발생했던 문제도 해결됐다.

하지만 이는 논리적 동치성을 검증하지 못했고, **리스코프 치환 원칙**을 위배했기 때문에 올바르게 해결했다고 하기 거시기하다...
> LSP(Liskov substitution principle, 바바라 리스코프란 사람이 만들었다고 함.)
  어떤 타입에 있어 중요한 속성이라면 그 하위 타입에서도 마찬가지로 중요하고,
  따라서 그 타입의 메서드가 하위 타입에서도 똑같이 잘 동작해야한다.

간단한 예를 통해 알아보자.  
우선 Parent 클래스를 다음과 같이 바꿔보자.  
```java
public class Parent {
    private static final List<Parent> z = List.of(new Parent());

    @Override
    public boolean equals(final Object o) {
        return (o != null) && (o.getClass() == this.getClass());
    }

    public boolean test(final Parent p) {
        return z.contains(p);
    }
}
```

그리고 간단한 테스트 클래스를 통해 의도한 대로 동작하는지 보자.  
```java
@Test
void test() {
    final var x = new Parent();
    assertTrue(x.test(x));
}
```
무슨 일을 하는 코드인지는 모르겠지만 우리가 의도한 대로 잘 동작한다.  
리스코프 치환 원칙을 준수했다면 Parent의 하위 클래스인 NotTransitive 클래스로 타입을 **치환**해도 정상 동작해야한다.  

```java
@Test
void test() {
    final var x = new NotTransitive(1);
    assertTrue(x.test(x));
}
```
상위 타입(Parent)에서 하위 타입(NotTransitive)로 치환했는데 테스트가 깨진다.  
이는 하위 타입인 NotTransitive 클래스를 리스코프 치환 원칙에 위배했다는 증거가 된다.  
리스코프 치환 원칙은 객체 지향의 5대 원칙 중 하나이므로 이는 객체 지향적으로 설계하지 못했다는 증거가 된다.  

그럼 하위 클래스에 필드를 추가하면서 equals 메서드를 오버라이딩 하는데 동치 관계를 준수하면서 객체 지향적으로 설계까지 하는 방법은 없는 걸까?  
답은 없다.  
그럼 어떻게 해야할까?  
하위 클래스(상속)로 만드는 대신에 Composition을 활용하는 것이다.
```java
public class NotTransitive {
    // 상속을 쓰지 않으니 부모 클래스로 접근할 수 있는 루트를 필드로써 제공하면 된다.
    private Parent p;
    private int a;

    public NotTransitive(final Parent p, final int a) {
        this.p = p;
        this.a = a;
    }
    
    // 부모 클래스의 기능을 쓰고 싶다면 이 메서드를 통해 접근하면 된다.
    public Parent asParent() {
        return p;
    }

    // 논리적 동치성을 검증.
    @Override
    public boolean equals(final Object o) {
        if(!(o instanceof NotTransitive)) return false;
        return a == ((NotTransitive) o).a;
    }
}
```

하지만 자바 라이브러리를 보면 하위 클래스에 필드를 추가하면서 equals를 재정의한 경우가 있다.  
바로 [java.util.Date](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Date.html) 클래스를 상속 받은 [java.sql.Timestamp](https://docs.oracle.com/en/java/javase/11/docs/api/java.sql/java/sql/Timestamp.html)가 그 예이다.  
따라서 Timestamp API 문서에는 아래와 같은 문구가 적혀있다.  
> This type is a composite of a java.util.Date and a separate nanoseconds value. 
  Only integral seconds are stored in the java.util.Date component.
  The fractional seconds - the nanos - are separate.
  The Timestamp.equals(Object) method never returns true when passed an object that isn't an instance of java.sql.Timestamp, because the nanos component of a date is unknown.
  As a result, the Timestamp.equals(Object) method is not symmetric with respect to the java.util.Date.equals(Object) method.
  Also, the hashCode method uses the underlying java.util.Date implementation and therefore does not include nanos in its computation.
  
위 클래스는 대칭성을 준수하지 못하고 있다.  
```java
@Test
void test() {
    long epochMilli = Instant.now().toEpochMilli();
    final var date = new Date(epochMilli);
    final var timestamp = new Timestamp(epochMilli);

    // not symmetric!!
    assertEquals(date, timestamp);
    assertNotEquals(timestamp, date);
}
```

물론 하위 클래스에 필드를 추가하면서 equals 메서드를 오버라이딩 하는데 동치 관계를 준수하면서 객체 지향적으로 설계하는 경우도 있긴 하다.  
바로 부모 클래스가 추상 클래스인 경우이다.  
추상 클래스는 인스턴스를 만들 수 없으므로 위에 얘기했던 문제가 발생하지 않는다.  

#### Consistent(일관성)
> for any non-null reference values x and y, multiple invocations of x.equals(y) consistently return true or consistently return false, provided no information used in equals comparisons on the objects is modified.
  https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)
  
equals 메서드의 결과가
1. 가변 클래스의 경우에는 수정되기 전까지 항상 똑같아야한다.
2. 불변 클래스의 경우에는 항상 똑같아야한다.

equals 판단에 신뢰할 수 없는 자원이 끼어있는 경우 일관성을 해칠 수 있다.

그럼 일관성을 준수하지 못하는 경우를 작성해보자. (물론 Reflexive, 대칭성, Transitive도 준수하지 못하지만...)  
```java
public class NotConsistent {
    @Override
    public boolean equals(final Object o) {
        if(!(o instanceof NotConsistent)) return false;
        return Instant.now().toEpochMilli() % 2 == 0;
    }
}
```
equals 판단에 신뢰할 수 없는 자원으로 **시간**을 넣었다.  
과연 이 경우에 일관성을 해치는지 검증해보자.  
```java
@Test
void test() {
    final var x = new NotConsistent();
    final var y = new NotConsistent();
    // 숫자를 너무 작게하거나 운이 나쁘면 원하는 결과가 안 나올 수도...
    final var resultSet = IntStream.range(1, 1000000).mapToObj(i -> x.equals(y)).collect(toSet());
    assertNotEquals(resultSet.size(), 1);
}
```

하지만 이런 일관성을 깨뜨리면서 equals를 오버라이딩한 경우가 자바 라이브러리에도 존재한다.  
바로 [java.net.URL](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/net/URL.html) 클래스가 그 예이다.  
java.net.URL의 [equals](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/net/URL.html#equals(java.lang.Object)) 메서드는 URL과 매핑된 IP 주소를 이용해 비교한다.  
URL을 통해 매핑된 IP 주소를 알아내려면 네트워크를 이용해야한다.  
하지만 이 **네트워크**도 **equals 판단에 신뢰할 수 없는 자원** 중 하나이다.  
하지만 이 경우에는 하위 호환성 때문에 문제를 고치지 못하고 있다고 한다.

### null이 아닌 객체는 null과 같지 않아야한다.
> For any non-null reference value x, x.equals(null) should return false.
  https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)
  
이름만 들어도 뭔소린지 바로 파악이 된다.  
이 지키기 어려운 경우도 바로 아래와 같이 예제를 구현해보자.  
```java
public class NotNull {
    @Override
    public boolean equals(final Object o) {
        if(o == null) return true;
        return o instanceof NotNull;
    }
}
```
바로 비교하려는 대상이 null일 때 true를 리턴하면 된다.  

그럼 이 규칙을 잘 어겼는지 검증해보자.  
```java
@Test
void test() {
    // reflexive!
    final var x = new NotNull();
    assertEquals(x, x);

    // symmetric!
    final var y = new NotNull();
    assertEquals(x, y);
    assertEquals(y, x);

    // transitive!
    final var z = new NotNull();
    assertEquals(y, z);
    assertEquals(x, z);
    
    // consistent!
    assertEquals(x, x);
    assertEquals(x, y);
    assertEquals(y, x);
    assertEquals(y, z);
    assertEquals(x, z);

    // is x null!!
    assertEquals(x, null);
}
```

모든 규칙을 지켰는데 `null이 아닌 객체는 null과 같지 않아야한다`를 지키지 못했으니 위의 경우에는 동치 관계를 준수하면서 equals 메서드를 구현한 게 아니다.
간단하게 첫 번째 줄인 `if(o == null) return true;`만 삭제하면 모든 조건을 만족시키게 되는 것이다.  
instansof는 null safe한 연산자이기 때문에 굳이 null 체크를 안 해도 NullPointerException을 유발하지 않는다.

### Best Practice
1. 가장 처음에는 레퍼런스 비교를 하자.  
애초에 같은 레퍼런스 값을 가진다면 동일한 객체(논리적으로도)로 봐도 무방하다.  
따라서 뒤에 있을 로직들을 쓸 데 없이 처리하지 않아도 돼서 성능 측면에서 좋아질 것이다.  
```java
public boolean equals(final Object o) {
    return o == this;
}
```

2. instanceof 연산자로 올바른 타입인지 확인한다.  
올바른 타입인지 확인하지 않으면 뒤에 나오는 핵심 필드의 값을 비교할 수 없다.
```java
public boolean equals(final Object o) {
    // instanceof 연산자는 null safe 하기 때문에 아래 구문은 필요 없다.
    // if(o == null) return false;
    // 혹은 인터페이스를 구현한 것이면 클래스 대신에 인터페이스를 넣어서 비교할 수도 있다.
    return o instanceof Type;
}
```

3. 올바른 타입으로 형변환 하고, **핵심** 필드의 값만 비교하자.  
모든 필드의 값이 일치하지 않아도 되는 경우에는 모든 필드를 비교하면 성능 상에 좋지 않다.  
혹은 인터페이스의 구현체라면 인터페이스의 메서드를 사용해서 필드에 접근해야할 것이다.
```java
public boolean equals(final Object o) {
    // 올바른 타입인지 비교하지 않으면 ClassCastException을 면치 못할 것이다.
    if(!(o instanceof Type)) return false;
    
    final var obj = (Type) o;
    
    // 모든 필드를 비교할 필요는 없고 핵심적인 필드만 비교하면 된다.
    if(!obj.a.equals(this.a)) return false;
    return true;
}
```

4. float과 double을 제외한 primitive type은 == 연산자를 통해 값을 비교하고,  
float과 double은 Float.NaN, -0.0D 등등의 특수한 경우 때문에 == 연산자로는 비교가 불가능하다.  
그렇다고 equals 메서드를 통해 비교하면 오토박싱 때문에 성능상 좋지 않을 수도 있으니 compare 메서드를 통해 비교하도록 하자.  
그 외에 자바가 제공해주는 라이브러리의 경우에는 대부분 동치관계를 준수했을 것이므로 equals 메서드로 비교하자. (이 마저도 주의해서 사용하긴 해야한다.)  
혹은 특정 타입의 경우에는 `null이 아닌 객체는 null과 같지 않아야한다`는 원칙을 준수하지 않고 equals 메서드를 오버라이딩 했을 수 있기 때문에 Objects.equals를 쓰는 게 좀 더 안전하긴 하다.  
```java
public boolean equals(final Object o) {
    final var obj = (Type) o;
    
    if(obj.a != this.a) return false;
    if(Double.compare(obj.b, this.b) != 0) return false;
    if(!(obj.c.equals(this.c))) return false;
    if(!Objects.equals(obj.d, this.d)) return false; 
    return true;
}
```
5. 특정 필드로부터 값이 추론되는 필드는 검증하지 말자.  
사각형은 너비(width), 높이(height)만으로 넓이(area)가 결정되기 때문에 너비와 높이만 비교했으면 넓이는 비교할 필요가 없다.
```java
public class Rectangle {
    private final double width;
    private final double height;
    private final double area;

    public Rectangle(final double width, final double height) {
        this.width = width;
        this.height = height;
        
        // width(너비)와 height(높이)를 통해 area(너비)가 결정된다.
        this.area = width * height;
    }

    public boolean equals(final Object o) {
        final var obj = (Rectangle) o;
        
        if(obj.width != this.width) return false;
        if(obj.height != this.height) return false;
        
        // width와 height만 알면 area 값은 자동으로 알 수 있으니 굳이 비교할 필요가 없다.
        // if(obj.area != this.area) return false;
        return true;
    }
}
```
6. 변경 가능성이 높은 필드부터 비교하자.  
변경 가능성이 높은 필드부터 비교하면 더 빠르게 해당 타입의 논리적 동치성을 검출할 수 있다.  
```java
public class Type {
    private final int a;
    private int b;

    public Type(final int b, final int a) {
        this.b = b;
        this.a = a;
    }

    public void setB(int b) {
        this.b = b;
    }

    public boolean equals(final Object o) {
        final var obj = (Type) o;
        
        // 변경이 불가능한 a를 먼저 검사하기 보단 변경이 가능한 a를 검사해야 더 빠르게 논리적 동치성을 검출할 수 있다.
        if(obj.b != this.b) return false;
        if(obj.a != this.a) return false;
        return true;
    }
}
```
7. @Override 어노테이션을 사용하자.  
잘못 오버라이딩 한 경우 컴파일 에러를 내주기 때문에 버그를 최대한 빨리 찾을 수 있다.  
만약 해당 어노테이션이 없다면 메서드 오버라이딩(재정의)가 아니라 메서드 오버로딩 취급해서 새로운 메서드를 추가한 거라고 생각한다.  
그리고 새로 추가한 메서드를 통해 equals 메서드를 호출하는 게 아니라 부모 클래스에 있는 원본 클래스의 equals 메서드를 호출하게 된다.
```java
// method does not override or implement a method from a supertype
@Override
public boolean equals(final Type o) {
    return true;
}
```

위 규칙들을 준수해서 간단하게 equals 메서드를 구현해보자면 아래와 같다.  
```java
public class Point {
    private int x;
    private int y;
    private double center;
    private Color color;

    public Point(final int x, final int y, final double center, final Color color) {
        this.x = x;
        this.y = y;
        this.center = center;
        this.color = color;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        final var obj = (Point) o;
        
        if(obj.x != this.x) return false;
        if(obj.y != this.y) return false;
        if(Double.compare(obj.center, this.center) != 0) return false;
        if(!Objects.equals(obj.color, this.color)) return false;
        return true;
    }
}
```