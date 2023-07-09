---
title: '(이펙티브 자바 3판) 3장 - 모든 객체의 공통 메서드, Comparable을 구현할지 고려하라'
tags:
  - Java
categories:
  - Note
  - Java
date: 2018-12-21 11:00:45
---


![](effective-java-ch03-item14-comparable-interface/thumb.png)

이번 아이템은 모든 객체의 부모 클래스인 Object 클래스에 있는 메서드가 아니다.  
아예 동떨어진 믹스인 인터페이스인 Comparable와 해당 인터페이스의 유일한 메서드인 compareTo에 대한 내용이다.  
그럼에도 불구하고 이번 챕터인 '모든 객체의 공통 메서드'에 넣은 이유는 모든 객체에 유용하게 쓰일 수 있는 메서드이고
자바 플랫폼 라이브러리의 모든 값 클래스와 Enum에서 해당 인터페이스를 구현했기 때문이 아닐까 싶다.  
또한 compareTo 메서드를 쓰는 자바 API들(Arrays, Collections, TreeSet, TreeMap 등등)이 있기 때문에
compareTo 메서드를 잘만 쓰면 좁살만한 노력으로 코끼리만 한 큰 효과를 누린다고 책에서 얘기하고 있으니 이 장을 주의 깊게 봐야한다.

## Comparable
Comparable은 믹스인 인터페이스이다.  
그럼 이 믹스인 인터페이스가 제공하는 **선택적 기능**은 무엇일까?  
바로 인스턴스 사이에 **순서를 비교**해주는 기능을 제공해준다.  

### 규약
[compareTo 메서드 명세서](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Comparable.html#compareTo(T)에 더 자세한 내용이 나와있으니 참고해보면 된다.  

아래에서 나오는 sgn(표현식) 표기는 수학에서 말하는 부호 함수(signum function)을 뜻하고, 표현식의 값이 음수이면 -1, 0이면 0, 양수이면 1을 반환한다.  
* 객체가 주어진 객체보다 작으면 음의 정수를, 같으면 0을, 크면 양의 정수를 반환한다.  
* 객체와 비교할 수 없는 타입의 객체가 주어지면 ClassCastException을 던진다.  
* Comparable을 구현한 클래스는 `sgn(x.compareTo(y)) == -sgn(y.compareTo(x))`여야한다.
(따라서 x.compareTo(y)는 y.compareTo(x)가 예외를 던질 때에 한해 예외를 던져야한다.)  
이는 대칭성을 가져야한다는 의미이다.  
* Comparable을 구현한 클래스는 `x.compareTo(y) > 0`이고, `y.compareTo(z) > 0`일 때 `x.compareTo(z) > 0`이어야한다.  
이는 추이성을 가져야한다는 의미이다.  
* Comparable을 구현한 클래스는 `x.compareTo(y) == 0`일 때 `sgn(x.compareTo(z)) == sgn(y.compareTo(z))`이다.  
* **필수는 아니지만 권장하는 규약이다, 이 규약을 명시하지 않을 때는 주석으로라도 그 사실을 명시를 해둬야한다.**  
Comparable을 구현한 클래스는 `(x.compareTo(y) == 0) == (x.equals(y))`이다.  
두 객체의 순서가 동일하다면 equals 메서드로 논리적 동치성을 비교했을 때도 동일해야한다는 얘기이다.

다른 건 다 이해가 잘 되는데 마지막 규약은 왜 필수가 아닌지 이해가 되지 않을 것이다.  
동작은 잘 하지만 어딘가 이상한 부분이 있어서 지키라고 하는 것이다.  
뭐가 이상한지 한 번 살펴보자.  
다음은 [Set 인터페이스 문서](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Set.html)에 나온 내용이다.  
> sets contain no pair of elements e1 and e2 such that e1.equals(e2)
  
`e1.equals(e2)`와 같은 논리적 동치성이 검증된 e1과 e2의 쌍은 Set 컬렉션에서 포함하지 않는다는 내용이다.  
이 내용 때문에 Set에는 중복을 허용하지 않는 것이다.  
그렇다면 Set 인터페이스를 구현했고, 순서도 보장한 [SortedSet 인터페이스](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/TreeSet.html)의 경우에는 어떨까?  
> a sorted set performs all element comparisons using its compareTo (or compare) method

SortedSet 인터페이스는 **equals 메서드 대신에 compareTo(혹은 compare) 메서드를 통해 객체를 비교**하고 있다.  
이 내용이 위에 적혀있는 Set 인터페이스의 규약을 위반한 건지는 잘 모르겠다.  
하지만 이렇게 Set 인터페이스를 준수한 SortedSet 인터페이스가 Set 인터페이스와 뭔가 엇박자가 있기 때문에 웬만하면
마지막 규약인 `(x.compareTo(y) == 0) == (x.equals(y))`을 지키라는 얘기이다.

실제로 equals와 compareTo의 결과가 다른 BigDecimal 클래스를 통해 어떻게 동작하는지 알아보자.  
```java
@Test
void test() {
    final var one1 = new BigDecimal("1.0");
    final var one2 = new BigDecimal("1.00");

    // equals와 compareTo의 결과가 다르다.
    assertNotEquals(one2, one1);
    assertEquals(0, one1.compareTo(one2));

    final HashSet<BigDecimal> hashSet = new HashSet<>();
    hashSet.add(one1);
    hashSet.add(one2);

    final TreeSet<BigDecimal> treeSet = new TreeSet<>();
    treeSet.add(one1);
    treeSet.add(one2);

    // 동일한 요소를 넣었지만 hashSet과 treeSet의 크기가 다르다.
    assertNotEquals(hashSet.size(), treeSet.size());
    
    // treeSet의 크기는 1이다.
    assertEquals(1, treeSet.size());
    
    // compareTo 메서드를 사용하기 때문에 "1.0"과 "1.00"을 double로 바꾸면 중복이므로 처음 집어넣은 one1만 들어있다. 
    assertEquals(one1, treeSet.first());
    assertNotEquals(one2, treeSet.first());
    
    // 하지만 contains 메서드를 사용하면 내부적으로 compareTo 메서드를 사용하기 때문에 둘 다 포함한다고 나온다.
    assertTrue(treeSet.contains(one1));
    assertTrue(treeSet.contains(one2));
}
```

또한 자식 클래스에 필드를 추가한 경우에는 compareTo 메서드 규약을 지킬 수 없다.  
```java
public class Type implements Comparable<Type> {
    private int number;

    public Type(final int number) {
        this.number = number;
    }

    @Override
    public int compareTo(final Type t) {
        return Integer.compare(number, t.number);
    }
}

public class ChildType extends Type {
    private int number2;

    public ChildType(final int number, final int number2) {
        super(number);
        this.number2 = number2;
    }

    @Override
    public int compareTo(final Type t) {
        var result = super.compareTo(t);
        if(result == 0 && (t instanceof ChildType)) {
            final var child = (ChildType) t;
            result = Integer.compare(number2, child.number2);
        }
        return result;
    }
}
```
위와 같이 부모 클래스 Type과 필드를 추가한 자식 클래스 ChildType이 있다고 해보자.  
이 때 이 클래스들은 compareTo 메서드 규약을 지킬 수 있을까?  
```java
@Test
void test() {
    final var x = new ChildType(3, 2);
    final var y = new Type(3);
    final var z = new ChildType(3, 1);

    // 다음 규약을 준수하는지 검증해봤는데 준수하지 못한다.
    // Comparable을 구현한 클래스는 `x.compareTo(y) == 0`일 때 `sgn(x.compareTo(z)) == sgn(y.compareTo(z))`이다.
    assertEquals(0, x.compareTo(y));
    assertNotEquals(sgn(x.compareTo(z)), sgn(y.compareTo(z)));
}

private int sgn(final int number) {
    if(number > 0) return 1;
    else if(number < 0) return -1;
    return 0;
}
```
따라서 이를 위한 해결 방법은 상속 대신에 컴포지션을 쓰면 된다는 것이다.  
```java
public class ChildType implements Comparable<ChildType> {
    private Type type;
    private int number2;

    public ChildType(final int number, final int number2) {
        type = new Type(number);
        this.number2 = number2;
    }

    // 부모 클래스의 기능을 쓰고 싶다면 이 메서드를 통해 접근하면 된다.
    public Type asType() {
        return type;
    }

    @Override
    public int compareTo(final ChildType child) {
        var result = type.compareTo(child.type);
        result = Integer.compare(number2, child.number2);
        
        return result;
    }
}
```

위의 규약들을 지키지 못한다면 compareTo 메서드를 활용하는 TreeSet, TreeMap, Collections, Arrays 등등과 어울리지 못한다.  
즉, 좁쌀만 한 노력으로 코끼리만 한 큰 효과를 얻는 기회를 상실하게 되는 것이다!  

### 구현
Comparable 인터페이스의 compareTo 메서드를 구현하는 방법은 어렵지 않다.  
equals 처럼 Object를 인자로 받지 않고 타입을 받기 때문에 Type 체크나 형변환이 필요치 않다.  
1. primitive type인 경우에는 **<**, **>**, **=** 등등의 비교 연산자를 쓰기보다는
Wrapper Class의 compare 클래스를 이용하는 게 오류도 줄이고, 코드의 가독성도 높이는 길이다.  
아래와 같이 해당 클래스들은 Comparable 인터페이스를 구현했기 때문이다.  
`public final class Integer extends Number implements Comparable<Integer>`  
1. 참조 클래스 같은 경우에는 재귀적으로 compareTo 메서드를 호출해야한다.  
1. 비교해야할 필드가 여러 개라면 변경 가능성이 높은 필드부터 검사를 해서 성능을 높일 수 있다.  

### Comparator
아래의 경우에 순서를 비교할 때 사용하는 인터페이스이다.

1. Comparable을 구현하지 않은 클래스의 순서를 비교
1. Comparable을 구현한 클래스의 compareTo 메서드 대신에 커스텀한 로직으로 순서를 비교하고 싶은 경우  
   String 클래스의 compareTo 메서드를 보면 아래와 같이 우리가 알고 있는 기본적인 알파벳(혹은 가나다) 순으로 비교하고 있다.
&nbsp;     
      1. 비교하려는 두 문자열이 latin1인지 UTF16인지 Character Set을 비교 후 compareTo 메서드 호출  
      1. 두 문자열의 길이를 구함.  
          1. 두 문자열 중에 길이가 짧은 문자열의 길이까지만 비교(그 이후에는 비교할 문자열이 없으므로 비교가 불가능)  
          1. 비교 대상의 문자열 중 다른 값이 있으면 알파벳(혹은 가나다) 순으로 비교  
      1. 비교 대상의 문자열이 모두 같다면 길이가 짧은 문자열이 더 작다고 판단  
```java
public int compareTo(String anotherString) {
    byte v1[] = value;
      byte v2[] = anotherString.value;
      if (coder() == anotherString.coder()) {
          return isLatin1() ? StringLatin1.compareTo(v1, v2)
                            : StringUTF16.compareTo(v1, v2);
      }
      return isLatin1() ? StringLatin1.compareToUTF16(v1, v2)
                        : StringUTF16.compareToLatin1(v1, v2);
}

public static int compareTo(byte[] value, byte[] other) {
    int len1 = value.length;
    int len2 = other.length;
    return compareTo(value, other, len1, len2);
}

public static int compareTo(byte[] value, byte[] other, int len1, int len2) {
    int lim = Math.min(len1, len2);
    for (int k = 0; k < lim; k++) {
        if (value[k] != other[k]) {
            return getChar(value, k) - getChar(other, k);
        }
    }
    return len1 - len2;
}

public static char getChar(byte[] val, int index) {
    // & 0xff는 unsigned value로 만들기 위함이라고 함.
    return (char)(val[index] & 0xff);
}
```

위의 경우에는 대소문자 비교까지 하고 있는데 우리는 대소문자를 비교하지 않고 싶다면 어떻게 해야할까?  
1. compareTo 메서드를 호출하기 전에 두 문자열을 대문자 혹은 소문자로 변환 후 compareTo 메서드 호출
1. Comparator 인터페이스 사용

여기서는 후자를 다룰 것인데, Comparator는 인터페이스이기 때문에 대소문자를 가리지 않은 Comparator를 만들어도 되지만  
자바에서 기본적으로 이런 기본적인 내용을 구현한 Comparator에 대한 구현체들이 있기 때문에 아래와 같이 해당 클래스를 사용하면 편하다.
`String.CASE_INSENSITIVE_ORDER.compare(string1, string2)` 

또한 자바 8부터는 인터페이스가 디폴트 메서드를 가질 수 있기 때문에 같이 간편한 기능들도 제공한다.  
만약 아래와 같이 integer들을 가진 클래스를 비교한다고 가정했을 때 여태까지는 이렇게 해왔을 것이다.  
```java
public class Type implements Comparable<Type> {
    private int number;
    private int number2;
    private int number3;
    private int number4;

    @Override
    public int compareTo(final Type t) {
        int result = Integer.compare(number, t.number);
        result = result == 0 ? Integer.compare(number2, t.number2) : result;
        result = result == 0 ? Integer.compare(number3, t.number3) : result;
        result = result == 0 ? Integer.compare(number4, t.number4) : result;
        
        return result;
    }
}
```
하지만 Comparator를 사용한다면 아래와 같이 간단하게 만들 수 있다. (약간의 성능 저하가 따라온다고 한다.)
```java
public class Type implements Comparable<Type> {
    private int number;
    private int number2;
    private int number3;
    private int number4;

    @Override
    public int compareTo(final Type t) {
        // 자바의 타입 추론의 한계 때문에 처음에는 타입을 명시해줘야한다.
        // 이렇게 해주는 것만으로 Comparator를 구현한 것이고 이 구현체를 통해 순서를 비교할 수 있다.
        return Comparator.comparingInt((Type t2) -> t2.number)
                         .thenComparingInt(t2 -> t2.number2)
                         .thenComparingInt(t2 -> t2.number3)
                         .thenComparingInt(t2 -> t2.number4)
                         .compare(this, t);
    }
}
```
기본 타입을 비교하는 comparingInt(int보다 작은 short, byte 등등도 이 메서드를 사용), comparingLong, comparingDouble(double 보다 작은 float도 이 메서드 사용)  
등등이 있고, Collection의 순서를 거꾸로 뒤집는 reversed 메서드 등등 편의성을 제공해주는 메서드들이 있다.  
또한 기본 타입 이외에 참조 타입 비교를 위한 comparing 메서드도 제공해준다.  

또한 **값의 차**로 순서를 비교하는 경우에는 정수 오버플로우나 부동 소수점계산 방식에 따라서 오류를 낼 수 있다.  
```java
final Comparator<Object> comparator = new Comparator<>() {
    @Override
    public int compare(final Object o1, final Object o2) {
        return o1.hashCode() - o2.hashCode();
    }
};
```

따라서 직접 값의 차를 이용해 순서를 비교하기 보다는 Wrapper Class에서 제공해주는 compare 메서드를 사용하거나  
```java
final Comparator<Object> comparator = new Comparator<>() {
    @Override
    public int compare(final Object o1, final Object o2) {
        return Integer.compare(o1.hashCode(), o2.hashCode());
    }
};
```

아니면 Comparator에서 제공해주는 메서드를 사용하는 게 더 안전하다.  
```java
final Comparator<Object> comparator = Comparator.comparingInt(Object::hashCode);
```
