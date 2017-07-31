---
title: (ES2015) Number.EPSILON은 왜 2.220446049250313e-16인가?
category: [Programming, ECMAScript, ES2015+]
tag: [JS, ES, ES6, ES2015, EPSILON]
---
![](thumb.png)  

## 들어가기에 앞서
1. [Number.EPSILON](/2016/12/24/ES6-Number-object-and-function/#Number-EPSILON)이 뭔지 모르는 사람은 해당 링크를 참조하고 오자.  
2. [부동소수점](http://thrillfighter.tistory.com/349)이 뭔지 모르는 사람은 해당 링크를 참조하고 오자.  

## 자바스크립트에서 숫자의 자료형은?
C나 Java를 접해본 사람이라면 숫자의 자료형은 크게 두 가지로 나눌 수 있을 것이다.  
1. 정수  
2. 실수

하지만 자바스크립트에서는 실수 하나 밖에 존재하지 않는다.  
```javascript
console.log(0 === 0.0); // true
console.log(0 === .0); // true
console.log(.0 === 0.0); // true
```
또 이 실수는 크게 두 가지로 나눌 수 있을 것이다.  
1. float  
2. double

하지만 자바스크립트에서는 이 실수형 중에서도 double 형 하나 밖에 존재하지 않는다.  

실수를 나타내는 데도 고정 소수점과 부동 소수점이 존재하는데 고정소수점은 직관적인데 반해 표현할 수 있는 범위가 좁아서  
거의 부동 소수점이 실수를 표현하는데 표준으로 자리잡고 있다.  
물론 이 부동 소수점도 오차가 존재한다는 단점을 떠안고 있지만...

이 부동 소수점을 표현하는데도 여러가지 방법이 있는데 현재 거의 표준으로 자리잡은 것은  
전기 전자 기술자 협회(IEEE)에서 제정한 [IEEE754](https://ko.wikipedia.org/wiki/IEEE_754)라는 것이다.  

자바스크립트도 이 IEE754를 따라서 숫자(실수, 부동소수점)을 표현하고 있고,  
[Double-precision floating-point format](https://en.wikipedia.org/wiki/Double-precision_floating-point_format)을 따르고 있다.  
![](IEEE-754-Double-Floating-Point-Format.png)  

해당 부동소수점 표현 방식은 아래와 같이 세 가지 부분으로 나뉘어진다.  
1. 부호 비트(sign, 1bit)  
MSB(most significant bit): 최상위 비트, 즉 제일 왼 쪽에 있는 비트를 뜻하며 0이면 양수, 1이면 음수를 나타낸다.  
2. 지수부(exponent, 11bit)  
지수부는 정수형과 달리 바이어스 표기법을 사용한다.  
범위는 -2<sup>11-1</sup>-1 ~ 2<sup>11-1</sup>, 즉 -2<sup>1024</sup>-1 ~ 2<sup>1024</sup>이다.  
하지만 최대값이나 최소값인 -2<sup>1024</sup>-1이나 2<sup>1024</sup>은 Infinity를 뿜어낸다.(특수하게 처리한 게 아닐까 싶다.)  
해당 범위를 넘어가는 지수부에 한해서는 아마도 오버플로우가 발생해서 예기치 않은 결과를 뿜어내지 않을까 싶다.(NaN, ±Infinity)  
또한 1e1 같은 숫자를 봤을 때 나오는 저 e가 지수부의 exponent를 줄인 것이다.

