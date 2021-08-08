---
title: '(이펙티브 자바 3판) 3장 - 모든 객체의 공통 메서드, clone 재정의는 주의해서 진행해라'
tags:
  - Java
category:
  - Note
  - Java
date: 2018-12-16 21:50:10
---

![](effective-java-ch03-item13-clone-method/thumb.png)

Object 클래스는 인스턴스가 생성 가능한 Concrete class이지만 기본적으로 상속해서 사용하도록 설계됐다고 한다.
(그 이유는 모르겠지만... 그걸 찾으려면 또 이 장의 범위를 넘어서니 나중에 찾아보자.)  
따라서 final이 아닌 메서드([equals](/2018/11/26/effective-java-ch03-item10-equals-method), [hashCode](/2018/12/03/effective-java-ch03-item11-hashCode-method), toString, clone, finalize는)는 모두 메서드 오버라이딩을 염두하고 설계된 메서드이다.  
따라서 해당 메서드를 오버라이딩 할 때는 각 메서드마다 지켜야할 규칙들이 존재한다.  
이 규칙을 지키지 않았을 때 뻑나는 경우가 있다.  
일반적인 클래스들(Collection Framework 등등)은 이러한 규칙들은 지켰겠지~ 하고 작성된 코드들이 많다.  
따라서 위와 같은 규칙을 지키지 않은 채 오버라이딩을 한 클래스를 사용하면 제대로 동작하지 않을 가능성이 존재한다.

## 믹스인 인터페이스
Cloneable이 믹스인 인터페이스라고 책에서 소개하고 있는데 그럼 믹스인 인터페이스는 뭔지부터 살펴보도록 하자.  
아이템 20: 추상 클래스 보다는 인터페이스를 우선하라(130P)를 보면 다음과 같이 정의하고 있다.  
> 믹스인이란 클래스가 구현할 수 있는 타입을 말한다.  
  믹스인을 구현한 클래스에 원래의 '주된 타입' 외에도 특정 선택적 행위를 제공한다고 선언하는 효과를 준다.

간단하게 말하서 믹스인 == 클래스가 구현할 수 있는 **타입(클래스, 함수, 인터페이스 등등)**이다.  
예를 들어서 `Comparable`이란 인터페이스를 토대로 살펴보자.  
```java
public interface Comparable<T> {
    public int compareTo(T o);
}
```

그리고 Point라는 클래스가 있다고 생각해보자.
```java
public class Point {
    int x;
    int y;
    
    public void print() {
        System.out.println(String.format("x: %d\ny: %d", x, y));
    }
}
```

그럼 Point의 믹스인(Point라는 클래스가 구현할 수 있는 타입)은 무엇일까?  
아주 여러가지 믹스인들이 있겠지만 그 중에 하나는 Comparable이라고 말할 수 있다.  
왜냐하면 아래와 같이 Point 클래스를 Comparable 인터페이스(타입)를 구현한 구현체로 만들 수 있기 때문이다.  

```java
public class Point implements Comparable<Point> {
    int x;
    int y;
    
    public void print() {
        System.out.println(String.format("x: %d\ny: %d", x, y));
    }
    
    @Override
    public int compareTo(final Point o) {
        return 0;
    }
}
```

클래스가 구현할 수 있는 타입을 왜 믹스인이라고 부르는 걸까?  
바로 대상 타입(Point)의 주된 기능(점의 위치를 표시, print 메서드)에 선택적 기능(순서를 정함, Comparable)을 `혼합(mixed in)`한다고 해서 믹스인이라고 부른다.  
또한 믹스인에는 함수나 클래스 등등의 타입이 있기 때문에 그냥 믹스인이라고 부르면 헷갈리기 때문에 믹스인 성격을 가진 인터페이스를 `믹스인 인터페이스`라고 부르는 것 같다.  

## Cloneable
Cloneable 인터페이스는 믹스인 인터페이스이다.  
하지만 믹스인의 용도를 제대로 사용하지 않고 있다.  
이유는 Cloneable 인터페이스를 직접 보면 알 수 있다.  
```java
public interface Cloneable {
}
```

위에서 얘기했던 Comparable과의 차이점이 뭘까?  
인터페이스만 있을 뿐, 구현해야하는 메서드가 아무것도 없다.  
믹스인 인터페이스라면 선택적 기능을 제공해야하는데 제공하는 게 아무것도 없다.  
즉, 구현해봤자 아무짝에 쓸모없는 인터페이스처럼 보인다.  
그럼 clone 메서드의 위치는 어디일까?  
바로 쌩뚱맞게도 Object 클래스에 clone 메서드가 있다.  
```java
@HotSpotIntrinsicCandidate
protected native Object clone() throws CloneNotSupportedException;
```
원본 메서드가 감춰져있어서 소스코드를 볼 수는 없지만 일단 객체를 복사해주는 메서드 같아 보인다.  
또 여태까지 살펴봤던 다른 메서드와 달리 protected 메서드이다.  
따라서 아래와 같이 리플렉션을 쓰지 않는 이상은 오버라이딩한 메서드에 접근할 수 있다는 게 보장되지 않는다.  
하지만 리플렉션을 사용한다 하더라도 해당 메서드를 오버라이딩 하지 않은 경우에는 NoSuchMethodException 예외를 던지기 때문에 리플렉션으로도 메서드에 접근할 수 있다는 걸 100% 보장할 수 없다.  
```java
@Test
void copyTest() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
    final var cloneMethod = Point.class.getDeclaredMethod("clone");
    cloneMethod.setAccessible(true);

    final var instance = new Point();
    final var copy = cloneMethod.invoke(instance);
}
```
오버라이딩 할 때 public으로 오버라이딩 할 수 있지만, 실수로라도 protected로 오버라이딩 할 여지가 존재하는 매우 부실한 프로토콜이다.  

그럼 아무짝에 쓸모 없어보이는 Cloneable 인터페이스는 내비두고, Object 클래스의 clone 메서드를 바로 오버라이딩 하면 될 것 같다.  
```java
public class Point {
    private int x;
    private int y;

    public Point(final int x, final int y) {
        this.x = x;
        this.y = y;
    }
    
    // 자바 5에 추가된 covariant return typing(공변 반환 타이핑, 리턴 타입이 서브 클래스의 범위 안에 있으면 된다는 내용) 덕분에 
    // 해당 메서드를 사용하는 사용자가 직접 형변환을 할 필요가 사라졌다.  
    @Override
    public Point clone() {
        return (Point) super.clone();
    }
}
```
공변성(covariant)과 반공변성(contravariant)에 대해서는 이 글의 주제를 넘어서므로 [공변성과 반공변성은 무엇인가?](https://edykim.com/ko/post/what-is-coercion-and-anticommunism/)에 들어가서 보면 된다.  

위 clone 메서드를 보면 public으로 오버라이딩 했고 전부 잘 작성한 것 같은데 컴파일이 안 된다.  
바로 checked exception인 CloneNotSupportedException이 발생하기 때문이다.  
이유는 해당 예외 클래스를 보면 나온다.  
```java
/* Thrown to indicate that the clone method in class Object has been called to clone an object,
 * but that the object's class does not implement the Cloneable interface.
 */
```
clone 메서드가 호출 됐는데 클래스가 Cloneable 인터페이스를 구현하지 않았을 때 던지는 예외란다.  
아무런 쓸모도 없어보이던 녀석이 드디어 쓸모가 있어보인다.  
그럼 위 예외를 없애버리기 위해 Cloneable 인터페이스를 구현해보자.  
```java
public class Point implements Cloneable {
    private int x;
    private int y;

    public Point(final int x, final int y) {
        this.x = x;
        this.y = y;
    }
    
    @Override
    public Point clone() {
        return (Point) super.clone();
    }
}
```
Cloneable 인터페이스는 아무런 메서드가 없기 때문에 구현해야할 것도 아무것도 없다.  
하지만 이럼에도 불구하고 컴파일은 되지 않고, CloneNotSupportedException이 발생한다.  
따라서 다소 귀찮지만 아래와 같이 처리를 해주어야한다.  

```java
public class Point implements Cloneable {
    private int x;
    private int y;

    public Point(final int x, final int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public Point clone() {
        try {
            return (Point) super.clone();
        } catch (final CloneNotSupportedException e) {
            // Cloneable 인터페이스를 구현한 이상 이 코드는 절대 실행되지 않는다.
            throw new AssertionError();
        }
    }
}
```
위와 같은 불편함을 초래하기 때문에 CloneNotSupportedException은 unchecked exception으로 만들었으면 더 좋았을 것 같다.  
unchecked exception이었다면 Cloneable 인터페이스를 구현하지 않은 경우에는 런타임 에러를 뱉겠지만, 
checked exception으로 만들어버려서 정상적으로 인터페이스를 구현한 경우에도 모두 불필요한 코드를 추가해야하는 불편함을 감수해야한다.  
또한 Cloneable 인터페이스는 특정 클래스(Object)의 메서드(clone) 동작 방식을 결정한다는 아주 요상한 방식이니 절대 따라하면 안 되고 따라하기 힘들 것 같다.  
우리가 위에서 선언한 clone 메서드는 `super.clone()`라는 코드로 인해 부모 클래스인 Object의 clone메서드의 결과값을 반환하는데  
그 객체의 필드들을 하나하나 복사한 객체를 반환한다.  
물론 primitive type만 제대로 복사하는 shallow copy이다. 
참조 타입은 reference value를 복사하기 때문에 불변 객체가 아닌 이상은 직접 deep copy를 구현해줘야한다.  

Object.clone() 메서드의 명세서에 적혀있는 규약을 정리해보자면 다음과 같다.  
* x.clone() != x;
* x.clone().getClass() == x
* x.clone().equals(x)
* 이 메서드가 반환하는 객체는 super.clone()을 호출해서 얻어야한다.  
* 하지만 위 조건이 모두 **필수는 아니다**. 즉, 권장사항일 뿐이며 **선택사항**이다.

하지만 우리는 `super.clone()`, 즉 Object 클래스의 clone 메서드를 신뢰하지 못해서 아래와 같이 직접 생성자를 사용해서 객체를 복사한다고 가정해보자.  
```java
// Object의 clone 메서드를 호출하는 게 아니므로 CloneNotSupportedException을 던지지 않기 때문에 Cloneable 인터페이스를 구현할 필요가 없다.
public class Point {
    private int x;
    private int y;

    public Point(final int x, final int y) {
        this.x = x;
        this.y = y;
    }
    
    @Override
    public Point clone() {
        // 좀 더 메서드가 깔끔해진 것 같다.
        return new Point(this.x, this.y);
    }
    
    // 실제로 객체가 잘 복사됐는지 비교하기 위해 equals 메서드를 오버라이딩
    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        
        final var point = (Point) o;
        if(this.x != point.x) return false;
        if(this.y != point.y) return false;
        
        return true;
    }
}
```
테스트 코드를 통해 객체가 제대로 복사가 됐는지 알아보자.  

```java
@Test
void testClone() {
    final var point = new Point(1, 2);
    final var clone = point.clone();

    // 내부적으로 동일 연산자를 통해 다른 인스턴스인지 비교 
    assertNotSame(point, clone);
    
    // 클래스 정보도 똑같다.
    assertEquals(point.getClass(), clone.getClass());
    
    // 내부적으로 동등 연산자인 equals 메서드를 통해 논리적 동치성을 보장하는지 비교
    assertEquals(point, clone);
}
```

이번엔 Point 클래스를 상속하는데 super.clone 메서드를 사용하는 클래스가 있다고 가정해보자. 
```java
public class ColorPoint extends Point {
    private String color;

    public ColorPoint(final int x, final int y, final String color) {
        super(x, y);
        this.color = color;
    }

    @Override
    public Object clone() {
        // java.lang.ClassCastException을 유발한다.
        // super.clone() 메서드로 얻어온 메서드의 반환 타입은 Point 생성자를 통해 생성된 Point 클래스 인스턴스이다. 
        // 부모 클래스를 가지고 자식 클래스로 형변환 했을 때 자식 클래스에 필요한 필수 필드들이 들어가있지 않을 가능성이 존재해서
        // 변환된 클래스가 제대로 작동하리란 보장이 없기 때문에 위와 같이 예외를 던지는 게 아닐까?
        // 따라서 형 변환을 할 수 없기 때문에 자식 클래스에서 필드가 추가된 경우에는 제대로 clone 조차 하지 못한다.
        // return (ColorPoint) super.clone();
        return super.clone();
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (!(o instanceof ColorPoint)) return false;
        if (!super.equals(o)) return false;

        final var colorPoint = (ColorPoint) o;
        return Objects.equals(color, colorPoint.color);
    }
}
```

그럼 다시 테스트 클래스를 통해 올바르게 복사가 됐는지 확인해보자.  
```java
@Test
void testColorClone() {
    final var colorPoint = new ColorPoint(1, 2, "red");
    final var clone = colorPoint.clone();

    // 내부적으로 동일 연산자를 통해 다른 인스턴스인지 비교
    assertNotSame(colorPoint, clone);

    // 클래스 정보도 부모의 생성자를 통해서 만들었기 때문에 자식 클래스의 정보를 가지지 못한다.
    assertNotEquals(colorPoint.getClass(), clone.getClass());

    // 내부적으로 동등 연산자인 equals 메서드를 통해 논리적 동치성을 보장하는지 비교하는데 red는 제대로 복사되지 않았음
    assertNotEquals(colorPoint, clone);
}
```
자식 클래스를 구현할 필요 없는 final 클래스 등등의 경우에는 상관 없겠지만 위와 같은 사유 때문에 웬만하면 Object.clone() 메서드 명세서의 규약은 준수하는 게 좋다.

그럼 가변 객체가 있을 때는 어떻게 구현해야할까?  
우선 간단하게 배열을 필드로 가지고 있는 객체를 예로 들어보자.  
```java
public class Type implements Cloneable {
    private int number;
    private Type[] children;

    public Type(final int number, final Type[] children) {
        this.number = number;
        this.children = children;
    }

    public int getNumber() {
        return number;
    }

    public void setNumber(final int number) {
        this.number = number;
    }

    public Type[] getChildren() {
        return children;
    }

    public void setChildren(final Type[] children) {
        this.children = children;
    }
    
    @Override
    public Type clone() {
        try {
            return (Type) super.clone();
        } catch (final CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (!(o instanceof Type)) return false;

        final var type = (Type) o;
        if(this.number != type.number) return false;
        if(!Arrays.equals(this.children, type.children)) return false;
        return true;
    }
}
```

그럼 clone 메서드가 우리가 생각하는대로 동작하는지 알아보자.  
```java
@Test
void test() {
    final var original = new Type(3, new Type[]{new Type(1, null), new Type(2, null)});
    final var clone = original.clone();

    // 원본 객체에서 첫 번째 자식을 다른 자식으로 대체
    original.getChildren()[0] = new Type(4, null);

    // clone과 original이 완전 독립된 객체라면 이 테스트는 통과해선 안 된다.
    assertEquals(original, clone);
}
```
우리가 의도한 대로 동작하지 않음(둘이 완전히 독립된 객체이길 원함)을 볼 수 있다.  
그렇다면 우리의 의도대로 동작하게 끔 clone 메서드를 변경해보자.

```java
@Override
public Type clone() {
    try {
        final var clone = (Type) super.clone();

        // 배열의 clone 메서드는 공변 반환 타이핑도 제대로 적용했고 unchecked exception인 CloneNotSupportedException도 제대로 처리한 유일한 예라고 책에서 설명하고 있다.
        // 하지만 가변 객체를 참조하는 필드는 final로 선언하라는 용법과는 상반된다.  
        // final로 선언해도 완전 불변 객체를 만드는 것은 아니지만 적어도 레퍼런스 값이 바뀌는 경우는 막을 수 있으니까 final로 선언하라는 용법이 있는 것으로 알고 있는데
        // 이 용법을 사용하면 가변 객체의 clone을 할당할 수 없다.
        clone.children = this.children.clone();
        return clone;
    } catch (final CloneNotSupportedException e) {
        throw new AssertionError();
    }
}
```
이렇게 변경했다면 위 테스트는 통과하지 못하고 `assertNotEquals(original, clone);`와 같이 변경해야 테스트를 통과시킬 수 있고 우리의 의도대로 동작한다.  

하지만 이마저도 얕은 복사이고 아래의 경우에는 객체의 완벽한 독립을 보장하지 못한다.  
```java
@Test
void test() {
    final var original = new Type(3, new Type[]{new Type(1, null), new Type(2, null)});
    final var clone = original.clone();

    // 자식을 재할당하는 게 아니라 자식의 필드를 변경
    original.getChildren()[0].setNumber(2);

    // clone과 original이 완전 독립된 객체라면 이 테스트는 통과해선 안 된다.
    assertEquals(original, clone);
}
```
  
아래와 같이 재귀를 통해 깊은 복사를 하면 우리가 원하는 문제를 해결할 수 있다.  
```java
@Override
public Type clone() {
    try {
        final var clone = (Type) super.clone();

        // 배열의 clone 메서드는 공변 반환 타이핑도 제대로 적용했고 unchecked exception인 CloneNotSupportedException도 제대로 처리한 유일한 예라고 책에서 설명하고 있다.
        clone.children = childrenDeepCopy(clone.children);
        return clone;
    } catch (final CloneNotSupportedException e) {
        throw new AssertionError();
    }
}

private Type[] childrenDeepCopy(final Type[] parent) {
    final var shallowClone = parent.clone();
    return Arrays.stream(shallowClone)
                 .map(origin -> new Type(origin.number, origin.hasChildren() ? childrenDeepCopy(origin.children) : null))
                 .toArray(Type[]::new);
}

private boolean hasChildren() {
    return children != null && children.length != 0;
}
```

하지만 재귀 함수의 단점은 자식의 깊이가 깊을 수록 재귀 호출을 통해 스택 프레임을 사용하기 때문에 스택 오버플로우를 유발할 수도 있다는 점이다.  
따라서 깊은 복사는 반복을 통해 풀 수 있다면 반복으로 푸는 것이 좋다.  

또한 상속용으로 설계된 부모 클래스에서 clone을 재정의할 경우, 해당 메서드에서는 다른 재정의 가능한 메서드를 호출하면 안 된다.  
이유는 자식 클래스에서 clone을 재정의 했을 경우 연쇄적으로 `super.clone();`을 호출하기 때문에 부모의 clone 메서드를 호출하게 된다.  
그 과정에서 부모의 clone 메서드에서 재정의 가능한 어떤 메서드를 호출한다면 부모 클래스의 메서드를 호출하는 게 아니라 자식 클래스에서 재정의한 메서드를 호출하기 때문이다.  
정확하게 어떻게 예를 들어야할지 모르겠다... (다소 억지스러운 것들 밖에 안 떠올라서...)

위와 같은 오동작을 불러일으킬 수 있기 때문인지 책(84P)에서는 상속해서 쓰기 위한 클래스 설계 방식 두 가지
(재정의 할 수 있는 메서드들을 내부적으로 어떻게 이용하는지 문서로 남긴 클래스,  
내부 동작 과정 중간에 끼어들 수 있는 hook을 잘 선별하여 protected 메서드 형태로 공개한 클래스)  
에서도 Cloneable 구현 자체를 하지 말라고 하고 있다.  
clone 메서드를 깊은 복사까지 구현만 해놓고 Cloneable 인터페이스는 구현하지 않아서 하위 클래스에게 Cloneable 구현 여부를 선택하게 끔 하거나,  
아래와 같이 clone 메서드를 재정의하는데 하위 클래스에서 재정의하지 못하게 하는 것이다.  
```java
@Override
public Type clone() throws CloneNotSupportedException {
    // 자식 클래스에서는 super.clone()을 통해 clone 메서드를 재정의 하니까 무조건 부모 클래스의 clone 메서드를 호출하게 돼있다.
    throw new CloneNotSupportedException();
}
```

또한 clone 메서드는 동기화(멀티 쓰레드로 돌아가는 환경에서 공유 자원에 대해 일관성 유지)도 고려돼있지 않기 때문에 동기화도 적절히 해줘야한다.

이러한 허술한 메커니즘 기반인 clone 보다는 아래와 같은 방법 중 하나를 추천한다.  
```java
// 복사 생성자
public Type(final Type type) { ... }

// 복사 팩터리 (복사 생성자를 모방한 정적 팩터리)
public static Type newInstance(final Type type) { ... }
```

위와 같은 방법을 쓰면 허술한 메커니즘 뿐만 아니라 불필요한 checked exception 처리, final 필드 용법, 형변환 등등에서 자유로워 질 수 있다.  
또한 인자로 해당 클래스가 구현한 인터페이스 타입도 받을 수 있기 때문에 원본 클래스의 타입에 얽매이지 않고 사용할 수도 있다는 장점이 존재한다.   