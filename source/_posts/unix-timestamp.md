---
title: Unix Timestamp
tags: [Time, Unix]
category: [기타, 등등]
date: 2018-09-25 23:05:08
---
![https://en.wikipedia.org/wiki/Unix_time](thumb.jpg)

들어가기 앞서 Unix Timestamp의 동의어를 살펴보자.  

* Epoch Posix Time
* Epoch Posix Timestamp
* Epoch Unix Time
* Epoch Unix Timestamp
* Posix Epoch
* Posix Epoch Time
* Posix Epoch Timestamp
* Posix Time
* Posix Timestamp  
* Unix Epoch  
* Unix Epoch Time  
* Unix Epoch Timestamp  
* Unix Time  
* Unix Timestamp

그냥 Epoch, Unix, Posix, Time, Timestamp 등의 조합으로 이뤄진 것 같다...

## Epoch가 뭐지?
> An epoch means an instant in time chosen as the origin of a particular era. 
  The "epoch" then serves as a reference point from which time is measured. 
  Time measurement units are counted from the epoch so that the date and time of events can be specified unambiguously.
  https://www.symantec.com/connect/articles/what-epoch-time-and-how-convert-human-understandable-format
  
시간을 측정하는 기준점을 Epoch라고 부르는 것 같다.  

> In a machine, time is represented by a counter: At the center of a system is a quartz-crystal heart that pulses every second, and each second is added to the count. 
  For a computer to have any comprehension of now, it must determine how many seconds have elapsed since then – and the earliest then is called the "epoch," or the theoretical time the clock began ticking.
  https://www.wired.com/2001/09/unix-tick-tocks-to-a-billion/

PC에서 시간은 카운터로 표시되고, 매 초마다 카운트가 증가한다.  
컴퓨터는 현재 시간(now)을 알려면 "epoch"라고 불리는 것으로부터 얼마나 흘렀는지 알아야한다.

## 그래서 그게 뭔데?  
[ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) 표기법 1970-01-01T00:00:00Z 기준으로 현재까지 몇 초가 지났는지를 나타내는 것이다.  
[윤초(Leap Second)](https://ko.wikipedia.org/wiki/%EC%9C%A4%EC%B4%88)는 포함하지 않는다.  
1970-01-01T00:00:00Z는 Unix Timestamp가 0이고, 1970-01-01T00:00:01Z은 Unix Timestamp가 1이고, 1969-12-31T23:59:59Z는 Unix Timestamp가 -1이다.  

## 왜 1970년 01월 01일 00시 00분 00초를 기준으로 했을까?
Unix의 [10억 초 문제](https://namu.wiki/w/10%EC%96%B5%20%EC%B4%88%20%EB%AC%B8%EC%A0%9C)를 기념해 2001년 9월 8일에 쓰여진 [UNIX TICK TOCKS TO A BILLION](https://www.wired.com/2001/09/unix-tick-tocks-to-a-billion/)의 기사를 찾아보니 그 설명이 나온다.  

> The Unix epoch is midnight on January 1, 1970. It's important to remember that this isn't Unix's "birthday" – rough versions of the operating system were around in the 1960s.
  Instead, the date was programmed into the system sometime in the early 70s only because it was convenient to do so, according to Dennis Ritchie, one the engineers who worked on Unix at Bell Labs at its inception.

Unix Epoch(Unix OS에서 사용되는 Epoch)는 Unix OS의 탄생일이 아니다. (이미 1960년대에 Unix의 대략적인 버전은 이미 존재했다는 것 같다.)  
그냥 1970년이 프로그래밍 하기 편리해보여서 지정한 걸로 보인다.
  
> "At the time we didn't have tapes and we had a couple of file-systems running and we kept changing the origin of time," he said.
  "So finally we said, 'Let's pick one thing that's not going to overflow for a while.' 1970 seemed to be as good as any."

그냥 1970년이 진짜 날짜/시간을 계산하기에 **당분간** 편리해보여서 선택했다고 한다.  
왜 **당분간**일까?

## [2038년 문제](https://namu.wiki/w/2038%EB%85%84%20%EB%AC%B8%EC%A0%9C)
위에 언급한 [10억 초 문제](https://namu.wiki/w/10%EC%96%B5%20%EC%B4%88%20%EB%AC%B8%EC%A0%9C)를 비롯해 [497일 문제](https://namu.wiki/w/497%EC%9D%BC%20%EB%AC%B8%EC%A0%9C) 등등이 있지만 여기서는 2038년 문제만 다뤄보겠다.  

이는 32bit Integer의 Overflow 현상을 이해하면 된다.  
Unix Timestamp가 만들어질 당시 대부분 32bit OS 밖에 존재하지 않았다.  
32bit Integer의 범위는 −2,147,483,648 (−2³²) ~ 2,147,483,647 (2³¹ − 1)이다.  
Unsigned Integer를 사용할 경우 부호를 없애서 0 ~ 4,294,967,295 (2³² − 1)까지 가능하지만 1970-01-01T00:00:00Z 이전을 나타낼 수 없으므로 어쩔 수 없이 Signed Integer를 사용했다.  
따라서 1970-01-01T00:00:00Z에서 2,147,483,647초를 더하면 2038-01-19T03:14:07Z인데(Unix Timestamp 2,147,483,647),
여기서 1초가 추가된 2038-01-19T03:14:08Z이 되는 순간 Unix Timestamp 0이 되어 시스템은 1970-01-01T00:00:00Z와 동일한 시간으로 인식한다.  
즉, 타임머신을 돌렸다고 보면 된다. 

그냥 와, 타임머신 탔다~ 신기하다~로 끝나는 게 아니다.  
대부분의 서버는 Unix 기반(Linux도 Unix 기반이고 Mac OS도 Unix 기반이므로 시스템의 시간을 나타낼 때 Unix Timestamp를 사용한다.)이기 때문에  
현재 시간이 1970년대로 표시되고, 시간을 처리하는 로직들(금융권, 각종 행정 처리, 특정 기간 동안의 이벤트 등등)이 망가질 것이다.  

해결책으로는 아주~ 간단하게 생각했을 때 64bit OS를 사용하면 해결될 일이다.
