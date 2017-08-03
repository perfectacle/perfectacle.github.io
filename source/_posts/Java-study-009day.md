---
title: (Java) 자바의 정석 3판 009일차 정리
date: 2017-02-11 13:07:43
category: [Note, Java]
tag: [Java, 자바의 정석]
---
![](thumb.png)

어제는 친구들이랑 노느라 공부를 조금 밖에 못 했다.  
그만큼 오늘은 좀 빡시게 달려야겠다.  

## 재귀함수(recursive function)
함수 내에서 자기 자신을 호출하는 것이다.  
배열의 요소를 모두 더하는 메소드는 아래와 같이 작성이 가능하다.  
```java
class test {
    static int sumArr(int[] arr) {
        int sum = 0;
        for(int num : arr) {
            sum += num;
        }
        return sum;
    }
    public static void main(String[] args) {
        int arr[] = {1, 2, 4, 5 , 8, 9};
        int sum = sumArr(arr);
        System.out.println(sum);
    }
}
```
이걸 재귀함수로 바꾸면 아래와 같다.  
```java
class test {
    static int sumArr(int[] arr, int i) {
        if(i < arr.length) { // 재귀함수를 호출하는 조건
            return arr[i] + sumArr(arr, i+1);
        }
        // 재귀함수를 탈출하는 조건
        return 0;
    }
    public static void main(String[] args) {
        int arr[] = {1, 2, 4, 5 , 8, 9};
        int sum = sumArr(arr, 0);
        System.out.println(sum);
    }
}
```
위에서 보듯이 재귀 함수에서는 두 가지 조건이 중요하다.  
1. 호출 조건  
이게 없으면 재귀함수를 호출하지 않을 것이고, 재귀함수라 불릴 수가 없다.  
2. 탈출 조건  
이게 없으면 stack에 무한정 재귀함수가 쌓이게 될 것이다.  
이렇게 되면 가용 가능한 메모리 영역을 넘어설 것이다.  
이 때 stack overflow가 발생하는 것이다.  
아래와 같이 말이다.  
```java
class test {
    public static void main(String[] args) {
        // Exception in thread "main" java.lang.StackOverflowError
        main(null);
    }
}
```
for문에 비해 재귀함수는 stack의 많은 공간을 차지하게 된다.  
또한 매개 변수 복사 및 복귀할 주소 저장 등등의 추가적인 작업이 발생해서 더 느리다.  
그럼에도 불구하고 재귀함수가 존재하는 이유는 논리적인 간결함이 있기 때문이다.  
즉 가독성이 좋아져서 유지 보수 함에 있어서 한결 용이해진다는 소리이다.  
반복문을 썼을 때 코드가 복잡해져서 한 눈에 파악하기 어려운 경우,  
재귀함수를 한번 고려해보면 좋을 것 같다.  
하지만 재귀함수는 퍼포먼스가 안 좋아지고, 엄청난 반복을 통해 호출하는 경우에는  
stack overflow 등등 고려해야할 내용이 있다는 점은 유념해서 써야한다.

## 클래스 설계하기
### 멤버 변수(클래스 변수 & 인스턴스 변수) 설계하기
1. 모든 인스턴스에 공통적으로 사용해야하는 변수에는 static 키워드를 붙여 클래스 변수로 만들어준다.  
인스턴스가 생성되기 전에 프로그램이 시작되면 자동적으로 메모리의 Method Area(Data) 영역에 적재된다.  
모든 인스턴스가 동일한 주소를 참조하므로 값을 공유하게 된다.  
공통적으로 사용하려면 값을 공유해야하므로 클래스 변수로 만들어줘야한다.  
프로그램이 종료될 때까지 메모리에 계속 적재돼있는다.  
`클래스 이름.변수`와 같이 사용한다.  
2. 인스턴스 마다 따로 사용해야하는 변수에는 static을 붙이지 않아 인스턴스 변수로 만들어준다.  
프로그램이 시작되어도 메모리에 자동적으로 적재되지 않는다.  
new 연산자와 생성자 호출로 인스턴스를 생성해야 비로소 메모리의 Heap 영역에 적재된다.  
각각의 인스턴스가 다른 주소를 참조하므로 개별적으로 값을 가지게 된다.  
참조 관계가 끊기는 순간 가비지 컬렉터가 메모리에서 자동적으로 회수해간다.(해제한다.)  
`인스턴스 이름.변수`와 같이 사용한다.

### 메소드(멤버 함수, 클래스 메소드 & 인스턴스 메소드) 설계하기
1. 인스턴스 변수를 사용하지 않는 메소드는 static 키워드를 붙여 클래스 메소드로 만드는 게 일반적이다.  
인스턴스가 생성되기 전에 프로그램이 시작되면 자동적으로 메모리의 Method Area(Data) 영역에 적재된다.  
하지만 인스턴스 변수가 메소드 내에 존재한다면,  
존재하지 않는 변수(메모리 공간 상에 할당되지 않은 변수)를  
참조해야하는 경우가 생기게 되므로 오류를 유발하게 된다.  
또한 static 키워드를 붙이지 않으면 실행 시 호출되어야할  
메소드를 찾는 과정이 추가적으로 필요해 퍼포먼스 적으로 안 좋다.
프로그램이 종료될 때까지 메모리에 계속 적재돼있는다.  
`클래스 이름.메소드()`와 같이 사용한다.  
2. 인스턴스 변수를 사용하는 경우에는 static 키워드를 붙이지 않아 인스턴스 메소드로 만들어야한다.  
프로그램이 시작되어도 메모리에 자동적으로 적재되지 않는다.  
생성자 함수를 호출해서 인스턴스를 생성해야 비로소 메모리의 Heap 영역에 적재된다.  
인스턴스 변수는 인스턴스가 생성되어야지만 메모리에 적재되고, 비로소 사용할 수 있게 된다.  
이런 인스턴스 변수를 쓰려면 인스턴스가 생성된 이후이므로,  
메소드도 인스턴스 변수가 생성된 이후에 사용이 가능해지는 것이므로  
클래스 메소드(인스턴스 변수가 생성되기 이전에 생성됨)로 선언하면 안된다.  
참조 관계가 끊기는 순간 가비지 컬렉터가 메모리에서 자동적으로 회수해간다.(해제한다.)  
`인스턴스 이름.메소드()`와 같이 사용한다.  
```java
class test {
    // 멤버 변수 중 인스턴스 변수
    int a=3, b=2;

    // 인스턴스 변수를 쓰므로 인스턴스 메소드로 만들어줌.
    int add() {
        return a+b; // 인스턴스 변수
    }

    // 인스턴스 변수를 쓰지 않으므로 클래스 메소드로 만들어줌.
    static int add(int a, int b) { // 매개 변수(Parameter) a, b
        return a + b; // 지역 변수
    }

    public static void main(String[] args) {
        // 클래스 변수(변수, 메소드)는 프로그램이 실행되는 순간 자동적으로 메모리의 Method Area(Data)에 할당된다.
        // 같은 클래스 내에 존재하는 클래스 변수(변수, 메소드)는 클래스 이름 생략이 가능하다.
        System.out.println(add(1, 2)); // 3, 인자(Argument)로 1과 2를 넘겨준 클래스 메소드

        // 인스턴스 변수(변수, 메소드)는 생성자를 통해 인스턴스를 생성하기 전까지 메모리의 Heap에 할당되지 않는다.
        test t = new test();
        System.out.println(t.add()); // 5, 인스턴스 변수인 t.a와 t.b를 이용한 인스턴스 메소드
    }
}
```

```java
class test {
    // 멤버 변수 중 인스턴스 변수
    int a=3, b=2;
    // static int c = a; // 에러
    // static 컨텍스트에서는 인스턴스 멤버를 사용하려면 먼저 인스턴스를 생성해줘야함.
    static int c = new test().a;

    int add() {
        // 인스턴스 컨텍스트에서는 따로 처리해주지 않아도 됨.
        // 인스턴스 멤버가 존재한다는 것은
        // 클래스 멤버도 존재한다는 가정이기 때문.
        return a+b+c;
    }

    static int add2() {
        // return c + a + b; // 에러
        // static 컨텍스트에서는 인스턴스 멤버를 사용하려면 먼저 인스턴스를 생성해줘야함.
        // 클래스 멤버가 존재해도 인스턴스 멤버가 존재하지 않을 수도 있기 때문임.
        // 이럴 경우에는 클래스 메소드가 아닌 인스턴스 메소드를 권장하는 바임.
        test t = new test();
        return t.a + t.b + c;
    }
}
```

## 메소드 오버로딩(overloading)과 오버라이딩(overriding)  
두 개가 너무 헷갈려서 간단하게 정리한다.  
1. 오버 라이딩  
ride: 타다  
부모 클래스로 올라`탄다`라는 생각으로 외웠다.  
상속받은 부모 클래스의 메소드를 `재정의`하는 것.  
2. 오버 로딩  
다형성, 메소드 이름이 똑같아도  
`매개 변수의 타입`, `매개 변수의 갯수`에 따라  
호출되는 메소드가 다른 것을 의미.  
`매개 변수의 이름`과 `반환 타입`은 중요치 않다.  
load: 적재하다  
원래는 하나의 메소드 이름에는 하나의 메소드만 적재해야하는데  
그걸 초과한 하나의 메소드 이름에 여러 메소드를 적재하기 때문에  
이런 이름이 붙은 게 아닐까 싶다.  
이는 동적 타입 언어인 JS에는 없는 기능이다.  

## 가변 인자(variable arguments)  
정적 타입 언어인 Java에서는 매개 변수의 갯수가 고정적이었다.  
동적 타입 언어인 JS를 먼저 접한 나로선 매우 빡빡하다고 생각이 들었다.  
하지만 Java5부터는 동적으로 지정해줄 수 있게 됐다.  
```java
class test {
    static String concatenate(String str, String str2) {
        return str + str2;
    }

    static String concatenate(String str, String str2, String str3) {
        return str + str2 + str3;
    }

    static String concatenate(String str, String str2, String str3, String str4) {
        return str + str2 + str3 + str4;
    }
    // 매개변수가 n개인 메소드를 계속 오버로딩할 것인가?
}
```

가변인자를 쓰면 아래와 같이 바꿀 수 있다.  
```java
class test {
    static String concatenate(String ...str) {
        String result = "";
        for(String arg : str) {
            result += arg;
        }
        return result;
    }
}
```
가변인자는 내부적으로 배열을 생성한다.  
이런 비효율이 존재하므로 꼭 필요한 경우에만 가변 인자를 사용해야한다.

```java
class test {
    // 가변 인자는 제일 나중에 선언해야 한다.
    static String concatenate(String ...str, int num) { // 에러
        String result = "";
        for(String arg : str) {
            result += arg;
        }
        return result;
    }

    static String concatenate(String string, String... str) {
        String result = "";
        for(String arg : str) {
            result += arg;
        }
        return result;
    }

    static String concatenate(String... str) {
        String result = "";
        for(String arg : str) {
            result += arg;
        }
        return result;
    }

    public static void main(String[] args) {
        // String concatenate(String string, String... str)
        // String concatenate(String... str)
        // 둘 중에 뭘 호출해야할지 모르므로 컴파일 에러
        System.out.println(concatenate("2", "aass"));
    }
}
```