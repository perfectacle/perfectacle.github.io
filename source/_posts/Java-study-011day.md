---
title: (Java) 자바의 정석 3판 011일차 정리
category: [Programming, Java]
tag: [Java, 자바의 정석]
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
        num = 1;
        isKwang = true;
        // this(1, true); 이 한줄로 커버 되고 이래야 유지보수 측면에서도 용이하다.
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
 
