---
title: (Java) 자바의 정석 3판 015일차 - 유용한 클래스, 날짜와 시간 & 형식화, 컬렉션
category: [Note, Java]
tag: [Java, 자바의 정석, 내장 클래스, 날짜와 시간, 형식화]
date: 2017-08-04 15:17:49
---
![](/images/Java-study-016day/thumb.png)  

흠... 한 3일을 탱자탱자 논 거 같다...
어찌보면 아까운 시간이지만 쉼이 있어야 또 달릴 수 있는 거 같다.  
고고씽!

## 스택과 큐의 사용 사례  
* 스택 - 수식 계산, 수식 괄호 검사, undo/redo, 뒤로/앞으로  
* 큐 - history, 인쇄작업 대기 목록, 버퍼 

### pop(poll) vs peek  
전자는 마지막(처음) 녀석을 삭제하면서 반환  
후자는 삭제는 하지 않고 반환만   

## Deque(데크, 덱, 디큐, Double Ended Queue)
Queue의 변형으로 Deque는 양쪽 끝에 추가/삭제가 가능하다.  
스택으로 사용할 수도 있고 큐로도 사용이 가능하다.

| Deque        | Queue   | Stack  |
|--------------|---------|--------|
| offerFirst() | -       | -      |
| offerLast()  | offer() | push() |
| pollFirst()  | poll()  | -      |
| pollLast()   | -       | pop()  |
| peekFirst()  | peek()  | -      |
| peekLast()   | -       | peek() |

## Iterator, ListIterator, Enumeration  
컬렉션에 저장된 요소를 접근하는데 사용되는 인터페이스  
Enumeration은 Iterator의 구버전이며, ListIterator는 Iterator의 기능을 향상시킨 것이다.  
Enumeration은 컬렉션 프레임워크가 나오기 전에 나온 애라서 레거시 코드를 위한 것이고, 웬만하면 쓰지 말자.   

* Iterator 인터페이스  
컬렉션 프레임워크에서는 컬렉션에 저장된 요소들을 읽어오는 방법을 아래와 같이 표준화하였다.
```java
public interface Iterator {
    boolean hasNext();
    Object next();
    
    // 아래 두 메소드는 default 메소드이므로 구현하지 않아도 됨.
    // next 해온 요소를 컬렉션에서 삭제할지를 뜻하는 것 같다.
    // next 이후에 호출해야함.
    default void remove() {
        throw new UnsupportedOperationException("remove");
    }
    
    // Java8에 추가됨.  
    // 남은 요소들에게 추가적으로 수행할 작업
    default void forEachRemaining(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        while (hasNext())
            action.accept(next());
    }
}

public interface Collection {
    public Iterator iterator();
}
```
iterator() 메소드는 Collection 인터페이스 내에 정의된 메소드로, Collection 인터페이스의 자식인 List와 Set에도 포함되어 있다.  
ArrayList에 저장된 요소를 읽어오는 방법은 다음과 같다.  
```java
List list = new ArrayList();
Iteraotr it = list.iterator();
while(it.hasNext()) {
    System.out.println(it.next());
}
```

### 위 예제는 왜 참조타입을 ArrayList 대신에 List를 썼을까?
ArrayList에만 존재하는 메소드를 쓸 게 아니고 List에만 존재하는 메소드를 쓸 때는 List로 참조 타입을 잡아두는 게 좋다고 한다.  
아래와 같은 상황을 가정해보자.  
만약에 자료구조를 ArrayList에서 LinkedList로 바꿀 일이 생겼다.  
1. 참조타입을 List로 선언한 경우  
LinkedList는 List의 구현체이므로 선언문 부분만 바꿔주면 되고, 나머지 사용 부분에 있어서는 List의 메소드만 사용했을 것이므로 테스트 할 필요가 없다.  
2. 참조타입을 ArrayList로 선언한 경우
ArrayList의 자식이 LinkedList가 아니므로 참조 타입을 List, 혹은 LinkedList로 바꿔줘야한다.  
그리고 나머지 사용 부분에 있어서도 ArrayList의 메소드를 사용했을지 모르므로 그런 부분을 다 바꿔줘야 할지도 모른다.  
따라서 List에만 존재하는 메소드를 쓴다면 다른 사람들에게 코드 변경에 대한 안정성도 심어줄 수 있고 굳이 ArrayList로 참조타입을 잡을 일이 없다.  

### Map 인터페이스에서는 iterator를 어떻게 쓰나?  
ES6에서도 다음의 경우에는 오류를 내뱉는다.  
```javascript
const obj = {
  name: '간장냥',
  age: 25
}
for(const key of obj) console.log(obj[key]);
```
Object는 Iterable한 객체가 아니라서 for of Syntax를 쓸 수 없고 아래와 같이 해주거나  
[proposal-object-rest-spread](https://github.com/tc39/proposal-object-rest-spread)을 지원하는 바벨 플러그인을 깔거나 해야했다.  

```javascript
const obj = {
  name: '간장냥',
  age: 25
}
for(const key of Object.keys(obj)) console.log(obj[key]);
```

아래와 같이 한 것이 지금 설명할 방법이다.  
```java
// ES6와 달리 Java의 Map은 Iterable 하지 않다.
Map map = new HashMap();
Iterator it = map.keySet().iterator();

Set set = map.entrySet();
Iterator it2 = set.iterator();
```
java의 경우에는 Map은 Key와 Value의 쌍(pair)라서 iterator를 호출할 수 없다는데  
ES6의 Map도 비슷한 맥락일텐데 왜 Iterable 한 걸까...
```javascript
const myMap = new Map();
myMap.set(0, 'zero');
myMap.set(1, 'one');
for(const [key, value] of myMap) console.log(key + ' = ' + value);
```

## ListIterator  
ListIterator는 Iterator를 상속받아서 기능을 추가한 것으로 컬렉션의 요소에 접근할 때  
Iterator는 단방향으로만 접근이 가능했지만 ListIterator는 양방향으로 접근이 가능하다.  
Iterator는 Set이나 Map에도 사용이 가능한 것에 비해 ListIterator는 List에만 사용이 가능하다.  

```java
import java.util.ArrayList;
import java.util.List;
import java.util.ListIterator;

public class ListIt {
    public static void main(String[] args) {
        List l = new ArrayList();
        l.add(1);
        l.add(2);
        l.add(3);
        l.add(4);
        l.add(5);
        ListIterator it = l.listIterator();
        while(it.hasNext()) System.out.println(it.next());
        while(it.hasPrevious()) System.out.println(it.previous());
    }
}
```

Iterator는 한 번 돌면 사용이 불가능해서 다시 얻어와야하지만, ListIterator는 역방향 순회가 가능해서 사용성이 더 높다.  

## default method
Interface에 있는 default 메소드는 구현하는 구현체에서 굳이 구현해도 되지 않는 메소드이다.  
구현자의 부담을 약간 덜어줬다고 보면 된다. 
하지만 추상메소드라서 아래와 같이 몸통(body)는 반드시 명시해줘야한다.  
```java
interface Test {
    // 몸통 반드시 존재
    default void t(){}
    
    // 저렇게 그냥 빈 몸통을 넣어줘도 오류는 안 나지만...
    // 이 메소드를 지원하지 않는 구현체의 경우에는 해당 메소드를 사용하면 오류가 난다는 예외를 던져줘야 좀 더 안전하다.
    default void t1() {
        throw new UnsupportedOperationException();
    }
}
```

## Iterator의 remove  
데이터를 가져만 온다면 next,  
가져온 데이터를 삭제까지 한다면 remove!  
즉 remove 하기 위해선 next를 해야함!

## Arrays 클래스  
이 클래스에는 배열을 다루는데 유용한 메소드가 정의돼있다.  

* copyOf(), copyOfRange()  
```java
int[] arr = {0, 1, 2, 3, 4};
int[] arr2 = Arrays.copyOf(arr, arr.length); // 0, 1, 2, 3, 4
int[] arr3 = Arrays.copyOf(arr, 3); // 0, 1, 2
int[] arr4 = Arrays.copyOf(arr, 7); // 0, 1, 2, 3, 4, 0, 0
int[] arr5 = Arrays.copyOfRange(arr, 2, 4); // 2, 3
int[] arr6 = Arrays.copyOfRange(arr, 0, 7); // 0, 1, 2, 3, 4, 0, 0
```

* fill(), setAll()
```java
int[] arr = new int[5];
Arrays.fill(arr, 9); // 9, 9, 9, 9, 9
Arrays.setAll(arr, () -> (int)(Math.random()*5)+1); // 1, 5, 2, 1, 1
```
람다식을 보니 반갑다, 그냥 ES6의 Arrow Function을 보는 기분이고 익명 함수도 보니 더욱 JS를 보는 거 같아 반갑다.  

* sort(), binarySearch()  
binarySearch는 요소를 검색할 때 사용하며 항상 정렬이 돼있어야한다.
```java
int[] arr = {77, 105, 2, 33};
int idx = Arrays.binarySearch(arr, 105); // 1, 잘못된 결과
System.out.println(idx);

Arrays.sort(arr);
idx = Arrays.binarySearch(arr, 105); // 3
System.out.println(idx);
```
Linear Search(순차 검색)은 배열이 정렬돼있을 필요가 없으나 요소 하나하나 비교하기 때문에 느리고,  
Binary Search(이진 검색)은 배열의 검색 범위를 반복적으로 절반씩 줄여나가기 때문에 빠르나 배열이 정렬돼있어야한다.  

* toString(), toDeepString(), equals(), deepEquals()  
전자는 얕은 문자열화, 후자는 깊은 문자열화?라고 보면 될 거 같다.  
즉 전자는 1차원 배열, 후자는 다차원 배열에 사용하면 된다.  
equals의 경우에도 마찬가지...

* asList(Object... a)  
배열을 List에 담아서 반환한다.  
매개변수가 가변인자라서 배열 생성 없이 그냥 요소만 넣어줘도 된다.  
일반 List와 달리 추가/삭제는 안 되고 변경만 된다.  
```java
List list = Arrays.asList(new int[]{1, 2, 3, 4, 5});
List list2 = Arrays.asList(new Integer[]{1, 2, 3, 4, 5});
List list3 = Arrays.asList(1, 2, 3, 4, 5);
List list4 = new ArrayList(Arrays.asList(1, 2, 3, 4, 5));

// UnsupportedOperationException 발생
// list2.add(2);
list4.add(2);
System.out.println(list.get(0)); // int를 넣으면 안된다.
System.out.println(list2.get(0));
System.out.println(list3.get(0));
System.out.println(list4.get(5)); // 2
```

* parallelXXX(), spliterator(), stream()
parallel로 시작하는 메소드는 보다 빠른 결과를 얻기 위해 여러 쓰레드가 작업을 나누어 처리하도록 한다.  
spliterator는 여러 쓰레드가 처리할 수 있게 하나의 작업을 여러 작업으로 나누는 Spliterator를 반환한다.  
stream은 컬렉션을 스트림으로 반환한다.  

## Comparator와 Comparable  
Comparator는 sort하는 기준, 메소드이고 Comparable한 녀석들끼리만 비교해서 sort 할 수 있다.  
둘 다 인터페이스이다.  
```java
import java.util.Arrays;
import java.util.Comparator;

public class ComparatorTest {
    public static void main(String[] args) {
        String[] str = {"마나", "하마", "가나"};
        Arrays.sort(str);
        System.out.println(Arrays.toString(str)); // 가나, 마나, 하마
        Arrays.sort(str, new Desc());
        System.out.println(Arrays.toString(str)); // 하마, 마나, 가나
    }
}

class Desc implements Comparator {
    public int compare(Object o1, Object o2) {
        if(o1 instanceof Comparable && o2 instanceof Comparable) {
            Comparable c1 = (Comparable)o1;
            Comparable c2 = (Comparable)o2;
            return c1.compareTo(c2) * -1;
            // return c2.compareTo(c1);
        }
        return -1;
    }
}
```

## Set
순서를 유지하지 않는 데이터의 집합, 데이터의 중복을 허용하지 않는다.  
저장 순서를 유지하는 녀석으로 LinkedHashSet이 있다.

### HashSet
Set 인터페이스의 구현체  
내부적으로는 HashMap을 이용해서 만들어졌다.

* load factor  
컬렉션 클래스에 저장공간이 가득 차기 전에 미리 용량을 확보하기 위한 것.  
이 값을 0.8로 지정하면 80%가 찼을 때 용량이 두 배로 늘어남. 기본값은 0.75(75%)
`HashSet(int capacity, float loadFactor)`과 같은 곳에서 사용한다.  

 



