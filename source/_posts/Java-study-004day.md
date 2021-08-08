---
title: (Java) 자바의 정석 3판 004일차 - 연산자(우선 순위 및 결합 규칙), switch 문
date: 2017-01-02 09:05:49
category: [Note, Java]
tag: [Java, 자바의 정석, 연산자, 조건문]
---
![](Java-study-004day/thumb.png)

## 연산자 우선순위
x << 2 **+** 1 => x << (2 + 1)  
data & 0xFF **==** 0 => data & (0xFF == 0)  
x < -1 || x > 3 **&&** x < 5 => x < -1 || (x > 3 && x < 5)  

괄호는 연산자가 아닌 우선순위를 임의로 정하는 기호임.

## 연산자 결합 규칙
x = **y = 3** => **x = 3** => x = 3, y = 3  
식을 평가하면 단 하나의 결과를 얻을 수 있음.  
할당 연산자인 y = 3도 하나의 식으로 쓸 수 있으며  
저장된 값, 즉 3을 결과로 반환함.  
```java
public class test {
    public static void main(String[] args) {
        int num;
        System.out.println(num = 3); // 3
    }
}
```

## 형변환
타입이 다른 피 연산자끼리의 연산은 값 손실 최소화를 위해 큰 타입으로 자동 변환.  
형변환 연산자 생략해도 자동으로 붙음.  
연산 결과도 큰 타입의 결과로 반환.
1.1f + 1L => 1.1f + (float)1L => 1.1f + 1.0f = 2.1f 
int보다 작은 byte, short, char는 자동으로 int로 바뀜.
1 + 'A' => 1 + (int)'A' => 1 + 65 = 66  
boolean을 제외한 기본형은 연산이 가능함.  
```java
public class test {
    public static void main(String[] args) {
        boolean j = true;
        // 다 오류다.
        System.out.println(j + 'A');
        System.out.println(j + 1);
        System.out.println(j + 2.1);
        System.out.println(++j);
        System.out.println(j << 0);
    }
}
```

## 산술 연산
0으로 나눴을 때 무조건 오류가 나는 게 아니었다.  
```java
public class test {
    public static void main(String[] args) {
        System.out.println(3.0 / 0); // Infinity, 3.0 / 0.0 으로 형변환이 일어나기 때문.
        System.out.println(3 / 0); // java.lang.ArithmeticException: / by zero
    }
}
```
나머지 연산자도 한번 보자.  
```java
public class test {
    public static void main(String[] args) {
        System.out.println(3.0 % 0); // NaN
        System.out.println(3 % 0); // java.lang.ArithmeticException: / by zero
    }
}
```
int 보다 작은 타입끼리의 연산은 형변환이 필수적이다.
```java
public class test {
    public static void main(String[] args) {
        byte num = 1, num2 = 3, num3;
        num3 = 1 + 2; // 에러 발생 안함.
        num3 = (byte)(num + num2); // 이렇게 해줘야함.
        // (byte)num + num2 => (byte)num + (int)num2 => (int)num + (int)num2와 같아짐.
        num3 = (byte)num + num2; // 에러 발생.
        // + 때문에 형변환이 발생.
        num3 = num + num2; // (int)num + (int)num2 => (int)(num + num2)가 됨.
    }
}
```
더 큰 타입으로 선언했다고 해도 형변환 연산을 적절하게 써줘야 손실이 일어나지 않는다.  
```java
public class test {
    public static void main(String[] args) {
        int num = 1000000;
        int num2 = 2000000;
        // int 형을 long으로 변환 후에 저장. (long)(num * num2)
        // 이미 오버플로우가 발생한 int를 long으로 변환한들 원래 값으로 돌아오지 않음.
        long num3 = num * num2;
        System.out.println(num3); // -1454759936
        // 아래 3가지 중 하나처럼 하면 됨.
        num3 = (long)num * num2;
        num3 = num * (long)num2;
        num3 = (long)num * (long)num2;
        System.out.println(num3);
    }
}
```

리터럴과 상수 간의 연산은 실행 과정동안 변하는 값이 아니기 때문에  
컴파일러가 미리 덧셈 연산을 수행한 후 그 결과를 저장함.  
int num = 11 \* 11이라고 치면 컴파일 후에는  
int num = 121이 저장되는 거임.  
하지만 변수가 들어간 연산은 계산 결과를 예측할 수가 없음.  
int num = num2 \* 11이라고 치면 컴파일 후에도  
int num = num2 \* 11이 저장됨.

위와 같은 이유로 리터럴과 상수 간의 연산은 계산 결과를 예측가능하기 때문에  
형변환 연산자가 생략이 가능한 경우도 있음.  
```java
public class test {
    public static void main(String[] args){
        char c1 = 'a';
        final char c2 = 'b';
        char c3 = 'a' + 1; // 리터럴 간의 연산이므로 컴파일 후엔 'b'가 저장됨.
        char c4 = c2 + 1; // 상수와 리터럴 간의 연산이므로 컴파일 후엔 'c'가 저장됨.
        // 에러, 변수가 껴있는 연산이므로 컴파일 후에도 c1 + 1로 저장됨.
        // 컴파일 후에 c1이 int보다 작으므로 (int)c1 + 1과 같이 변하게 됨.
        char c5 = c1 + 1;
    }
}
```
## 문자열 비교 메소드 equals()
문자열 클래스 String은 기본형이 아니다.  
따라서 String 클래스의 인스턴스들은 참조형이다.  
참조형은 변수, 상수에 값을 저장하는 게 아니라 주소(번지)를 저장한다.
```java
public class test {
    public static void main(String[] args){
        String str = new String("ab");
        String str2 = new String("ab");
        System.out.println(str == str2); // false, 둘은 다른 주소값을 참조함.
        System.out.println(str.equals(str2)); // true, 둘은 같은 문자열을 갖고 있음.
        str = str2 = "ab";
        // new 키워드를 쓰지 않으면 클래스의 인스턴스가 되지 않아서인지 둘 다 true
        System.out.println(str == str2); // true
        System.out.println(str.equals(str2)); // true
    }
}
```

## 문자가 숫자인가? 영문자인가?
```java
public class test {
    public static void main(String[] args){
        char ch = '1';
        System.out.println('0' <= ch && ch <= '9'); // 숫자면 true
        ch = 'c';
        // 괄호가 없어도 되지만 가독성을 위해 넣음.
        System.out.println(('A' <= ch && ch <= 'Z') || ('a' <= ch && ch <= 'z')); // 영어 대소문자면 true
    }
}
```

## 효율적인 논리 연산자
x || y => x가 참이면 무조건 참.  
즉 x가 참이면 y는 평가하지도 않음.  
x && y => x가 거짓이면 무조건 거짓.
즉 x가 거짓이면 y는 평가하지도 않음.  
이렇게 좌변에 어떤 값을 넣는가에 따라서 연산 속도에 영향을 미침.  
```java
public class test {
    public static void main(String[] args){
        int num = 0, num2 = 1;
        System.out.println(num == 0 || ++num2 != 0);
        // num == 0이 참이되자 ++num2는 실행도 안 됨.
        System.out.println(num + " " + num2); // 0 1

        System.out.println(num != 0 || ++num2 == 0);
        // num != 0이 거짓이되자 ++num2가 실행됨.
        System.out.println(num + " " + num2); // 0 2

        System.out.println(num != 0 && ++num2 == 0);
        // num != 0이 거짓이되자 ++num2는 실행도 안 됨.
        System.out.println(num + " " + num2); // 0 2

        System.out.println(num == 0 && ++num2 == 0);
        // num == 0이 참이되자 ++num2가 실행 됨.
        System.out.println(num + " " + num2); // 0 3
    }
}
```

## 비트 연산자
전자 계산기를 배우니까 드디어 이해가 간다.  
논리 게이트에서  
* AND 연산자(&)  
특정 비트의 값을 뽑아낼 때 사용.  
* OR 연산자(|)  
특정 비트의 값을 변경할 때 사용.  
* XOR 연산자(^)  
XOR을 한 번 때리면 암호화, 두 번 때리면 복호화  
* NOT 연산자(~)  
1의 보수를 얻을 때 사용.  
십진수를 이진수로 바꾼 후 각 비트별로 연산을 때린 후 다시 십진수로 바꾼 결과를 반환한다.
```java
public class test {
    static String toBinaryString(int num) {
        String zero = "00000000000000000000000000000000";
        String tmp = zero + Integer.toBinaryString(num);
        return tmp.substring(tmp.length()-32);
    }
    public static void main(String[] args){
        /*
            num = 0XAB                  00000000000000000000000010101011
            num2 = 0XF                  00000000000000000000000000001111
            0XAB & 0XF = 0XB            00000000000000000000000000001011
            0XAB | 0XF = 0XAF           00000000000000000000000010101111
            0XAB ^ 0XF = 0XA4           00000000000000000000000010100100
            0XAB ^ 0XF ^ 0XF = 0XAB     00000000000000000000000010101011
            num3 = 0X2                  00000000000000000000000000000010
            ~num3 = -3                  11111111111111111111111111111101
            num3 + ~num3 = -1           11111111111111111111111111111111
            ~num3 + 1 = -2              11111111111111111111111111111110
        */
        int num = 0xAB, num2 = 0xF, num3 = 2;
        System.out.printf("num = %#X\t\t\t\t\t%s%n", num, toBinaryString(num));
        System.out.printf("num2 = %#X\t\t\t\t\t%s%n", num2, toBinaryString(num2));
        // 1인 비트들만 뽑아냄.
        System.out.printf("%#X & %#X = %#X\t\t\t%s%n", num, num2, num & num2, toBinaryString(num & num2));
        // 특정 비트들을 1로 바꿈.
        System.out.printf("%#X | %#X = %#X\t\t\t%s%n", num, num2, num | num2, toBinaryString(num | num2));
        // 간단한 암호화.
        System.out.printf("%#X ^ %#X = %#X\t\t\t%s%n", num, num2, num ^ num2, toBinaryString(num ^ num2));
        // 간단히 암호화한 것을 복호화.
        System.out.printf("%#X ^ %#X ^ %#X = %#X\t\t%s%n", num, num2, num2, num ^ num2 ^ num2, toBinaryString(num ^ num2 ^ num2));
        System.out.printf("num3 = %#X\t\t\t\t\t%s%n", num3, toBinaryString(num3));
        // 1의 보수를 구함.
        System.out.printf("~num3 = %d\t\t\t\t\t%s%n", ~num3, toBinaryString(~num3));
        // 직접 더해보니 모든 비트가 1이 되는 걸 보니 1의 보수가 맞음.
        System.out.printf("num3 + ~num3 = %d\t\t\t%s%n", num3 + ~num3, toBinaryString(num3 + ~num3));
        // 1의 보수에 1을 더하면 2의 보수, 즉 음수를 구할 수 있음.
        System.out.printf("~num3 + 1 = %d\t\t\t\t%s%n", ~num3 + 1, toBinaryString(~num3 + 1));
    }
}
```

## 쉬프트 연산자
연산 속도가 상당히 빠르다.  
하지만 가독성이 안 좋다.  
피연산자의 타입을 일치시키지 않는다.  
byte, short, char는 int로 자동 형변환이 일어난다.  
속도가 엄청 중요시되는 곳이 아니면 곱셈, 나눗셈을 쓰자.  


## 삼항 연산자
역시 형변환이 일어난다.
```java
public class test {
    public static void main(String[] args) {
        System.out.println(true ? 0 : .1); // 0.0
    }
}
```

## 대입 연산자(할당 연산자)
lvalue = rvalue  
l은 left, r은 right의 준말.  
lvalue에는 변수와 이 값을 변경할 수 있는 것만 들어갈 수 있고,  
rvalue에는 변수 뿐만 아니라 식, 상수, 리터럴 등등이 가능하다.  
1. x = y = 3  
2. y = 3 => 3  
3. x = 3

## 복합 연산자
```java
public class test {
    public static void main(String[] args) {
        int i = 1, j = 2;
        i += 1 + j; // i = i + (1 + j) = i + 1 + j
        System.out.println(i); // 4
        i *= 1 + j; // i = i * (1 + j)
        System.out.println(i); // 12
    }
}
```

## 반복문 - switch
### 장단점
* 가독성이 좋아짐.  
* 조건을 한 번만 검사하면 돼서 속도가 빠름.  
* if 문으로 표현 가능하나 switch 문으로 표현 불가능한 경우가 있음.  

### 제약조건
* switch 조건식은 (정수)리터럴, 변수, 상수, (문자)리터럴, 변수, 상수, (문자열)리터럴, 변수, 상수만 가능  
* case 문의 값은 정수 리터럴, 정수 상수, 문자 리터럴, 문자 상수, 문자열 리터럴, 문자열 상수만 가능함.  
* 문자는 자동으로 int형으로 변환돼서 정수와 같이 취급됨.  
* 자바7부터 문자열 관련 내용이 추가됨.
```java
public class test {
    public static void main(String[] args) {
        final int num = 48;
        int num2 = 47;
        switch ('1') {
            case 49: // 조건식은 char이지만 int와 호환 가능
                System.out.println("str");
                break;
            case num: // num은 final 지정 예약어를 써서 상수로 만들었으므로 가능함.
                System.out.println("str");
                break;
            case num2: // 변수는 불가능!
                System.out.println("str");
                break;
            case "asdf": // 조건식은 char인데 값은 string이라서 오류.
        }
    }
}
```

## 연습 문제 오답
* 연산자의 우선 순위  
사칙 연산이 시프트 연산자보다 우선순위가 높다.  
```java
public class test {
    public static void main(String[] args) {
        int x = 2;
        // int는 32비트, 33 % 32 = 1;
        System.out.println(1 + x << 33); // 3 << 33 = 3 << 1 = 3 * 2^1 = 3 * 2 = 6
    }
}
```

* 나의 머리를 때린 문제  
> 아래는 변수 num의 값보다 크면서도 가장 가까운 10의 배수에서 변수 num의 값을
  뺀 나머지를 구하는 코드이다. 예를 들어 24의 크면서도 가장 가까운 10의 배수는 30이다.
  19의 경우 20이고, 81의 경우 90이 된다. 30에서 24를 뺀 나머지는 6이기 때문에
  변수 num의 값이 24라면 6을 결과로 얻어야 한다.
  
```java
public class test {
    public static void main(String[] args) {
        int num = 24;
        // 내가 생각한 답.
        System.out.println((num / 10 + 1) * 10 - num);
        // 저자가 생각한 답. 진짜 천재다. 문제는 함정 투성이었다 ㅠㅠ
        System.out.println(10 - num%10);
    }
}
```

* 실수형 비교  
boolean result = d==f2; → boolean result = (float)d==f2;  
비교연산자도 이항연산자이므로 연산 시에 두 피연산자의 타입을 맞추기 위해 형변환이 발생한다.  
그래서 double과 float의 연산은 double과 double의 연산으로 자동형변환 되는데  
실수는 정수와 달리 근사값으로 표현을 하기 때문에 float를 double로 형변환했을 때 오차가 발생할 수 있다.  
그래서 float값을 double로 형변환하기 보다는 double값을 유효자리수가 적은  
float로 형변환해서 비교하는 것이 정확한 결과를 얻는다.  
&nbsp;  
이제부터 나만의 해설.  
같은 수가 있을 때 float로 표현한 실수가 double로 표현한 실수보다 오차가 클 수 있다.  
따라서 오차가 큰 float를 double로 바꿔도 오차가 큰 double이 된다.  
따라서 float를 double로 바꿨다 하더라도  
오차가 큰 double와 오차가 작은 double을 비교하면 신뢰할 수 없는 값이 나온다.  
그럼 역으로 오차가 작은 double을 오차가 큰 float로 형변환 시키는 것이다.  
이러한 역발상을 통해 둘 다 오차가 큰 float로 만들어서 비교하면 신뢰할 수 있는 결과가 나온다.