---
title: Green Thread vs Native Thread
tags:
  - Thread
category:
  - 기타
  - 등등
date: 2019-03-10 18:24:06
---

![](thumb.png)

## [Green Thread](https://en.wikipedia.org/wiki/Green_threads)
Green Thread는 우리가 알고 있는 쓰레드를 흉내낸 짝퉁 쓰레드이다.  
Green Thread는 VM(Virtual Machine)이나 Library 등등에서 관리되며 개발자가 통제할 수도 있어서 user-level 쓰레드라고도 불린다.  
하지만 Green Thread는 Many to One(Many는 쓰레드, One은 CPU) 모델로 설계된 쓰레드이다.  
따라서 CPU Core가 하나인 환경일 때 설계된 쓰레드이다보니 아무리 Green Thread가 많아도 Native Thread는 단 한 개 뿐이 만들어지지 않는다.  
Native Thread가 하나라는 건 CPU를 하나 밖에 사용하지 못한다는 뜻이다.  
따라서 CPU가 여러 개인 멀티 코어 환경에서는 그 장점을 전혀 살리지 못한다.  

싱글 코어 환경에서는 동시에 여러 작업을 잘 수행하던 Green Thread는 그럼 단점만이 존재하는 걸까?  
아니다.  
싱글 코어 환경에서 네이티브 쓰레드를 10개 사용할 때와 그린 쓰레드를 10개 사용할 때를 비교해보자.  
네이티브 쓰레드를 10개 사용하면 네이티브 쓰레드가 10개 생성된다.  
그린 쓰레드를 10개 사용하면 네이티브 쓰레드는 한 개만 생성된다.  
CPU 입장에서는 10개의 네이티브 쓰레드를 사용하는 것보다 한 개의 네이티브 쓰레드만 사용하는 그린 쓰레드 쪽이 성능 이슈가 훨씬 잘 나온다.  
이유는 멀티 쓰레드 환경에서는 공유 자원의 [동기화](/2019/03/10/java-synchronized-note/) 문제가 매우 중요하다.  
동기화가 제대로 이루어지지 않는다면 프로그램은 치명적 오류를 유발한다.  
하지만 그린 쓰레드 환경에서는 네이티브 쓰레드가 1개 뿐이니 동기화할 공유 자원이 없게 된다.  

따라서 그린 쓰레드가 싱글 쓰레드 환경에서는 더 좋은 성능을 발휘하게 된다.  
하지만 자바 환경에서는 멀티 코어 환경에서 그 강점을 발휘하지 못하기 때문에 자바 3부터 Native Thread로 전부 바뀌었다.

Node.js에서는 [Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)를 구현하기 위해 사용하고 있는
[libuv](https://github.com/libuv/libuv)에서 Green Thread를 사용하고 있지 않을까... **추측**을 해본다.

## Native Thread
우리가 진짜로 알고 있는 쓰레드 개념이다.  
Green Thread와 달리 OS 단에서 쓰레드를 관리한다.  
Native Thread Model은 non-green(kernel-level) thread라고도 불리며 Many to Many(Thread도 Many, CPU도 Many)로 설계됐다.  
따라서 멀티 코어 환경에서 강점을 발휘한다.  
하지만 위에 말했던 것과 같이 쓰레드가 여러 개 있다는 것은 각 쓰레드 사이에 공유 자원에 대해 동기화 이슈를 가지게 된다는 소리이다.  
이는 네이티브 쓰레드를 1개만 가지는 Green Thread에 비해 훨씬 복잡한 동기화 문제를 가지고 있음을 뜻하며 그에 따라 성능도 좋지 못하단 소리다.

자바 1.3부터는 Green Thread 대신에 Native Thread를 사용하고 있다.  

## 참조 링크
* [Green threads Wikipedia](https://en.wikipedia.org/wiki/Green_threads)
* [Green Threads vs Non Green Threads](https://stackoverflow.com/questions/5713142/green-threads-vs-non-green-threads)  
* [Why not Green Threads?](https://softwareengineering.stackexchange.com/questions/120384/why-not-green-threads)  
* [Green vs Native Threads and Deprecated Methods in Java](https://www.geeksforgeeks.org/green-vs-native-threads-and-deprecated-methods-in-java/)