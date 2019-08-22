---
title: (삽질기) Spring Data JPA에서 Entity Manager 관련 삽질기
tags:
  - JPA
category:
  - Note
  - 삽질
date: 2019-05-01 17:26:48
---

![이미지 출처: http://bemil.chosun.com/nbrd/bbs/view.html?b_bbs_id=10044&pn=0&num=128739](/images/jpa-entity-manager-with-test/thumb.png)

오랜만에 Spring Data JPA를 가지고 뭔가 뻘뻘 대보고 있었다.  
하지만 내 의도대로 동작하지 않았다.  
아래 코드를 보자.  
```java
@RunWith(SpringRunner.class)
@DataJpaTest
public class MotherTest {
    @Autowired
    private SomeEntityRepository repository;

    @Before
    public void setup() {
        repository.save(new SomeEntity());
    }

    @Test
    public void test() {
        repository.findById(1L);
    }
}
```

우선 테스트를 돌릴 때마다 DB를 초기화했다. (인메모리 DB인 H2를 사용했다.)  
따라서 테스트 할 데이터를 setup 메서드를 통해 데이터를 DB에 밀어넣고 있었다.  
그리고 테스트 케이스에서 해당 엔터티를 불러오는 간단한 코드인데 나는 select 쿼리가 날아갈 줄 알았다.  
하지만 insert 쿼리만 날아가고, 이거 가지고 코드를 이리저리 바꿔보며 온갖 삽질을 한 것 같다.  

왜 select 쿼리가 찍히지 않을까... 한 2시간 가까이를 이거 때문에 계속 삽질하고 있었다.  
그리고 스프링 관련 커뮤니티에 질문하려고 `아마 SomeEntity 엔터티가 생성되면서 ID 값이 어딘가에 저장돼서 동일한...`까지 딱 치고 있는데  
**어딘가 저장**에 딱 꽂혀서 아! 맞다! 하고 그동안 JPA를 안 쓴 지 오래돼서 까먹었구나... 하고 한참동안 너무 허무했었다.  
  
답은 JPA의 동작 방식에 있었다.  
기본적으로 JPA는 select 쿼리를 DB에 날리기 전에 엔터티 매니저를 뒤짐으로써 성능을 향상시킨다.  
바로 save 메서드 당시에 엔터티 매니저에 해당 엔터티를 저장한 것이다.  
엔터티 매니저에 없는 다른 ID를 조회하거나 @Id 어노테이션이 붙지 않은 다른 필드를 조건에 줄 경우에는 실제로 select 쿼리가 날아갔다.

그럼 setup 메서드와 test 메서드에서 사용하는 엔터티 매니저가 동일하다는 것을 어떻게 알 수 있을까?  
기본적으로 엔터티 매니저는 thread safe하지 않아서 thread 별로 한 개의 엔터티 매니저 생성을 권장하는 것으로 알고 있다.  
따라서 Spring Data JPA에서도 그렇게 하지 않았을까...?  

아래 테스트 코드를 통해 내가 생각한 가설이 맞는 거 같다. (멀티 스레드 환경에서 돌려본 건 아니긴 하지만...)  
```java
@RunWith(SpringRunner.class)
@DataJpaTest
public class MotherTest {
    @Autowired
    private SomeEntityRepository repository;

    @PersistenceContext
    private EntityManager em;

    private SomeEntity entity;

    @Before
    public void setup() {
        entity = new SomeEntity();
        
        assertFalse(em.contains(entity));

        repository.save(entity);
    }

    @Test
    public void test() {
        assertEquals(Long.valueOf(1L), entity.getId());
        assertTrue(em.contains(entity));

        repository.findById(1L);
    }
}
```

기본에 충실해야겠다 ㅠㅠ...