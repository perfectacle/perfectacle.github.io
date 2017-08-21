---
title: 모르는 항목들
tag: [develop]
category: [기타, 등등]
---

## 배포

### AWS (Amazon Web Server)
#### EC2
서버 인스턴스3?  
일반적인 서버?라고 보면 될라나
#### S3
정적 파일 저장소?
#### ELB(Elastic Load Balancing)
분산해서 접속? 무중단 배포를 위해? 장애가 나도 고가용성을 유지하기 위해?
#### Route 53
도메인을 연결시키기 위해?
#### RDS(Relational Database Service)
RDB를 여기다 설치하는 거 같다.  
DB 서버를 제공해주는 곳인 듯.
* Read Replica  
MySQL만 지원하는지 모르겠는데 대부분은 
#### SQS(?)
#### CloudWatch(?)

### Docker
이미지를 배포? 운영체제 이미지? 가상 OS? 가상 머신?

### Firebase
앱을 배포하는 건가??

## DB
### RDBMS(Relation Data Base Management System)
MySQL, MariaDB, Oracle, PostgreSQL  
관계를 기반? reference가 많이 이뤄진다는 소리인가??
* 관계 기반?이라 그런지 복잡한 join 문을 지원하는 것 같다.    
* 정형화 된 데이터를 처리하는데 유리하다.  

또 모르는 거 정리  
1. 스키마  
MySQL에서는 DB라고 부르는 거 같은데 내가 아는 건 어떤 컬럼에 어떤 자료형이 들어가야하는지 등등을 명세해 놓은 게 스키마가 아닌가 싶다.  
2. 엔티티  
테이블이라고 보면 될 것 같다.  
주로 제안서? 그런 곳에서 명사를 뽑아내면 된다.  
3. 레코드  
튜플, **인스턴스**, Row 등등으로 불린다.  
한 회원의 전체 정보를 하나의 레코드라고 보면 될 거 같다.  
4. 컬럼  
어트리뷰트라고도 불린다.  
ID 컬럼, PW 컬럼 등등


### NoSQL(Not Only Standard Query Language)
MongoDB, Redis
출현 이유  
* RDB는 비싸다.  
* RDB는 스키마?가 존재하여 초기에 데이터 모델링을 하지 않으면 다시 설계해야함.  
* 스키마를 제대로 설계하지 않아서 정형화되지 않은 데이터를 넣을 경우 돈이 많이 듦.(재활용성도 떨어짐)  
* RDB 보다 더 대용량의 데이터의 저장이 가능하다.  

#### In Memory DB  
휘발성 데이터를 (메인)메모리(RAM)에 저장하는 방식인 것 같다.  
빠른 성능을 보장받을 수 있는 것 같다.  
지금 이 상품을 보고 있는 사람, 최근 본 상품, 최근에 많이 구매한 상품들이 이에 해당함.  
* memcached: 순수하게 메모리 DB란다.  
* redis: 데이터를 디스크에 저장할 수 있단다.  


 

## 검색
ELKR은 MEAN(MongoDB, Express, Angular, Node.js)와 같은 하나의 스택? 패키지? 정도로 보면 될 거 같음.  
[ELKR (ElasticSearch + Logstash + Kibana + Redis) 를 이용한 로그분석 환경 구축하기](https://medium.com/chequer/elkr-elasticsearch-logstash-kibana-redis-%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-%EB%A1%9C%EA%B7%B8%EB%B6%84%EC%84%9D-%ED%99%98%EA%B2%BD-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0-f3dd9dfae622)  
### ElasticSearch
검색 엔진을 구현한 오픈 소스?  
물론 라이브러리이기 때문에 얘를 쓰면 뿅하고 검색이 되는 게 아니라 사용자가 구현을 해줘야함.  
[Elastic Search (엘라스틱서치) 입문](https://www.slideshare.net/seunghyuneom/elastic-search-52724188)  
[엘라스틱서치 기초 사용법](https://bakyeono.net/post/2016-06-03-start-elasticsearch.html)

### Logstash
로그 수집을 위한 것??
### Kibana
엘라스틱 서치로 검색한 걸 시각화시켜주는 녀석!  
데이터 시각화! visualization!
[4 kibana 소개 & quick start](http://gyrfalcon.tistory.com/entry/elastic-stack-4-kibana-%EC%86%8C%EA%B0%9C-quick-start)
### Redis
REmote DIctionary Server  
in memory 저장
[redis란?](http://genesis8.tistory.com/189)

## 협업 툴
Slack - 메신저(봇이나 앱 등등을 붙일 수 있음.) 
Trello, Jira, MeisterTask - 협업툴


## etc.
### Swagger
[공식 사이트](https://swagger.io/)  
API 설계하는 걸 도와주는 툴인 듯.  

### 멀티 스레드

### Restful API