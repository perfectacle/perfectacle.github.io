---
title: (Java) 타임머신을 타고 시간 여행 떠나기
date: 2018-03-30 00:41:17
tags: [Test, Java]
category: [Middle-end, TDD]
---
![타임머신을 타고 시간 여행을 떠나보자.](/images/mock-time-with-time-machine/thumb.png)  

## 문제의 발단
가끔 현재 시간을 기준으로 코드를 짜야할 때가 있다.  
이런 경우에 자바의 경우에는 `LocalDate, LocalTime, LocalDateTime` 등등의 클래스에 있는 static 메서드인 now 메서드로 현재 시간을 구한다.  
아래와 같이 말이다.  

```java
public class App {
    // 테스트 하기 어렵게 하기 위해서 일부러 메소드가 메소드를 계속해서 호출하는 형태로 작성함.
    // 현재 시간이 오전인지 알아내는 메소드
    public static boolean isAM() {
        return method();
    }

    private static boolean method() {
        return method2();
    }

    private static boolean method2() {
        return method3();
    }

    private static boolean method3() {
        return LocalTime.now().isBefore(LocalTime.of(12, 0));
    }
}
```

하지만 이렇게 현재 시간에 **의존**하는 코드를 테스트하기란 매우 어렵다.  
```java
public class AppTest {
    @Test
    public void testAm() {
        // 이 테스트는 오전에는 통과하고 오후에는 깨지는 테스트가 된다.
        assertTrue(App.isAM());
    }
}
```

만약 배포 스크립트에 테스트가 통과하지 못하면 배포가 실패하게 끔 구성돼있다면 오전에만 배포해야하거나 테스트를 끄고 배포를 수행해야할 것이다.  
가장 간단하게 떠오르는 해결 방안은 현재 시간을 파라미터로 받는 것이다.  

```java
public class App {
    public static boolean isAM(LocalTime now) {
        return method(now);
    }

    private static boolean method(LocalTime now) {
        return method2(now);
    }

    private static boolean method2(LocalTime now) {
        return method3(now);
    }

    private static boolean method3(LocalTime now) {
        return now.isBefore(LocalTime.of(12, 0));
    }
}
```

이렇게 하면 현재 시간을 내 마음대로 컨트롤 해서 아래와 같이 항상 통과시키는 테스트를 작성할 수 있다.  
```java
public class AppTest {
    @Test
    public void testAm() {
        assertTrue(App.isAM(LocalTime.of(11, 59)));
    }
}
```

하지만 위와 같이 하면 처음 메소드 도입부(isAM)부터 now를 쓸 때까지 계속해서 now를 던지는 의미없는 행위를 반복해야한다.  

## 타임머신을 통해서 나이스하게 문제 해결하기
우선 LocalTime, LocalDate, LocalDateTime의 now 메소드를 보면 아래와 같이 구현돼있다.  
```java
public static LocalDateTime now() {
    return now(Clock.systemDefaultZone());
}
public static LocalDateTime now(Clock clock) {
    Objects.requireNonNull(clock, "clock");
    final Instant now = clock.instant();  // called once
    ZoneOffset offset = clock.getZone().getRules().getOffset(now);
    return ofEpochSecond(now.getEpochSecond(), now.getNano(), offset);
}
public static LocalDateTime ofEpochSecond(long epochSecond, int nanoOfSecond, ZoneOffset offset) {
    Objects.requireNonNull(offset, "offset");
    NANO_OF_SECOND.checkValidValue(nanoOfSecond);
    long localSecond = epochSecond + offset.getTotalSeconds();  // overflow caught later
    long localEpochDay = Math.floorDiv(localSecond, SECONDS_PER_DAY);
    int secsOfDay = (int)Math.floorMod(localSecond, SECONDS_PER_DAY);
    LocalDate date = LocalDate.ofEpochDay(localEpochDay);
    LocalTime time = LocalTime.ofNanoOfDay(secsOfDay * NANOS_PER_SECOND + nanoOfSecond);
    return new LocalDateTime(date, time);
}
```
일단 간단하게만 보면 now를 호출할 때 [Clock](https://docs.oracle.com/javase/8/docs/api/java/time/Clock.html)만 모킹해서 넘겨주면 된다.
Clock은 timezone(아마도 [UTC](https://ko.wikipedia.org/wiki/%ED%98%91%EC%A0%95_%EC%84%B8%EA%B3%84%EC%8B%9C)일 것 같다.)을 기준으로 date와 time을 제공해준다.  
기본적으로 Clock을 고정(fix) 시키지 않으면 디폴트로 OS에 설정된 타임존과 시간을 기준으로 현재 시간을 반환한다.  

다행히 Clock은 fixed 메서드를 통해 모킹할 수 있고, 모킹한 Clock을 가지고 현재 시간을 구하게 하면 문제는 깔끔하게 해결할 수 있다.  
```java
public class TimeMachine {
    // 디폴트로 운영체제에 설정된 타임존과 시간을 기준으로 Clock을 반환한다.
    private static Clock clock = Clock.systemDefaultZone();

    // Clock을 모킹할 때 쓸 timezone인데 이 포스트에서는 timezone을 뛰어넘은 모킹은 다루지 않으므로 운영체제에 설정된 UTC 타임존을 사용하겠다.
    private static ZoneOffset zoneOffset = ZoneOffset.UTC;

    // 내가 모킹한, 혹은 현재 시간을 가진 Clock 인스턴스를 가지고 현재 시간을 구하게 된다.
    public static LocalDateTime dateTimeOfNow() {
        return LocalDateTime.now(clock);
    }

    public static LocalTime timeOfNow() {
        return LocalTime.now(clock);
    }

    public static LocalDate dateOfNow() {
        return LocalDate.now(clock);
    }

    // 지정한 날짜/시간으로 현재 시간을 고정시킨다.
    public static void timeTravelAt(LocalDateTime dateTime){
        clock = Clock.fixed(dateTime.atOffset(zoneOffset).toInstant(), zoneOffset);
    }

    public static void timeTravelAt(LocalTime time) {
        // 여기서 중요한 건 시간이고 날짜는 중요치 않다.
        clock = Clock.fixed(time.atDate(LocalDate.now()).atOffset(zoneOffset).toInstant(), zoneOffset);
    }

    public static void timeTravelAt(LocalDate date) {
        // 여기서 중요한 건 날짜고 시간은 중요치 않다.
        clock = Clock.fixed(date.atStartOfDay().atOffset(zoneOffset).toInstant(), zoneOffset);
    }

    // 모킹한 현재 시간을 다시 원래 현재 시간으로 되돌리는 메소드이다.
    public static void reset() {
        clock = Clock.systemDefaultZone();
    }
}
```
타임머신이란 이름이 매우 몽환적인 분위기를 풍기는 것 같기도 하고, 참 매력적이다.  

Clock.fixed 메소드의 예제는 아래를 참고하면 쉽게 이해할 수 있다.  
```java
public class ClockTest {
    @Test
    public void testFixedClock() {
        // 2011년 1월 1일 1시 1분 0초
        LocalDateTime dateTime = LocalDateTime.of(2011, 1, 1, 1, 1);

        // UTC +09:00 서울/도쿄 기준 2011년 1월 1일 1시 1분 0초
        Instant instant = dateTime.atOffset(ZoneOffset.ofHours(9)).toInstant();

        // UTC +09:00 2011년 1월 1일 1시 1분 0초를 UTC ±00:00 기준으로 변환한 Clock
        Clock fixedClock = Clock.fixed(instant, ZoneOffset.ofHours(0));

        // UTC +09:00 기준의 시간을 UTC ±00:00 기준의 시간으로 변경했으므로 9시간만 빼면 된다.
        assertThat(LocalDateTime.now(fixedClock), is(LocalDateTime.of(2010, 12, 31, 16, 1)));
    }
}
```
  
그럼 우리가 만든 타임머신을 도대체 어떻게 써먹을지 아래 예제로 알아보자.  

```java
public class App {
    public static boolean isAM() {
        return method();
    }

    private static boolean method() {
        return method2();
    }

    private static boolean method2() {
        return method3();
    }

    private static boolean method3() {
        return TimeMachine.timeOfNow().isBefore(LocalTime.of(12, 0));
    }
}
```

쓸 데 없이 now를 매개변수로 넘기던 것에서 우리가 만든 타임머신에서 지정한 시간으로 현재 시간을 구해오고 있다.  
시간 여행(timeTravelAt 메소드)을 하지 않았다면 기본적으로 현재 시간을 반환한다.  

그럼 시간 여행을 떠날 시간이다.  
```java
public class AppTest {
    @Test
    public void testAm() {
        TimeMachine.timeTravelAt(LocalTime.of(11, 59));
        assertTrue(App.isAM());
        assertThat(TimeMachine.timeOfNow(), not(LocalTime.now()));

        TimeMachine.timeTravelAt(LocalTime.of(12, 59));
        assertFalse(App.isAM());
        assertThat(TimeMachine.timeOfNow(), not(LocalTime.now()));

        TimeMachine.reset();
        assertThat(TimeMachine.timeOfNow(), is(LocalTime.now()));
    }
}
```
시스템에 의존하지 않고 저렇게 나이스 하게 모킹한 코드를 보고 엄청난 센세이션을 느꼈다.  
앞으로도 어떠한 요소에도 의존하지 않는 이런 우아한 코드를 지향하도록 노력해야겠다.

## 참조링크
[Mocking time in Java 8's java.time API](https://stackoverflow.com/a/29360514/8778461)