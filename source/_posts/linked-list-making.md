---
title: (자료구조) List - LinkedList를 만들어보자!
category: [Middle-end, 자료구조]
tag: [자료구조, LinkedList, List]
date: 2017-08-06 11:03:03
---
![](thumb.png)  
List는 데이터를 순차적으로 저장하므로 선형 구조(한 줄로 계속 되며, 데이터가 끊어지지 않음)이다.  
또한 여기서 말하는 노드는 하나의 데이터 덩어리라고 보면 될 것 같다.  

## LinkedList란...?
LinkedList는 스택의 다음과 같은 단점을 극복하고자 만들어졌다.  
* 노드의 끝 부분을 제외한 곳에 데이터 삽입  
스택은 끝 부분에만 데이터를 삽입할 수 있으므로 중간에 데이터를 삽입할 방법이 존재하지 않았다.  
LinkedList는 배열의 이러한 단점을 노드(배열의 각 요소)가 다음 주소지를 알게 함으로써 그 단점을 극복하였다.

하지만 신은 공평하듯, 이 LinkedList에도 다음과 같은 장/단점이 있다.  
* 데이터의 접근 속도가 느리다.  
LinkedList는 다음 노드에 대한 참조만을 가지고 있다.  
따라서 255 번째 노드의 데이터를 불러오려면 처음부터 순차적으로 255 번째 노드까지 접근해야한다.  
배열에 비해 이러한 접근 속도가 매우 느리다.  
* 다음 노드에 대한 참조만 있을 뿐, 이전 노드에 대한 데이터는 없다.  
따라서 이전 노드의 값을 가져올 수는 없다.  
이는 Doubly Linked List라는 이중 링크드 리스트라는 자료구조를 만들어 해결하였다.  
* 처음 노드에서 마지막 노드로, 혹은 마지막 노드에서 처음 노드로 가려면 시간이 오래 걸린다.  
Doubly Linked List를 이용해도 순차적인 접근 밖에 되지 않기 때문에 어쨌든 계속해서 노드들을 타고 타고 끝이나 처음으로 이동해야 한다.  
이러한 단점을 극복하기 위해 처음 노드에 대한 이전 참조를 마지막 노드로, 마지막 노드에 대한 다음 참조를 처음 노드로 이어줘 원형 구조로 만든 Doubly Circular Linked List가 있다.

따라서 이 LinkedList를 잘 살리려면 중간에 삽입/삭제가 빈번하며 검색을 자주 하지 않는 자료를 담을 때 사용해야한다.  

## 만들어보자!
먼저 기본적인 Node부터 만들어보았다.  
```java
class Node {
    private Object value;
    private Node next;

    Node(Object o) {
        this.value = o;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object o) {
        this.value = o;
    }

    public Node getNext() {
        return next;
    }

    public void setNext(Node next) {
        this.next = next;
    }

    boolean isLast() { // 마지막 노드인지
        return this.next == null;
    }

    public boolean equals(Node node) { // 내용물과 참조하는 애가 같은지
        return value.equals(node.getValue()) && next == node.getNext();
    }
}

class NodeTest {
    public static void main(String[] args) {
        Node n = new Node(2);
        Node n2 = new Node(2);
        Node n3 = new Node(2);
        Node n4 = new Node(3);
        n.setNext(n4); // n 다음에 n4
        n2.setNext(n4); // n2 다음에 n4
        n3.setNext(n); // n3 다음에 n
        System.out.println(n.equals(n2)); // true
        System.out.println(n.equals(n3)); // false
        System.out.println(n.isLast()); // false
        System.out.println(n4.isLast()); // true

        // 지금 구조(List)는 n3(2) 다음에 n(2) 다음에 n4(3) 순으로 연결(Linked)돼있다.
        // 초기 노드를 지정해주고, 계속해서 다음 노드를 참조하는 걸 증감식에 적어줌,
        for(Node node = n3; true; node = node.getNext()) { // 탈출 조건이 있는 무한 반복문
            // 마지막 노드여도 출력까지는 해줘야함.
            System.out.println(node.getValue()); // 2 2 3
            if(node.isLast()) break;
        }
    }
}
```

그 다음엔 LinkedList를 만들어보았다.  
```java
class LinkedList {
    private Node[] nodes;
    private int idx; // 현재 리스트의 몇 번째 요소까지 노드가 들어왔는지 확인하는 변수

    LinkedList() {
        this(10); // 기본적으로 10개를 만들어주자, 너무 작게 만들면 복사하는 처리 비용이 많이 들테니...
    }

    LinkedList(int size) {
        nodes = new Node[size];
    }

    void add(Object o) { // 맨 끝에 삽입하는 경우
        int size = size();
        Node node = new Node(o);

        // 꽉차지 않았다면
        if(idx != size)  nodes[idx] = node; // 현재 인덱스에 노드 삽입.
        else { // 꽉 찼으면
            Node[] tmpNodes = new Node[size+10]; // 나중에 또 금방 복사하지 않게 적절하게 큰 배열을 만들자.
            for(int i=0; i<size; i++) tmpNodes[i] = nodes[i]; // 기존의 값들을 새로운 배열에 복사
            tmpNodes[idx] = node; // 새로운 값 삽입
            nodes = tmpNodes; // 복사한 배열을 원본 배열 변수로 갈아치우기
        }
        if(idx == 0) {
            idx++;
            return; // 하나만 넣은 거면 참조 관계를 수정할 필요가 없음.
        }
        nodes[idx-1].setNext(nodes[idx++]); // 이전 노드의 참조를 현재 노드로 변경
    }

    void add(int idx, Object o) { // 인덱스를 지정해 해당 지점에 삽입하려는 경우
        // List는 선형구조이므로 데이터를 삽입해야할 인덱스보다 더 뒤에 노드를 삽입하는 것은 불가능하다.
        // 당연히 배열의 인덱스를 벗어나는 음수도 불가능하다.
        if(this.idx < idx || idx < 0) throw new ArrayIndexOutOfBoundsException("올바른 인덱스를 입력해주세요!");
        // 배열의 중간에 노드를 삽입하는 게 아닌 경우
        if(idx == this.idx) this.add(o);
        else { // 배열의 중간에 노드를 삽입하는 경우
            int size = size();
            Node node = new Node(o);
            // 꽉 차지 않았다면 기존과 동일한 사이즈의 배열 생성, 아니라면 넉넉히 길이가 10 더 긴 배열 생성.
            Node[] tmpNodes = idx != size ? new Node[size] : new Node[size+10];

            // 복사할 배열을 직접 넘겨줘서 추가하기.
            for(int i=0; i<idx; i++) tmpNodes[i] = nodes[i]; // idx 이전까지는 그대로 복사
            for(int i=idx; i<this.idx; i++) { // last까지 복사
                tmpNodes[i+1] = nodes[i]; // idx 이후는 한 칸씩 밀어서 복사
            }
            tmpNodes[idx] = node; // 새로운 배열에 지금 들어온 노드 삽입
            nodes = tmpNodes; // 복사한 배열을 원본 배열 변수로 갈아치우기
            nodes[idx].setNext(nodes[idx-1].getNext()); // idx 노드는 중간에 끼어들었으므로 idx 노드 이전 노드의 참조를 가리켜야함.
            nodes[idx-1].setNext(nodes[idx]); // idx 이전 노드의 참조는 idx 노드를 가리키고 있어야함.
            this.idx++;
        }
    }

    void remove() {
        nodes[--idx] = null; // 마지막 노드 삭제 후 인덱스 1 낮춤.
        nodes[idx-1].setNext(null); // 이전 노드가 마지막 노드이므로 참조할 노드가 없음.
    }

    void remove(int idx) {
        Node[] tmpNodes = new Node[size()]; // 배열을 한 칸씩 땡겨야하므로 새롭게 배열 생성.
        Node node = getNode(idx).getNext(); // idx 번째 노드가 갖고 있는 참조 노드
        for(int i=0; i<idx; i++) tmpNodes[i] = nodes[i]; // idx 이전까지 복사
        for(int i=idx+1; i<this.idx; i++) tmpNodes[i-1] = nodes[i]; // idx 이후로 또 복사
        nodes = tmpNodes; // 복사한 배열을 원본 배열 변수로 갈아치우기
        nodes[idx-1].setNext(node);
        this.idx--;
    }

    Object get(int idx) {
        Node node = getNode(idx);
        return node == null ? null : node.getValue();
    }

    Node getNode(int idx) {
        Node node=nodes[0];
        // idx까지 계속 다음 참조 노드를 구함.
        for(int i=0; i<idx; i++, node=node.getNext());
        return node;
    }

    int size() {
        return nodes.length;
    }
}

class LinkdedListTest {
    public static void main(String[] args) {
        LinkedList l = new LinkedList();
        l.add(1);
        l.add("a");
        System.out.println(l.get(0)); // 1
        // 0번째 노드를 구하고 그 참조 노드를 구하고 값을 얻기
        System.out.println(l.getNode(0).getNext().getValue()); // a
        for(int i=0; i<10; i++) l.add(i); // 1 a 0 1 2 3 4 6 7 8 9
        System.out.println(l.get(11)); // 9
        l.add(11, 22);
        System.out.println(l.get(11)); // 22

        LinkedList l2 = new LinkedList();
        l2.add(1);
        l2.add(2);
        l2.add(3);
        l2.add(4);
        System.out.println(l2.get(3)); // 4
        l2.remove();
        System.out.println(l2.get(3)); // null
        System.out.println(l2.get(1)); // 2
        l2.remove(1);
        System.out.println(l2.get(1)); // 3
    }
}
```

틀린 게 많을지는 모르겠지만...  
일단은 구현을 했다는 것에 의의를 두고 나중에 다시 수정해야겠다.  