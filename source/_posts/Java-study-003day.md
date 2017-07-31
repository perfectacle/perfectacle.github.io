---
title: (Java) 자바의 정석 3판 003일차 정리
date: 2017-01-01 20:00:22
category: [Programming, Java]
tag: [Java, 자바의 정석]
---
![](thumb.png)

## 형변환(캐스팅, Casting)
기본형(primitive type)에서 boolean을 제외한 나머지 타입들은 형변환이 가능.  
역시 자스를 먼저 배우고 나니 자스의 자유로운 형변환이 그리울 때가 있다.  
또한 기본형과 참조형(reference type)간의 형변환은 불가능하다.  
또한 실수형을 정수형으로 바꾸면 반올림 하지 않고 소수점 이하를 다 짜른다.  
왜냐하면 정수형에서는 소수점 이하를 표현할 방법이 없기 때문이다.  
형변환을 할 때 캐스팅 연산자를 써줘야하지만 생략하면 자동으로 컴파일러가 붙여준다.  
하지만 손실이 발생할 수 있는 경우에는 오류가 발생한다.  
따라서 손실이 발생하는 경우에는 무조건 캐스팅 연산자를 써줘야한다.
```java
public class test {
    public static void main(String[] args) {
        char ch = 'A';
        short num = 255;
        int num2 = num;
        num2 = ch;
        long num3 = 12345678781234L;
        // float은 4byte지만 부동 소수점 형태로 표현되기 때문에 8byte인 long보다 더 넓은 범위를 표현할 수 있다.
        // 하지만 정밀도 때문에 오차가 발생할 수는 있다.
        float num4 = num3;
        double num5 = num3;
        // ch와 num은 둘 다 2byte지만 ch는 unsigned short와 같이 부호가 없으므로 표현 범위가 다름.
        // 따라서 서로 손실이 발생하므로 형변환 연산자가 꼭 존재해야함.
        ch = (char)num;
        num = (short)ch;
    }
}
```

## 십진수를 2진수로 보기
```java
public class test {
    public static void main(String[] args) {
        int num = (int)-2.8d;
        // num = 11111111111111111111111111111110
        System.out.println("num = " + Integer.toBinaryString(num));
        num = (int)2.8d;
        System.out.println("num = " + Integer.toBinaryString(num)); // num = 10
    }
}
```
## 정규화
정규표현식의 정규는 많이 들어봤는데 그것과는 많이 다른 것이다.  
기본적으로 부동소수점에 대한 이해를 하고 있어야한다.  
우선 정의부터 살펴보면  
> 2진수로 변환된 실수를 저장기 전에 1.xxx x 2<sup>n</sup>의 형태로 변환하는 과정.
2진수로 변환된 실수를 정수부에 1만 남기고 소수점에 관한 정보는 2<sup>n</sup>으로 표현한 것.

십진 실수 10.625를 2진 실수로 바꾸면 1010.101이다.  
2진수로 변환된 실수를 정규화하면 1.010101 x 2<sup>3</sup>가 된다.  
이를 지수 표기법(Exponential Notation)으로 바꾸면 1.010101e3이 된다.  
이 정규화된 수를 토대로 IEE754로 표기하여 저장하는 것이다.

## 연산자(operator)
* 식(expression)  
연산자와 피연산자를 조합하여 계산하고자 하는 바를 표현한 것.  
2+3 등등
* 식을 평가(evaluation)하다.  
식을 계산하여 결과를 얻는 것  
단 하나의 식을 평가(계산)하면 단 하나의 결과를 얻음.  
* 문(statement)  
식을 프로그램에 포함시키려면 식의 끝에 세미콜론을 붙여 하나의 문으로 만들어야함.  
2+3; 등등  
하지만 결과를 얻었지만 쓰이지 않고 사라지기 때문에 무의미함.  
나중에 사용하기 위해 메모리 상의 공간(변수, 상수)에 저장한 후 꺼내 쓰면 됨.  
int num = 1 + 2;  
int num2 = num * 3;  
변수 선언 = 식; => 하나의 문장.  
하지만 다른 곳에서도 쓰이지 않을 결과라면 굳이 식을 문으로 바꾸지 않아도 됨.  
아래와 같이 메소드의 매개변수로 쓰이는 등등의 경우와 같음.  
System.out.println(2+3);  
식을 혼자 쓴 게 아니라 문 안에 식이 쓰인 것이다.  

## 연습문제 오답
* char의 형변환!
```java
public class test {
    public static void main(String[] args) {
      System.out.println('A' + 'B'); // 65 + 66 = 131
      System.out.println('1' + 2); // 49 + 2 = 51
      System.out.println('1' + '2'); // 49 + 50 = 99
      System.out.println("" + true); // "true"
    }
}
```
문자열 + any type → 문자열 + 문자열 → 문자열  
any type + 문자열 → 문자열 + 문자열 → 문자열

* System은 키워드가 아니었다!

* 참조형 변수(reference type) 4byte이다!!
[JAVA 변수타입](https://labofengineer.wordpress.com/2013/07/08/java-%EB%B3%80%EC%88%98%ED%83%80%EC%9E%85/)  
참조형 변수는 null 또는 객체의 주소(4 byte, 0x0~0xffffffff)를 값으로 갖는다.  
null은 어떤 값도 갖고 있지 않음, 즉 어떠한 객체도 참조하고 있지 않다는 것을 뜻한다.

* 캐스팅 연산자 생략
```java
public class test {
    public static void main(String[] args) {
      int num = 0;
      // 표현할 수 있는 범위더라도 int => 4byte, byte => 1byte 이므로 캐스팅 연산자 꼭 써줘야함.
      byte num2 = num;
    }
}
```

* 접근 지정자, 지정 예약어, 메소드  
접근 지정자 - public, protect, default, private  
지정 예약어 - this, static, final  
메소드 - 리턴타입 이름(매개변수) {}  
지정 예약어 this를 빼고 설명.  
  * 지정 예약어끼리는 순서 상관 없음 => static final이던 final static이던  
  * 접근 지정자와 지정 예약어도 순서 상관 없음 => public static이던 static public이던  
  * 하지만 메소드는 무조건 접근 지정자와 지정 예약어 뒤에 와야함.  
  * 접근 지정자를 생략하면 default 접근 지정자가 적용됨.  
  * 지정 예약어는 생략 가능하며 생략해도 기본값이 없음.
  * 메소드에서는 매개변수를 제외한 모든 것은 생략 불가능. 즉 기본 값이 없음.
  
* 변수의 기본값  
  * 참조형 - null  
  * 기본형  
    * boolean - false  
    * char - '\u0000'  
    * byte - 0  
    * short - 0  
    * int - 0  
    * long - 0L or 0l  
    * float - 0.0F or 0.0f  
    * double - 0.0 or 0.0D or 0.0d
    byte, short는 컴파일 할 때 자동으로 int 타입으로 바꿈.  
    long에 접미어 L을 붙이는 이유는 int와 다른 메모리 공간을 차지하게 하기 위함.  
    float도 double과 차별을 두기 위해 접미어를 붙이게 끔 설계됨. 
    