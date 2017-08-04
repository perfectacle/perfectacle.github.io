---
title: (Java) 자바의 정석 3판 011일차 - 상속과 포함, 오버라이딩, super, 패키지와 클래스, 접근 지정자
category: [Note, Java]
tag: [Java, 자바의 정석, OOP]
date: 2017-08-01 18:30:01
---

![](thumb.png)

## 연습문제 실수
* 기존의 코드를 재사용할 수 있으면 하자.  
```java
public class SutdaCard {
    int num = 0;
    boolean isKwang = false;
    SutdaCard() {
        // 이 한줄로 커버 되고 이래야 유지보수 측면에서도 용이하다.
        this(1, true);
        // num = 1;
        // isKwang = true;
       
    }
    SutdaCard(int num, boolean isKwang) {
        this.num = num;
        this.isKwang = isKwang;
    }
}
```

* 형변환
10f와 10.0f는 동일하니 쓸 데 없는 .0을 안 찍도록 하자.

* 지역변수
```java
public static void main(String[] args){
  
}
```
args도 지역변수다.  
또한 main은 **변수**가 아니라 **(클래스) 메소드**이다.  
자바스크립트에서는 함수를 변수에 담을 수 있어서 함수도 변수의 범주 안에 속하고,  
함수와 메소드가 유사한 측면을 갖고 있다보니 main 메소드도 static 키워드를 썼으므로 클래스 변수인 줄 알았는데 아니었다.  

* String vs StringBuffer
```java
public class Test {
    static void change(String str) {
        str += "456";
    }

    static void change(StringBuffer str) {
        str.append("456");
    }

    public static void main(String[] args) {
        String str = "ABC123";
        System.out.println(str); // ABC123
        change(str);
        System.out.println("After change:"+str); // ABC123
        StringBuffer str2 = new StringBuffer("ABC123");
        System.out.println(str2); // ABC123
        change(str2);
        System.out.println("After change:"+str2); // ABC123
    }
}
```
String 클래스는 참조타입임에도 불구하고 내용을 변경할 수 없기 때문에 ABC123456이라는 새로운 변수를 지역변수 str에 만들고  
메소드 종료와 더불어 해당 지역변수도 날아가서 원하는 결과가 나오지 않는다.  
따라서 원하는 결과를 얻어내려면 return으로 반환 값을 받아오거나 StringBuffer 클래스를 이용해야한다.  
 
## 상속
생성자와 초기화 블럭은 상속되지 않고, 멤버(변수, 메소드)만 상속된다.  
접근 지정자가 private 또는 default는 상속은 받되, 자식 클래스에서 직접적인 접근이 불가능하다.  

## 포함(Composite)
```java
class Point {
    int x, y;
}
class Circle {
    //int x, y, r;
    Point p = new Point();
    int r;
}
```

이렇게 단위별로 클래스를 여러 개로 쪼개면 조합해서 사용할 수도 있어서 유지보수(재사용성, 적은 변경사항) 측면에서 뛰어나다.  


## extends vs composite
* 원은 점이다. - Circle is a Point, 상속(extends)  
* **원은 점을 가지고 있다. - Circle has a Point, 포함(composite)**

## toString() 메소드
```java
class Card {
    public String toString() {
        return "asdf";
    }
    public static void main(String[] args){
      Card c = new Card();
      System.out.println(c.toString()); // "asdf"
      System.out.println(c); // "asdf"
      System.out.println("qwer" + c); // "qwerasdf"
    }
}
```
java.lang.Object 클래스에 있는 메소드를 오버라이딩한 것이다.  
모든 객체(클래스, 인스턴스)는 Object 클래스를 상속 받는다.  

## 단일 상속(single inheritance)
또 다른 객체지향 언어인 C++에서는 다중 상속을 허용하지만, 자바는 그렇지 않다.  
다중 상속을 하면 복합적인 기능을 가진 클래스를 쉽게 작성할 수 있다는 장점이 존재하지만,  
클래스 간의 관계가 복잡해질 수 있고, 다른 클래스로부터 상속받은 멤버간의 이름이 같으면 구별할 수 있는 방법이 없다.  
static 멤버야 클래스 이름을 붙여서 구분이 가능하지만 인스턴스 멤버는 그렇지 않다.  
다중 상속의 장점을 포기했지만, 그럼으로 인해서 클래스 간의 관계가 명확해지고 코드의 신뢰도가 올라간다는 장점이 존재한다.  

물론 아래와 같이 다중 상속을 흉내낼 수 있다.
```java
class TV {
    boolean power;
    int channel;
    
    void power(){}
    void channelUp(){}
    void channelDown90(){}
}

class VCR {
    boolean power;
    int counter;

    void power(){}
    void play(){}
    void stop(){}
    void rew(){}
    void ff(){}
}

class TVCR extends TV {
    VCR vcr = new VCR();
    int counter = vcr.counter;
    
    void play() {
        vcr.play();
    }
    void stop() {
        vcr.stop();
    }
    void rew() {
        vcr.rew();
    }
    void ff() {
        vcr.ff();
    }
}
```

1. TVCR은 TV이다. (상속)  
2. TVCR은 VCR을 가지고 있다. (포함)

위 관계를 잘 활용하면 다중 상속과 같은 효과를 낼 수 있다.  
TVCR.play는 사실 VCR 클래스의 play 메소드를 실행하고 있다.  

## 오버라이딩(overriding)
발음상 overwrite(오버라이트)와 override(오버라이드)가 비슷하다.  
따라서 override는 덮어쓴다고 생각하면 될 것 같다.  
**부모 클래스의 메소드를 재정의**하는 것이다.

조건은 아래와 같다.  
1. 이름이 같아야한다.  
2. 매개변수가 같아야한다.  
3. 반환타입이 같아야한다.  
Java5부터는 자손 클래스의 타입으로 변경하는 것이 가능하게 되었다.  
covariant return type이라고도 부른다.(공변, 함께 변하는 이라는 뜻)  

즉 선언부는 아예 일치해야한다는 뜻이다.  
하지만 접근 지정자와 예외 처리는 예외이다.

* 부모 클래스 보다 접근 지정자가 넓어야한다. 보통은 같은 걸 쓴다.
```java
public class Parent {
    protected void a(){}
}

class Child extends Parent {
    protected void a(){}
    // private가 protected 보다 범위가 좁아서 오류가 난다.
    // private void a(){} 
}
```

* 부모 클래스보다 예외 처리할 수 있는 경우가 적어야한다.
```java
public class Parent {
    protected void a() throws IOException, SQLException {}
}

class Child extends Parent {
    protected void a() throws IOException {}
    // 단순 갯수의 문제가 적어야하는 게 아니라 경우의 수의 문제이다.
    // Exception은 모든 예외의 경우를 커버하므로 경우의 수가 부모보다 훨씬 많다.
    // protected void a() throws Exception {}
}
```

* 인스턴스 메소드 <-> static 메소드가 불가능하다.  
또한 부모 클래스의 static 메소드를 자식 클래스에서 static 메소드로 선언하는 것은 각 클래스에 별개의 static 메소드를 선언하는 것이므로 오버라이딩은 아니다.  

## 오버로딩 vs 오버라이딩
1. 오버로딩(new): 기존에 없던 새로운 메소드(이름만 같은)를 선언하는 것  
2. 오버라이딩(modify): 상속받은 메소드를 수정하는 것

## super vs this
this가 인스턴스 자기 자신을 가리키는 참조 변수이듯, super는 상속받은 부모 인스턴스를 가리키는 참조 변수이다.
```java
class Parent {
    int x = 10;
}

class Child extends Parent {
    void method() {
        System.out.println("x="+x); // 10
        System.out.println("this.x="+this.x); // 10
        System.out.println("super.x="+super.x); // 10
    }
}

class Test {
    public static void main(String[] args) {
        Child c = new Child();
        c.method();
    }
}
```
읭? 뭐지? 싶으면 아래를 보자.  
```java
class Parent {
    int x = 10;
}

class Child extends Parent {
    int x = 20;
    void method() {
        System.out.println("x="+x); // 20
        System.out.println("this.x="+this.x); // 20
        System.out.println("super.x="+super.x); // 10
    }
}

class Test {
    public static void main(String[] args) {
        Child c = new Child();
        c.method();
    }
}
```
매개변수와 인스턴스 변수를 구분할 때 this를 썼 듯이,  
부모 인스턴스 변수와 자식 인스턴스 변수를 구분할 때 super를 사용하면 유용하다.  
물론 변수 뿐만 아니라 메소드도 가능하다.  

```java
public class Point {
    int x, y;
    String getLocation() {
        return "x: " + x + ", y: " + y;
    }
}

class Point3D extends Point {
    int z;
    String getLocation() {
        // return "x: " + x + ", y: " + y + ", z: " + z;
        return super.getLocation() + ", z: " + z;
    }
}
```

## this() vs super()
this()는 같은 클래스 내의 생성자를 호출하기 위해 사용하는 데 비해,  
super()는 부모 클래스의 생성자를 호출하기 위해 사용된다.  
this와 마찬가지로 super도 제일 첫 줄에 호출해야하는데  
자식 클래스가 부모 클래스의 멤버를 사용했을 수도 있으므로
먼저 부모 클래스의 생성자를 호출해서 멤버들을 초기화시켜야한다.  
자식 생성자에서 다른 생성자(super()나 this())가 없는 경우에는 컴파일러가 자동으로 super()를 삽입한다.

```java
class Test {
    public static void main(String[] args) {
        Point3D p = new Point3D(1, 2, 3);
        System.out.println(p.x + ", " + p.y + ", " + p.z); // 1, 2, 3
    }
}

// 아무것도 상속받지 않으면 컴파일러가 자동적으로 extends Object를 붙여준다.
// 그래서 equals()나 toString() 같은 메소드는 모든 클래스에서 사용이 가능한 것이다.
public class Point {
    int x, y;
    Point(int x, int y) {
        // super();
        // 여기에도 마찬가지로 다른 생성자(this()나 super())가 없으므로 자동으로 super()가 삽입된다.
        // 아마 최상위 부모인 Object까지 타고 가지 않을까 싶다.
        this.x = x;
        this.y = y;
    }
}

class Point3D extends Point {
    int z;
    Point3D(int x, int y, int z) {
        // super()가 자동으로 삽입되지만 부모 클래스에는 Point() 생성자는 없고 Point(int x, int y) 생성자만 존재한다.
        // this.x = x;
        // this.y = y;
        super(x, y);
        this.z = z;
    }
}
```

따라서 Point3D 클래스의 인스턴스의 생성 순서는 다음과 같다.  
1. Point3D(int x, int y, int z)  
2. Point(int x, int y)  
3. Object()

## 패키지와 클래스  
클래스: 물리적으로 하나의 파일(*.class)  
패키지: 물리적으로 하나의 디렉토리  
java.lang.String -> java 패키지(디렉토리) 안에 lang 패키지(디렉토리) 안에 String 클래스(파일)  
패키지(디렉토리)가 다르면 클래스(파일)명은 같아도 된다.  

모든 클래스는 반드시 패키지 안에 속해야하며 패키지를 명시하지 않으면 default package로 같은 패키지 안에 속하게 된다.  

## import
import 문은 다른 패키지에 있는 클래스를 사용할 때 패키지 명을 붙이지 않고 사용할 수 있게 해준다.  
```java
import java.util.Scanner;

public class Test2 {
    java.util.Scanner sc = new java.util.Scanner(System.in); 
}

class Test4 {
    Scanner sc = new Scanner(System.in);
}
```

import 문을 많이 쓰거나 import java.util.\* 처럼 \*을 썼다고 해서 실행할 때 퍼포먼스 상 차이는 없다.  
단지 컴파일 시간이 조금 더 오래 걸릴 뿐이다.  
하지만 \*을 쓰면 어떤 패키지의 클래스인지 구분하기 어려울 때가 있다.  
또한 \*은 클래스에만 매칭되지 하위 패키지까지 매칭되는 것은 아니다.  

```java
// 이렇게 하면 java 패키지의 클래스만 매칭되지  
// java 패키지 내부에 있는 util 패키지까지 import 되는 것은 아니다.  
import java.*;
```

**같은 패키지 내의 클래스들은 import 없이도 사용이 가능하다!**

또한 System이나 String 클래스는 어떻게 패키지를 import하지 않고도 사용이 가능했던 걸까?  
같은 패키지 내의 클래스는 import 없이 사용 가능하다는데 그럼 모든 패키지에는 System이나 String 과 관련된 패키지가 삽입된 걸까?  
```java
// 컴파일러가 자동적으로 아래와 같은 import 문을 삽입해주기 때문이다.
// 해당 패키지의 클래스들은 매우 빈번하게 사용하기 때문이다.
import java.lang.*;
```

## static import 문
import를 하면 패키지명을 생략할 수 있듯이  
static 키워드를 사용하면 클래스명을 생략할 수 있다.  
단 export 한 녀석은 public static이어야한다.   
```java
import static java.lang.System.out;
import static java.lang.Math.random;
// 아래와 같이 하면 Math 클래스의 모든 public static 메소드(random, ceil, abs 등등)에서 Math 클래스를 생략 가능하다.  
// import static java.lang.Math.*;

class Test2 {
    public static void main(String[] args) {
        // System과 Math가 생략이 가능해졌다.
        out.println(random());
    }
}
```
그냥 import는 package.\*로 해서 모든 클래스들을 불러와서 패키지 명을 생략가능하게 했다면  
static import는 package.class.\*로 해서 클래스 내의 모든 멤버를 불러와서 클래스 명을 생략 가능하게 했다고 알아두면 될 것 같다.   

## 클래스 멤버 vs 인스턴스 멤버  
멤버: 변수, 메소드  
클래스 멤버는 static 멤버라고도 부른다.  
인스턴스 멤버를 사용하지 않는 인스턴스 메서드는 static 메서드로 바꾸는 걸 고려해보자.  

다음과 같은 장점이 있다.  
1. 클래스가 메모리에 로드될 때 단 한번만 수행된다.  
2. 인스턴스를 생성하지 않고 호출이 가능하다.  
3. 더 편리하고 속도도 더 빠르다.  

## final
* 변수 -> 상수로 만들어버림.  
* 메소드 -> 오버라이딩이 불가능해짐.  
* 클래스 -> 상속받지 못하는 클래스가 됨.  

예외로 인스턴스 변수는 상수로 선언만 했을 때는 생성자 함수에서 초기화가 가능하다.  
그 이유는 생성자 함수에서 초기화가 불가능하다면 모든 인스턴스마다 같은 인스턴스 상수를 갖게 될 것이기 때문이다.  
인스턴스 상수도 일단은 인스턴스 변수이니 인스턴스마다 다른 값을 가져야 의미가 있는 것이지 다 같은 값을 가지면 static 변수와 큰 차이점이 없게 된다.  

```java
class Test2 {
    final int x;
    final int y = 10;
    Test2() {
        x = 10; // 초기화 되지 않은 상수를 초기화 시켜주지 않고 방치하면 오류가 발생한다.
        // y = 20; 초기화만 가능하지 재할당은 불가능하다.
    }
    void a() {
        // x = 22; 생성자 함수 이외에는 불가능하다.
    }
}
```

## 접근 지정자
| 제어자    | 같은 클래스 | 같은 패키지 | 자식 클래스 | 전체 |
|-----------|-------------|-------------|-------------|------|
| public    | O           | O           | O           | O    |
| protected | O           | O           | O           | X    |
| (default) | O           | O           | X           | X    |
| private   | O           | X           | X           | X    |

| 대상     | 사용 가능한 접근 지정자               |
|----------|---------------------------------------|
| 클래스   | public, (default)                     |
| 멤버     | public, protected, (default), private |
| 지역변수 | 없음                                  |

접근 지정자를 사용하는 이유는 다음과 같다.  
1. 외부로부터 데이터를 보호하기 위해서  
2. 외부에는 불필요하고 내부적으로만 사용하는 부분들을 감추기 위해서  
이러한 것들을 캡슐화(encapsulation)이라고 부른다.  
데이터가 유효한 값을 유지하고, 비밀번호 같은 데이터를 외부에서 함부로 변경하지 못하게 하기 위함.  
이렇게 접근 범위를 축소해나가다 보면 테스트를 할 때도 다른 패키지들을 다 커버할 필요없이 해당 코드가 접근 가능한 부분들만 테스트하면 되니 유지보수 측면에서도 용이하다.  
또한 getter와 setter를 써서 변수의 유효성 검사도 할 수 있다.  

```java
public class Time {
    private int hour;

    public int getHour() {
        return hour;
    }

    public void setHour(int hour) {
        if(hour > 0 && hour < 24) this.hour = hour;
    }
}

class TimeTest {
    public static void main(String[] args) {
        Time t = new Time();
        // t.hour = 25; 접근지정자가 없으면 유효한 시간 값인지 검사할 방법이 없다.
        t.setHour(25);
        System.out.println(t.getHour()); // 0
        t.setHour(11);
        System.out.println(t.getHour()); // 11
    }
}
```

또한 생성자에 접근 제어자를 사용하면 [싱글톤 패턴](https://blog.seotory.com/post/2016/03/java-singleton-pattern)을 구현할 수 있다.  
싱글톤: 해당 클래스의 인스턴스가 하나만 만들어지고, 어디서든지 그 인스턴스에 접근할 수 있도록 하기 위한 패턴.  

```java
// 싱글톤 객체는 상속이 불가능하다.
// 왜냐하면 자식 클래스에서 부모 클래스의 생성자 호출이 불가능하기 때문이다.
// 따라서 명시적으로 final 키워드를 붙여서 상속이 불가능한 클래스라는 것을 표기해주는 게 좋다.
public final class Singleton {
    private static Singleton s = new Singleton();
    private Singleton() {
        System.out.println(11);
    }
    public static Singleton getInstance() {
        return s;
    }
}

class SingletonTest {
    public static void main(String[] args) {
        // Singleton s = new Singleton(); private이므로 다른 클래스에서 생성자에 접근 불가
        // 클래스의 인스턴스를 얻으려면 이미 static 변수에 저장된 동일한 인스턴스만 불러오면 된다.
        Singleton s = Singleton.getInstance();
        System.out.println(s);
    }
}
```

또한 다음과 같은 주의사항이 있다.  
1. 메소드에 static과 abstract를 함께 사용할 수 없다.  
abstract는 몸통이 없는 불완전한 애이고, static은 클래스가 로딩되자마자 메모리에 적재되므로  
구현이 안 된 애를 메모리에 적재할 수는 없다.  
2. 클래스에도 abstract와 final을 함께 사용할 수 없다.  
abstract는 선언부만 던져주고 상속받아서 알아서 구현하라는 키워드인데  
final 키워드를 붙여 상속이 불가능하게 만들면 모순되는 말이다.  
3. 메소드에 abstract와 private를 함께 사용할 수 없다  
abstract는 선언부만 던져주고 상속받아서 알아서 구현하라는 키워드인데  
private 키워드는 그 상속받은 자식 클래스에서 조차 접근이 불가능하므로 모순되는 말이다.  
4. 메소드에 private과 final을 같이 사용할 필요는 없다.  
private인 메소드는 자식에서도 접근이 불가능하기 때문에 오버라이딩 될 수 없다. 이미 둘 다 같은 역할을 하기 때문에 하나만 사용하면 된다.  