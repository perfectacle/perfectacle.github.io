---
title: 어떻게 웹플럭스는 적은 쓰레드만으로 많은 요청을 처리할 수 있을까?
tags:
  - Java
  - Srping
  - Webflux
  - Reactive
category:
  - Programming
  - Spring
date: 2019-03-10 19:24:38
---

![](/images/how-can-webflux-process-huge-requests-with-fewer-threads/thumb.png)

기본적으로 SpringMVC에서 많이 사용하는 WAS인 Tomcat의 경우에는 기본적으로 쓰레드 풀의 갯수가 200개이고,
Jetty의 경우에는 기본적으로 minimum 8개에서 maximum 200개로 설정돼있다.  
쓰레드 생성 비용은 비싸므로(오래 걸리므로) 미리 생성해서 ThreadPool에 쌓아놓는 것이다.  
여기서 말하는 Thread는 [Green Thread vs Native Thread](/2019/03/10/green-thread-vs-native-thread/)에서 얘기하다 싶이 Native Thread(OS에서 관리하는 Thread)이다.  
이 말은 동시에 요청을 최대 200개까지 처리 가능하단 얘기이다.

그에 반해 Webflux는 core * 2의 Thread만을 생성한다.  
SpringMVC에 비해 턱없이 모자란 쓰레드 갯수이고 그럼 싱글 코어의 경우에는 동시에 2개의 요청밖에 처리하지 못할 것처럼 보인다.  

## SpringMVC는 어떻게 동작하는가?
1. 요청이 들어오면 ThreadPool에서 Thread를 하나 사용한다.  
1. 그러다 I/O(File I/O, Network I/O 등등)가 발생하면 CPU를 block 시킨다. (idle 상태에 빠진다.)  
1. 이 때 다른 요청이 들어오면 ThreadPool에서 Thread를 하나 사용한다.  
1. 이런 식으로 쓰레드를 돌아가면서 요청을 처리하고 block이 풀리면 작업을 이어나간다.  

## Webflux는 어떻게 동작하는가?
Webflux는 기본적으로 아래의 쓰레드로 이루어진다.  
1. 요청을 받는 쓰레드 (이하 A 쓰레드라 칭함)  
1. block 상태에서 풀린 쓰레드의 요청을 처리하는 쓰레드 (이하 B 쓰레드라 칭함)
1. block 상태가 풀렸는지 무한 루프 돌면서 감시하는 event loop를 위한 쓰레드 (몇 개의 쓰레드가 쓰이는지는 케바케, 이하 C 쓰레드라 칭함.)  

통상적으로 event loop를 위한 쓰레드의 갯수는 정확하지 않으므로 Webflux에서는 core * 2개의 쓰레드를 사용한다고 한다.  
그럼 어떻게 그 적은 쓰레드(리소스, 비용)로 수많은 요청을 동시에 처리할 수 있는 걸까?

1. 요청이 들어오면 A 쓰레드에서 요청을 처리한다.  
1. 그러다 I/O(File I/O, Network I/O 등등)가 발생하면 CPU를 block 시킨다. (idle 상태에 빠진다.)  
1. 이런 비동기 작업을 처리하기 위해 Queue에 넣는다.  
1. A 쓰레드는 계속해서 요청을 받아서 처리한다.  
1. 동시에 C 쓰레드에서 Queue를 무한 루프 돌면서 감시를 한다.
1. Event Loop에서 감시를 하다가 작업이 끝난 이벤트가 있으면 B 쓰레드에서 해당 이벤트를 처리한다.

이런 일련의 흐름으로 인해 CPU가 놀 틈 없이 열심히 돌릴 수 있다.

## Webflux는 왜 CPU Core * 2개의 쓰레드를 사용할까?
단순히 쓰레드 생성 비용이 비싸니까 쓰레드를 적게 쓰는 Webflux가 성능 상 뛰어나다고 생각하면 안 된다.  
조금만 더 인심 쓰지... 왜 2개만으로도 충분하다고 생각하는 걸까? 하나 더 생성하면 조금 더 좋아지는 것 아닐까?? 

쓰레드가 많다는 건 뭔가?  
결국 쓰레드 사이에서 공유 자원의 [동기화](/2019/03/10/java-synchronized-note/) 이슈가 걸려있다.  
쓰레드가 많으면 많을 수록 동기화 이슈로 인해 시간이 오래 걸리게 된다.    
따라서 Thread가 적으면 적을 수록 동기화 이슈로 인한 문제에 덜 시달리게 된다.

또한 CPU는 한 번에 하나의 작업 밖에 수행하지 못한다.  
따라서 CPU Core 갯수보다 더 많은 쓰레드를 생성하는 건 무의미하게 동기화 이슈를 늘리는 것에 불과하다.  
하지만 Webflux에서 Core * 2개의 갯수를 만든 이유는 무엇일까?  
아는 사람이 있다면 댓글로 남겨주길 바란다.  