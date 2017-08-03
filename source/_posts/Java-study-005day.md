---
title: (Java) 자바의 정석 3판 005일차 정리
date: 2017-01-20 15:31:25
category: [Note, Java]
tag: [Java, 자바의 정석]
---
![](thumb.png)

## 반복문
## for문
```java
public class test2 {
    public static void main(String[] args) {
        System.out.println("i \t i % 3 \t i / 3");
        for(int i=0; i<12;)
            System.out.printf("%d \t %d \t %d%n", i, i%3, i++/3);
        /*
            i % n에서 % 연산자는 n개의 숫자가 연속적으로 순환하면서 나오고
            i / n에서 / 연산자는 동일한 숫자가 n번 연속해서 나온다.
            알고리즘 어딘가 쓰일지 모르니 기억해두자.
            i 	 i % 3 	 i / 3
            0 	 0 	 0
            1 	 1 	 0
            2 	 2 	 0
            3 	 0 	 1
            4 	 1 	 1
            5 	 2 	 1
            6 	 0 	 2
            7 	 1 	 2
            8 	 2 	 2
            9 	 0 	 3
            10 	 1 	 3
            11 	 2 	 3
         */
    }
}
```

### 향상된 for문
배열이나 컬렉션을 순회할 때만 사용할 수 있다.
es6의 for of와 유사하다.
```javascript
const nums = [1, 2, 3];
/*
  1
  2
  3
 */
for(const num of nums) console.log(num);
```

```java
public class test2 {
    public static void main(String[] args) {
        int nums[] = {4, 5, 6};
        /*
          4
          5
          6
         */
        for(int num : nums) System.out.println(num);
    }
}
```

### while문
for문과 while문은 항상 변환이 가능하다.  
for는 `반복할 횟수`에 포커스를, while은 `조건`에 포커스를 뒀다.  

## 연습문제 오답
* char 범위 구하기  
자꾸만 아스키 코드의 함정에 갇혀있다.  
오답은 아닌데 어차피 int로 변환되므로 굳이 아스키코드로 대조하지 않아도  
숫자인지 영어인지 비교가 가능했다.  
`ch > 47 && ch < 58`가 아니라  
`'0' <= ch && ch <='9'`  
`(ch > 64 && ch < 91) || ( ch > 96 && ch < 123)`가 아니라  
`('a' <= ch && ch <= 'z') || ('A' <= ch && ch <= 'Z')`  

* boolean형 변수 powerOn가 false일 때 true인 조건식  
한 가지 경우밖에 떠올리지 못했다.  
  * !powerOn  
  * powerOn == false  
  * powerOn != true  


* `정수, 음수 교차 합산 문제`  
또 한번 나의 머리를 강타한 문제다.  
내가 굉장히 편협한 사고 방식을 가지고 있는 게 아닐까 하는 생각이 들었다.  
정답을 살짝 보고 나와 다른 것 같아서 아무리 생각해봤지만...  
저자의 발끝만치도 따라오지 못했다.  
정말 반성해야겠다.  
&nbsp;  
1+(-2)+3+(-4)+... 과 같은 식으로 계속 더해나갔을 때, 몇까지 더해야 총합이 100이상이 되는지 구하시오.
&nbsp;  
내가 생각한 답안  
```java
public class test2 {
    public static void main(String[] args) {
        int i=1, sum=0;
        while(sum < 100) {
            sum += i;
            i = i>0 ? -(++i) : -(--i);
        }
        i = i>0 ? i : -i;
        System.out.printf("sum: %d, i: %d", sum, --i);
    }
}
```
저자가 제시한 답안  
s라는 부호 변수를 놓고, 토글시키면서 쓸 줄은 전혀 몰랐다...
```java
public class test2 {
    public static void main(String[] args) {
        int i = 0, s = 1, sum = 0;
        while(sum < 100) {
            sum += ++i * s;
            s = -s;
        }
        System.out.printf("sum: %d, i: %d", sum, i);
    }
}
```

* 두 개의 주사위를 던졌을 때, 눈의 합이 6이 되는 모든 경우의 수  
필요없는 sum을 선언했었다.  
다른 곳에서 쓰지 않는 변수는 따로 캐싱을 하지 않아도 된다.
```java
public class test2 {
    public static void main(String[] args) {
        for(int i=0; ++i<6;)
            for(int j=0; ++j<6;)
                if(i+j == 6) System.out.printf("i: %d, j: %d%n", i, j);
    }
}
```

* 정수형 변수에 랜덤한 값 담기.
```java
// 형변환을 꼭 해줘야하고, + 이전까지가 실수이므로 랩핑은 거까지만 해주면 됨.
int rnd = (int)(Math.random() * 6) + 1;
```

* 문자를 정수로 바꾸기.  
parseInt가 만능이 아니었다.  
```java
char ch = '4';
int num = Integer.parseInt("" + ch);
int num2 = ch - '0'; // - 연산에 의해 int로 둘 다 형변환 되서 연산이 진행됨.
```

* 정수의 각 자릿수 구하기.  
문자열이면 정수로 바꾸고 진행하는 게 맘 편하다.  
```java
public class test {
    public static void main(String[] args){
      int num = 12345;
      while(num > 0) { // 이 놈의 조건이 참 유용하다. 괜히 for로 해서 변수 선언할 필요 없다.
          System.out.println(num % 10);
          num /= 10;
          // 결국 마지막엔 10 이하의 값을 나누게 되므로 0이 된다.
      }
    }
}
```
## continue와 break
이중 반복문이 있을 때 반복문에 이름을 붙이고, continue와 break 뒤에 반복문의 이름을 붙이면 해당 반복문을 탈출한다.  
```java
public class Main {
    public static void main(String[] args) {
        /*00
        01
        10
        11*/
        outer:
        for(int i=0; i<2; i++) {
            for(int j=0; j<4; j++) {
                if(j == 2) {
                    continue outer;
                }
                System.out.print(i);
                System.out.println(j);
            }
        }
    }
}
```