---
title: (Java) 자바의 정석 3판 012일차 정리
category: [Note, Java]
tag: [Java, 자바의 정석]
date: 2017-08-02 11:35:34
---
![](thumb.png)

## 다형성(Polymorphism)  
객체지향 개념에서 다형성이란 **여러 가지 형태를 가질수 있는 능력**을 의미함.  
자바에서는 한 타입의 참조 변수로 여러 타입의 객체를 참조할 수 있도록 함으로써 다형성을 프로그램적으로 구현함.  

```java
public class TV2 {
    boolean power;
    int channel;
    
    void power(){}
    void channelUp(){}
    void channelDown(){}
}

class CaptionTV extends TV2 {
    String text;
    void caption(){}
}

class Test4 {
    public static void main(String[] args) {
        TV2 t = new TV2();
        CaptionTV c = new CaptionTV();
        TV2 t2 = new CaptionTV();
        
        System.out.println(c.text);
        // System.out.println(t2.text); TV2에 생성된 것만 참조 가능.
        // CaptionTV c2 = new TV2(); CaptionTV보다 TV2가 가진 멤버가 더 적어서 생성 불가능.
    }
}
```

다음과 같은 특성을 지닌다.  
`참조변수 a = new 인스턴스타입()` 을 기준으로 설명한다.
1. 기본적으로는 참조변수와 인스턴스의 타입이 일치하는 걸 많이 쓴다.  
2. 참조 변수 보다 인스턴스 타입의 멤버가 더 범위가 넓어야한다.  
`TV2 t2 = new CaptionTV();`
참조변수: 부모, 인스턴스 타입: 자식 -> 가능, 부모의 멤버만 참조가 가능하다.  
`CaptionTV c2 = new TV2();`
참조변수: 자식, 인스턴스 타입: 부모 -> 불가능, 참조변수의 멤버를 모두 충족하지 못한다.  

그럼 `TV2 t = new TV2();`와 `TV2 t = new CaptionTV();` 차이점이 궁금할텐데 차차 보도록 하자.  

## 참조 변수의 형변환(Casting)
기본값과 마찬가지로 참조타입도 형변환이 가능하다.  
하지만 제약이 있는데 상속 관계에 있는 녀석들끼리만 가능하다.  
또한 부모의 부모로 형변환도 가능하므로 모든 클래스는 Object 클래스를 상속 받고 있으므로 Object 클래스로 형변환이 가능하다.  
참조 변수의 캐스팅의 특징은 다음과 같다.  
1. 자식 -> 부모(Up-casting): 형변환 생략 가능  
자식이 부모의 모든 걸 상속 받았으므로 자식이 더 범위가 넓다고 판단하여 손실이 없다고 판단하는지 형변환의 생략이 가능하다.  
2. 부모 -> 자식(Down-casting): 형변환 생략 불가능  

우리 눈으로 보기에는 형제 관계도 있을 것 같은데 자바에서는 형제 관계가 존재하지 않아 형제 사이에 형변환은 불가능하다.  
그럼 `TV2 t = new TV2();`와 `TV2 t = new CaptionTV();` 차이점을 알아보자.  
사실 `TV2 t = new CaptionTV();`는 다음을 줄인 것이다.  
`TV2 t = (TV2)new CaptionTV();` 업 캐스팅이므로 형변환이 생략돼있던 것이다.  
이걸 또 풀어쓰면 다음과 같다.  
1. `CaptionTV c = new CaptionTV();`
2. `TV2 t = (TV2)c`  
역시 업캐스팅이므로 TV2는 생략이 가능하다.  

그럼 위와 같은 차이점으로 인해 무엇이 달라진단 말인가?  
아래의 예제를 살펴보자.  
```java
public class TV2 {
    boolean power;
    int channel;

    void power(){}
    void channelUp(){}
    void channelDown(){}
}

class CaptionTV extends TV2 {
    String text;
    void caption(){}
}

class Test4 {
    public static void main(String[] args) {
        TV2 t = new TV2();
        TV2 t2 = new CaptionTV();
        // t는 TV2 인스턴스여서 TV2의 멤버만 가지고 있으므로 CaptionTV 타입을 커버할 수가 없다.
        // 컴파일 시에는 올바른 형변환으로 보지만 런타임에서 체크 해보면 부모가 자식을 커버할 수 없는 원리와 같다.
        // CaptionTV c = (CaptionTV)t;
        // System.out.println(c.text);
        // t2는 CaptionTV 인스턴스를 강제로 TV2로 업캐스팅 해서 일단 CaptionTV 멤버를 들고는 있는데
        // 접근만 못할 뿐이라 CaptionTV 타입을 커버할 수 있다.
        CaptionTV c2 = (CaptionTV)t2;
        System.out.println(c2.text); // null
    }
}
```

이렇듯 부모 클래스에서 자식 클래스로 형변환이 가능하지만  
부모 인스턴스 타입에서 자식 참조 타입으로 변환하지는 못한다.  
이 말을 풀어 쓰면  
1. `TV2 t = new TV2();`  
부모 참조 타입에 부모 인스턴스면  
`CaptionTV c = (CaptionTV)t;`  
자식의 참조 타입으로 변환하지 못한다.  
2. `TV2 t = new CaptionTV();`
부모 참조 타입에 자식 인스턴스면  
`CaptionTV c = (CaptionTV)t;`  
자식의 참조 타입으로 변환 가능하단 소리다.  

## instanceof 연산자
자스와 비슷하다고 보면 되고, null인 참조 변수는 항상 false를 반환한다.  
음... 말로 설명하기 까다로우니 다음 예제를 보자.  

```java
public class TV2 {
    boolean power;
    int channel;

    void power(){}
    void channelUp(){}
    void channelDown(){}
}

class CaptionTV extends TV2 {
    String text;
    void caption(){}
}

class Test4 {
    public static void main(String[] args) {
        CaptionTV c2 = new CaptionTV();
        System.out.println(c2 instanceof CaptionTV); // true
        System.out.println(c2 instanceof TV2); // true
        System.out.println(c2 instanceof Object); // true
    }
}
```

## 참조변수와 인스턴스의 연결
```java
class Parent {
    int x = 10;
    static int y = 20;
    void method() {
        System.out.println("asdf");
    }
    static void method2() {
        System.out.println("qwer");
    }
}

class Child extends Parent {
    int x = 20;
    static int y = 30;
    void method() {
        System.out.println("x="+x); // 20
        System.out.println("this.x="+this.x); // 20
        System.out.println("super.x="+super.x); // 10
    }
    static void method2() {
        System.out.println("zxcv");
    }
}

class Test {
    public static void main(String[] args) {
        Parent p = new Child(); // (Parent)new Child();
        // 인스턴스 변수인 x는 참조타입인 Parent를 따른다.
        System.out.println(p.x); // 10
        // static 변수인 y는 참조타입인 Parent를 따른다.
        System.out.println(p.y); // 10
        // static 메소드인 method2는 참조타입인 Parent를 따른다.
        p.method2();
        // 인스턴스 메소드인 method는 인스턴스 타입인 Child를 따른다.
        p.method();
        
        Child c = new Child();
        // 인스턴스 변수인 x는 참조타입인 Child를 따른다.
        System.out.println(c.x); // 20
        // static 변수인 y는 참조타입인 Child를 따른다.
        System.out.println(c.y); // 30
        // static 메소드인 method2는 참조타입인 Child를 따른다.
        c.method2(); // zxcv
        // 인스턴스 메소드인 method는 인스턴스 타입인 Child를 따른다.
        c.method(); 
    }
}
```
참조타입에 좌지우지 되지 않고 뚝심있게 인스턴스 타입으로 밀고나가는 것은 인스턴스 메소드 밖에 없다.  
static 타입도 참조타입에 좌지우지 되므로 인스턴스.멤버 말고 `클래스.멤버`로 적어주는 것이 좋다.

## 매개변수의 다형성
```java
public class Product {
    int price;
    int bonusPoint;
}

class Computer extends Product {}
class Radio extends Product {}

class Buyer {
    int money = 1000;
    int bonusPoint = 0;
    void buy(Computer c) {
        money -= c.price;
        bonusPoint += c.bonusPoint;
    }
    void buy(Radio r) {
        money -= r.price;
        bonusPoint += r.bonusPoint;
    }
}
```

제품이 추가될 때 마다 계속해서 메소드를 오버로딩할 것인가...?  
아래와 같이 다형성을 이용하면 된다.  

```java
class Buyer {
    int money = 1000;
    int bonusPoint = 0;
    void buy(Product p) {
        money -= p.price;
        bonusPoint += p.bonusPoint;
    }
    void buy(Radio r) { // 따로 처리하고 싶은 녀석만 따로 빼면 된다.
        money -= r.price;
        bonusPoint += r.bonusPoint;
        System.out.println("asdf");
    }
}

class Test5 {
    public static void main(String[] args) {
        Buyer b = new Buyer();
        b.buy(new Radio()); // "asdf"까지 무사 출력된다.  
        System.out.println(b.money); // 900으로 까였다.
        b.buy(new Computer());
        System.out.println(b.money); // 800으로 까였다.
    }
}
```

Product의 instanceof로 자식 클래스들이 전부 걸리므로 저기서도 전부 매칭이 된다.  
매개변수의 다형성이 저렇게 부모 클래스로 추상화시키는 것이라면 메소드의 다형성은 오버로딩이려나...??  

## 여러 종류의 객체를 배열로 다루기
```java
class Test5 {
    public static void main(String[] args) {
        // Product의 instanceof에 걸리므로 이렇게도 할 수 있다.
        // 물론 배열 내부에 있는 애들은 부모 타입으로 업캐스팅 된다. (형변환 연산자는 생략된 것임)
        Product[] p = {new Computer(), new Radio(), new Radio()};
        // 배열은 길이가 고정적인데 반해 벡터는 10개는 기본이고, 그 이후에는 계속해서 추가된다.
        // 이러한 단점을 극복한 게 Vector이다. Vector는 객체 배열이다.
        // 따라서 클래스의 인스턴스 멤버들을 사용하려면 다운캐스팅 해줘야한다.  
        // System.out.println(((Audio)p[3]).volume);
        Vector<Product> v = new Vector<>();
        v.add(new Computer());
        v.add(new Radio());
    }
}
```

## 추상 클래스(abstract class)
미완성 클래스(설계도)이다.  
틀만 그려놓고 자식이 상속받아서 구현하라는 뜻이다.  
이 클래스를 가지고는 인스턴스를 생성하지 못한다.  
백지에서 클래스를 설계하기 보다는 공통된 요소를 모아논 추상 클래스를 만들고 여기 저기서 상속 받아서 클래스를 작성하면 훨씬 수월할 것이다.  
추상 메소드가 있으면 abstract 키워드를 붙여 상속 받아서 완성시켜야할 놈이 있다고 명시적으로 알려주는 게 좋다.  
abstract에는 미완성인 녀석만 있는 게 아니라 생성자나 메소드 등등 다 가지고 있을 수 있다.  
심지어 일반 클래스도 그냥 abstract 키워드를 붙여 추상 클래스로 만들 수 있는데 이렇게되면 직접 인스턴스 생성을 하지 못한다.  
상속이 자식 클래스를 만드는데 부모 클래스(공통 부분)를 이용하는 것이라면,  
추상화는 부모 클래스(공통 부분)을 만드는데 자식 클래스(여러 자식에서 공통되는 부분들을 추출)를 이용한다.  
추상화는 클래스 간의 공통점을 찾아내서 공통의 조상을 만드는 작업이라고 할 수 있고,  
구체화는 상속을 통해 클래스를 구현, 확장하는 작업이라고 할 수 있다.

## 추상 메소드(abstract method)
일반적인 클래스에는 존재할 수 없다.  
몸통이 없으므로 `abstract void a();`와 같이 세미콜론을 찍어주고 {} 블록이 없다.  
일반 메소드와 달리 추상 메소드는 무조건 오버라이딩 해줘야 오류가 발생하지 않는다.  

## 인터페이스(Interface)
추상 클래스보다 추상화 정도가 훨씬 높다.  
인터페이스는 추상 메소드와 상수만 존재할 수 있다.  

그리고 인터페이스 멤버의 제약 사항은 다음과 같다.  
1. 모든 멤버변수는 public static final이어야 하면 생략 가능하다.  
2. 모든 메소드는 public abstract이어야 하며 생략 가능하다
3. Java8부터 static 메소드와 default 메소드도 가능해졌다.

인터페이스의 상속은 다른 인터페이스로부터만 가능하며 다중 상속이 가능하다.  
인터페이스는 클래스의 Object와 같은 최고 조상이 없다.  
인터페이스의 모든 메소드들을 구현해야하는데 일부만 구현하는 클래스는 abstract 키워드를 붙여 추상 클래스로 만들어주면된다.  
인터페이스는 주로 ~able로 끝나는 것들이 많다.  
그 이유는 어떤 기능 또는 행위를 하는데 필요한 메소드를 제공한다는 의미를 지니기 때문이다.  

```java
interface TT {
    // public abstract void a();
    void a();
}

class T implements TT {
    // 구현부는 원본보다 접근 지정자가 넓어야한다.
    public void a() {}
}
```

## 다중 상속?
다중 상속을 하면 멤버(변수, 메소드) 명의 충돌 위험이 존재한다는 단점이 존재해서 Java에서는 지원하지 않는다.  
하지만 다른 객체 지향 언어인 C++에서는 지원하는데 반해 Java에서는 지원하지 않자 이게 단점처럼 지적을 받았다.  
그러다보니 마케팅(?)을 위해서인지 Java에서도 인터페이스를 통해 다중 상속(구현)을 지원하기 시작했는데 실제로 인터페이스를 다중 상속하는 경우는 드물단다.  

## 인터페이스의 다형성  
클래스에서 부모 타입으로 자식 인스턴스를 생성하듯,  
인터페이스에서도 인터페이스 타입으로 인터페이스를 구현한 클래스의 인스턴스를 생성할 수 있다.  
```java
// Fightable 인터페이스에 존재하는 멤버들만 사용이 가능한다.
Fightable f = new Fighter(); // (Fightable)new Fighter();와 동일.
```

그 진가는 아래 예제를 통해 발동한다.  
instanceof 연산자는 자기 자신, 부모, 조상, 추상 클래스, 인터페이스에 모두 걸리는 모양이다.  
```java
public interface Parseable {
    void parse(String fileName);
}

class XMLParser implements Parseable {
    public void parse(String fileName) {
        System.out.println(fileName + " - XML parsing completed.");
    }
}

class HTMLParser implements Parseable {
    public void parse(String fileName) {
        System.out.println(fileName + " - HTML parsing completed.");
    }
}

class ParserManager {
    public static Parseable getParser(String type) {
        if(type.equals("XML")) return new XMLParser();
        return new HTMLParser();
    }
}

class ParserTest {
    public static void main(String[] args) {
        Parseable parser = ParserManager.getParser("XML");
        parser.parse("document.xml"); // document.xml - XML parsing completed.
        parser = ParserManager.getParser("HTML");
        parser.parse("document.html"); // document.html - HTML parsing completed.
    }
}
```

매개변수와 리턴타입으로 인터페이스가 올 수 있는데 이는 **해당 인터페이스를 구현한 클래스의 인스턴스**를 의미한다.  
그래서 Parseable라는 인터페이스 타입에 XMLParser나 HTMLParser 인스턴스를 모두 저장할 수 있는 것이다.  
이러한 장점은 분산환경 프로그래밍에서 그 위력을 발휘한다.  
사용자가 컴퓨터에 설치된 프로그램을 변경하지 않고 서버측의 변경만으로도 사용자는 변경된 프로그램을 사용할 수 있게 된다라고 하는데 뭔 소린지 모르겠다.  

## 기본 메소드와 static 메소드
Java8에 들어와서 기본 메소드가 등장했다.  
인터페이스에 메소드가 하나 추가되면 모든 구현체 클래스에 해당 메소드를 구현해야한다는 부담이 생긴다.  
따라서 아래와 같이 하면 기본적인 메소드가 생겨서 굳이 구현을 하지 않아도 오류가 생기지 않는다.  
```java
default void newMethod(){} // public default void newMethod(){}
```
static 메소드는 인스턴스와 관계가 없는 독립적인 메소드이기 때문에 인터페이스에 넣지 않을 이유가 없다는데 그게 무슨 상관인지 모르겠다.  

만약 여러 인터페이스에서 default 메소드가 중복된다면 구현하는 클래스에서 오버라이딩해야하고,  
부모 클래스와 default 메소드 간에 충돌이 일어나면 디폴트 메소드는 무시되고 부모 클래스의 메소드를 상속받는다.  

## 내부 클래스
클래스에 다른 클래스를 선언하는 이유는 두 클래스가 서로 긴밀한 관계가 있기 때문이다.  
내부 클래스를 선언하면 두 클래스 멤버 사이에 서로 쉽게 접근할 수 있고, 외부에 불필요한 데이터를 감춤으로써  
코드의 복잡성을 줄일 수 있다. (캡슐화)  
 