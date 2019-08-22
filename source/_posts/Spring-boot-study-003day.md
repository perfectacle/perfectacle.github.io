---
title: (Spring) 스타트 스프링 부트 003일차 - Spring Data JPA
category: [Note, Spring Boot]
tag: [Java, Spring, Spring Boot, Spring Data JPA]
date: 2017-08-04 13:11:13
---
![](/images/Spring-boot-study-003day/thumb.png)  

드디어 유닛 테스트? 단위 테스트? JUnit을 써봤다~  
그럼 시작!  

## Repository
xBatis(MyBatis, iBatis) 같은 경우에는 DAO(Data Access Object)라는 개념이 있었다는데 나중에 공부해봐야겠다.  
여튼 JPA에서는 Repository가 비슷한 거라고 DAO와 비슷하다고 보면 될 거 같다.  
JPA에서는 EntityManager를 구성하고, 트랜잭션을 시작하고 종료하는 코드를 만들 수도 있지만...(트랜잭션은 나중에 또 공부하자 ㅠㅠ)  
JPA를 쓰기 좋게 구성한 Spring Data JPA 라이브러리를 쓰면 복잡하지 않은 Repository는 간단하게 구성이 가능하다.  

Repository<T,ID> <- CrudRepository<T,ID> <- PagingAndSortingRepository<T,ID>
위는 Repository 인터페이스들의 상속 구조를 나타낸 것이다.  
<>는 제네릭이고(공부하자 ㅠㅠ), T는 타입(엔티티 타입), ID는 PK를 의미한다.  
CRUD(Create(insert), Read(Select), Update, Delete)는 CrudRepository로,  
Paiging과 Sorting은 PagingAndSortingRepository로 해주면 된다.  
페이징 로직(현재 몇 페이지인지, 데이터 몇 개씩 보여줄 건지, 페이지를 보여주는 블록에 관한 것 등등)을 안 짜도 된다니 혁명 같다 ㅠㅠ  

나머지는 다 코드 중심이고, CRUD 및 페이징, 정렬 코드 작성하고 테스트 하는 건데...  
넘나 덥고 자바의 정석 공부를 해야해서 나중에 정리해야겠다 ~~