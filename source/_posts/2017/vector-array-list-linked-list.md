---
title: (자료구조) Vector vs ArrayList vs LinkedList
categories: [Middle-end, 자료구조]
tag: [자료구조, Vector, ArrayList, LinkedList]
date: 2017-08-02 14:58:36
---
![](vector-array-list-linked-list/thumb.png)

위 개념들은 일단 자바에 존재한다. (다른 거에도 다 존재하려나...?)  
비슷비슷해서 각각의 차이점이 궁금해서 정리해보았다.  

일단 이 포스트에서 소개하는 자료구조들은 Array의 다음과 같은 단점들을 극복하고자 나왔다.    
1. 길이가 한정적이라 길이를 넘어서게 되면 새로 배열을 만들고 복사를 한 후에 새로운 값을 넣어야한다는 굉장히 큰 비용을 지불해야한다.  
2. 똑같은 타입의 요소들만 들어간다.

## 차이점
1. Vector  
Java1 버전 대에서 제일 먼저 등장해서 아무도 없을 때는 요놈만 썼다.  
또한 동기화를 보장해주어 **공유 자원**이나 **복수의 사용자**가 존재할 때 좀 더 안전하게 프로그램을 작성할 수 있다.  
하지만 **하나의 스레드가 하나의 자원을 이용하는 경우**에는 오히려 성능의 저하가 발생한다.  
또한 공간이 모자를 때 **모자른 공간x2** 만큼의 공간을 확보하기 때문에 메모리를 많이 잡아먹는다는 단점도 존재한다.  
2. ArrayList  
Array 라는 이름이 들어갔다싶이 **인덱스를 가지고 있어서 검색에 용이**하다.  
하지만 삽입/삭제를 하려면 중간에 이빨 나간 곳을 전부 한칸씩 땡기거나 뒤로 밀어야하기 때문에  
**삽입과 삭제가 빈번한 데이터인 경우에는 부적합**하다.  
Vector와 달리 동기화를 보장해주지 못하고, 공간이 모자를 때는 모자른 만큼만 공간을 확보한다.  
3. LinkedList  
노드(데이터와 다음 노드로 연결시킬 주소지)들이 줄줄이 연결된 녀석이다.  
맨 마지막에 있는 녀석을 검색해야한다면 처음부터 끝까지 노드를 타고 줄줄이 이동해야해서 **검색에는 적합하지 않다**.  
하지만 삭제/삽입을 할 때는 중간에 해당 노드의 주소지만 바꿔주면 되므로 **삽입/삭제가 빈번한 데이터에 적합**하다.

## ArrayList vs LinkdedList
```java
public class ArrayLinked {
    static long add(List list) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 100000; i++) list.add(i + "");
        long end = System.currentTimeMillis();
        return end - start;
    }
    static long add2(List list) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 10000; i++) list.add(500, "X");
        long end = System.currentTimeMillis();
        return end - start;
    }
    static long remove(List list) {
        long start = System.currentTimeMillis();
        for (int i = list.size()-1; i >= 0; i--) list.remove(i);
        long end = System.currentTimeMillis();
        return end - start;
    }
    static long remove2(List list) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 10000; i++) list.remove(i);
        long end = System.currentTimeMillis();
        return end - start;
    }
    static long access(List list) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 10000; i++) list.get(i);
        long end = System.currentTimeMillis();
        return end - start;
    }

    public static void main(String[] args) {
        ArrayList a = new ArrayList(200000);
        LinkedList b = new LinkedList();
        System.out.println("순차적으로 추가하기");
        System.out.println("ArrayList: " + add(a) + "ms 소요"); // 44ms
        System.out.println("LinkedList: " + add(b) + "ms 소요"); // 21ms
        System.out.println();
        System.out.println("중간에 추가하기");
        System.out.println("ArrayList: " + add2(a) + "ms 소요"); // 272ms
        System.out.println("LinkedList: " + add2(b) + "ms 소요"); // 18ms
        System.out.println();
        System.out.println("중간에 제거하기");
        System.out.println("ArrayList: " + remove2(a) + "ms 소요"); // 259ms
        System.out.println("LinkedList: " + remove2(b) + "ms 소요"); // 458ms
        System.out.println();
        System.out.println("순차적으로 삭제하기");
        System.out.println("ArrayList: " + remove(a) + "ms 소요"); // 5ms
        System.out.println("LinkedList: " + remove(b) + "ms 소요"); // 15ms
        System.out.println();
        add(a);
        add(b);
        System.out.println("접근 속도 테스트");
        System.out.println("ArrayList: " + access(a) + "ms 소요"); // 1ms
        System.out.println("LinkedList: " + access(b) + "ms 소요"); // 283ms
    }
}
```

## 참고자료
* [Java 의 Vector 와 ArrayList , Linked List 의 차이점](http://seeit.kr/36)  
* [What are the differences between ArrayList and Vector?](https://stackoverflow.com/questions/2986296/what-are-the-differences-between-arraylist-and-vector)
