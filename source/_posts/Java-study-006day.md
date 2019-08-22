---
title: (Java) 자바의 정석 3판 006일차 - 배열
date: 2017-01-24 10:17:58
category: [Note, Java]
tag: [Java, 자바의 정석, 배열]
---
![](/images/Java-study-006day/thumb.png)

## 배열
Java에서는 길이가 0인 배열의 선언도 가능하다.  
또한 길이는 int 범위의 양의 정수이다.  
```java
import java.util.Arrays;

public class test2 {
    public static void main(String[] args) {
        // 둘 다 가능하지만 후자가 C/C++에서 먹히는 스타일이라 이식성이 높다고 생각한다.
        int[] num = new int[5];
        boolean flag[] = new boolean[5];

        // 배열을 초기화하지 않으면 기본값으로 초기화 돼서 나온다.
        for(int i=0; i<num.length; i++) System.out.println(num[i]); // 0
        for(int i=0; i<flag.length; i++) System.out.println(flag[i]); // false

        double num2[] = new double[]{1.1, 4.5}; // 선언과 동시에 초기화.
        double num3[] = new double[5]{1.1, 4.5}; // 길이를 지정해주면 오류가 난다.
        double num4[] = {1.5, 3.14, 15}; // 선언과 동시에 초기화 할 때는 new 연산자를 뺄 수 있다.
        
        // 선언과 초기화를 따로 할 때는 new 연산자를 써서 할당까지 해주어야 한다.
        double num5[];
        num5 = new double[]{33.123, 51.792};
        
        // 아래와 같은 경우를 불허한다.
        double num6[] = new double[123];
        num6 = {123.22, 33};

        // 수정할 때는 new 연산자를 써서 새로 만들어줘야한다.
        num2 = new double[]{123, 456, 111.33};
        
        // 아래 세 문장은 배열의 길이가 0이다.
        int num7[] = new int[]{};
        int num8[] = new int[0];
        int num9[] = {};
        
        // import java.util.Arrays;
        // java 패키지의 utill 패키지의 Arrays 클래스에 있는 toString이라는 메소드를 쓴다.
        System.out.println(Arrays.toString(num4)); // [1.5, 3.14, 15.0]
        
        // char 배열은 for 문이나 다른 메소드를 안 써도 된다.
        char ch[] = {'h', 'e', 'l', 'l', 'o'};
        System.out.println(ch); // hello
    }
}
```

### 배열을 복사하는 방법
* 하드코딩(비효율적)  
```java
import java.util.Arrays;

public class test2 {
    public static void main(String[] args) {
        // 배열의 길이를 늘리고 싶다고 생각하면 아래와 같이 복사해야한다.
        int arrNum[] = {1, 2, 3, 4, 5};
        int arrNumLen = arrNum.length;
        // 배열의 길이가 너무 길어지면 메모리에 부담이 되므로 x2 정도가 적당하다.
        int tmp[] = new int[arrNumLen*2];

        // for 문을 돌리는 부분에서도 상당한 비용을 소모한다.
        for(int i=0; i<arrNumLen; i++) {
            tmp[i] = arrNum[i];
        }
        
        arrNum = tmp;
        // 원본 배열과의 참조 관계가 끊겼다는 걸 알 수 있다.
        // 즉 원본 배열 [1, 2, 3, 4, 5]는 가비지 컬렉팅 대상이 된다.
        System.out.println(arrNum.length); // 10
        System.out.println(Arrays.toString(arrNum)); // [1, 2, 3, 4, 5, 0, 0, 0, 0, 0]
    }
}
```

* 내장된 API 사용(효율적)  
```java
import java.util.Arrays;

public class test2 {
    public static void main(String[] args) {
        // 배열의 길이를 늘리고 싶다고 생각하면 아래와 같이 복사해야한다.
        int arrNum[] = {1, 2, 3, 4, 5};
        int arrNumLen = arrNum.length;
        // 배열의 길이가 너무 길어지면 메모리에 부담이 되므로 x2 정도가 적당하다.
        int tmp[] = new int[arrNumLen*2];

        // for 문은 요소 하나하나마다 접근하지만
        // 배열은 연속된 메모리 공간이라는 점을 활용하여
        // arraycopy 메소드는 하나의 값으로 취급하여 접근한다고 한다.
        System.arraycopy(arrNum, 0, tmp, 0, arrNumLen);

        arrNum = tmp;
        // 원본 배열과의 참조 관계가 끊겼다는 걸 알 수 있다.
        // 즉 원본 배열 [1, 2, 3, 4, 5]는 가비지 컬렉팅 대상이 된다.
        System.out.println(arrNum.length); // 10
        System.out.println(Arrays.toString(arrNum)); // [1, 2, 3, 4, 5, 0, 0, 0, 0, 0]
    }
}
```

### String 클래스의 배열
```java
public class test2 {
    public static void main(String[] args) {
        String str[] = new String[3]; // [null, null, null]
        
        // String은 기본형이 아니기 때문에 전자와 같이 써야하지만 후자와 같이 간편히 쓰는 걸 허용한다.
        // 그리고 기본형이 아닌 참조 변수이기 때문에 값이 아닌 주소가 아닌 객체의 주소가 담겨있다.
        // 객체의 주소는 그냥 임의대로 넣은 거니 크게 의미를 담지 말길 바란다.
        String str2[] = {new String("asdf"), new String("qwer")}; // [0x100, 0x200]
        String str3[] = {"asdf", "qwer"}; // [0x400, 0x500]
    }
}
```

String 클래스는 char 배열에 기능을 추가하여 확장한 것.  
객체 지향 이전의 절차 지향의 C언어의 경우에는  
데이터와 기능을 따로 다루었지만(그래서 char 배열로 문자열을 표현),  
객체 지향 개념인 Java에서는 데이터와 그와 관련된 기능을 하나의 클래스로 묶음.  
기능 = 함수 = 메소드라고 보면 된다.  

하지만 char 배열과 달리 String 클래스는 내용의 변경이 불가능하다.  
변경 가능한 String 클래스는 StringBuffer라는 클래스가 따로 있다.
```java
public class test2 {
    public static void main(String[] args) {
        String str = "asd";
        str += "8"; // 변경되는 게 아니라 새로운 문자열이 생성된 것이다.
        System.out.println(str); // asd8
    }
}
```

String 클래스와 char 배열의 변환은 아래와 같다.  
```java
public class test2 {
    public static void main(String[] args) {
        char ch[] = {'h', 'i'};
        String str = new String(ch);
        char ch2[] = str.toCharArray();
    }
}
```

### 향상된 for문
```java
public class test2 {
    public static void main(String[] args) {
        int nums[] = {4, 5, 6};
        for(int num : nums) {
            num = 1; // 값이 변경 될까?
        }
        for(int num : nums) {
            System.out.print(num ); // 4 5 6
        }
        System.out.println();
        
        int nums2[][] = {
                {1, 2, 3},
                {4, 5, 6}
        };
        // 이중 배열 안에 있는 놈도 배열이므로
        // int num2[]와 같이 해줘야 함.
        for(int num2[] : nums2) {
            for(int num : num2) {
                System.out.print(num);
            }
            System.out.println();
        }
    }
}
```

### 다차원 배열
```java
public class test2 {
    public static void main(String[] args) {
        int nums[][] = new int[3][];
        // 아래와 같은 형태의 배열이 됨.
        // 정사각형이 아닌 배열을 만들 수 있게 됨.
        // int int
        // int int int
        // int int int int
        nums[0] = new int[2];
        nums[1] = new int[3];
        nums[2] = new int[4];
        // 아래와 같은 것도 가능하다.
        int nums2[][] = {
                {1, 2},
                {1, 2, 3},
                {1, 2, 3, 4}
        };
    }
}
```

가변 배열 문제만 보고 있다보니 드럽게 재미없다.  
좀 쉬다가 다른 공부나 해야지...

\+ 내용 추가(170125)
## 연습문제 오답 정리
* 배열의 잘못된 선언 및 초기화  
b. int[] arr = {1,2,3,}; // 마지막의 쉼표는 있어도 상관없음.  
d. int[] arr = new int[5]{1,2,3,4,5}; // 두 번째 대괄호[]에 숫자 넣으면 안됨.  
e. int arr[5]; // 배열을 선언만 할 때는 배열의 크기를 지정할 수 없음.