---
title: (Spring) 스타트 스프링 부트 002일차 - Hibernate와 MySQL 연결하기
category: [Note, Spring Boot]
tag: [Java, Spring, Spring Boot, Hibernate, MySQL, Entity Lifecycle]
date: 2017-08-03 09:17:54
---
![](/images/Spring-boot-study-002day/thumb.png)  

Hibernate를 써보자! (feat. MySQL)

## 의존성 추가(build.gradle)
```groovy
dependencies {
	compile('org.springframework.boot:spring-boot-starter-data-jpa')
	compile('org.springframework.boot:spring-boot-starter-jdbc')
	testCompile('org.springframework.boot:spring-boot-starter-test')
}
```

## DB 정보 입력(및 하이버네이트 설정)
/src/main/resources/application.properties에 정보를 입력해주자.  
이 DB 정보 입력을 datasource 지정이라고 하는 것 같다.  
```spel
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/db?useSSL=false
spring.datasource.username=id
spring.datasource.password=pw

# 스키마 생성(create)
spring.jpa.hibernate.ddl-auto=create
# DDL 생성 시 데이터베이스 고유의 기능을 사용하는가?
spring.jpa.generate-ddl=false
# 실행되는 SQL문을 보여줄 것인가?
spring.jpa.show-sql=true
# 데이터베이스는 무엇을 사용하는가?
spring.jpa.database=mysql
# 로그 레벨
logging.level.org.hibernate=info
# MySQL 상세 지정
spring.jpa.database-platform=org.hibernate.dialect.MySQL5InnoDBDialect
```

필요한 정보들은 알아서 수정하자.  

## JPA로 엔티티 만들기
1. SQL로 테이블 만들고 엔티티 클래스 만들기  
2. JPA를 통해 클래스만 설계하고 자동으로 테이블 생성하기  

이 중에 후자를 택했다. (책에서)

* 엔티티 클래스 설계(VO 만들기, model)  
```java
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import java.sql.Timestamp;

@Getter
@Setter
@ToString
public class Board {
    private Long bno;
    private String title;
    private String Writer;
    private String content;
    private Timestamp regdate;
    private Timestamp updatedate;
}
```
* JPA를 위한 어노테이션 추가  
```java
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.sql.Timestamp;

@Getter
@Setter
@ToString
@Entity
@Table(name="tbl_boards")
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long bno;
    private String title;
    private String Writer;
    private String content;

    @CreationTimestamp
    private Timestamp regdate;
    @UpdateTimestamp
    private Timestamp updatedate;
}
```
**@Table vs @Entity**  
나는 엔티티 == 테이블이라고 알고 있어서 두 어노테이션의 차이점이 뭐가 있나 싶었는데  
@Table은 테이블에 관한 정보를 기술한 어노테이션이고,  
@Entity는 이 클래스의 인스턴스가 엔티티임을 명시해주는 거란다.  

## @EntityScan
나는 다른 패키지에 엔티티 클래스를 만들고 ComponentScan을 했는데 안 되서 구글링 해보니 @EntityScan 어노테이션을 써야하는 거였다.  
Controller와 Model을 import하는 어노테이션이 따로 있는 줄은 몰랐다.  
사실 스프링이며 JPA며 다 어제 처음 접한 거니 모르는 거 투성이다.  
근본 없이, 이해 없이 본다 하더라도 나중엔 피와 살이 되겠지 ㅠㅠ... 

## Failed to start connector [Connector[HTTP/1.1-8080]]
해당 포트를 이미 사용 중이라는데 IDE 다 껐는데도 종종 살아있는 서버가 있는갑다 ㅠㅠ
아래 명령어로 pid를 확인하고 kill해주자.  
```bash
lsof -i :8080
kill -9 pid
```

## 테이블의 수동 생성 VS 자동 생성
일단은 JPA에 익숙하지 않으니 자동으로 생성해보면서 익숙해지자!  
큰 규모의 프로젝트라면 테이블을 별도로 생성하고 코드를 작성하는 것이 일반적이란다!

## 엔티티와 엔티티 매니저  
* 엔티티: DB 상에서 데이터로 관리하는 대상  
'상품', '회사', '직원' 등과 같이 명사인 것들(아마 테이블로 뽑아낼 수 있는 걸 얘기하는 듯...?)  
DB에서는 엔티티를 위해 테이블을 설계하고 데이터를 추가하는데 이렇게 추가된 **데이터**를 **인스턴스 혹은 레코드**라고 부란다.  
상품, 회사 이것들 하나 하나가 엔티티 타입이 되며 이 **엔티티 타입을 생성한다**는 의미는 하나의 **클래스를 작성한다**는 의미가 된다.  
또한 JPA에서의 **엔티티**는 하나의 **클래스(엔티티 타입, 테이블)**이 될 때도 있고 하나의 **인스턴스(레코드)**를 뜻할 때도 있다.  
* 엔티티 매니저: 여러 엔티티 객체(아마 인스턴스이지 않을까...)들을 관리하는 역할을 한다.  
여기서 말하는 **관리**는 **라이프 사이클**이라고 할 수 있다.(고 한다.)  
엔티티 매니저는 자기가 관리해야하는 엔티티 객체를 **Persistence Context(영속 컨텍스트)**라는 곳에 넣고 객체들의 생사(라이프 사이클)을 관리한다.  

## 엔티티 객체 생명주기
![엔티티 인스턴스의 라이프 사이클](entity_lifecycle.jpg)  
* New(비영속): Java 영역에 객체만 존재하고, DB와 연동된 적이 없는 상태.  
엔티티 매니저의 관리 하에 있는 게 아니기 때문에 순수한 Java 객체  
* Managed(영속): DB에 저장되고 **메모리 상에서도 같은 상태**로 존재하는 상태.  
객체는 영속 컨텍스트 내에 들어가게 되고 PK를 통해 엔티티 객체를 꺼내 사용할 수 있다.  
* Removed(삭제): DB에서 삭제된 상태, 객체는 더 이상 영속 컨텍스트에 존재하지 않는다.  
* Detached(준영속): 영속 컨텍스트에서 엔티티 객체를 꺼내서 사용하는 상태.  
고유한 PK는 있지만, 아직 DB와 동기화가 이루어지지 않은 상태.   