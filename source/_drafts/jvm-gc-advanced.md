---
title: (JVM) Garbage Collection Basic
tags: [JVM, Java, GC]
category: [Programming, Java]
---

## 들어가기에 앞서
![](optimizing-java.jpeg)
이 글은 이일웅 님께서 번역하신 [자바 최적화](https://book.naver.com/bookdb/book_detail.nhn?bid=14796595)란 책을 읽던 도중 공부한 내용을 정리한 글입니다.  
절대 해당 책의 홍보는 아니며 좋은 책을 써준 사람과 번역해주신 분께 진심으로 감사하는 마음에 썼습니다.

## Mark and Sweep Algorithm
[Basic](/2019/05/07/jvm-gc-basic/)편에서는 간단하게 Young/Old Generation과 Mark and Sweep 알고리듬에 대해서 간단하게 알아보았다.  
해당 알고리듬을 사용하는 GC를 **scavenge garbage collector**라고도 부른다.
Mark and Sweep Algorith의 단점은 GC를 수행하는 동안 Stop the World(어플리케이션이 멈춤)이 발생한다는 것이다. 
![출처: https://www.youtube.com/watch?v=_cNXjmuhCCc](stop-the-world.png) 

그럼 이제 해당 알고리듬을 사용하는 GC 알고리듬에는 뭐가 있는지 알아보자.

### Serial GC
**프로덕션에서 절대 사용하면 안 되는 GC이다.** (싱글 코어 CPU를 사용하는 서버를 제외하고... ~~설마 아직도??~~)  
CPU 코어를 한 개만 사용하기 때문에, 해당 GC는 싱글 코어 환경에서만 적합하다. (쓰레드 간의 컨텍스트 스위칭도 적기 때문에...)  
Young/Old Generation 모두 Mark and Sweep 알고리듬을 사용하여 GC를 수행한다.  
Young Generation에서는 gc 수행 시간을 줄이고자 memory compaction을 수행하지 않고 survivor 영역을 전전긍긍하다 Old Generation으로 승진시켜버린다.  
Old Generation은 survivor 영역처럼 별도의 메모리 영역이 없다보니 memory compaction도 하고, 메모리 사이즈도 크다보니 수행 시간이 길다. (그만큼 Stop the World도 길다...)

-XX:+UseSerialGC 파라미터를 주고 실행하면 적용된다.

### ParallelGC(Young) / ParallelOldGC(Old)
Java 7~8의 기본 GC이며 [Serial GC](#Serial-GC)의 멀티 코어 판이다.  
'Serial GC에서 하던 걸 다수의 코어(및 쓰레드)가 하다보니 더 빠르게 수행하겠구나~'정도로 받아들이고 있다.

둘은 쌍쌍바 같은 녀석이라 -XX:+UseParallelGC 파라미터를 주면 자동으로 -XX:+UseParallelOldGC 파라미터가 활성화되고,
-XX:+UseParallelOldGC 파라미터를 주면 자동으로 -XX:+UseParallelGC 파라미터가 활성화된다.

## Tri-color Marking Algorithm
Tri-color Abstraction으로도 불리는 것 같으며 '자바 최적화'란 책에서는 '삼색 마킹 알고리즘'이라고 번역하였다.  
Tri라는 접두사는 숫자 3을 의미하며, 총 3가지 색을 써서 마킹하는 알고리듬을 뜻한다.  
[Mark and Sweep Algorithm](#Mark-and-Sweep-Algorithm)에서는 2가지 색(마킹되었거나, 마킹되지 않았거나)을 쓴 것과 차이점을 지닌다.  
이 알고리듬은 동시성 알고리듬과 GC의 정확성을 증명했다는데, 즉 어플리케이션이 멈추지 않으면서 GC를 **동시**에 **정확**하게 쓰기 위해 나온 알고리듬 같다.  

먼저 알고리듬을 알아보기 전에 각각의 색에는 무엇이 있고, 어떤 역할을 하는지 알아보자.  
1. 회색(Grey)  
해당 객체가 참조하고 있는 객체를 식별하지 않은, 즉 처리가 되지 않은 객체
2. 검은색(Black)  
해당 객체가 참조하고 있는 객체를 모두 식별한, 즉 모든 처리를 끝마친 객체
3. 흰색(White)  
해당 객체를 참조하고 있는 객체가 아무런 객체도 없는 객체, 수집 대상이 되는 객체

![Stack과 같은 GC Root(외부에서 힙 메모리에 대한 레퍼런스를 갖고 있는 메모리 풀?)에 있는 객체를 전부 회색으로 표시한다.](tri-color-marking-01.png)  
![마킹 스레드가 회색 객체를 랜덤하게 돌아다니면서 해당 회색 객체가 참조하고 있는 객체를 전부 회색으로 마킹한 후 본인을 검은색으로 마킹한다.](tri-color-marking-02.png)  
![또 마킹 스레드가 랜덤하게 회색 객체를 돌아다니다가 참조하고 있는 객체가 없음을 확인했으니 자신을 검은색으로 마킹한다.](tri-color-marking-03.png)  
![또 마킹 스레드가 랜덤하게 회색 객체를 돌아다니다가 참조하고 있는 객체가 없음을 확인했으므로 본인을 검은색으로 마킹한다.](tri-color-marking-04.png)    
![또 마킹 스레드가 랜덤하게 회색 객체를 돌아다니다가 참조하고 있는 객체가 없음을 확인했으므로 본인을 검은색으로 마킹한다.](tri-color-marking-05.png)    
![또 마킹 스레드가 랜덤하게 회색 객체를 돌아다니다가 참조하고 있는 객체는 회색으로 마킹하고 본인은 검은색으로 마킹한다.](tri-color-marking-06.png)  
![또 마킹 스레드가 랜덤하게 회색 객체를 돌아다니다가 참조하고 있는 객체는 회색으로 마킹하고 본인은 검은색으로 마킹한다.](tri-color-marking-07.png)  
![또 마킹 스레드가 랜덤하게 회색 객체를 돌아다니다가 참조하고 있는 객체가 없음을 확인했으므로 본인을 검은색으로 마킹한다.](tri-color-marking-08.png)  
![회색 객체가 없을 때까지 위 작업을 반복하고 흰색 객체를 전부 수거해간다.](tri-color-marking-09.png)  

### Issue
Mark and Sweep Algorithm과 달리 Tri-color Marking Algorithm은 어플리케이션과 동시에 수행된다.  
따라서 마킹하는 도중에 어플리케이션 스레드(책에선 Mutator라고 표기)에서 수정 사항이 반영되기 때문에 라이브 객체가 수집되는 현상이 발생될 수 있다.

```java
aInstance.setSomeField(cInstance);
```
![A라는 객체는 검은색으로 마킹돼있기 때문에 참조하는 객체에 대한 처리가 모두 끝난 객체이다.](tri-color-marking-issue-01.png)  

```java
aInstance.setSomeField(cInstance);

// blah blah...

aInstance.setSomeField(bInstance);
```
![A가 C에서 B를 바라보게 끔 변경되었다.](tri-color-marking-issue-02.png)  
여기서 두 가지 문제점이 발생한다.  
1. A는 검은색 객체로 모든 작업이 끝난 객체다.    
또한 B는 흰색으로 마킹돼있다, 즉 수집의 대상이다.  
라이브 객체를 수집하기 때문에 추후에 NPE(NullPointerException)이 발생할 가능성이 존재한다.
2. C는 회색 객체로 마킹돼있고, 나중에 검은색 객체로 바뀐다.  
즉, C는 GC 루트로부터 아무도 참조하지 않는 객체가 된 죽은 객체인데도 불구하고 흰색으로 마킹되지 않는다.  
따라서 수집 대상이 되지 않기 때문에 메모리 릭을 유발할 수 있다. (물론 다음 GC에서 수거해가겠지만...)

위와 같은 경우에는 애플리케이션 스레드가 객체를 변경했을 때 재마킹하게 끔하거나,  
알고리듬을 깨버릴만한 모든 변경 사항을 큐 형태로 넣어놓고 GC의 main phase가 끝난 다음에 fixup phase에서 바로 잡는 방법 등등이 존재한다. 

### CMS(Concurrent Mark Sweep) GC
CMS GC는 Tri-color Marking Algorithm을 사용하기 때문에 GC와 함께 어플리케이션을 돌릴 수 있다.    
그렇다고 해서 아예 Stop the World가 없는 건 아닌데 Parallel(Old)GC에 비하면 훨씬 짧다.  
즉, 레이턴시에 엄청 민감한 경우에 적합한 GC라고 볼 수 있다.  
절반은 GC 돌리고, 절반은 어플리케이션 스레드를 돌리는 것이다. (물론 평상시에는 100% 어플리케이션이 쓰겠지만...)  
CMS GC는 Old Generation 전용 GC이고, 해당 GC를 사용하면 자동적으로 Young Generation 전용으로 ParNewGC를 사용한다. (Java 8에서 -XX:+UseConcMarkSweepGC -XX:-UseParNewGC 이 조합이 Deprecate 되었다.)  
ParNewGC에 대해선 좀 이따 간단히 설명하겠다.

CMS GC의 장점은 아래와 같다.
1. 어플리케이션 스레드가 오랫동안 멈추지 않는다. (짧게 짧게 쪼개서 멈춘다.)  

CMS GC의 단점은 아래와 같다.  
1. GC 풀 사이클 자체는 Parallel(Old)GC 보다 길다.  
1. GC가 도는 도중에는 어플리케이션 스레드가 절반만 돌기 때문에 처리율이 감소한다. 
1. Mark and Sweep 알고리듬에 비해 하는 일도 많고 복잡하다보니 메모리, CPU를 더 많이 쓴다.  
1. CMS GC는 Old Generation의 메모리 Compaction을 수행하지 않으므로 단편화가 발생한다.

역시 은총알은 없는 것 같다... ㅠㅠ

CMS GC는 어플리케이션 쓰레드와 같이 돌기 때문에 좀 복잡하게 동작한다.  
1. 초기 마킹(Initial Mark, Stop the World의 시작)  
  
