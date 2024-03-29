---
title: Netty 이벤트 루프
tags:
  - TCP
  - Netty
categories:
  - Note
  - Netty
date: 2021-02-28 01:32:12
---

이벤트 루프의 개념이 명확하지 않아 [자바 네트워크 소녀 네티](https://www.hanbit.co.kr/media/books/book_view.html?p_code=B2683487348)를 보고 정리해봄.

통상적으로 이벤트 기반 어플리케이션이 이벤트를 처리하는 방식은 아래 두 가지가 존재한다고 함.
## 이벤트 리스너와 이벤트 처리 쓰레드 방식
브라우저에서 DOM에 클릭 이벤트를 어떻게 핸들링하는지 생각해보면 된다.  
```js
document.querySelector('body').onclick = e => console.dir(e) 
```

이벤트를 처리하는 로직을 가진 메서드(`e => console.dir(e)`)를 대상 객체(`document.querySelector('body')`)의 이벤트 리스너(`onclick`)에 등록하고,
객체에 이벤트(click)가 발생했을 때 이벤트 처리 쓰레드에서 등록된 메서드를 수행하는 방식.

이런 처리 방식은 대부분 단일 쓰레드에서 이벤트를 처리한다. (js도 그래서 이벤트 리스너에서 병목이 발생하면 거의 stop the world에 걸린다고 보면 됨.)

## 이벤트 큐에 이벤트를 등록하고 이벤트 루프가 이벤트 큐에 접근하여 처리하는 방식
![책에 나온 이벤트 루프 간단 도식화](netty-event-loop/event-loop.png)
이벤트 루프는 쉽게 말해서 이벤트를 실행하기 위한 무한루프 스레드를 말한다. (이벤트가 올 때까지 해당 쓰레드가 block이 걸릴 수도 있고, 안 걸릴 수도 있고...)  
이벤트 루프 쓰레드는 무한 루프를 돌면서 이벤트 큐에 이벤트가 있나 없나? 계속 감시를 하고 이벤트가 존재하면 큐에서 꺼내서 이벤트를 처리한다.

### 단일 쓰레드와 다중 쓰레드 이벤트 루프
#### 단일 쓰레드 이벤트 루프
![Node.js에서 이벤트 루프](netty-event-loop/event-loop-node-js.png)  

Node.js와 같이 단일 쓰레드에서 이벤트 루프를 처리하게 되면 이벤트의 처리 순서를 보장할 수 있는 장점이 존재한다.  
하지만 이벤트 처리 도중 병목이 걸리면 뒤에 있는 이벤트들도 전부 지연된다는 단점이 존재한다.  
이런 단점을 극복하고자 노드에서는 CPU 코어 갯수만큼 프로세스를 띄우기도 한다.

#### 다중 쓰레드 이벤트 루프
![책에 나온 다중 쓰레드 이벤트 루프 간단 도식화](netty-event-loop/multithread-event-loop.png)
다중 쓰레드 이벤트 루프는 여러 쓰레드에서 이벤트 루프를 처리하기 때문에 단일 쓰레드보다 더 효율적으로 이벤트를 처리할 수 있다는 장점이 존재한다.  
하지만 하나의 자원(이벤트 큐)에 대해 여러 쓰레드에서 경합을 하기 때문에 다른 쓰레드에서 대기하는 시간이 발생할 수 있다. 
또한 CPU 코어는 동시에 하나의 쓰레드만 실행할 수 있으므로 쓰레드가 CPU 코어 갯수를 초과하는 경우 아래와 같은 컨텍스트 스위칭 비용이 발생한다.  
1. 운영체제는 현재 쓰레드 상태가 대기(Waiting), 슬립(Sleep), 지연(Blocked)인 쓰레드 중 하나를 선택하여 실행(Run) 상태로 바꾼다.  
1. 이 때 쓰레드가 가진 스택 정보를 현재 코어의 레지스터로 복사(컨텍스트 스위칭)한다.

그리고 여러 쓰레드에서 하나의 이벤트 큐에 접근하므로 이벤트 처리에 대한 순서를 보장할 수 없다.
1. 이벤트 큐는 하나, 이벤트 루프 쓰레드는 2개라고 가정.
1. 이벤트 큐에 E1, E2, E3가 쌓여있음.
1. 이벤트 루프 쓰레드 1에서 E1 처리 시작
1. 이벤트 루프 쓰레드 2에서 E2 처리 시작
1. 이벤트 루프 쓰레드 2에서 E2 처리 끝
1. 이벤트 루프 쓰레드 2에서 E3 처리 시작
1. 이벤트 루프 쓰레드 2에서 E3 처리 끝
1. 이벤트 루프 쓰레드 1에서 E1 처리 끝

이벤트 처리 시작에 대한 순서는 보장할 수 있어도 순서가 상관있는 이벤트를 순차적으로 시작하고 끝내는 걸 할 수가 없다.  
만약 파일에서 InputStream을 열어 데이터를 읽어서(E1), 버퍼에 기록하고(E2), 스트림을 닫는다(E3)라고 하면 순서가 보장되지 않으면 데이터를 다 읽기도 전에 스트림이 닫혀버릴 수도 있다. 
이렇게 다중 쓰레드 이벤트 루프를 사용할 때는 순서를 보장하지 않아도 되는 이벤트에 대해서만 처리 로직을 작성하여야한다. 

![책에 나온 네티의 다중 쓰레드 이벤트 루프 간단 도식화](netty-event-loop/event-loop-netty.png)
네티는 이런 단점을 보완하고자 이벤트 루프 쓰레드마다 이벤트 큐를 가지도록 하였다.    
이렇게 되면 여러 쓰레드가 하나의 자원(이벤트 큐)을 사용하고자 서로 경합을 벌이지 않아도 된다.  
그리고 이벤트 루프 쓰레드에 채널이 등록되고, 해당 채널에서 이벤트를 발생시키기 때문에 독립적인 이벤트 큐에 대해 하나의 이벤트 루프 쓰레드만 처리를 진행하므로 순서도 보장할 수 있다.  
그리고 Netty의 NioEventLoopGroup은 CPU 코어 갯수 * 2개의 이벤트 루프 쓰레드를 만들어서 컨텍스트 스위칭 비용도 최소화하였다.  
2배로 만드는 이유는 아마 한 쓰레드에서 병목이 발생하면(최대한 적어야겠지만) 다른 쓰레드에서 커버쳐주기 위함이 아닐까 싶다.

