---
title: (Java) 자바의 정석 3판 010일차 - 생성자, this, 멤버 변수 초기화
date: 2017-02-13 13:53:36
categories: [Note, Java]
tag: [Java, 자바의 정석, OOP]
---
![](Java-study-010day/thumb.png)  
## 생성자(Constructor)
인스턴스가 생성될 때 호출되는 `인스턴스 초기화 메소드`  
인스턴스 변수 초기화 작업에 주로 사용된다.  

### 생성자는 인스턴스를 생성하지 못한다!  
나는 생성자로 인스턴스를 생성하고  
new 연산자가 C언어의 &(주소값 반환) 역할을 하는 줄 알았는데  
new 연산자가 있어야 인스턴스를 생성하면서 그 주소값을 반환하게 하는 연산자인 것 같다.  
생성자는 인스턴스 변수 초기화이지 그 이상(인스턴스 생성)도 그 이하도 아닌 것 같다.  

### 기본값 생성자
```java
class a {
    // 아무런 생성자가 없으므로 기본 생성자가 생성됨.
}
class b {
    // 생성자가 1개 이상 존재하면 기본 생성자는 만들어지지 않음.
    b(int x) {}
}
```

### 사용 예제
```java
class Car {
    String color;
    String gearType;
    int cntDoor;
    Car() {}
    Car(String color, String gearType, int cntDoor) {
        this.color = color;
        this.gearType = gearType;
        this.cntDoor = cntDoor;
    }
    public static void main(String[] args){
      Car c1 = new Car();
      c1.color = "black";
      c1.gearType = "manual";
      c1.cntDoor = 4;
      
      // 위 코드보다 생성자를 이용하면 간결하게 작성이 가능하다.
      Car c2 = new Car("red", "auto", 4);
    }
}
```
```java
class Car {
    String color;
    String gearType;
    int cntDoor;
    Car() {
        // 생성자 내에서 다른 생성자 호출은 첫 줄에서만 가능함.
        this("white", "auto", 4);
        // 아래와 같이도 가능하다.
        // color = "white";
        // gearType = "auto";
        // cntDoor = 4;
    }
    Car(String color, String gearType, int cntDoor) {
        this.color = color;
        this.gearType = gearType;
        this.cntDoor = cntDoor;
    }
    public static void main(String[] args){
        Car c1 = new Car();
    }
}
```

## this  
JS에서는 this가 호출하는 놈에 따라서 유동적으로 변해서 아주 골치가 아팠는데  
Java에서는 `클래스의 인스턴스`만 가리키므로 명확하다.  
이러한 이유로 static 메소드에서는 this를 쓸 수 없다.  
static 메소드 호출을 클래스의 인스턴스 생성 이전에도 가능하나  
this는 클래스의 인스턴스를 가리키므로 클래스의 인스턴스 생성 이후에만 사용 가능하기 때문이다.  
생성자를 포함한 모든 인스턴스 메소드에는 해당 클래스의 인스턴스를 가리키는  
this 지역변수가 숨겨진 채로 존재할 뿐이다.  
static 메소드는 인스턴스 멤버와 관련된 작업을 하지 않는 애들이기 때문에  
this 지역변수가 존재하지 않을 뿐이다.  
또한 this에는 인스턴스의 주소가 저장돼있다.  
즉 this는 참조 변수이고, this()는 생성자이다.  

## 인스턴스의 복사
클래스 인스턴스 간의 차이점을 보면  
static 멤버(변수 메소드)와 인스턴스 메소드는 모두 같다.  
인스턴스 변수만 서로 다른 값을 가지고 있을 뿐이다.  
즉, 인스턴스를 복사할 때는 인스턴스 변수만 복사하면 된다.
```java
class Car {
    String color;
    String gearType;
    int cntDoor;
    Car(Car c) {
        color = c.color;
        gearType = c.gearType;
        cntDoor = c.cntDoor;
        // 사실 위와 같이 하는 것 보다는
        // 기존의 코드를 재활용하는 것이 유지보수 측면에서 좋다.
        // 미연의 실수도 방지하고...
        // this(c.color, c.gearType, c.cntDoor); 
        // 위와 같이 써줘야하고 생성자의 제일 첫줄에 적어줘야한다.
        // 왜냐하면 여태까지 초기화한 내역 이후에 또 다시 생성자로 다시 인스턴스를 초기화할 필요는 없기 때문이다.
        // Car(c.colr, c.gearType, c.cntDoor); 라고 쓰면 오류가 난다.
    }
    Car(String color, String gearType, int cntDoor) {
        this.color = color;
        this.gearType = gearType;
        this.cntDoor = cntDoor;
    }
}
```

## 변수의 초기화
멤버 변수(클래스 변수, 인스턴스 변수)와 배열은 기본값으로 초기화가 이루어지지만,  
지역 변수(배열 빼고)는 기본값으로 초기화가 이루어지지 않는다.  
즉, 멤버 변수와 배열의 초기화는 선택적이지만(초기화를 권장한단다)  
지역 변수의 초기화는 필수적이다.
또한 멤버 변수의 초기화에는 다음 세 가지 방법이 존재한다.  
* 명시적 초기화  
가장 기본적이면서 간단한 방법이다.  
```java
class Car {
    String color = "black";
    String gearType = "manual";
    int cntDoor = 4;
}
```
* 초기화 블럭  
예외 처리나 반복, 조건문 등등의 복잡한 작업을 통해 초기화 해야할 경우  
이러한 블럭`{}`을 사용해서 초기화를 진행하면 된다.  
```java
class Car {
    static int cntCar; // 현재 자동차가 몇 대 생성되었는지
    static { // 클래스 초기화 블럭
        // 프로그램이 실행되면 단 한 번만 실행된다.
        System.out.println("이렇게 함수 실행도 된다.");
        cntCar = 0;
    }

    String color;
    String gearType;
    int cntDoor;
    { // 인스턴스 초기화 블럭
        // 인스턴스가 생성될 때마다 실행된다.
        if(true) {
            System.out.println("조건문도 쓸 수 있네?");
        }
        cntCar++; // 생성자마다 중복된 코드를 여기다가 빼면 된다.
    }
    Car() {
        // cntCar++; // 차가 생성됐으므로 1대 추가, 생성자마다 중복된 코드다.
        color = "white";
        gearType = "auto";
        cntDoor = 4;
    }
    Car(String color, String gearType, int cntDoor) {
        // cntCar++; // 차가 생성됐으므로 1대 추가, 생성자마다 중복된 코드다.
        this.color = color;
        this.gearType = gearType;
        this.cntDoor = cntDoor;
    }

    public static void main(String[] args) {
        // 이렇게 함수도 실행된다.
        
        // 조건문도 쓸 수 있네?
        Car c = new Car();
        // 조건문도 쓸 수 있네?
        Car c2 = new Car("black", "manual", 3);
    }
}
```
* 생성자  
인스턴스 변수를 초기화하기 위해 쓴다고 위에 설명했으므로  
자세한 설명은 생략한다.  

## 멤버 변수의 초기화 시기와 순서
* 클래스 변수의 초기화 시점  
클래스 변수가 처음 로딩될 때 단 한 번 초기화 된다.  
* 인스턴스 변수의 초기화 시점  
인스턴스가 생성될 때마다 각 인스턴스별로 초기화가 이루어진다.  
* 클래스 변수의 초기화 순서  
기본값 - 명시적 초기화 - 클래스 초기화 블럭  
* 인스턴스 변수의 초기화 순서   
기본값 - 명시적 초기화 - 인스턴스 초기화 블럭 - 생성자  
```java
class InitTest {
    static int cv = 1;
    int iv = 1;
    static {
        cv = 2;
    }
    {
        iv = 2;
    }
    InitTest() {
        iv = 3;
    }

    public static void main(String[] args) {
        InitTest i = new InitTest();
    }
}
```
<table><thead><tr><th scope="col" colspan="3">클래스 초기화</th><th scope="col" colspan="4">인스턴스 초기화</th></tr></thead><tbody><tr><td>기본값</td><td>명시적 초기화</td><td>클래스 초기화 블럭</td><td>기본값</td><td>명시적 초기화</td><td>인스턴스 초기화 블럭</td><td>생성자</td></tr><tr><td>cv: 0</td><td>cv: 1</td><td>cv: 2</td><td>cv: 2</td><td>cv: 2</td><td>cv: 2</td><td>cv: 2</td></tr><tr><td></td><td></td><td></td><td>iv: 0</td><td>iv: 1</td><td>iv: 2</td><td>iv: 3</td></tr><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td></tr></tbody></table>
