---
title: (Java8) 날짜와 시간 API
tags:
  - Java8
  - Date
  - Time
category:
  - Programming
  - Java
date: 2018-09-26 13:36:45
---

![](/images/java8-date-time/thumb.png)

부끄럽게도 Java8에 나온 날짜와 시간 API를 제대로 모르고 계속해서 사용해왔다.  
늦었지만 지금이라도 정리를 해봤다.  

## 들어가기에 앞서
먼저 날짜와 시간 API는 JSR-310이라고도 불린다.  
이걸 풀어서 설명하면 [JCP(Java Community Process)](https://www.jcp.org/en/home/index)에서 관리하는 [JSR(Java Specification Requests)](https://jcp.org/en/jsr/overview)의 [310번 째](https://jcp.org/en/jsr/detail?id=310) Request(?)로  
Date and Time API이다.  

이 API는 현재 표준으로 자리잡았고, 날짜와 시간 관련 라이브러리인 [Joda-Time](http://www.joda.org/joda-time/)의 창시자인 Joda도 이 API를 만드는데 동참했다.

기존 Date, Calander와 달리 Thread Safe하고, 날짜 연산 관련된 편의 기능이 많고, TimeOffset/TimeZone 관련된 기능들도 있어서 글로벌 서비스에서도 적합하다.

## LocalTime/LocalDate/LocalDateTime
시간대(Zone Offset/Zone Region)에 대한 정보가 전혀 없는 API이다.  
따라서 한국에서 2018-09-07T08:00:04였으면 미국으로 들고가도 2018-09-07T08:00:04이다.  
이러한 경우는 생일 같은 경우 제일 적합하다.  
나는 1993-05-30T01:05:30 [KST](https://www.timeanddate.com/time/zones/kst)(1993-05-29T06:05:30 [HST](https://www.timeanddate.com/time/zones/hast))에 태어났고, KST(Korea Standard Time)를 사용하는 한국에서 매년 5월 30일에 생일 파티를 했다.  
하지만 HST(Hawaii Standard Time)를 쓰는 하와이로 갔다고 해서 내 생일 파티를 매년 5월 29일에 하지 않는다.  
여전히 내 생일 파티는 매년 5월 30일에 할 것이다.

```java
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public class LocalDateTimeTest {
    public static void main(String[] args){
        // 1993-05-30T01:05:30는 아래와 같이 나타낼 수 있다.  
        final var birthDateTime = LocalDateTime.of(1993, 5, 30, 1, 5, 30);
        final var birthDate = LocalDate.of(1993, 5, 30);
        final var birthTime = LocalTime.of(1, 5, 30);
        final var birthDay = LocalDateTime.of(birthDate, birthTime);
    }
}
```

## ZoneOffset
UTC 기준으로 시간(Time Offset)을 나타낸 것이라고 보면 된다.  
우리나라는 KST를 사용하는데 KST는 [UTC](/2018/09/26/date-and-time/#UTC-Coordinated-Universal-Time)보다 9시간이 빠르므로 UTC +09:00으로 표기한다.  
ZoneOffset은 ZoneId의 자식 클래스이다.

```java
import java.time.ZoneOffset;
import java.time.ZoneId;

public class ZoneOffsetTest {
    public static void main(String[] args){
        // UTC +09:00은 아래와 같이 나타낼 수 있다.  
        final var zoneOffset = ZoneOffset.of("+9");
        final var zoneOffset2 = ZoneOffset.of("+09");
        final var zoneOffsetIso8601Format = ZoneOffset.of("+09:00");
        final var zoneOffset3 = ZoneOffset.of("+09:00:00");
        final var zoneOffset4 = ZoneId.of("+9");
        final var zoneOffset5 = ZoneId.of("+09");
        final var zoneOffsetIso8601Format2 = ZoneId.of("+09:00");
        final var zoneOffset6 = ZoneId.of("+09:00:00");
        
        // UTC ±00:00은 아래와 같이 나타낼 수 있다.
        final var zoneOffset7 = ZoneOffset.of("+0");
        final var zoneOffset8 = ZoneOffset.of("-0");
        final var zoneOffset9 = ZoneOffset.of("+00");
        final var zoneOffset10 = ZoneOffset.of("-00");
        final var zoneOffsetIso8601Format3 = ZoneOffset.of("+00:00");
        final var zoneOffsetIso8601Format4 = ZoneOffset.of("-00:00");
        final var zoneOffsetIso8601Format5 = ZoneOffset.of("Z"); // Zulu Time
        final var zoneOffset11 = ZoneOffset.of("+00:00:00");
        final var zoneOffset12 = ZoneOffset.of("-00:00:00");
        final var zoneOffset13 = ZoneId.of("+0");
        final var zoneOffset14 = ZoneId.of("-0");
        final var zoneOffset15 = ZoneId.of("+00");
        final var zoneOffset16 = ZoneId.of("-00");
        final var zoneOffsetIso8601Format6 = ZoneId.of("+00:00");
        final var zoneOffsetIso8601Format7 = ZoneId.of("-00:00");
        final var zoneOffsetIso8601Format8 = ZoneId.of("Z"); // Zulu Time
        final var zoneOffset17 = ZoneId.of("+00:00:00");
        final var zoneOffset18 = ZoneId.of("-00:00:00");
    }
}
```

## ZoneRegion
Time Zone을 나타낸 것이라고 보면 된다.  
KST는 타임존의 이름이고 이를 나타내는 ZoneRegion은 Asia/Seoul이다.
ZoneRegion은 ZoneId의 자식 클래스이다.  
하지만 public 클래스가 아니라 외부에서 직접적인 접근은 하지 못해 ZoneId 클래스를 통해서만 생성이 가능하다.  

```java
import java.time.ZoneId;

public class ZoneIdTest {
    public static void main(String[] args){
        // KST는 아래와 같이 나타낼 수 있다.  
        final var zoneId = ZoneId.of("Asia/Seoul");
        final var zoneId2 = ZoneId.of("UTC+9");
        final var zoneId3 = ZoneId.of("UTC+09");
        final var zoneId4 = ZoneId.of("UTC+09:00");
        final var zoneId5 = ZoneId.of("UTC+09:00:00");
        final var zoneId6 = ZoneId.of("GMT+9");
        final var zoneId7 = ZoneId.of("GMT+09");
        final var zoneId8 = ZoneId.of("GMT+09:00");
        final var zoneId9 = ZoneId.of("GMT+09:00:00");
        final var zoneId10 = ZoneId.of("UT+9");
        final var zoneId11 = ZoneId.of("UT+09");
        final var zoneId12 = ZoneId.of("UT+09:00");
        final var zoneId13 = ZoneId.of("UT+09:00:00");
    }
}
```

## ZoneRules
ZoneOffset의 UTC +09:00과 ZoneRegion의 Asia/Seoul을 보면 전혀 차이가 없다.  
그럼 ZoneOffset과 ZoneRegion은 왜 따로 분리돼있는 걸까?  
좀 더 지역에 특화된, 지명 등등을 넣어서 그 의미를 살리고자 분리가 되거나 한 걸까?  
이 차이는 DST(Daylight saving time, 서머타임)와 같은 Time Transition Rule을 포함하느냐, 포함하지 않느냐로 갈린다.  
ZoneOffset은 Time Transition Rule을 포함하지 않는 ZoneRules를 가진다.  
ZoneRegion은 Time Transition Rule을 포함할 수도, 포함하지 않을 수도 있다.  

```java
import java.time.ZoneOffset;
import java.time.ZoneId;

public class ZoneRulesTest {
    public static void main(String[] args){
        // ZoneOffset이기 때문에 Time Transition Rule이 없기 때문에 아무것도 찍히지 않는다.
        ZoneOffset.of("+1").getRules().getTransitionRules().forEach(System.out::println);

        // ZoneRegion이지만, Time Transition Rule이 없기 때문에 아무것도 찍히지 않는다.
        ZoneId.of("Africa/Brazzaville").getRules().getTransitionRules().forEach(System.out::println);

        // ZoneRegion이고, Time Transition Rule이 있기 때문에 내용이 찍힌다.
        // TransitionRule[Gap +01:00 to +02:00, SUNDAY on or after MARCH 25 at 02:00 STANDARD, standard offset +01:00]
        // TransitionRule[Overlap +02:00 to +01:00, SUNDAY on or after OCTOBER 25 at 02:00 STANDARD, standard offset +01:00]
        ZoneId.of("CET").getRules().getTransitionRules().forEach(System.out::println);
    }
}
```
그럼 UTC+01:00인 [CET(Central European Time)](https://www.timeanddate.com/time/zones/cet)와 UTC+02:00인 [CEST(Central European Summer Time)](https://www.timeanddate.com/time/zones/cest)를 왜 구분하지 않는 것일까?  
그 이유는 CET와 CEST가 동시에 사용되지 않기 때문이다.  
CET를 사용하는 모든 나라는 CEST도 사용하고 있고, 겨울에는 CET를, 여름에는 CEST를 사용하기 때문에 절대 동시에 사용하지 않는다.  

이런 ZoneRules는 ZonedDateTime과 사용했을 때 진가를 발휘한다. 

## OffsetDateTime
LocalDateTime + ZoneOffset에 대한 정보까지 포함한 API이다.  
이러한 경우는 축구 경기 생중계 등등에 적합하다.  

레알 마드리드와 바르셀로나의 경기인 엘 클라시코 더비의 경우를 살펴보자.  
![바르셀로나 홈 구장인 Camp Nou(바르셀로나에 위치)에서 2018-05-06T20:45:00+02:00에 경기가 시작했다.](/images/java8-date-time/el-clasico-cest.png)
![똑같은 경기를 한국 사람이 보려면 2018-05-07T03:45:00+09:00에 경기가 시작했다.](/images/java8-date-time/el-clasico-kst.png)

```java
import java.time.OffsetDateTime;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZoneId;

public class OffsetTimeTest {
    public static void main(String[] args){
        final var barca = OffsetDateTime.of(LocalDateTime.of(2018, 5, 6, 20, 45, 0), ZoneOffset.of("+2"));
        // 2018-05-06T20:45+02:00
        System.out.println(barca);
        
        final var seoul = OffsetDateTime.of(LocalDateTime.of(2018, 5, 7, 3, 45, 0), ZoneOffset.of("+9"));
        // 2018-05-07T03:45+09:00
        System.out.println(seoul);

        // 둘을 UTC로 변환했을 때 같은 시간이기 때문에 둘은 같은 시간이라고 볼 수 있다.
        // 2018-05-06T18:45Z
        System.out.println(barca.atZoneSameInstant(ZoneId.of("Z")));
        // 2018-05-06T18:45Z
        System.out.println(seoul.atZoneSameInstant(ZoneId.of("Z")));
        
        // 1970-01-01T00:00Z
        final var unixTimeOfUTC = OffsetDateTime.of(1970, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        // 1970-01-01T00:00+09:00
        final var unixTimeOfUTC9 = OffsetDateTime.of(1970, 1, 1, 0, 0, 0, 0, ZoneOffset.of("+9"));
        // false, 둘은 다른 ZoneOffset을 가진다.
        System.out.println(unixTimeOfUTC.equals(unixTimeOfUTC9));

        // 1970-01-01T00:00
        final var unixTimeOfUTCLocalDateTime = unixTimeOfUTC.toLocalDateTime();
        // 1970-01-01T00:00
        final var unixTimeOfUTCL9ocalDateTime = unixTimeOfUTC9.toLocalDateTime();
        // true, LocalDateTime은 ZoneOffset이 없기 때문에 둘 다 똑같은 걸로 취급한다.
        System.out.println(unixTimeOfUTCLocalDateTime.equals(unixTimeOfUTCL9ocalDateTime));
    }
}
```


## ZonedDateTime
OffsetDateTime + ZoneRegion에 대한 정보까지 포함한 API이다.  
UTC +09:00의 Time Offset을 가지는 Time Zone도 여러가지이다.  
* Asia/Seoul  
* Asia/Tokyo
* 등등
  
하지만 시간을 나타내는데 있어서 Asia/Seoul을 쓰던 Asia/Tokyo를 쓰던 큰 차이점이 없다.  
OffsetDateTime과의 차이점은 DST(Daylight Saving Time)와 같은 Time Transition Rule을 포함하는 ZoneRegion을 갖고 있는 ZoneRules의 유무이다.  
독일 등등에서 사용하는 CET(겨울), CEST(여름)는 서머타임을 사용하지 않는 나라에 사는 나 같은 경우에는 굉장히 생소하다.  
그래서 어떤 때는 CET를 사용해야하고, 어떤 때는 CEST를 사용해야할지 매우 애매하고 계산하기도 까다롭다.  
자바에서는 이 두 Time Zone을 하나의 Time Zone(CET)로 통일하고 Time Transition Rule을 가지는 ZoneRules를 통해 알아서 내부적으로 계산해준다.    

```java
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public class ZonedDateTimeTest {
    public static void main(String[] args){
        // 2018-03-25T01:59:59+01:00[CET]
        System.out.println(ZonedDateTime.of(LocalDateTime.of(2018, 3, 25, 1, 59, 59), ZoneId.of("CET")));
        // 2018-03-25T03:00+02:00[CET]
        System.out.println(ZonedDateTime.of(LocalDateTime.of(2018, 3, 25, 2, 0, 0), ZoneId.of("CET")));
        // 2018-10-28T02:59:59+02:00[CET]
        System.out.println(ZonedDateTime.of(LocalDateTime.of(2018, 10, 28, 2, 59, 59), ZoneId.of("CET")));
        // 2018-10-28T03:00+01:00[CET]
        System.out.println(ZonedDateTime.of(LocalDateTime.of(2018, 10, 28, 3, 0, 0), ZoneId.of("CET")));
        
        // DST 등등의 Time Transition Rule을 사용하지 않는 ZoneRegion이나 ZoneOffset 같은 경우에는 겨울이나 여름이나 UTC 기준 시간이 동일하다.
        // 2018-06-01T00:00+09:00[Asia/Seoul]
        System.out.println(ZonedDateTime.of(LocalDateTime.of(2018, 6, 1, 0, 0, 0), ZoneId.of("Asia/Seoul")));
        // 2018-12-01T00:00+09:00[Asia/Seoul]
        System.out.println(ZonedDateTime.of(LocalDateTime.of(2018, 12, 1, 0, 0, 0), ZoneId.of("Asia/Seoul")));
        // 2018-06-01T00:00+09:00
        System.out.println(ZonedDateTime.of(LocalDateTime.of(2018, 6, 1, 0, 0, 0), ZoneId.of("+9")));
        // 2018-12-01T00:00+09:00
        System.out.println(ZonedDateTime.of(LocalDateTime.of(2018, 12, 1, 0, 0, 0), ZoneId.of("+9")));
        
        final var zonedDateTimeOfSeoul = ZonedDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneId.of("Asia/Seoul"));
        final var zonedDateTimeOfTokyo = ZonedDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneId.of("Asia/Tokyo"));
        // false, 둘은 다른 Region에서 사용하는 TimeZone을 사용하고 있기 때문이다.
        System.out.println(zonedDateTimeOfSeoul.equals(zonedDateTimeOfTokyo));

        final var offsetDateTimeOfSeoul = zonedDateTimeOfSeoul.toOffsetDateTime();
        final var offsetDateTimeOfTokyo = zonedDateTimeOfTokyo.toOffsetDateTime();
        // true, 둘은 같은 Offset에 다른 Region이지만, OffsetDateTime은 ZoneRegion에 대한 정보는 없고 ZoneOffset에 대한 정보만 있기 때문에 동일한 것으로 취급한다.
        // 같은 Region에서 사용하는 형식인지 아닌지는 알 수 없다.
        System.out.println(offsetDateTimeOfSeoul.equals(offsetDateTimeOfTokyo));

        final var zonedDateTimeOfWinter = ZonedDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneId.of("CET"));
        final var zonedDateTimeOfSummer = ZonedDateTime.of(2018, 6, 1, 0, 0, 0, 0, ZoneId.of("CET"));
        // true, 둘 다 CET라는 ZoneRegion이다.
        System.out.println(zonedDateTimeOfWinter.getZone().equals(zonedDateTimeOfSummer.getZone()));
        // false, Offset은 겨울에는 +01:00, 여름에는 +02:00이다.
        System.out.println(zonedDateTimeOfWinter.getOffset().equals(zonedDateTimeOfSummer.getOffset()));

        final var offsetDateTimeOfWinter = zonedDateTimeOfWinter.toOffsetDateTime();
        final var offsetDateTimeOfSummer = zonedDateTimeOfSummer.toOffsetDateTime();
        // false, ZoneRegion이 없어서 ZoneOffset을 갖고 구분해야하는데 둘은 같은 Region에서 사용하는 것인데도 불구하고 다른 Offset을 가진다고 판단해서 
        // OffsetDateTime만으로는 두 날짜가 같은 Region에서 사용하는 건지 아닌지를 알 수 없다.
        System.out.println(offsetDateTimeOfWinter.getOffset().equals(offsetDateTimeOfSummer.getOffset()));
    }
}
```

## Instant
어느 순간을 나타내는 클래스이다.  
[Unix Timestamp](/2018/09/26/date-and-time/)를 구할 때 사용한다.  
0 ~ 999,999,999의 integer 범위(Integer는 10억 단위를 전부 제대로 표시하지 못하기 때문에)의 Unix Timestamp Nanosecond와
long의 자료형을 가지는 Unix Timestamp Second(2038년 문제를 해결하기 위해 long을 택한 듯)를 가진다.  

Unix Timestamp를 사용하는 이유는 기본적으로 integer, long 등등의 숫자 자료형을 가지고 연산을 하기 때문에  
Local/Offset/ZonedDateTime과 비교했을 때 연산 속도가 훨씬 빠를 것이다.  
그리고 다양한 NumberUtils의 기능들도 사용할 수 있고, UTC 기준이기 때문에 글로벌한 서비스에서도 매우 적합할 것이다.  

```java
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;

public class InstantTest {
    public static void main(String[] args){
        // 2018-09-26T11:41:56.281466
        final var localDateTimeNow = LocalDateTime.now();
        // Unix Timestamp는 UTC 기준인데 LocalDateTime은 이런 정보가 하나도 없기 때문에 어떤 Time Zone인지 알려줘야 Unix Timestamp를 구할 수 있다.
        // Unix Timestamp는 UTC(+00:00)이기 때문에 UTC+09:00인 KST(Asia/Seoul)에서는 9시간을 뺀 시간이 나온다.
        // 2018-09-26T02:41:56.281466Z
        final var instantFromAsiaSeoulLocalDateTime = localDateTimeNow.atZone(ZoneId.of("Asia/Seoul")).toInstant();
        // 2018-09-26T02:41:56.281466Z
        final var instantFromAsiaSeoulLocalDateTime2 = Instant.from(localDateTimeNow.atZone(ZoneId.of("Asia/Seoul")));

        // Unix Timestamp는 UTC(+00:00)이기 때문에 UTC(+00:00)인 GMT에서는 동일한 시간이 나온다.
        // 2018-09-26T11:41:56.281466Z
        final var instantFromGMTLocalDateTime = localDateTimeNow.atZone(ZoneId.of("GMT")).toInstant();
        // 2018-09-26T11:41:56.281466Z
        final var instantFromGMTLocalDateTime2 = Instant.from(localDateTimeNow.atZone(ZoneId.of("GMT")));

        // ZonedDateTime은 Time Zone을 가지지만 Unix Timestamp는 UTC 기준이기 때문에 어떤 Time Zone으로 세팅해도 알아서 UTC로 변환한다.
        // 시스템의 기본 시간이 KST(UTC+09:00)이기 때문에 9시간을 뺀 시간이 나온다.
        // 2018-09-26T02:41:56.281834Z
        final var instantFromZonedDateTime = ZonedDateTime.now().toInstant();
        // 2018-09-26T02:41:56.281933Z
        final var instantFromAsiaSeoulZonedDateTime = ZonedDateTime.now(ZoneId.of("Asia/Seoul")).toInstant();
        // 2018-09-26T02:41:56.281884Z
        final var instantFromGMTZonedDateTime = ZonedDateTime.now(ZoneId.of("GMT")).toInstant();

        // OffsetDateTime은 Time Offset을 가지지만 Unix Timestamp는 UTC 기준이기 때문에 어떤 Time Offset으로 세팅해도 알아서 UTC로 변환한다.
        // 시스템의 기본 시간이 KST(UTC+09:00)이기 때문에 9시간을 뺀 시간이 나온다.
        // 2018-09-26T02:41:56.281834Z
        final var instantFromOffsetDateTime = OffsetDateTime.now().toInstant();
        // 2018-09-26T02:41:56.281834Z
        final var instantFromUTC9OffsetDateTime = OffsetDateTime.now(ZoneOffset.of("+9")).toInstant();
        // 2018-09-26T02:41:56.281834Z
        final var instantFromUTCOffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC).toInstant();

        // 가장 쉽게 시스템의 Unix Timestamp를 구하는 방법이다.
        // 2018-09-26T02:41:56.281834Z
        final var instantNow = Instant.now();

        // true, LocalDateTime UTC를 빼고 모두 동일하다(시스템 Time Offset이 UTC+09:00인 가정 하에)
        final var allAreSame = new HashSet<>((List.of(instantFromAsiaSeoulLocalDateTime.getEpochSecond(),
                                                      instantFromAsiaSeoulLocalDateTime2.getEpochSecond(),
                                                      instantFromZonedDateTime.getEpochSecond(),
                                                      instantFromGMTZonedDateTime.getEpochSecond(),
                                                      instantFromAsiaSeoulZonedDateTime.getEpochSecond(),
                                                      instantFromOffsetDateTime.getEpochSecond(),
                                                      instantFromUTCOffsetDateTime.getEpochSecond(),
                                                      instantFromUTC9OffsetDateTime.getEpochSecond(),
                                                      instantNow.getEpochSecond()))).size() == 1;
    }
}
```