---
title: (DB) MySQL의 데이터를 Elasticsearch로 마이그레이션하기
date: 2017-11-06 14:40:55
tags: [DB, MySQL, Elasticsearch]
category: [Back-end, DB, Elasticsearch]
---

MySQL의 데이터를 Elasticsearch로 마이그레이션 할 때 다음과 같은 방법이 존재한다.  
1. ~~일일이 노가다로 집어넣기~~
2. Logstash의 [logstash-input-jdbc](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-jdbc.html) 플러그인 사용하기.  
3. [go-mysql-elasticsearch](https://github.com/siddontang/go-mysql-elasticsearch) 사용하기.  

logstash-input-jdbc 같은 경우에는 다음과 같은 단점이 존재한다.  
1. 테이블 명 일일이 입력  
2. 테이블 별 프라이머리 키 일일이 입력  
3. 메모리도 많이 잡아먹고, 엄청나게 오래 걸림(성공해본 적이 단 한 번도... ㅜㅜ)

따라서 go-mysql-elasticsearch를 토대로 마이그레이션하는 방법을 설명하겠다.  
(내가 Mac을 쓰므로 맥 기반으로 설명을...)

## 사전 설치 사항
* MySQL  
* Elasticsearch  
* Git

## golang 설치하기
우선 go-mysql-elasticsearch는 golang으로 만들어져있으므로 golang부터 설치해보자.  
설치는 다양한 방법이 있지만 가장 간단한 brew로 진행을 하겠다.    
```bash
brew install go
```

[Setting GOPATH](https://github.com/golang/go/wiki/Setting-GOPATH)를 참고하여 GOPATH를 지정해주자.  
본인이 bash를 쓰는지 zsh를 쓰는지 잘 판단해서 GOPATH를 지정해주자.  
그리고 해당 설정 파일에 다음과 같은 내용을 추가해주자.  
아래는 brew를 이용하여 설치한 GOPATH이니 버전과 본인이 설치한 버전에 맞춰서 GOPATH를 알맞게 지정해줘야한다.  
```bash
export GOPATH=/usr/local/Cellar/go/1.9.2
```

그리고 터미널을 새로 띄우거나 껐다 켜야 GOPATH가 제대로 잡히는데 아래 커맨드를 입력하면 새로고침(?) 효과가 있다.  
```bash
source ~/.zshrc
# 또는 아래와 같이...
# source ~/.bash_profile
```

## go-mysql-elasticsearch 설치하기  
~~해당 저장소의 [Install](https://github.com/siddontang/go-mysql-elasticsearch#install)을 보고 따라하면 된다.~~  
아래 명령어들을 따라 치자.  
```bash
# package github.com/siddontang/go-mysql-elasticsearch: no Go files in ... 이런 에러가 나면 무시해주자.
go get github.com/siddontang/go-mysql-elasticsearch

# cd: no such file or directory: ... 이런 에러가 나면 GOPATH가 제대로 설정되지 않은 것이니 PATH를 다시 잡거나 터미널을 다시 열고 시도해보자.
$GOPATH/src/github.com/siddontang/go-mysql-elasticsearch

# Makefile에 있는 스크립트들을 실행하는 커맨드이다. 코드를 수정하고 컴파일하려면 해당 커맨드를 실행해야한다.
make
```

## 사용하기  
대충 [문서](https://github.com/siddontang/go-mysql-elasticsearch#how-to-use) 보고, [설정 예제 파일](https://github.com/siddontang/go-mysql-elasticsearch/blob/master/etc/river.toml) 보면 어떻게 해야할지 각이 나온다.  
DB와 테이블 관련 내용은 [Source](https://github.com/siddontang/go-mysql-elasticsearch#source)를 만지면 되고, 특정 컬럼만 싱크를 맞추는 등등의 복잡한 설정을 하려면 [Rule](https://github.com/siddontang/go-mysql-elasticsearch#rule)를 만져야한다.   
또한 기본적으로 go-mysql-elasticsearch는 하나의 인덱스(RDS로 치면 DB)에 여러 타입(RDS로 치면 테이블)을 두는 게 아니라  
한 인덱스에 하나의 타입(테이블 명과 일치하게끔)을 넣는 걸 디폴트 동작으로 두었으니 하나의 인덱스에 다 때려박고 싶거나 한다면 위의 Rule 파트를 참조해야한다.  
또한 [Wildcard table](https://github.com/siddontang/go-mysql-elasticsearch#wildcard-table)을 이용하면 테이블 이름을 일일이 입력해야하는 수고를 줄일 수 있는데, 아직은 그 기능이 좀 미약하다.  
혹시나 데이터베이스 내에 존재하는 모든 테이블의 싱크를 맞추고자 한다면 [포크 뜬 저장소](https://github.com/perfectacle/go-mysql-elasticsearch)를 다시 go get 메소드로 받아서  
*.toml 파일에서 `tables = ["*"]`로 설정해주면 된다.  
모든 설정을 마쳤으면 아래 커맨드를 입력해서 

```bash
# 반드시 go-mysql-elasticsearch가 저장된 곳으로 이동 후에 아래 커맨드를 입력해야한다.
# toml 파일의 디렉토리도 꼭 설정해주자.
./bin/go-mysql-elasticsearch -config=*.toml
```

## 리셋하기
go-mysql-elasticsearch를 맨 처음에 켰을 때는 싱크가 아주 잘 맞는다.  
하지만 실수(?)로 해당 프로그램을 종료했다가 재시작하면 빈로그가 종료된 시점 이후의 데이터에 대해서만 싱크를 맞추기 시작한다.  
이럴 땐 *.toml 파일의 data_dir로 설정한 디렉토리로 가서 