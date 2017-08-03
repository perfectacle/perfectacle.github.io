---
title: (Java) 자바의 정석 3판 013일차 정리
category: [Programming, Java]
tag: [Java, 자바의 정석]
date: 2017-08-03 15:05:34
---
![](thumb.png)  

어제 잠이 안 와서 늦잠을 잤더니 오늘은 어제꺼 복습이랑 연습문제 밖에 못 풀었다...  
내일부터 또 다시 진짜 빡세게 이빠이 달려야겠다 ㅠㅠ

## 연습문제 오답노트
### 1~10 반복하기  
```java
class Test {
    public static void main(String[] args){
      for(int i = 0; i < 20; i++) {
        System.out.println(i % 10 + 1);
      }
    }
}
```

내가 생각한 것  
```java
class Test {
    public static void main(String[] args){
      for(int i = 0; i < 20; i++) {
        int lastNum = (i+1) % 10;
        System.out.println(num == 0 ? 10 : num);
      }
    }
}
```
이렇게 10인 경우에 대해서 먼저 덧셈을 진행하고 나머지 연산자를 쓰다보니 그런 문제가 발생한 것 같다.  
역시 나는 아직 멀었다, 알고리즘 ㅠㅠ  

### 매개변수의 유효성 검사
매일 까먹는데 매개변수가 들어오면 항상 유효성 검사를 하자!!  
특히 setter 부분...  

내가 생각한 것
```java
SutdaCard pick(int idx) {
    if(idx < 0 && idx >= CARD_NUM) return null;
    return cards[idx];
}

SutdaCard pick() {
    return cards[(int)(Math.random() * CARD_NUM)];
}
```

위 코드보다 혹시 몰라서 유효성 검사까지 돌려주게 끔 하려고 기존에 작성된 메소드를 이용하는 것 같다.
pick() 안에서 유효성 검사를 또 돌리면 중복이기에...

답안
```java
SutdaCard pick(int idx) {
    if(idx < 0 && idx >= CARD_NUM) return null;
    return cards[idx];
}

SutdaCard pick() {
    return pick([(int)(Math.random() * CARD_NUM)]);
}
```

### 자식 클래스에서 부모 메소드 호출  
```java
class Parent {
    int y = 20;
    void method() {
        System.out.println(y, + "," + this.y);
    }
}

class Child extends Parent {
    int y = 30;
}

class Test {
    public static void main(String[] args) {
        Child c = new Child();
        c.method(); // 20,20
    }
}
```

메소드를 오버라이딩 하지 않아 부모 클래스의 메소드를 호출할 때가 있다.  
이때 메소드 내에 멤버들은 부모의 멤버를 가리킨다.  
ES2015와는 약간 다르다.  
```javascript
class Parent {
  constructor() {
    this.x = 20;
  }
  method() {
    console.log(this.x);
  }
}

class Child extends Parent {
  constructor() {
    super();
    this.x = 30;
  }
}

const c = new Child();
c.method(); // 30
```
ES2015+에서는 메소드 오버라이딩을 하지 않았어도 자식 클래스에서 호출한 거면 자식 클래스의 멤버를 따른다.  

## 이전 값 기억하기  
setter로 값을 계속 지정하고, 그 이전값으로 돌아가는 메소드까지 구현해보는 거였다.  
예제로 TV 클래스의 채널을 가지고 구현했는데 나는 아래와 같이 반복된 로직을 사용하였다.  
```java
public class TV {
    private int channel;
    private int prev;


    public int getChannel() {
        return channel;
    }

    public void setChannel(int channel) {
        prev = this.channel;
        this.channel = channel;
    }

    void gotoPrevChannel() {
        int tmp = prev;
        prev = channel;
        channel = tmp;
    }
}
```

gotoPrevChannel 쪽에 저렇게 스와핑하는 로직을 쓸 필요가 없이 아래와 같이 하면 끝나는 거였다.  
나는 바보같다 흑흑...
```java
public class TV3 {
    private int channel;
    private int prev;


    public int getChannel() {
        return channel;
    }

    public void setChannel(int channel) {
        prev = this.channel;
        this.channel = channel;
    }

    void gotoPrevChannel() {
        setChannel(prev);
    }
}
```

## Math 클래스의가 private 접근 지정자가 붙어있는 이유?  
Math 클래스는 인스턴스 멤버는 하나도 없고 죄다 static 멤버이다.  
따라서 클래스가 자동으로 로딩되니(컴파일러가 import.lang.*을 자동으로 삽입해주니) 메모리에 static 멤버는 바로 적재되니 인스턴스 생성없이 사용이 가능하며  
인스턴스를 생성할 필요가 없어서 private 접근 지정자로 호출이 불가능하게끔 하고 있다.

## 참조타입 간의 형변환
```java
class Unit {
    int x = 1;
}
class AirUnit extends Unit {}
class GroundUnit extends Unit {
    int y = 2;
}
class Tank extends GroundUnit {}
class AirCraft extends AirUnit {}

class UnitTest {
    public static void main(String[] args){
        Unit u = new GroundUnit();
        Unit u2 = new Unit();
        Tank t = new Tank();
        AirCraft ac = new AirCraft();

        // 가능하다. 나는 참조타입이 Unit이라 더 넓은 타입인 GroundUnit으로 변환이 불가능한 줄 알았다.
        // 근데 인스턴스 타입이 GroundUnit이어서 가능한 것이다.  
        // u2처럼 만드는 것과 차이점이 무엇이 있냐면
        // 이렇게 형변환을 자유로이(멤버의 범위를 여의봉 마냥 자유자재로 늘렸다 줄였다) 할 수 있는 장점이 있다.
        GroundUnit gu = (GroundUnit)u;
        // 컴파일 에러는 안 나는데 런타임 에러, 
        // u2는 Unit 인스턴스 타입이라 참조 가능한 한계가 Unit 뿐임.
        // 하지만 위는 GroundUnit의 인스턴스라 참조타입에 따라서 여의봉 마냥 참조 가능한 멤버의 한계가 달라짐.
        // GroundUnit gu2 = (GroundUnit)u2; 

        // System.out.println(u.y); 참조타입이 Unit이라 Unit꺼가 아니라 컴파일 에러
        System.out.println(gu.y); // GroundUnit의 멤버까지 접근이 가능하다.
    }
}
```

## 확실히 구현해야하는 메소드들은 오버라이딩 보다는 추상메소드를 쓰자
추상 메소드로 쓰면 구현을 하지 않으면 컴파일 에러가 나서 무조건 구현해야하는구나 라고 개발자가 더 확실히 인식할 수 있다.  
또한 오버라이딩은 해도 그만 안 해도 그만이라 잘못된 메소드를 만들어서 메소드 오버로딩이 될 수도 있는데 추상 메소드는 그럴 가능성이 없다.  
```java
class Unit {
    int x, y;
    abstract move(int x, int y){} // 메소드 오버라이딩 대신에 추상 메소드를 써서 무조건 구현하게끔 했다.
    void stop(){}
}

class Marine extends Unit {
    void move(int x, int y){}
    void stimPack(){}
}

class Tank extends Unit {
    void move(int x, int y){}
    void changeMode(){}
}

class Dropship extends Unit {
    void move(int x, int y){}
    void load(){}
    void unload(){}
}
```

## 고객이 물건 사는 거 구현하기
생각할 게 많은 예제인 것 같다.  
```java
public class Product {
    int price = 100;
    Product(int price) {
        this.price = price;
    }
}

class TV extends Product {
    TV() {
        super(100);
    }

    public String toString() {
        return "TV";
    }
}
class Computer extends Product {
    Computer() {
        super(200);
    }

    public String toString() {
        return "Computer";
    }
}
class Audio extends Product {
    Audio() {
        super(50);
    }

    public String toString() {
        return "Audio";
    }
}

class Buyer {
    int money = 1000;
    Product[] cart = new Product[3];
    int i = 0;

    void buy(Product p) {
        if(p.price <= money) {
            money -= p.price;
            add(p);
        } else {
            System.out.println("잔액이 부족하여 " + p + "을/를 살 수 없습니다.");
        }
    }

    void add(Product p) {
        int len = cart.length;
        // len - 1까지는 정상적으로 넣어도 되는 값이고 넣은 이후에 ++이 되기 때문에 len으로 조건을 걸어주면 된다.
        if(i >= len) {
            Product[] tmp = new Product[len*2];
            System.arraycopy(cart, 0, tmp, 0, len);
            cart = tmp;
        }
        cart[i++] = p;
    }

    void summary() {
        int spend = 0;
        System.out.print("구입한 물건: ");
        // cart.length로 하면 null인 경우에 break를 걸어줘야하는데(아직 카트를 덜 채운 경우)
        // i를 맥스로 하면 i는 이제 넣어야할 차례의 인덱스이므로 끝까지 넣은 구간까지만 출력하니 null을 처리해주지 않아도 된다. 
        for (int j = 0; j < i; j++) {
            System.out.print(cart[j] + ", ");
            // spend를 구할 때 1000 - money로 구해도 되지만 1000원이라는 확신이 없기에 이렇게 해줘야함.
            spend += cart[j].price;
        }
        System.out.println();
        System.out.println("사용한 금액: " + spend);
        System.out.println("남은 금액: " + money);
    }
}

class Test5 {
    public static void main(String[] args) {
        Buyer b = new Buyer(); b.buy(new TV()); b.buy(new Computer()); b.buy(new TV()); b.buy(new Audio()); b.buy(new Computer()); b.buy(new Computer()); b.buy(new Computer());
        b.summary();
    }
}
```

## 매개변수가 인터페이스일 때
매개변수의 다형성에 대해 묻는 얘기인 것 같다.  
이렇게 다형성을 이용하면 메소드 오버로딩 해야할 경우의 수를 많이 줄일 수 있다.  
하지만 특정 인스턴스에 특화된 게 아니라 공통된 멤버들만 사용이 가능하다는 제약이 있다.  
진짜 클래스의 다형성, 매개변수의 다형성, 메소드의 다형성, 인터페이스의 다형성 등등 그지같이 많다.  

1. null  
2. Interface  
3. Interface를 구현한 클래스(인스턴스)  
4. Interface를 구현한 클래스의 자식 클래스(인스턴스)

## 내부 클래스의 변수 사용하기
사용할 일이 있을라나...  

* 인스턴스 변수
```java
class Outer { // 외부 클래스
    class Inner { // 내부 클래스(인스턴스 클래스)
        int iv=100; 
    }
}
class Test {
    public static void main(String[] args) {
        Outer o = new Outer(); 
        Outer.Inner ii = o.new Inner();
        System.out.println(ii.iv);
    } 
}
```

* 클래스 변수
```java
class Outer { // 외부 클래스
    class Inner { // 내부 클래스(인스턴스 클래스)
        static int iv=100; 
    }
}
class Test {
    public static void main(String[] args) {
        Outer.Inner ii = new Outer.Inner();
        System.out.println(ii.iv);
    } 
}
```

## 익명 클래스
얘는 어딘가 써먹을 법하다. 1회성 클래스에... 캡슐화 시키고자  
```java
class Test {
    public static void main(String[] args) {
        Frame f = new Frame();
        f.addWindowListener(new EventHandler());
    }
}
class EventHandler extends WindowAdapter {
    public void windowClosing(WindowEvent e) {
        e.getWindow().setVisible(false);
        e.getWindow().dispose();
        System.exit(0);
    } 
}
```

EventHandler를 익명클래스로 작성하면  
```java
class Test {
    public static void main(String[] args) {
        Frame f = new Frame();
        f.addWindowListener(new WindowAdapter() {
            public void windowClosing(WindowEvent e) {
                e.getWindow().setVisible(false);
                e.getWindow().dispose();
                System.exit(0);
            } 
        });
    }
}
```

상속받은 클래스의 인스턴스를 호출하고 {} 블록을 열어서 내용을 채워주면 된다.  
Swing에서 1회성(하나의 버튼에서만 쓰인다거나) 이벤트 핸들러를 쓸 때 이걸 많이 썼던 것 같다.  

## Constant Pool
DB의 Connection Pool 마냥 상수를 모아놓은 곳인 것 같다.  
 