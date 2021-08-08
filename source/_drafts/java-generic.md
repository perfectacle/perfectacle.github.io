---
title: (Java) 제네릭
category: [Programming, Java]
tag: [Java, Java5, Generic]
---
![](java-generic/thumb.png)  

JAVA5에 새로 나온 기능이다.  

## 사용 이유
* 메소드 오버로딩 하기가 귀찮을 때  
비슷비슷한 로직인데 매개변수 타입마다 일일이 지정해주기란 매우 귀찮을 것이다.  
동일한 로직이 반복되고 하나로 커버가 가능할 때 쓰면 유용하다.  
```java
public class Box {
    void a(int b) {
        // 동일한 로직1
    }
    void a(long b) {
        // 동일한 로직1
    }
    String b(int a) {
        // 동일한 로직2
        return null;
    }
    int b2(int a) {
        // 동일한 로직2
        return 0;
    }
}
```
위의 일반적인 코드를 어떻게든 줄여보자.    
```java
public class Box2 {
    void a(Object b) {
        // 동일한 로직1
    }
    Object b(int a) {
        // 동일한 로직2
        return null;
    }

    public static void main(String[] args) {
        Box2 box2 = new Box2();
        String b = (String)box2.b(1);
        String b = (String)box2.b(1);
    }
}
```
상속 관계에 있어서 최상위 조상(부모) 객체인 Object를 사용하면 된다.  
하지만 형변환이 매우 귀찮아진다.  

이럴 때 제네릭을 쓰면 동일 로직 메소드 오버로딩과 귀찮은 형변환을 말끔히 해결해준다.  
 

* 