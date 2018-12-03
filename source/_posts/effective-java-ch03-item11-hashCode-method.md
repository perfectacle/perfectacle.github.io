---
title: '(이펙티브 자바 3판) 3장 - 모든 객체의 공통 메서드, equals를 재정의하려거든 hashCode도 재정의하라'
tags:
  - Java
category:
  - Note
  - Java
date: 2018-12-03 20:42:39
---

![](thumb.png)

Object 클래스는 인스턴스가 생성 가능한 Concrete class이지만 기본적으로 상속해서 사용하도록 설계됐다고 한다.
(그 이유는 모르겠지만... 그걸 찾으려면 또 이 장의 범위를 넘어서니 나중에 찾아보자.)  
따라서 final이 아닌 메서드([equals](/2018/11/26/effective-java-ch03-item10-equals-method), [hashCode](#hashCode), toString, clone, finalize는)는 모두 메서드 오버라이딩을 염두하고 설계된 메서드이다.  
따라서 해당 메서드를 오버라이딩 할 때는 각 메서드마다 지켜야할 규칙들이 존재한다.  
이 규칙을 지키지 않았을 때 뻑나는 경우가 있다.  
일반적인 클래스들(Collection Framework 등등)은 이러한 규칙들은 지켰겠지~ 하고 작성된 코드들이 많다.  
따라서 위와 같은 규칙을 지키지 않은 채 오버라이딩을 한 클래스를 사용하면 제대로 동작하지 않을 가능성이 존재한다.

## 들어가기에 앞서...
equals 메서드와 마찬가지로 hashCode를 오버라이딩 할 경우는 거의 없다.  
대부분 hashCode를 쓰는 쪽은 HashMap, HashSet 등등이다.  
이 마저도 키에다가 equals를 오버라이딩 한 클래스를 사용할 때이다.  
실무에서 대부분 키로 String, Integer를 쓰지, 해당 클래스를 써본 적은 한 번도 없다.  
(물론 특수한 경우에는 존재할 수도 있지만, 아주 특수할 것이다.)
따라서 이런 아주 특수한 경우를 제외하고는 딱히 hashCode를 오버라이딩 할 이유가 없으니 이 글도 딱히 읽을 필요도 없다.  
그래도 혹여나 실무에서 당장 hashCode를 오버라이딩 하려면 세 가지 방법이 존재한다.  
~~내가 당신의 시간을 아껴주겠다.~~  
그래도 공부 측면 등등에서 꼭 알아야하는 내용임에는 틀림이 없는 것 같다.

1. 구글에서 만든 [AutoValue](https://github.com/google/auto/tree/master/value) 사용하기. (권장)  
아주 사용하기가 간단하다.  
바로 클래스 위에 `@AutoValue` 어노테이션만 달아주면 끝이다.  
(물론 equals, hashCode, toString 메서드까지 다 오버라이딩 해준다.)  
클래스가 변경돼도 hashCode 쪽 소스코드를 수정할 필요가 없다.  
얘는 자바 6부터 지원한다.  
2. IDEA가 생성해준 소스 코드 사용하기.  
여러가지 규칙을 직접 찾아보며 구현하기 귀찮으니까 아래 코드를 복붙하면 된다.  
인텔리제이 IDEA가 생성한 코드니 신뢰하고 써도 될 것이다.
```java
@Override
public int hashCode() {
    // 필드를 다 넘기면 된다.
    return Objects.hash(x, y);
}
```
단점으로 클래스가 변경될 때마다 hashCode 쪽 소스도 넣어줘야해서 귀찮다.  
또한 Objects 클래스는 자바 7에 등장해서 자바 7 미만인 환경에서는 사용하지 못한다.  
3. 직접 구현하기(자바 5 이하~~탈출을 권장~~)
이 글을 보시고 직접 구현해보면 될 것 같다.

## hashCode
> Returns a hash code value for the object. 
  This method is supported for the benefit of hash tables such as those provided by HashMap.
  https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#hashCode()
  
object의 해시 값을 반환하는 메서드이다.  
key를 해싱해서 인덱스를 만들고, 해당 인덱스의 버킷(저장 공간)에 값을 저장하는 자료구조인 [Hash Table](https://en.wikipedia.org/wiki/Hash_table)에서 사용된다.

```java
public V get(Object key) {
    Node<K,V> e;
    return (e = getNode(hash(key), key)) == null ? null : e.value;
}

static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```
위 코드는 [HashMap](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/HashMap.html) 클래스의 get 메서드인데 내부적으로 타고들어가다보면 Object의 hashCode 메서드를 사용해서 key의 hashCode를 구해서 원하는 value를 구하고 있다.    


이제 hashCode의 규약을 알아보자.  
1. Whenever it is invoked on the same object more than once during an execution of a Java application, the hashCode method must consistently return the same integer, provided no information used in equals comparisons on the object is modified.  
This integer need not remain consistent from one execution of an application to another execution of the same application.  
equals 비교에 사용되는 정보가 변경되지 않았다면, 애플리케이션이 실행되는 동안 그 객체의 hashCode 메서드는 몇 번을 호출해도 일관되게 항상 같은 값을 반환해야 한다.  
단, 어플리케이션을 다시 실행한다면 이 값이 달라져도 상관없다.
1. If two objects are equal according to the equals(Object) method, then calling the hashCode method on each of the two objects must produce the same integer result.    
equals(Object)가 두 객체를 같다고 판단했다면, 두 객체의 hashCode는 똑같은 값을 반환해야한다.  
1. It is not required that if two objects are unequal according to the equals(java.lang.Object) method, then calling the hashCode method on each of the two objects must produce distinct integer results. However, the programmer should be aware that producing distinct integer results for unequal objects may improve the performance of hash tables.  
equals(Object)가 두 객체를 다르다고 판단했더라도, 두 객체의 hashCode가 서로 다른 값을 반환할 필요는 없다.  
단, 다른 객체에 대해서는 다른 값을 반환해야 해시 테이블의 성능이 좋아진다.

어, 지루하게 hashCode의 규약에 대해 살펴봤으니 우리가 간단하게 만든 클래스가 hashCode의 규약을 준수하는지 알아보자.  
우선 간단한 클래스를 만들어보자.
```java
public class Point {
    private int x;
    private int y;

    public Point(final int x, final int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        final var obj = (Point) o;

        if(obj.x != this.x) return false;
        if(obj.y != this.y) return false;

        return true;
    }
}
```

이 클래스가 동치 관계를 준수하면서 equals 메서드를 구현했는지 간단하게 검증해보자.  
```java
@Test
void test() {
    // reflexive
    final var x = new Point(1, 1);
    assertEquals(x, x);

    // symmetric
    final var y = new Point(1, 1);
    assertEquals(x, y);
    assertEquals(y, x);

    // transitive
    final var z = new Point(1, 1);
    assertEquals(y, z);
    assertEquals(x, z);

    // consistent
    assertEquals(x, x);
    assertEquals(x, y);
    assertEquals(y, x);
    assertEquals(y, z);
    assertEquals(x, z);
    
    // For any non-null reference value x, x.equals(null) should return false.
    assertNotEquals(x, null);
}
```

5가지 규칙을 모두 지킨 참된 equals 메서드이다.  
그럼 이 클래스가 HashMap에서도 key로써 제대로 역할을 수행하는지 알아보자.  
```java
@Test
void test() {
    // 두 인스턴스가 같다고 판단(내부적으로 equals 메서드 사용)
    assertEquals(new Point(1, 1), new Point(1, 1));

    // 1번 규칙에 의하면 몇 번을 호출하더라도 동일한 hashCode가 나와야하는데 동일한 값이 나오지 않았음.
    final var resultSet = IntStream.range(1, 100).mapToObj((i) -> new Point(1, 1).hashCode()).collect(toSet());
    assertNotEquals(resultSet.size(), 1);

    // 단 두 번만 호출했는데도 불구하고 둘이 다른 해시코드가 나옴.
    assertNotEquals(new Point(1, 1).hashCode(), new Point(1, 1).hashCode());

    // 서로 다른 해시코드를 내뱉기 때문에 키의 역할을 제대로 수행하지 못하고 있음.
    final var map = new HashMap<Point, Integer>();
    map.put(new Point(1, 1), 1);
    assertNull(map.get(new Point(1, 1)));
}
```

제대로 규칙을 이행하는 게 하나도 없다.  
그렇다면 기본 메서드인 Object.hashCode()는 어떻게 구현이 돼있길래 저런 결과가 나온 걸까...?  

```java
@HotSpotIntrinsicCandidate
public native int hashCode();
```
내부 구현이 다 숨겨져 있다.  
주석을 살펴보면 아래와 같이 나와있다.  
> As much as is reasonably practical, the hashCode method defined by class Object does return distinct integers for distinct objects.
  (The hashCode may or may not be implemented as some function of an object's memory address at some point in time.)
  https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Object.html#hashCode()

**object's memory address**가 핵심인 것 같다.  
객체의 참조값을 가지고 해싱을 한다는 것 같은데, 모든 객체 인스턴스는 싱글턴이 아닌 이상 각각 고유한 참조값을 가지고 있으므로
hashCode의 기본 메서드로를 모든 인스턴스마다 고유한 hashCode를 생산한다.  
하지만 우리가 구현한 equals 메서드에 따르면 각 인스턴스마다 equals 값이 true로 나오고 있으므로 hashCode도 동일한 값이 나와야하는데  
그러고 있지 않으므로, 우리가 만든 클래스는 hashCode의 규약을 준수하지 못한 경우이다.  
따라서 equals 메서드를 오버라이딩 했으면 거의 hashCode도 같이 오버라이딩 해줘야 hashCode의 규약을 준수해서 hashMap 등등에서 key로써 제대로 된 역할을 수행한다고 말할 수 있다.  

아주 간단하게 해시 코드를 작성해보면 다음과 같다.~~(실무에서 절대 쓰면 안된다.)~~  
```java
@Override
public int hashCode() {
    return 1;
}
```
이렇게 구현하면 물론 `equals 비교에 사용되는 정보가 변경됐는데도 똑같은 해시 값을 반환`하므로 1번 규약을 지키지는 못한다.  
또한 모두 같은 해시 값을 반환하기 때문에 충돌이 발생하게 되는데 이 경우에는 index가 가리키고 있는 LinkedList에 값을 추가해서 데이터의 유실을 방지한다.  
따라서 해시 테이블의 단 하나의 버킷에 저장하기 때문에 평균 수행 시간이 O(n)으로 느려진다.  
이상적인 해시 값이라면 hashCode 규약을 준수하고, O(1)의 수행속도를 가져야한다. (각기 다른 버킷에 값을 저장하고, 따라서 충돌이 아주 적은...)  

책에 나와있는 hashCode 작성법을 글로만 읽으면 이해가 안 되니 코드와 함께 이해해보자.  
```java
public class Type {
    private int x;
    private String y;
    private double[] z;
    private Type t;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Type)) return false;
        final var obj = (Type) o;

        // 첫 번째 핵심 필드 x
        if(obj.x != this.x) return false;
        if(obj.y.equals(this.y)) return false;
        if(Arrays.equals(obj.z, this.z)) return false;
        // 필드 t는 아예 equals 메서드에서 제외하였다.

        return true;
    }
    
    @Override
    public int hashCode() {
        // 첫 번째 핵심 필드 x의 해시값을 구함.
        // primitive type이기 때문에 WrapperClass.hashCode() 메서드를 통해 해시값을 구함.
        var result = Integer.hashCode(x);
        
        // 그 다음 핵심필드 y는 참조 타입이기 때문에 참조 타입의 hashCode() 메서드 사용.
        result = result * 31 + y.hashCode();
        
        // 그 다음 핵심필드 z는 배열이고, 그 내부 원소가 모두 equals에 사용된 핵심 원소이므로 Arrays.hashCode() 메서드를 통해 구현.
        // 만약 특정 원소만 핵심 원소라면 해당 원소들에 대해서 for-loop 돌면서 hashCode를 구하면 됨.
        result = result * 31 + Arrays.hashCode(z);
        
        // equals 메서드에 사용되지 않은, 핵심필드가 아닌 t는 hashCode에서 사용하면 안 됨.
        // equals 메서드를 통해 같다고 판단한 객체가 서로 다른 hashCode를 내뱉는 현상이 발생해 hashCode 규약을 지키지 못할 수 있음.
        
        // 위에서 구한 result를 반환.
        return result;
    }
}
```
**Q: 왜 기존 값에 해시코드를 더하지 않고, 31을 곱한 후에 더하는가?**  
A: 아래의 예제를 통해 알아보자.  
```java
public class Type {
    private int x;
    private int y;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Type)) return false;
        final var obj = (Type) o;

        // 첫 번째 핵심 필드 x
        if(obj.x != this.x) return false;
        if(obj.y != this.y) return false;

        return true;
    }

    @Override
    public int hashCode() {
        // 첫 번째 핵심 필드 x의 해시값을 구함.
        // primitive type이기 때문에 WrapperClass.hashCode() 메서드를 통해 해시값을 구함.
        var result = Integer.hashCode(x);

        // 그 다음 핵심필드 y도 primitive type이기 때문에 WrapperClass.hashCode() 메서드를 통해 해시값을 구함.
        result += Integer.hashCode(y);

        // 위에서 구한 result를 반환.
        return result;
    }
}
```
여기서 {x=1, y=2}와 {x=2, y=1}은 동등(equals)하지 않다.  
하지만 각 원소의 집합은 {1, 2}로 동일하기 때문에 해시코드를 구하면 일치하게 된다.  
이런 충돌을 줄이고자 31을 곱하는 것이다. (이는 String의 hashCode 메서드를 봐도 마찬가지다.)  

**Q: 왜 31을 곱하는가?**  
A: 31이 소수이기 때문이란다.  

**Q: 왜 소수를 곱하는가?**
A: Modulo operation(나머지 연산)에서 충돌을 줄이기 위함이라고 한다.  
해시 함수의 예제를 구글링해보면 나머지 연산을 통해 해시 값을 구하는 예제가 참 많다.  
실제로 나머지 연산을 통해 해시값을 구할 때는 소수로 나누는 것이 훨씬 충돌 횟수가 적다. (입력값이 균일하게 분포돼있지 않다는 전제 하에...)  
그래서인지 곱하는 수도 소수를 곱하는 것 같다.  
하지만 명확하게 왜 소수를 곱하는지는 아직 찾지 못했다.

**Q: 충돌이 일어나면 어떻게 동작하는가?**
우선 데이터의 유실을 막기 위해 어디다가 저장하긴 해야한다.  
이를 위한 여러가지 동작 방식이 있는데 자바에서는 Separate Chaining 방식을 채택해서 버킷을 Linked List로 구현했다. 
(Open Addressing이란 방식도 있다고 하니 이것도 공부해두면 좋을 것 같다.)  
따라서 해시 코드가 충돌되더라도 일단 데이터는 저장되니 데이터의 유실은 막는다.  
하지만 충돌이 잦을 수록 검색 성능은 나빠지니 최대한 충돌이 적은 알고리즘을 찾아야한다.  
그리고 충돌이 발생하더라도 해당 키값에 대한 동등(equals) 비교가 일치하는 키 값이 없으면 null을 반환하게 된다.

**Q: 그 많은 소수 중에 왜 31인가? (추측)**  
31은 2⁵ - 1이다.  
이를 비트 연산자로 표기하면 2 << 5 - 1이다.  
왼쪽으로 n칸 이동하면 2ⁿ만큼 곱했다고 보면 된다.  
cpu는 비트 연산에 매우 최적화 돼있다.  
그리고 31은 1만 빼면 되는데, 37((2 << 5) + 6)은 6을 더해야하니 31이 더 빠르지 않을까?  
31보다는 37이 더 충돌 횟수가 적긴 할텐데, 아마 31만으로도 충분히 충돌 횟수를 많이 줄일 수 있어서 굳이 37을 안 쓰는 게 아닐까 싶다...  
즉, 성능과 충돌 사이의 밸런스를 찾다보니 31이 나온 건 아닌가 싶다.  

그리고 해시값을 구하는데 소수를 이용하는 거 보다 더 나은 알고리즘들이 있다고 하니 직접 찾아보는 것도 좋을 것 같다.

또한 위와 같이 일일이 귀찮게 hashCode를 계산하기 보다는 아래와 같이 할 수 있다.  
하지만 박싱/언박싱 및 입력값을 담기 위한 배열 생성 비용 등등으로 인해 성능 측면에서는 조금 아쉽긴 하다.
```java
@Override
public int hashCode() {
    // Array가 아닌 타입은 모두 Objects.hash() 메서드로 해시값을 구할 수 있다.
    int result = Objects.hash(x, y, t);
    result = 31 * result + Arrays.hashCode(z);
    return result;
}

// 어차피 Objects.hash() 메서드를 따라들어가보면 Arrays.hashCode()를 사용하고 있다.
public static int hash(Object... values) {
    return Arrays.hashCode(values);
}
```

혹은 클래스가 불변인 경우에는 생성 당시에 해시코드 값을 미리 캐싱해놓는 것도 좋다.
```java
private final int hash;

public Type(final int x, final String y, final double[] z, final Type t) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.t = t;
    this.hash = hashCode();
}
```
  
하지만 해시코드 생성 비용이 큰 경우에는 해시코드 값을 사용하기 전까지는 지연 초기화를 시켜놓으면 된다.  
```java
@Override
public int hashCode() {
    if(hash != 0) return hash;
    
    var result = Objects.hash(x, y, t);
    result = 31 * result + Arrays.hashCode(z);
    hash = result;
    
    return hash;
}
```   
