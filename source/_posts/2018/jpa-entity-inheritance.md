---
title: (JPA) 엔터티 상속
tags: [JPA, ORM]
categories: [Back-end, DB, JPA]
date: 2018-07-10 01:13:20
---
![출처: https://blog.naver.com/PostView.nhn?blogId=dyner&logNo=100177467201](jpa-entity-inheritance/thumb.png)

어이쿠야... 정말 백만년만에 포스팅하는 것 같다...
나태하게 살지 말기로 작심만 몇 번째 하는 건지 ㅠㅠ  
여튼 이번에 JPA를 통해 엔터티를 용도에 맞게 잘게 쪼개보다 보니 겪었던 이슈를 간단히 정리해봤다.  

## 엔터티 상속
먼저 Deal(상품) 클래스이다.  
이 녀석은 베이스(부모) 클래스이다.  
```java
@Getter
public class Deal {
    @Id
    private long id;
    
    @Enumerated(EnumType.STRING)
    @Column(name ="deal_type")
    private DealType type;
    
    private int price;
    
    @OneToMany(mappedBy = "deal")
    private List<CategoryDealMap> categoryDealMaps;
}
```
기본적으로 pk, 상품 유형, 가격, 해당 상품에 해당하는 카테고리 목록들을 가지고 있다.

그 다음으로 Deal과 매핑된 CategoryDealMap 엔터티 클래스이다.
```java
@Entity
@Getter
public class CategoryDealMap implements Serializable {
    @Id
    private long id;

    @ManyToOne
    private Deal deal;

    private long categoryId;
}
```

이제 자식이 되는 항공권 상품(Air)이다.  
```java
@Getter
@Entity
@Table(name = "deal")
public class Air extends Deal {
    private LocalDate departure;
    private LocalDate arrival;
}
```
언제 출발해서 언제 도착하는지 정보를 포함한 컬럼이다.

이제 또 다른 자식인 숙박 상품(Lodge)이다.  
```java
@Getter
@Entity
@Table(name = "deal")
public class Lodge extends Deal {
    private LocalDate checkIn;
    private LocalDate checkOut;
}
```
언제 체크인 해서 언제 체크아웃 하는지 정보를 포함한 컬럼들이다.

## 문제  
1. Deal 클래스는 엔터티가 아니라 CategoryDealMap 엔터티와 매핑할 수가 없다.  
2. CategoryDealMaps 컬럼이 없더라도 where 절에 아래와 같은 요상한 조건이 붙어서 쿼리 자체를 실행할 수가 없다.
`where dtype = 'AIR' 또는 where dtype = 'Lodge'`  

## 해결
@Inheritance 어노테이션, 그리고 @DiscriminatorColumn과 @DiscriminatorFormula 어노테이션을 적절히 잘 쓰면 된다.  

### @DiscriminatorColumn
**어떤 컬럼을 가지고 어떤 자식 엔터티를 판별할 것인가**에 대한 힌트를 주는 어노테이션이다.  
여기선 type 컬럼을 가지고 엔터티를 구분하므로 Deal 클래스를 다시 아래와 같이 설정해주자.  

```java
@Getter
@Entity
@Inheritance
@DiscriminatorColumn(name = "deal_type")
public class Deal {
    @Id
    private long id;

    @OneToMany(mappedBy = "deal")
    private List<CategoryDealMap> categoryDealMaps;

    private int price;
    
    @Enumerated(EnumType.STRING)
    @Column(name ="deal_type")
    private DealType type;
}
```
@Entity 어노테이션도 붙여주고, @Inheritance 어노테이션, @DiscriminatorColumn 어노테이션도 붙여줬다.  
@Inheritance 어노테이션의 기본 strategy 필드값은 SINGLE_TABLE이다.  
name은 실제 필드명을 입력해주면 된다.  
그리고 @DiscriminatorColumn 어노테이션의 name field를 보면 위에 dtype이라는 조건이 왜 붙었었는지 알게 된다.  

```java
@Target({TYPE})
@Retention(RUNTIME)
public @interface DiscriminatorColumn {

    /**
     * (Optional) The name of column to be used for the discriminator.
     */
    String name() default "DTYPE";
}
```
name 필드의 기본값이 DTYPE이기 때문에 요상한 조건 절이 붙었던 것이다.  

그리고 Air 엔터티와 Lodge 엔터티를 아래와 같이 고치면 된다.  
```java
@Getter
@Entity
@DiscriminatorValue("AIR")
public class Air extends Deal {
    private LocalDate departure;
    private LocalDate arrival;
}
```

```java
@Getter
@Entity
@DiscriminatorValue("LODGE")
public class Lodge extends Deal {
    private LocalDate checkIn;
    private LocalDate checkOut;
}
```
@Table 어노테이션은 부모 클래스에 있는 걸 가져다 쓰면 되니 사라졌고, @DiscriminatorValue 어노테이션이 붙었다.  
부모 클래스에서 정한 @DiscriminatorColumn(name = "deal_type"), 즉 deal_type 필드의 값이 뭐냐에 따라서 어떤 엔터티를 사용할지가 정해진다고 보면 된다.

### @DiscriminatorFormula
@DiscriminatorColumn의 경우에는 해당 컬럼의 값으로 딱 자식 클래스가 명확하게 구분되어질 때 사용하면 된다.  
DealType enum에 딱 AIR와 LODGE에 해당하는 타입이 각각 있으면 상관 없다.  
하지만 숙박에 해당하는 타입은 MOTEL, HOTEL, PENSION 등등 다양한 타입이 존재한다.  
해당 타입들도 전부 Lodge 엔터티를 사용해야할 때는 어떻게 해야할까?  

컬럼 대신에 조건을 줄 수 있는 @DiscriminatorFormula 어노테이션을 써서 Deal 엔터티를 아래와 같이 수정해보자.  
 
```java
@Getter
@Entity
@Inheritance
@DiscriminatorFormula("case when deal_type = 'AIR' then 'AIR' else 'LODGE' end")
public class Deal {
    @Id
    private long id;

    @OneToMany(mappedBy = "deal")
    private List<CategoryDealMap> categoryDealMaps;

    private int price;
    
    @Enumerated(EnumType.STRING)
    private DealType type;
}
```

deal_type의 값을 AIR면 AIR고 나머지는 LODGE로 값을 세팅하게 끔 한 것이다.  
그럼 MOTEL이건 HOTEL이건 PENSION이건 동일한 엔터티인 Lodge 엔터티를 사용하게 된다.   
