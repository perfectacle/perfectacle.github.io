---
title: (Java) Fail Fast Iterator
category:
  - Programming
  - Java
tags:
  - Java
  - Collection
  - Iterator
date: 2021-08-14 19:20:03
---


## 문제상황
```kotlin
private fun clear(cardCompanyCode: CardCompanyCode) {
    mappings.entries.forEach {
        if (it.value != cardCompanyCode) return@forEach
        mappings.remove(it.key)
    }
}
```

맵에서 entrySet(key/value 쌍)을 가져와 forEach 돌면서 특정 조건에 맞으면 맵에서 요소를 삭제했더니 한 번만 요소가 삭제되고나서 ConcurrentModificationException을 던졌다.

여기서 아래와 같은 의문점이 생겼다.

1. 맵의 요소를 삭제하는 건데 왜 예외를 던질까?
2. 왜 한 번만 요소 삭제에 성공하는 걸까?
3. 하나의 쓰레드에서 작업했는데 왜 `Concurrent`ModificationException을 던진 걸까?

## Fail Fast

> In systems design, a fail-fast system is one which immediately reports at its interface any condition that is likely to indicate a failure. Fail-fast systems are usually designed to stop normal operation rather than attempt to continue a possibly flawed process. Such designs often check the system's state at several points in an operation, so any failures can be detected early. The responsibility of a fail-fast module is detecting errors, then letting the next-highest level of the system handle them.

[위키피디아 Fail-fast](https://en.wikipedia.org/wiki/Fail-fast)에서 따온 건데, 실패 조건에 부합한다면 바로 후속 작업 같은 걸 멈추는 걸 fail-fast라고 부르는 것 같다.
비슷하게 gradle에서 테스트 같은 태스크를 돌릴 때 fail-fast 옵션을 킬 수 있는데, 하나의 테스트라도 실패하면 그 뒤에 테스트들은 실행조차 하지 않고 테스트가 실패했다고 처리하는 방식이다.
비슷한 맥락으로 runtime에서 터질 에러를 compile-time으로 땡겨와서 에러를 잡는 것도 Fail-fast 전략이라고도 부르는 것 같다. (자바에서는 not null 타입이 없어서 NullPointerException으로 runtime에 에러가 던져졌는데 코틀린에서는 not null 타입이 생기면서 null을 넘기면 compile-time에 에러가 생겨 좀 더 빠른 실패가 보장된다던지... 등등)

## Fail Fast Iterator

실제 내가 사용했던 Map의 구현체인 [LinkedHashMap의 javadoc](https://docs.oracle.com/en/java/javase/16/docs/api/java.base/java/util/LinkedHashMap.html)을 보면 아래와 같이 나온다.

> The iterators returned by the iterator method of the collections returned by all of this class's collection view methods are fail-fast: if the map is structurally modified at any time after the iterator is created, in any way except through the iterator's own remove method, the iterator will throw a ConcurrentModificationException. Thus, in the face of concurrent modification, the iterator fails quickly and cleanly, rather than risking arbitrary, non-deterministic behavior at an undetermined time in the future.

this class(LinkedHashMap)의 collection view를 반환하는 메서드에 의해 반환된 컬렉션의 iterator 메서드에 의해 반환된 iterators는 fail-fast라고 한다. (자바의 Collections Framework에서 View에 대한 내용은 [https://softwarecave.org/2014/03/19/views-in-java-collections-framework/](https://softwarecave.org/2014/03/19/views-in-java-collections-framework/) 를 참조 바람)

`mappings.entries.forEach`
여기서 말하는 collection view를 반환하는 methods는 위 예시에서 entries(내부적으로 자바의 entrySet 메서드 호출)를 의미하고, forEach 메서드 안에서 내부적으로 iterator 메서드를 호출하여 iterator를 반환받고 iterating 하고 있는 것이다.

만약 map(예시에서 LinkedHashMap)이 iterator 생성 이후 구조적으로 변경(put(add)/remove 메서드를 통해 구조가 바뀌는 경우)되는 경우에는 iterator는 ConcurrentModificationException을 던진다.
이를 통해 잠재적으로 동시에 Map이 수정되는 현상을 방지하며 빠르고, 깔끔하게 실패처리를 하고 있다고 한다.

Map 입장에서는 이게 멀티쓰레드 환경에서 돈 건지 아닌지 모르고, 혹시나 모를 동시성 이슈에 대비해 구조가 바뀌면 바로 ConcurrentModificationException을 던지는 것 같다.

실제 LinkedHashMap의 구현체를 보면 아래와 같다.

```java
public V remove(Object key) {
    Node<K,V> e;
    return (e = removeNode(hash(key), key, null, false, true)) == null ?
        null : e.value;
}

final Node<K,V> removeNode(int hash, Object key, Object value,
                               boolean matchValue, boolean movable) {
      Node<K,V>[] tab; Node<K,V> p; int n, index;
      if ((tab = table) != null && (n = tab.length) > 0 &&
          (p = tab[index = (n - 1) & hash]) != null) {
          Node<K,V> node = null, e; K k; V v;
          if (p.hash == hash &&
              ((k = p.key) == key || (key != null && key.equals(k))))
              node = p;
          else if ((e = p.next) != null) {
              if (p instanceof TreeNode)
                  node = ((TreeNode<K,V>)p).getTreeNode(hash, key);
              else {
                  do {
                      if (e.hash == hash &&
                          ((k = e.key) == key ||
                           (key != null && key.equals(k)))) {
                          node = e;
                          break;
                      }
                      p = e;
                  } while ((e = e.next) != null);
              }
          }
          if (node != null && (!matchValue || (v = node.value) == value ||
                               (value != null && value.equals(v)))) {
              if (node instanceof TreeNode)
                  ((TreeNode<K,V>)node).removeTreeNode(this, tab, movable);
              else if (node == p)
                  tab[index] = node.next;
              else
                  p.next = node.next;
              ++modCount;
              --size;
              afterNodeRemoval(node);
              return node;
          }
      }
      return null;
  }
```

removeNode 메서드의 맨 아랫 부분의 조건문을 보면 실제 삭제가 발생할 때 `++modCount`를 통해 변경된 횟수를 늘리고 있다.

```java
public Set<Map.Entry<K,V>> entrySet() {
    Set<Map.Entry<K,V>> es;
    return (es = entrySet) == null ? (entrySet = new EntrySet()) : es;
}

final class EntrySet extends AbstractSet<Map.Entry<K,V>> {
		public final int size()                 { return size; }
		public final void clear()               { HashMap.this.clear(); }
		public final Iterator<Map.Entry<K,V>> iterator() {
		    return new EntryIterator();
		}
		// ...
}

final class EntryIterator extends HashIterator
    implements Iterator<Map.Entry<K,V>> {
    public final Map.Entry<K,V> next() { return nextNode(); }
}

abstract class HashIterator {
    Node<K,V> next;        // next entry to return
    Node<K,V> current;     // current entry
    int expectedModCount;  // for fast-fail
    int index;             // current slot

    HashIterator() {
        expectedModCount = modCount;
        Node<K,V>[] t = table;
        current = next = null;
        index = 0;
        if (t != null && size > 0) { // advance to first entry
            do {} while (index < t.length && (next = t[index++]) == null);
        }
    }
		// ...
}
```

entrySet 메서드를 통해 반환되는 EntrySet의 iterator 메서드는 EntryIterator를 반환하고, EntryIterator가 상속받은 HashIterator는 fast-fail을 위해 생성자에서 Map(LinkedHashMap)의 modCount를 expectedModCount 변수에 저장하고 있다.

```java
final class EntryIterator extends HashIterator
    implements Iterator<Map.Entry<K,V>> {
    public final Map.Entry<K,V> next() { return nextNode(); }
}

abstract class HashIterator {
		// ...
		final Node<K,V> nextNode() {
        Node<K,V>[] t;
        Node<K,V> e = next;
        if (modCount != expectedModCount)
            throw new ConcurrentModificationException();
        if (e == null)
            throw new NoSuchElementException();
        if ((next = (current = e).next) == null && (t = table) != null) {
            do {} while (index < t.length && (next = t[index++]) == null);
        }
        return e;
    }
		// ...
}
```

EntryIterator의 next 메서드는 부모 클래스인 HashIterator의 nextNode() 메서드를 호출하는데 그 안에서 객체 생성 당시의 modCount(expectedModCount)와 현재 Map(LinkedHashMap)의 modCount를 비교해서 다르면 ConcurrentModificationException을 던지고 있는 것을 볼 수 있다.
문제가 발생(할 가능성이 보이면)하면 후속작업을 하지 않고 바로 fail 처리(예외 던져버리기)를 해버리는 점에서 fail fast iterator라고 불리는 것 같다.

## 문제 해결

그럼 다시 문제상황에서 어떻게 코드가 내부적으로 돌아갔을지 확인해보자.

```kotlin
private fun clear(cardCompanyCode: CardCompanyCode) {
    mappings.entries.forEach {
        if (it.value != cardCompanyCode) return@forEach
        mappings.remove(it.key)
    }
}
```

1. mappings.entries 메서드에 의해 entrySet 메서드가 호출되고, EntrySet 타입을 반환받는다.
2. forEach에서 반복문을 돌리기 위해 EntrySet의 iterator 메서드가 호출됨에 따라 EntryIterator를 반환받는다.
3. EntryIterator의 부모인 HashIterator 생성자에서는 fail-fast를 위해 현재 Map의 modCount를 expectedModCount 변수에 저장한다.
4. forEach 메서드 안에서는 iterator.hasNext()가 호출되고 true를 반환함에 따라 iterator.next() 메서드가 호출되고, 그 반환값은 it라는 변수에 저장된다.
5. 조건문에 따라 Map의 remove 메서드가 호출되고 그에 따라 Map의 modCount가 1 증가한다.
6. 또 다시 iterator.hasNext()가 호출되고 true를 반환함에 따라 iterator.next() 메서드를 호출한다.
7. iterator.next()에서는 HashIterator의 nextNode() 메서드가 호출되고, 객체 생성 당시의 modCount(expectedModCount)와 현재 Map의 modCount가 다르기 때문에 ConcurrentModificationException을 던진다.

이 문제를 해결하기 위해서는 map.remove 메서드가 아닌 iterator.remove() 메서드를 사용해야한다.

```java
abstract class HashIterator {
		// ...
		public final void remove() {
        Node<K,V> p = current;
        if (p == null)
            throw new IllegalStateException();
        if (modCount != expectedModCount)
            throw new ConcurrentModificationException();
        current = null;
        K key = p.key;
        removeNode(hash(key), key, null, false, false);
        expectedModCount = modCount;
    }
}
```

iterator.remove() 메서드 안에서도 실제로 removeNode(map.remove에서도 호출함) 메서드가 호출되지만, expectedModCount를 현재 modCount로 갱신하는 게 큰 차이점이다.

따라서 위 예시는 아래와 같이 바꾸면 해결된다.

```kotlin
private fun clear(cardCompanyCode: CardCompanyCode) {
    val iterator = mappings.entries.iterator()

    while (iterator.hasNext()) {
        val entry = iterator.next()
        if (entry.value != cardCompanyCode) continue
        iterator.remove()
    }
}
```

## Fail Safe Iterator (Non Fail Fast Iterator)

Fail Safe Iterator라는 용어가 없지만 Fail Fast Iterator와 반대되는 개념이라고 보면 된다.

대표적으로 ConcurrentHashMap의 Collection View를 반환하는 메서드(entrySet, keySet, valueSet 등등)의 iterator 메서드가 생성하는 iterator가 있다.

```java
static final class EntryIterator<K,V> extends BaseIterator<K,V>
    implements Iterator<Map.Entry<K,V>> {
    EntryIterator(Node<K,V>[] tab, int index, int size, int limit,
                  ConcurrentHashMap<K,V> map) {
        super(tab, index, size, limit, map);
    }

    public final Map.Entry<K,V> next() {
        Node<K,V> p;
        if ((p = next) == null)
            throw new NoSuchElementException();
        K k = p.key;
        V v = p.val;
        lastReturned = p;
        advance();
        return new MapEntry<K,V>(k, v, map);
    }
}
```

ConcurrentHashMap의 entrySet 메서드의 반환타입인 EntrySetView의 iterator 메서드의 반환타입인 EntryIterator의 next 메서드를 보면 ConcurrentModificationException을 던지지 않는 것을 볼 수 있다.
즉, fail fast iterator와 달리 새로운 요소가 추가/삭제되더라도 끝까지 모든 요소를 순회하는 것이다.

ConcurrentHashMap에서 요소가 추가/제거되더라도 ConcurrentModificationException을 던지지 않는 이유는 ConcurrentHashMap은 추가/삭제 메서드에 synchronized 키워드를 사용하여 락을 잡은 후 다른 쓰레드에서 건드리지 못하도록 하기에 동시성으로부터 안전하기 때문이다.

```java
public V remove(Object key) {
    return replaceNode(key, null, null);
}

final V replaceNode(Object key, V value, Object cv) {
    int hash = spread(key.hashCode());
    for (Node<K,V>[] tab = table;;) {
        Node<K,V> f; int n, i, fh;
        if (tab == null || (n = tab.length) == 0 ||
            (f = tabAt(tab, i = (n - 1) & hash)) == null)
            break;
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);
        else {
            V oldVal = null;
            boolean validated = false;
            synchronized (f) {
                // ...
            }
            if (validated) {
                if (oldVal != null) {
                    if (value == null)
                        addCount(-1L, -1);
                    return oldVal;
                }
                break;
            }
        }
    }
    return null;
}
```

즉, fail safe iterator는 요소가 추가/삭제 되더라도 ConcurrentModificationException을 던지지 않고 모든 요소를 순회할 수 있으며 동시성 이슈로부터도 안전하다(Safe).

위와 같이 syncronized로 해결하는 케이스도 있지만, CopyOnWriteArrayList처럼 원본 collection을 카피한 후 카피한 collection으로부터 iterator를 생성하여 사용하는 fail safe iterator도 있다. (원본 collection과 생성된 iterator는 무관하기 때문에 ConcurrentModificationException을 던지지 않는다.)