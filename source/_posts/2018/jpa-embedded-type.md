---
title: (JPA) Embedded Type
date: 2018-02-20 00:52:00
tags: [DB, ORM, JPA, Hibernate]
categories: [Back-end, DB, JPA]
---
![출처: http://www.datamodel.com/index.php/2014/06/24/big-data-nosql-and-data-modeling-big-challenges-in-data-modeling/](jpa-embedded-type/thumb.png)

## 일반적인 테이블 구조의 문제점
일반적인 DB 테이블 구조에 맞춰 엔티티를 만들다보면 아래와 같이 만들게 된다.
```java
@Entity
public class Deal {
    @Id
    private Long id;

    @Column
    private LocalDate saleStartDate;

    @Column
    private LocalDate saleEndDate;

    @Column
    private int normalPrice;

    @Column
    private int discountPrice;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getSaleStartDate() {
        return saleStartDate;
    }

    public void setSaleStartDate(LocalDate saleStartDate) {
        this.saleStartDate = saleStartDate;
    }

    public LocalDate getSaleEndDate() {
        return saleEndDate;
    }

    public void setSaleEndDate(LocalDate saleEndDate) {
        this.saleEndDate = saleEndDate;
    }

    public int getNormalPrice() {
        return normalPrice;
    }

    public void setNormalPrice(int normalPrice) {
        this.normalPrice = normalPrice;
    }

    public int getDiscountPrice() {
        return discountPrice;
    }

    public void setDiscountPrice(int discountPrice) {
        this.discountPrice = discountPrice;
    }
}
```

객체 지향 관점에서 봤을 때 판매 시작/종료 날짜와 일반가/할인가는 전혀 관련이 없는 데이터이다.  
응집력이 낮은 데이터들끼리 모여있으므로 테이블을 아래와 같이 설계하는 게 더 응집도 높은 엔티티가 될 것 같다.
```java
@Entity
public class Period {
    @Id
    private Long id;

    @OneToOne
    private Deal deal;

    @Column
    private LocalDate saleStartDate;

    @Column
    private LocalDate saleEndDate;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Deal getDeal() {
        return deal;
    }

    public void setDeal(Deal deal) {
        this.deal = deal;
    }

    public LocalDate getSaleStartDate() {
        return saleStartDate;
    }

    public void setSaleStartDate(LocalDate saleStartDate) {
        this.saleStartDate = saleStartDate;
    }

    public LocalDate getSaleEndDate() {
        return saleEndDate;
    }

    public void setSaleEndDate(LocalDate saleEndDate) {
        this.saleEndDate = saleEndDate;
    }
}
```

응집도가 높은(서로 관련이 있는) 판매 시작/종료 날짜를 포함하는 Period라는 테이블을 따로 파서 엔티티로 만들고,
외래키를 사용하여 Deal 테이블과 매핑하였다.
```java
@Entity
public class Price {
    @Id
    private Long id;

    @OneToOne
    private Deal deal;

    @Column
    private int normalPrice;

    @Column
    private int discountPrice;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Deal getDeal() {
        return deal;
    }

    public void setDeal(Deal deal) {
        this.deal = deal;
    }

    public int getNormalPrice() {
        return normalPrice;
    }

    public void setNormalPrice(int normalPrice) {
        this.normalPrice = normalPrice;
    }

    public int getDiscountPrice() {
        return discountPrice;
    }

    public void setDiscountPrice(int discountPrice) {
        this.discountPrice = discountPrice;
    }
}
```
응집도가 높은 일반가/할인가를 포함하는 Period라는 테이블을 따로 파서 엔티티로 만들고,
외래키를 사용하여 Deal 테이블과 매핑하였다.

좀 더 객체지향 관점에서 바라본 Deal 엔티티는 아래와 같이 변경될 것이다.
```java
@Entity
public class Deal {
    @Id
    private Long id;

    @OneToOne(mappedBy = "deal")
    private Period period;

    @OneToOne(mappedBy = "deal")
    private Price price;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Period getPeriod() {
        return period;
    }

    public void setPeriod(Period period) {
        this.period = period;
    }

    public Price getPrice() {
        return price;
    }

    public void setPrice(Price price) {
        this.price = price;
    }
}
```
외래키는 deal 테이블의 id로 잡아서 각각 period, price 테이블에 뒀다고 가정한다.  
위와 같이 테이블을 일일이 쪼개기란 매우 귀찮은 일이다.  
그리고 조인을 하기 때문에 쪼개기 전보다 성능상 좋지 않은 점도 많다.  

## Embedded Type
이럴 때 쓰는 게 바로 Embedded Type이다.  
백문이 불여일견, 코드로 바로 보자.
```java
@Embeddable
public class Period {
    @Column
    private LocalDate saleStartDate;

    @Column
    private LocalDate saleEndDate;

    public LocalDate getSaleStartDate() {
        return saleStartDate;
    }

    public void setSaleStartDate(LocalDate saleStartDate) {
        this.saleStartDate = saleStartDate;
    }

    public LocalDate getSaleEndDate() {
        return saleEndDate;
    }

    public void setSaleEndDate(LocalDate saleEndDate) {
        this.saleEndDate = saleEndDate;
    }
}
```
EmbeddedType으로 응집도가 높은 판매 시작/종료 날짜를 정의하였다.  
EmbeddedType을 정의할 클래스에 @Embeddable 어노테이션을 달아줘야하고,  
엔티티가 아니기 때문에 식별자나 조인을 위한 엔티티가 없어도 된다.  

```java
@Embeddable
public class Price {
    @Column
    private int normalPrice;

    @Column
    private int discountPrice;

    public int getNormalPrice() {
        return normalPrice;
    }

    public void setNormalPrice(int normalPrice) {
        this.normalPrice = normalPrice;
    }

    public int getDiscountPrice() {
        return discountPrice;
    }

    public void setDiscountPrice(int discountPrice) {
        this.discountPrice = discountPrice;
    }
}
```
마찬가지로 EmbeddedType으로 응집도가 높은 일반가/할인가를 정의하였다.  

```java
@Entity
public class DealEmbedded {
    @Id
    private Long id;

    @Embedded
    private Period period;

    @Embedded
    private Price price;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Period getPeriod() {
        return period;
    }

    public void setPeriod(Period period) {
        this.period = period;
    }

    public Price getPrice() {
        return price;
    }

    public void setPrice(Price price) {
        this.price = price;
    }
}
```
필드를 일일이 나열하는 대신 응집도가 높은 EmbeddedType을 사용하면 되고,
가져다 쓸 때는 @Embedded 어노테이션을 달아주면 된다.  
EmbeddedType을 null로 세팅하면 관련된 필드들이 모두 null로 세팅돼서 DB에 저장된다.

EmbeddedType을 쓰면 테이블을 따로 만들어주지 않아도 되고, 조인을 사용하지 않으니 성능 상 이슈도 없고,
응집도가 높은 클래스끼리 따로 빼놨으니 좀 더 보기 좋은(?) 형태가 됐다고 말할 수 있다.

## 엔티티 vs 값 타입
@Entity가 안 붙은 걸 전부 값 타입이라고 말할 수 있다.  
둘의 차이점은 영속성 컨텍스트에서 추적이 가능하냐, 가능하지 않느냐이다.  
엔티티는 식별자(@Id가 붙은 필드)가 존재하여 엔티티의 변화 추적이 가능하지만,  
값 타입의 경우에는 해당 값이 바뀌어버리면 식별자를 가지고 있는 게 아니라 추적이 불가능하다.  
따라서 값 타입의 경우에는 엔티티에 의존적이고, 변화를 감지해야하는 경우에는 엔티티로 만들어야할 것이다.  

간단하게 값 타입에 대해 정리하자면 다음과 같다.  
1. 기본 값 타입  
엄밀히 말하자면 primitive type(int, long, boolean 등등) 만을 뜻하는 것은 아니다.  
불변하는 타입(Integer, String 등등)까지 포함한 경우를 말한다.  
2. Embedded 타입  
위에서 많이 설명했다.  
3. 값 타입 컬렉션
1과 2 타입을 컬렉션(List, Set, Map 등등)으로 가지고 있는 경우를 말한다.  
많이 쓸까... 싶기도 하고 나중에 자세히 알아봐야겠다.
