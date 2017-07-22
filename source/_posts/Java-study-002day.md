---
title: (Java) 자바의 정석 3판 002일차 정리
date: 2016-12-31 18:12:20
category: [Programming, Java]
tag: [Java, Java8, 자바의 정석]
---
![](thumb.png)

## char의 연산자별 형변환.
전위&후위 연산자는 형변환을 하지 않고  
기타 연산자는 int로 형변환을 함.  
```java
public class test {
    public static void main(String[] args) {
        char ch = 65;
        System.out.println(ch++); // 'A'
        System.out.println(ch); // 'B'
        System.out.println(++ch); // 'C'
        ch = 65;
        System.out.println(ch); // 'A'
        System.out.println(ch+0); // 65
        System.out.println(+ch); // 65
        System.out.println(-ch); // -65
        System.out.println(ch << 1); // 130
        System.out.println(ch); // 'A'
        short num = 0;
        // num = ch + 1; // error
        int num2 = 0;
        num2 = ch + 1; // 에러가 나지 않음.
    }
}
```
+ 170102 내용 수정  
형변환은 쉬프트 연산자(<<, >>), 증감 연산자(++, --)에서만 일어나지 않음.

## 오버 플로우(overflow)
정수형
최대값 + 1 == 최소값
최소값 - 1 == 최대값

실수형
최대값 + @ == Infinity  
최소값 - @ == -Infinity  
표현할 수 없는 아주 작은 0에 수렴하는 값 == 0.0(underflow)
```java
public class test {
    public static void main(String[] args) {
        System.out.println(Float.MAX_VALUE * 2); // Infinity
        System.out.println(Float.MAX_VALUE * -2); // -Infinity
        System.out.println(Float.MIN_VALUE * 0.1f); // 0.0 (underflow)
        System.out.println(Float.MIN_VALUE * -0.1f); // -0.0 (underflow)
    }
}
```

## 실수형의 오차
[IEEE 754](https://ko.wikipedia.org/wiki/IEEE_754)
전기 전자 기술자 협회(IEEE)에서 개발했고, 컴퓨터에서 부동 소수점을 표기하기 위한 표준.  
실수를 표기하는 데는 위와 같이 부동 소수점이 있고, 고정 소수점이 있다.  
고정 소수점은 매우 직관적이라는 장점이 있지만  
범위가 작고, 정밀도가 낮다.(이 말은 오차 없이 표현해낼 수 있는 수의 범위가 매우 좁다고 이해하면 되려나??)  
그에 따라 부동 소수점이 현재 쓰이는 것으로 알고 있다.

나는 정밀도(precision)에 대해 이해하지 못해서 정리를 해보자 한다.  
float 정밀도: 7자리  
double 정밀도: 15자리  
나는 아래와 같이 소수점을 제외한 십진수 7개를 뜻하는 줄 알았다.  
xxxx.xxx  
x.xxxxxx  

뭐 반은 맞고 반은 틀렸달까... 예제를 보고 이해해보자.  
```java
public class test {
    public static void main(String[] args) {
        // 정밀도는 오차 없이 표현하는 10진수의 갯수이다.
        // 오차가 있을 수도, 없을 수도 있다.
        // 10진수 8개를 오차없이 표현해냈다.
        System.out.println(1.2345678e-3f); // 0.0012345678
        // 10진수 8개를 오차있이 표현해냈다.
        System.out.println(1.2345679e-3f); // 0.001234568
        // double은 15자리의 정밀도를 가지므로 10진수 8개 정도는 거뜬하다.
        System.out.println(1.2345679e-3); // 0.0012345679
    }
}
```

또한 소수점 계산시 오차가 발생한다.  
0.1 + 0.2 == 0.30000000000000004  
아주 괴랄한 숫자가 나온다.  
왜 나오는지 파악해보자.  
는 귀찮으니 아래 글들을 참고하자.  
[소수점 때문에 바보가 되는 컴퓨터??](http://namsieon.com/232)  
[컴퓨터에서는 0.1을 어떻게 저장/표현 하나요?!](https://kldp.org/node/116672)  
[10진수 소수점을 2진수 변환](
http://loveknof.tistory.com/entry/10%EC%A7%84%EC%88%98-%EC%86%8C%EC%88%98%EC%A0%90%EC%9D%84-2%EC%A7%84%EC%88%98-%EB%B3%80%ED%99%98)  
소수점끼리의 계산은 끝자리가 5로 끝나는 (0.00005, 0.231423415 등등) 숫자들끼리의 연산이 아니고서는  
정확한 값이 나온다는 확신을 가질 수가 없다.   
왜냐하면 5로 끝나지 않는 0.1 같은 십진 소수를 이진 소수로 바꿀 방법이 없다.  
10진수로는 유한소수여도 2진수로는 무한 소수인 경우가 존재하기 때문에...  
2진수로도 무한 소수가 아니더라도 가수를 저장할 수 있는 공간이 한정돼있기 때문에  
버려지는 수에 의해 오차가 발생하기도 한다.  
아마 같은 수라도 고정 소수점에서는 오차가 발생하지 않을 수도 있지 않을까.. 하는 생각을 한다.  
이는 부동 소수점이 가지는 단점이며 소수를 정수로 바꿔서 연산 후 다시 소수로 바꾸는 방법이 있다.  
정수는 오차가 없기 때문이다.

## 실수형의 정밀도
왜 float은 7자리, double은 15자리의 정밀도를 가질까?  
그것은 float은 1자리의 부호 비트, 8자리의 지수 비트, **23자리의 가수 비트** = 32비트  
**23자리의 2진수** => 약 7자리의 10진수가 표현이 가능하기 때문이다.  
double도 찾아보면 마찬가지의 공식으로 결과가 나온다.

## 바이어스 표기법
[부동소수점에 대한 이해](http://thrillfighter.tistory.com/349)  
위 링크를 참조하자. 부동 소수점에서 지수부를 표현할 때는 바이어스 표기법을 사용한다.  
바이어스 표기법 = 2의 보수 + 바이어스 상수.
  
바이어스 상수: 2<sup>n-1</sup>-1  
n은 지수를 나타내는 비트의 갯수.  
음의 지수를 나타내기 위해 n비트로 나타낼 수 있는 갯수를 반으로 쪼개고(n-1)  
0이 포함돼있기 때문에 -1을 해준다.  
정수를 표현할 때는 음수가 표현할 수 있는 갯수가 1개가 더 많았는데  
실수의 지수를 표현할 때는 양수가 표현할 수 있는 갯수가 1개 더 많은 차이점이 존재한다.  

float: 2<sup>8-1</sup>-1 = 2<sup>7</sup>-1 = 128-1 = 127(-127~128의 지수 표현 가능)  
double: 2<sup>52-1</sup>-1 = 2<sup>51</sup>-1 = 알아서 계산  
하지만 자바에서는 마지막 끝 값들인 -2<sup>n-1</sup>-1 ~ 2<sup>n-1</sup>은 NaN, ±Infinity를 표현하는데 쓰임.
따라서 실제로 쓰이는 범위는
-2<sup>n-1</sup> + 1 ~ 2<sup>n-1</sup>-1 이라고 보면 됨

double은 너무 크니까 float를 기준으로 설명.  
<sup>3</sup>을 바이어스 표기법으로 나타내면  
3 + 127 = 0000**0101** + 0111**1111** = 1000**0010**  
위와 같이 하면 어려우니까 그냥 아래와 같이 계산하는 게 훨씬 쉽다.  
지수 + 바이어스 상수 = 10진수 => 2의 보수법으로 변경  
3 + 127 = 130 = 1000**0010**  
<sup>-126</sup> = -126 + 127 = 1 = 0000**0001**  
<sup>128</sup> = 128 + 127 = 255 = 1111**1111**