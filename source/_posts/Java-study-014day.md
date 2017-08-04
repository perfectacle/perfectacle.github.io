---
title: (Java) 자바의 정석 3판 014일차 - 오류(에러와 예외), 유용한 클래스
category: [Note, Java]
tag: [Java, 자바의 정석, 오류, 에러, 예외, 내장 클래스]
date: 2017-08-04 15:17:49
---
![](thumb.png)  

## 프로그램 오류
1. 컴파일 에러 - 컴파일 시에 발생하는 에러(오타, 타입 불일치 등등)  
2. 런타임 에러 - 실행 시에 발생되는 에러(파일을 열어야하는데 없는 파일을 인자로 넘겼을 때 등등)  
3. 논리적 에러 - 의도와 다르게 동작하는 것(돈이 음수가 된다거나 적에게 부딪혀도 죽지않는 것 등등)  

## 오류의 두 가지 종류
1. 에러(Error) - 발생하면 복구할 수 없는 심각한 오류(StackOverflowError, OutOfMemoryError 등등)  
2. 예외(Exception) - 발생하더라도 수습이 가능한 비교적 덜 심각한 오류(NullPointerException 등등)  

## 오류를 처리하는 클래스
Error와 Exception 모두 클래스로 만들어져있고, 그 둘의 부모 클래스는 Throwable 클래스이다. (물론 최상위에는 Object 클래스가 자리잡고 있다.)  

### 예외 클래스
Exception 클래스는 다음 두 카테고리로 나눌 수 있다.  
* Exception의 자식 클래스  
주로 외부의 영향(프로그램의 사용자)으로 발생한다.  
1. 존재하지 않는 파일의 이름을 입력(FileNotFoundException)  
2. 실수로 클래스 이름을 잘못 적은 경우(ClassNotFoundException)  
3. 입력한 데이터 형식이 잘못된 경우(DataFormatException)  
4. 기타 등등...

* RuntimeException의 자식 클래스(물론 RuntimeException 클래스도 Exception 클래스의 자식 클래스이다.)  
RuntimeException 클래스는 주로 개발자의 실수에 의해 발생한다.  
1. 배열의 범위를 벗어난 경우(IndexOutOfBoundException)  
2. 값이 null인 참조변수의 멤버를 호출한 경우(NullPointerException)  
3. 정수를 0으로 나눈 경우(ArithmeticException)  
4. 기타 등등...

### 예외 처리하기
**프로그램의 비정상 종료를 막고, 정상적인 실행상태를 유지하는 것**이 그 목표이다.  
이러한 예외 처리를 제대로 해놓지 않으면 프로그램이 뻗고, JVM의 예외처리기(UncaughtExceptionHandler)가 받아서 원인을 로그에 출력해준다.  

이러한 예외를 처리하기 위해서는 try-catch 문을 사용해야한다.  
try-catch 문은 문이 하나 뿐이어도 {} 블록의 생략이 불가능하다.  
```java
try {
    // 예외가 발생할 수 있는 구문
} catch(IndexOutOfBoundException e) {
    System.out.println("배열의 길이를 벗어났습니다!");
} catch(ArithmeticException e) {
    System.out.println("연산이 제대로 이루어지지 않았습니다!");
}
```
만약 저기서 NullPointerException이 발생했으면 예외 처리를 제대로 하지 않았으므로 프로그램이 뻗는다.  
매개변수의 다형성을 이용하면 아래와 같이 처리할 수 있다.  
```java
try {
    // 예외가 발생할 수 있는 구문
} catch(Exception e) {
    System.out.println("어디선가 예외가 발생했습니다!");
}
```
또한 예외가 발생하지 않았으면 try-catch 문 전체를 빠져나간다.  

또한 try나 catch문 안에 try-catch문이 또 들어갈 수 있다.  
이렇게 중첩해서 try-catch문을 사용할 때는 중복된 변수(IndexOutOfBoundException와 ArithmeticException를 모두 e로 선언하는 경우 등등)를 사용하면 에러가 난다.  
지역 변수는 상위 스코프의 변수를 덮어씌우는데 try-catch문은 안되나 보다.  

#### 멀티 catch
Java7부터 추가되었다.  
여기서 쓰이는 | 는 논리 연산자가 아니라 그냥 기호이고, 갯수에는 제한이 없다.  
```java
catch(IndexOutOfBoundException | ArithmeticException e) {}
// catch(ParentException | ChildException e) {}
// 부모 자식 관계인 경우에는 위 코드는 오류를 유발하므로 아래와 같이 써주자.
catch(ParentException e) {}
```

### 예외 처리 정보 얻기
* printStackTrace(): 예외 발생 당시 콜스택에 있던 메서드의 정보와 예외 메시지를 화면에 출력한다.  
* getMessage(): 발생한 예외 클래스의 인스턴스에 저장된 메시지를 얻는다.
```java
public class ExceptionTest {
    public static void main(String[] args) {
        try {
            System.out.println(1);
            System.out.println(2/0);
            System.out.println(3); // 위에서 에러나서 출력 안 됨.
        } catch (ArithmeticException e) {
            // java.lang.ArithmeticException: / by zero
            // at ch08.Exception.main(Exception.java:7)
            e.printStackTrace();
            System.out.println("예외 메시지:" + e.getMessage()); // 예외 메시지:/ by zero
        } catch (Exception e) {
            System.out.println("asdf");
        }
    }
}
```

switch-case 문처럼 instanceof가 true에 걸리는 녀석을 순서적으로 찾아가고 마지막에 default 마냥 Exception에 걸리게 된다.  
하지만 아래와 같이 하면 에러가 난다.  

```java
public class ExceptionTest {
    public static void main(String[] args) {
        try {
            System.out.println(1);
            System.out.println(2/0);
            System.out.println(3);
        } catch (Exception e) {
            System.out.println("asdf");
        }
        // java: exception java.lang.ArithmeticException has already been caught
        catch (ArithmeticException e) {
            // java.lang.ArithmeticException: / by zero
            // at ch08.Exception.main(Exception.java:7)
            e.printStackTrace();
            System.out.println("예외 메시지:" + e.getMessage()); // 예외 메시지:/ by zero
        }
    }
}
```

이미 먼저 예외 처리를 하고 있다고 아래서는 할 필요가 없다고 에러를 내고 있다.  

### 예외 발생시키기
정확하게 왜 일부로 예외를 발생시켜야하는지는 모르겠지만, 그런 경우가 있는 것 같다.  

```java
public class ThrowTest {
    public static void main(String[] args) {
        try {
            ArithmeticException e = new ArithmeticException("이거시 예외 메시지!");
            throw e;
            // throw new ArithmeticException("이거시 예외 메시지!");
        }
        // java.lang.ArithmeticException: 이거시 예외 메시지!
        // at ch08.ThrowTest.main(ThrowTest.java:6)
        catch (ArithmeticException e) {
            e.printStackTrace();
            System.out.println(e.getMessage()); // 이거시 예외 메시지!
        }
    }
}
```

```java
import java.io.IOException;

public class ThrowTest {
    public static void main(String[] args) {
        // RuntimeException의 자식 클래스가 아니면 컴파일 에러가 난다.
        // throw new IOException();
        
        // RuntimeException의 자식 클래스면 런타임 에러가 난다.
        throw new ArithmeticException();
    }
}
```

### 메소드에 예외 선언하기
다른 프로그래밍 언어에서는 메소드에 예외를 선언할 수 없었다.  
따라서 해당 메소드가 어떤 예외를 발생할지 모르므로 노련한 프로그래머야 해당 메소드를 쓸 때 예외처리를 잘 하겠지만,  
경험이 적은 개발자 입장에서는 다양한 테스트를 통해 어떤 상황에서 어떤 Exception이 발생하는지 순전히 노가다(?)로 알아볼 수 밖에 없었다.  
하지만 자바에서는 메소드에서 발생할 수 있는 예외를 명시해서 사용하는 측에서 어떻게 대비해야하는지를 알려줄 수 있다.  

**주의해야할 것은 메소드에 예외를 선언한다고 해서 예외 처리까지 떠맡게 되는 것은 아니다.**  
```java
public class MethodException {
    static void method() throws NullPointerException {
        method2();
    }
    static void method2() throws NullPointerException {
        throw new NullPointerException();
    }

    public static void main(String[] args) {
        // Exception in thread "main" java.lang.NullPointerException
        // at ch08.MethodException.method2(MethodException.java:8)
        // at ch08.MethodException.method(MethodException.java:5)
        //at ch08.MethodException.main(MethodException.java:12)
        method();
    }
}
```
main이 method를 호출했고, method가 method2를 호출했고 method2에서 NullPointerException 예외가 발생했다고 알려주고 있다.  
물론 다음과 같이 메소드 내에서도 예외를 처리할 수 있다.  

```java
public class MethodException {
    static void method() throws NullPointerException {
        method2();
    }
    static void method2() throws NullPointerException {
        try {
            throw new NullPointerException();
        } catch (NullPointerException e) {
            System.out.println(e.getMessage() + " 예외 처리"); // null 예외 처리
        }
    }

    public static void main(String[] args) {
        method();
    }
}
```
이 예제는 main 메소드는 예외가 발생했다는 사실도 모른다는 것이다.  
내 생각에는 메소드에서 처리할 바에는 저렇게 throws로 명시해줄 필요가 없을 것 같다.  
throws 키워드로 던져주는 예외는 메소드 사용자가 처리해야할 예외인데,  
미리 발생할 예외를 메소드 개발자가 미리 처리하는데 굳이 throws로 어떤 예외가 발생했는지 알려줄 필요가 있나 싶다.  
따라서 메소드 사용자에게 예외 처리를 미뤄버리면 다음과 같이 구현하면 될 것이다.  
```java
public class MethodException {
    static void method() throws NullPointerException {
        method2();
    }
    static void method2() throws NullPointerException {
        throw new NullPointerException();
    }

    public static void main(String[] args) {
        try {
            method();
        } catch (NullPointerException e) {
            System.out.println(e.getMessage() + " 예외 처리"); // null 예외 처리
        }
    }
}
```
이 예제는 main 메소드도 예외가 발생했다는 것을 알게 된다.

### finally
```java
public class FinallyTest {
    static void method() {
        try {
            System.out.println("try");
            return;
        } catch (Exception e) {
            System.out.println("catch");
        } finally {
            System.out.println("finally");
        }
    }
    public static void main(String[] args) {
        // try
        // finally
        method();
    }
}
```
타짜를 보면 손은 눈보다 빠르듯, finally는 함수를 종료시키는 return 보다 빠르다.  

### 자동 자원 반환
주로 I/O와 관련된 클래스를 처리할 때 유용하다.  
```java
try {
    FileInputStream fis = new FileInputStream("score.dat");
    DataInputStream dis = new DataInputStream(fis);
    // 코드..
} catch(IOException e) {
    e.printStackTrace();
} finally {
   try {
       if(dis != null) dis.close();
   } catch(IOException e) {
       e.printStackTrace();
   }
}
```
예외가 나던 안 나던 자원은 close(), 반환해줘야한다.  
하지만 이 close에서도 예외가 일어날 수도 있어서 또 예외 처리를 해줘야한다.  
가독성은 물론이고 문제가 있는 코드란다. (자세히는 모르겠다.)

그래서 JDK7에서는 try-with-resources 문이 생겼다.  
```java
try(FileInputStream fis = new FileInputStream("score.dat");
    DataInputStream dis = new DataInputStream(fis)) {
    // 코드..
} catch(IOException e) {
    e.printStackTrace();
}
```
문장이 두 개인 경우 ;를 구분자로 사용하며 finally 없이도 자원이 자동으로 반환된다.  
이렇게 자동으로 반환되는 자원이라면 클래스(DataInputStream 등등)가 AutoCloseable 인터페이스를 구현한 것이어야만 한다.  
자세히 모르니 나중에 다시 보자.  

## java.lang 패키지
### Object 클래스
#### equals 메소드
최상위 클래스 Object에는 equals 메소드가 있고 다음과 같이 구현돼있다.  
```java
public boolean equals(Object obj) {
    return (this == obj);
}
```
둘이 같은 객체를 참조하고 있는지 비교하고 있는 것이다.  
그렇다면 String 클래스에서 어떻게 문자열을 가지고 비교하는 것일까?  
String도 클래스이고, 인스턴스 생성시 항상 메모리에 비어있는 공간에 할당될텐데 어떻게 equals 메소드로 두 문자열의 값을 비교하는 것일까?  
바로 equals 메소드를 오버라이딩하는 것이다.  

String 클래스는 다음과 같이 구현돼있다.  
```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence {
    // 결국에 다뤄지는 것은 C언어와 마찬가지로 문자 배열로 다루게 된다.
    private final char value[];
    
    public boolean equals(Object anObject) {
        if (this == anObject) { // 같은 객체를 참조 하고 있으면
            return true;
        }
        if (anObject instanceof String) { // 인자가 String 클래스의 인스턴스인 경우
            // 기존에 넘어온 것은 Object 참조 타입이므로 Object 멤버 밖에 사용이 불가능하다.  
            // 따라서 String 클래스의 멤버들을 사용하려면 String 클래스로 형변환(다운 캐스팅) 해줘야 한다.
            String anotherString = (String)anObject;
            int n = value.length;
            if (n == anotherString.value.length) { // 둘의 길이가 같다면
                char v1[] = value;
                char v2[] = anotherString.value;
                int i = 0;
                while (n-- != 0) { // 둘의 문자 하나 하나를 각각 비교
                    if (v1[i] != v2[i])
                        return false;
                    i++;
                }
                return true;
            }
        }
        return false;
    }
}
```

#### hashCode 메소드
해싱은 데이터 관리 기법 중의 하나인데, 다량의 데이터를 저장하고 검색하는 데 유용하다.  
해시 함수는 찾고자하는 값을 입력하면 그 값이저장된 위치를 알려주는 해시 코드를 반환한다.  

일반적으로 해시코드가 같은 두 객체가 같은 것지 존재하는 것이 가능하지만(String 클래스),  
hashCode 메소드를 오버라이딩 하지 않는 한 Object 클래스의 hashCode 메소드를 사용할 것이고  
이 메소드는 객체의 주소값을 이용해서 해시코드를 만들어 반환하기 때문에 서로 다른 두 객체는 절대 같은 해시코드를 가질 수 없다.  

해싱기법을 사용하는 HashMap이나 HashSet 같은 클래스에 저장할 객체라면 반드시 이 메소드를 오버라이딩 해주자!  

#### toString 메소드
기본적으로 println이나 print 메소드에서 인스턴스를 넣으면 자동적으로 toString 메소드가 호출된다.  
그리고 toString 메소드를 오버라이딩 하다보면 항상 public 접근 지정자를 왜 써야하는지 의문이었다.  
그에 대한 해답은 Object 클래스가 어떻게 toString 메소드를 구현했는지 보면 된다.  
```java
public String toString() {
    return getClass().getName() + "@" + Integer.toHexString(hashCode());
}
```
바로 public 접근 지정자를 쓰고 있다.  
메소드 오버라이딩을 하기 위해선 부모 클래스의 메소드보다 더 좁은 접근 지정자를 지정할 수 없는데,  
public 보다 넓은 접근 지정자는 없으니 무조건 public으로 접근 지정자를 지정하고 오버라이딩을 해줘야하는 거였다.  

#### clone 메소드
Object 클래스의 clone 메소드를 보면 다음과 같다.  
```java
protected native Object clone() throws CloneNotSupportedException;
```

무조건 CloneNotSupportedException 예외를 던진다.  
따라서 클래스에서 따로 이 예외를 처리해줘야한다.  

```java
public class TV implements Cloneable {
    public Object clone() {
        Object obj = null;
        try {
            // TV 클래스의 부모 클래스는 Object,
            // Object 클래스의 clone 메소드는 아래와 같은 예외를 유발하므로 예외 처리를 이렇게 해줘야함.
            obj = super.clone();
        } catch (CloneNotSupportedException e) {}
        return obj;
    }
}


class Test {
    public static void main(String[] args) {
        TV t = new TV();
        // 반환된 타입은 Object 객체니 TV 객체로 형변환 해줘야한다.
        TV t2 = (TV)t.clone();
    }
}
```
또한 clone을 하기 위해서는 클래스를 Cloneable 인터페이스를 구현해야한다.  
왜냐하면 코드의 안전성을 보장하기 위한 것인데 클래스 개발자가 명시적으로 **클래스 복제를 허락**했다고 알리는 것과 같다.  

#### 공변 반환 타입
위 예제에서 clone을 하고 나서 Object로 반환했으니 TV 객체로 형변환해야하는 과정이 필요했다.  
하지만 JDK5부터는 공변 반환 타입이란 게 나왔다.  
뭔소린지 나도 모르겠으니까 코드로 보자.  
```java
public class TV implements Cloneable {
    public TV clone() {
        Object obj = null;
        try {
            obj = super.clone();
        } catch (CloneNotSupportedException e) {}
        return (TV)obj;
    }
    
    // 아래 코드는 에러를 유발한다.
    // public TV2 toString() {
    //        return new TV2();
    // }
}

class CaptionTV extends TV implements Cloneable { }

class TVCR extends CaptionTV implements Cloneable {
    public CaptionTV clone() {
        // 부모 클래스의 메소드에서 이미 예외 처리를 하고 있기 때문에 얘는 예외 처리를 안 해줘도 된다.
        Object obj = super.clone();
        return (CaptionTV)obj;
    }
    
}

class Test {
    public static void main(String[] args) {
        TV t = new TV();
        TV t2 = t.clone();
    }
}
```
원래대로 라면 메소드 오버라이딩 조건에 의해 선언부는 완전히 일치해야하기 때문에 return 타입도 일치해야하기 때문에  
`public Object clone()`이 돼야하는데 TV instanceof Object가 true이기 때문에 `public TV clone()`도 가능해진 것이다.
TVCR의 clone 메소드도 마찬가지다.  

이런 clone 메소드는 배열, Vector, ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap, Calendar, Date와 같은 클래스에서도 사용이 가능하다.  

#### 얕은 복사와 깊은 복사
clone 메소드는 객체의 값만 복사하므로 그 값이 참조하고 있는 객체를 또 복사하거나 하지 않는 Shallow Copy(얕은 복사)를 수행한다.  
멤버 변수가 기본값이 아닌 참조타입(클래스)인 경우가 이에 해당한다.  
기본적으로 deep copy는 해당 클래스의 인스턴스를 새로 반환하게 끔 해야하는 것 같다.  
JS처럼 hierarchical(계층적) 구조여서 재귀함수로 얕은 복사를 계속해서 수행하는 방식과는 다르다.  

#### Class 객체
**이름이 Class인 객체**  
```java
public final class Class implements ... {}
```
클래스마다 getClass라는 메소드를 가지고 있고, 이 메소드는 자신의 Class 객체를 반환한다.  
따라서 클래스마다 Class 객체는 단 하나만 가지고 있다.  
이 Class 객체는 클래스 파일이 클래스 로더(ClassLoader)에 의해 메모리에 올라갈 때 자동으로 생성된다.  
클래스 로더는 실행 시에 필요한 클래스를 동적으로 메모리에 로드하는 역할을 한다.  
클래스 파일을 찾지 못하면 ClassNotFoundException을 발생시키고, 찾으면 클래스 파일을 읽어서 Class 객체로 변환한다.  

클래스 객체를 얻기 위해서는 세 가지 방법이 있다.  
1. `Class c = new Card().getClass();`, 생성된 객체(인스턴스)로부터 얻는 방법  
2. `Class c = Card.class;`, 클래스 리터럴(*.class)로부터 얻는 방법  
3. `Class c = Class.forName("Card");`, 클래스 이름으로부터 얻는 방법  

또한 인스턴스를 만드는 방법도 두 가지 방법이 있다.  
1. `Card card = new Card();`, new 연산자를 이용해서 인스턴스 생성  
2. `Card card = c.newInstance();`, 위에서 구한 Class 객체를 이용해서 인스턴스 생성

### String 클래스
immutable(변경 불가능한) 클래스이다.  
String 클래스에는 문자열을 저장하기 위해 문자형 배열 변수인 `char[] value`를 인스턴스 변수로 정의해놓고 있다.  
인스턴스 생성 시 매개변수로 입력하는 문자열은 이 인스턴스 변수(문자형 배열 변수 value)로 저장된다.  
따라서 + 연산자를 이용하여 문자열을 결합한다면 새로운 인스턴스를 생성한다고 보면 된다.  
따라서 + 연산자를 이용하여 계속해서 새로운 인스턴스를 생성하면 아무리 GC(Garbage Collector)가 회수해간다 해도 메모리 공간 측면에서 좋지 않을 것이다.  

#### "abc" vs new String("abc")
문자열을 생성하는데도 위의 두 가지 방법이 있다.  
나는 편의를 위해서 그냥 new String()의 생략이 가능한 줄 알았는데 그게 아니었다.  
1. `"abc"`, 이미 인스턴스가 존재하면 해당 인스턴스를 반환  
2. `new String("abc")`, 매번 새로운 인스턴스를 반환  

그러한 까닭에 `"abc" == "abc"`는 true이지만, `"abc" == new String("abc")`는 false인 것이다.  
그래서 어떤 방식으로 문자열을 생성했을지 모르니 문자열의 비교는 무조건 equals() 메소드를 사용하자.  

#### Constant Pool
```java
String a = "aa";
String a2 = "aa";
String a3 = "aa";
String b = new String("bb");
String b2 = new String("bb");
String b3 = new String("bb");
```
이 *.java 파일을 컴파일하고, 컴파일된 *.class 파일을 헥스 에디터로 열어보면  
aa는 단 한 번만 저장되고, bb는 세 번 저장돼있는 걸 볼 수 있다.  
Constant Pool이라는 상수 저장소에 바로 저 aa가 저장되게 되는 것이다.  

#### 문자형 배열에서 null의 부재?
기존에 C를 배웠을 때 문자 배열에서 맨 끝에 null 문자(\0)을 삽입해줬었다.  
이 null 문자를 만나는 순간이 배열의 끝이라는 걸 알려주기 위함이었다.  
하지만 Java에서는 따로 길이정보를 저장한다고 한다.  

#### 기본값
String도 클래스이다 보니 참조변수의 기본값인 null이 들어가는 줄 알았는데 빈 문자열인 ""으로 초기화 된다고 한다.  
```java
public String() {
    this.value = "".value;
}
```
char는 빈 문자열이 들어갈 수 없으므로 공백(' ')이 들어간다고 한다.  

#### join vs split
둘이 반대되는 개념이라고 보면 된다.  
1. join  
**배열**의 요소들 사이에 구분자를 **넣어서 문자열**로 반환한다.  
2. split  
**문자열**을 구분자로 **나누어서 배열**로 반환한다.  

#### int vs char
메소드의 매개변수를 보면 int인 것이 있고 ch인 것이 있는데 차이는 다음과 같다.  
1. int  
UTF-16(2Byte, 65536개의 문자)로도 감당이 안 되다보니 int(4Byte, 4294967296개의 문자)를 매개변수로 받는 것이다.  
뭐 이런 문자는 거의 안 쓴다고 보면 된다.  
2. char  
UTF-16 내에 존재하는 문자로 커버가 된다고 생각하는 매개변수이다.  

#### "" vs valueOf
자스에도 문자열로 변환하는 다양한 방법들이 있고, 자바에서도 마찬가지이다.  
"" 이 더 간결한데, 성능이 중요시 된다면 valueOf를 쓰라고 한다.  

#### parseInt vs valueOf
둘 다 동일한 메소드이다.  
valueOf 내부를 보면 아래와 같이 parseInt를 호출하고 있다.  
아마 다른 클래스에서도 valueOf를 쓰기 때문에 통일성 때문에 추가된 게 아닐가 싶다.  
```java
public static Integer valueOf(String s) Throws NumberFormatException{
    return Integer.valueOf(parseInt(s, 10));
}
```

#### 기본형 <-> 문자열
| 기본형 -> 문자열          | 문자열 -> 기본형               |
|---------------------------|--------------------------------|
| String.valueOf(boolean b) | Boolean.parseBoolean(String s) |
| String.valueOf(char c)    | 문자를 문자로 바꿀 필요 없음.  |
| btye b도 int i와 동일     | Byte.parseByte(String s)       |
| short s도 int i와 동일    | Short.parseShort(String s)     |
| String.valueOf(int i)     | Integer.parseInt(String s)     |
| String.valueOf(long l)    | Long.parseLong(String s)       |
| String.valueOf(float f)   | Float.parseFloat(String s)     |
| String.valueOf(double d)  | Double.parseDouble(String s)   |

문자열에 숫자로 인식 가능한 + - . f d L과 같은 접두어, 접미어를 붙일 수 있다.
```java
class Test {
    public static void main(String args[]) {
        int a = Integer.parseInt("+100");
        float b = Float.parseFloat("+100d");
        System.out.println(a);
        System.out.println(b);
    }
}
```

### StringBuffer 클래스
StringBuffer 클래스도 기본적으로 char[]로 문자열을 처리한다.  
```java
public final class StringBuffer
    extends AbstractStringBuilder
    implements java.io.Serializable, CharSequence {
    /**
     * A cache of the last value returned by toString. Cleared
     * whenever the StringBuffer is modified.
     */
    private transient char[] toStringCache;
}
```

또한 기본적으로 16자리 공간을 차지하며 문자열보다 + 16자리 큰 버퍼를 가진다.  
```java
 public StringBuffer() {
    super(16);
}

public StringBuffer(String str) {
    super(str.length() + 16);
    append(str);
}
```

또한 기존 char[] 보다 더 긴 문자열을 추가하려면 기존의 문자열을 복사하고 더 긴 char[]을 만들고 기존의 것을 복사한 후 새로운 걸 붙여넣는 형태로 만들 것이다.  
append 메소드가 있는데 요놈은 문자열을 뒤에 추가하고 + 자기 자신의 주소를 반환해서 메소드 체이닝이 가능하다.

String 클래스는 equals() 메소드를 오버라이딩하여 비교가 가능하지만, StringBuffer 클래스는 오버라이딩하지 않아 문자열로 비교할 방법이 없다.  
```java
class Test {
    public static void main(String args[]) {
        StringBuffer s = new StringBuffer("asd");
        StringBuffer d = new StringBuffer("asd");
        // StringBuffer를 String으로 변환 후 비교를 진행해야한다.
        System.out.println(s.toString().equals(d.toString())); // true
    }
}
```

#### StringBuffer vs String
StringBuffer는 데이터의 변경이 가능한데 String은 데이터를 변경하는 게 아니라 새로운 인스턴스를 생성하는 것이다.  

#### StringBuffer vs StringBuilder
동기화는 StringBuffer의 성능을 떨어뜨린단다.  
또한 멀티 쓰레드로 작성된 프로그램이 아닌 경우에는 StringBuffer의 동기화는 불필요하게 성능만 떨어뜨린다.  
반면 StringBuilder는 멀티쓰레드에 안전(Thread Safe)하도록 동기화가 되어있단다.  
StringBuffer에서 쓰레드의 동기화만 뺀 게 StringBuilder란다.  
뭔 소린지 모르겠다.  
싱글 스레드면 StringBuilder가 더 좋다는 말같다.  
멀티 스레드면 StringBuffer를 쓰라는 건가...?  
근데 뭐 StringBuffer도 충분히 성능이 좋아서 크게 StringBuilder를 쓸 일은 없는 것 같다.  

### Math 클래스
Math 클래스는 PI, E 두개의 상수 외에는 전부 static 메소드이다.  
자동으로 메모리에 로딩되는 애들이기 때문에 굳이 생성자로 인스턴스를 만들어도 메모리 차지만 할 뿐, 추가적으로 이용 가능한 인스턴스 멤버가 없다.  
따라서 인스턴스를 생성할 필요가 없어서 클래스의 접근 지정자가 private이고 만들고 싶어도 만들 수 없다.  

#### 소수점 n째 자리까지 반올림하기
* Math.round()를 쓰면 **정수(Long)**로 반올림 한다.  
소수점 n째 자리까지 반올림해서 구하고 싶다면 10<sup>n</sup>를 곱하고 Math.round로 정수로 반올림 후에 10<sup>n</sup>로 다시 나누면 된다.  
이때 나눌 때는 정수로 곱하면 안되고 뒤에 .0이나 실수형의 접두어인 f나 d를 붙여주자.  
```java
class Test {
    public static void main(String[] args) {
        double d = 90.12345;
        Long i = Math.round(d * 100);
        d = i / 100.0;
        System.out.println(d); // 90.12
    }
}
```

#### 올림, 내림, 반올림  
* Math.ceil(): 올림  
* Math.floor(): 내림  
* Math.round(): 반올림  
* Math.rint(): 반올림  

Math.round vs Math.rint를 비교해보자.  
```java
class Test {
    public static void main(String[] args) {
        System.out.println(Math.round(1.1)); // 1
        System.out.println(Math.round(1.5)); // 2
        System.out.println(Math.round(-1.1)); // -1
        System.out.println(Math.round(-1.5)); // -1
        System.out.println(Math.round(-1.6)); // -2
        System.out.println(Math.rint(1.1)); // 1.0
        System.out.println(Math.rint(1.5)); // 2.0
        System.out.println(Math.rint(-1.1)); // -1.0
        System.out.println(Math.rint(-1.5)); // -2.0
        System.out.println(Math.rint(-1.6)); // -2.0
    }
}
```

#### 예외를 발생시키는 메소드
Java8에서 추가됐다.  
add 메소드는 결과만 반환하고 오버플로우(범위를 초과)가 발생했는지 얘기해주지 않는다.  
addExact 메소드는 오버플로우가 발생하면 ArithmeticException을 발생시킨다.  
여기서 negateExact라는 메소드도 있는데 단순히 부호를 바꿔주는 연산자인데 부호를 바꾸는 과정에서 어떻게 오버플로우가 발생하는지 알아보니 참 재밌는 것 같다.  
우선 a의 부호를 바꾸는 연산자는 -a이지만 내부적으로는 ~a+1로 돌아간다.  
내 말을 못 믿겠다면 아래 코드를 보고 원리를 이해해보자.  
```java
class Test {
    public static void main(String[] args) {
        int i = -2147483648;
        System.out.println(i); // -2147483648
        System.out.println(-i); // -2147483648
    }
}
```

~a는 십진수를 이진수로 바꾸고 비트를 전부 역전시키므로 a의 2의 보수를 구하게 된다.  
2의 보수 + 1은 음수이므로 ~a+1은 음수이다.  
그래서 그게 어쨌다는 건가... 싶으면 다음 내용을 보자.  

int는 4byte로 범위는 -2<sup>32-1</sup> ~ 2<sup>32-1</sup>-1, 즉 -2147483648 ~ 2147483647이다.  
-2147483648를 negate, 부호를 바꾼다고 생각해보자.  
~(-2147483648)+1을 구하면 되는 간단한 문제이다.  
-2147483648을 2진수로 표현하자면 다음과 같다.  
1000_0000_0000_0000_0000_0000_0000_000<sub>(2)</sub>  
이걸 2의 보수(~(-2147483648))를 구하면 다음과 같다.  
0111_1111_1111_1111_1111_1111_1111_1111<sub>(2)</sub>  
이 수는 int의 최대값인 2147483647이다.  
여기서 1을 더하면 다음과 같다.  
1000_0000_0000_0000_0000_0000_0000_000<sub>(2)</sub>  
다시 자기 자신으로 돌아왔다.  
최대값 + 1 == 최소값, 즉 오버플로우가 발생했다.  
따라서 아래와 같이 처리해줘야한다.  
```java
class Test {
    public static void main(String[] args) {
        int i = -2147483648;
        try {
            System.out.println(Math.negateExact(i));
        } catch (ArithmeticException e) {
            System.out.println("범위 초과!");
            System.out.println(Math.negateExact((long)i)); // 2147483648
        }
    }
}
```
단순히 부호를 바꾸는 연산자인데도 오버플로우가 발생할 수 있다는 사실이 참 신기하고 재미있다.  
따라서 negateExact라는 메소드가 필요한 것이다.  

#### Math vs StrictMath
Math 클래스는 최대한의 성능을 얻기 위해 OS의 메서드를 호출해서 사용한다.  
즉 OS에 의존적이라 결과가 달라질 수도 있다.  
StrictMath는 성능을 좀 포기하더라도 어디서나 동일한 결과를 보장받기 위한 클래스이다.  

#### 기타 메소드  
* Math.random(): 0.0 <= x < 1.0  
* Math.max(), Math.min(): 두 가지 인자를 받아서 둘 중에 누가 크고 작은지 알려줌.  
* Math.abs(): 절대값 알려줌. 

### 래퍼 클래스(Wrapper Class)
기본타입을 객체로 다루기 위한 클래스  

#### 오토 박싱 & 언박싱(autoboxing & unboxing)  
JDK5 이후에 등장했다.  
오토박싱은 기본값을 래퍼 객체의 인스턴스로 바꿔주는 걸 말한다.  
```java
class Test {
    public static void main(String[] args) {
       // 제네릭에는 기본값이 못 들어간다.
       Vector<Integer> v = new Vector<Integer>();
       v.add(10); // v.add(new Integer(10)) 이라고 컴파일러가 오토박싱 해줌.
    }
}
```
언박싱은 반대로 래퍼 객체의 인스턴스를 기본값으로 바꿔주는 걸 말한다.  
```java
class Test {
    public static void main(String[] args) {
        int i = 1;
        int i2 = new Integer("1"); // new Integer(1); 과 동일
        System.out.println(i + i2); // i + i2.intValue()로 컴파일러가 자동 언박싱 해준다.
    }
}
```

## java.util.Objects 클래스
Object 클래스의 보조 클래스이다.  
Math처럼 모든 메소드가 static이다.  
* isNull(Object obj), nonNull(Object obj): 딱 보면 뭐하는 놈인지 알 것이다. 둘은 정반대  
* requireNonNull(T obj)  
기존에는 아래와 같이 했어야 했다.  
```java
void setName(String name) {
    if(name == null) {
         try {
             throw new NullPointerException("name must not be null");
         } catch (NullPointerException e) {
             e.printStackTrace();
         }
     }
     this.name = name;
}
```

하지만 위 메소드를 쓰면 좀 더 줄일 수가 있다.  
```java
void setName(String name) {
    try {
        this.name = Objects.requireNonNull(name, "name must note be null");
    } catch (NullPointerException e) {
        e.printStackTrace();
    }
}
```

* compare(Object a, Object b, Comparator c)  
Object 클래스에는 equals만 있고 비교를 할 수 있는 메소드가 없는데 Objects 클래스에서 추가되었다.  
Comparator는 두 객체를 비교할 기준인 거 같다.  
크면 양수, 작으면 음수, 같으면 0을 반환한다. (아마 a가 기준일라나..??)  
String 클래스에서는 그냥 compareTo를 이용하거나 숫자는 부등호를 이용하면 될 것 같다.  
여튼 나중에 다시 알아보자.  

* equals  
기존 Object 클래스에서 equals를 비교하기 전에 null인지 아닌지도 비교를 해줬어야 했다.  
```java
if(a != null && a.equals(b)) {}
```

하지만 Objects 클래스의 equals를 쓰면 한결 편해진다.  
```java
if(Objects.equals(a, b)) {}
```

* deeqEquals(Object a, Object b)  
위 equals는 shallow equals라고 보면 된다.  
내부에 참조변수가 있으면 그녀석들은 비교하지 못한다.  
다차원 배열인 경우가 아마 그럴 것이다. 그럴 때 이 deepEquals를 쓰면 된다.  

* toString(Object o)  
equals와 마찬가지로 내부적으로 null을 검사해주는 것 이외에는 큰 차이가 없다.    
* toString(Object o, String nullDefault)  
null이면 기본으로 넣을 값을 지정해줄 수 있다.  

* hashCode(Object o)  
이것도 내부적으로 null을 검사해주는 것 외에는 큰 차이가 없다.  
null이면 0을 반환한다.  

### import static java.util.Objects.*을 한다면...?  
Objects 클래스까지 생략 가능하고 바로 메소드의 사용이 가능해진다.  
하지만 컴파일러는 자동적으로 java.lang.* 패키지도 넣어버리므로 Object 클래스까지 같이 import 된다.  
Objects 클래스와 Object 클래스는 메소드명이 겹치는 경우가 많아서 어떤 걸 써야할지 구분을 못 하는 경우가 있어서 이럴 때는 클래스명을 다 붙여줘야한다.  
