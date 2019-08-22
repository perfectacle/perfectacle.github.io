---
title: (Docker) Spring Boot Application Image 최적화하기
tags: [Docker, Spring Boot]
category: [Middle-end, DevOps]
date: 2019-04-16 03:19:58
---
![](/images/spring-boot-docker-image-optimization/thumb.png)

## 들어가기에 앞서
이 글에서 Docker와 Spring Boot, Gradle에 대한 기본적인 지식은 있다고 판단하고 설명한다.  
프로젝트는 [spring-boot-docker-demo 저장소](https://github.com/perfectacle/spring-boot-docker-demo)에서 단계별로 브랜치를 확인해보면 된다.  
이해를 돕기 위해 docker image tag 단위로 branch를 땄다.

프로젝트의 build.gradle은 아래와 같다.
```groovy
plugins {
    id 'org.springframework.boot' version '2.1.4.RELEASE'
    id 'java'
}

apply plugin: 'io.spring.dependency-management'

archivesBaseName = 'demo'
group = 'com.example'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '11'

repositories {
    jcenter()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.projectreactor:reactor-test'
}
```

## 가장 간단한 Spring Boot Docker Image 만들기
이 상태에서 gradle wrapper를 이용해 build를 수행해보자.
```bash
./gradlew build
```

그렇다면 build/libs 디렉토리에 **demo-0.0.1-SNAPSHOT.jar**란 파일이 만들어진다.
(build.gradle의 archivesBaseName과 version 값에 의해 위와 같은 이름으로 생성된다.)

이제 실행 가능한 jar 파일이 생성됐으니 Docker 이미지를 만들어서 해당 jar 파일을 실행하게 만들어보기 위해서 Dockerfile을 생성하자.
```dockerfile
FROM openjdk:11-jre-slim

WORKDIR /root

COPY build/libs/demo-0.0.1-SNAPSHOT.jar .

CMD java -jar demo-0.0.1-SNAPSHOT.jar
```

이제 이미지를 빌드해보자.
```bash
# docker build -t ${imageName}:${tagName} .
# 예제에서는 이해를 돕기 위해 임의로 이미지와 태그 이름을 임의로 설정함.
# perfectacle은 글쓴이의 docker hub 아이디이므로 본인의 docker hub 아이디를 입력해야 docker hub repository 충돌이 일어나지 않는다.

docker build -t perfectacle/spring-boot-demo:basic .
```

이제 이미지를 통해 컨테이너를 띄워보자.

```bash
# docker run --rm -d -p ${hostPort}:${containerPort} --name ${containerName} ${imageName}:${tagName}
# --rm 옵션은 컨테이너를 stop 하면 자동으로 컨테이너를 죽여버린다.
# -d 옵션은 백그라운드에서 컨테이너를 실행한다는 옵션이다.
# 예제에서는 이해를 돕기 위해 포트나 컨테이너 이름 등등의 값을 임의로 설정함.

docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:basic 
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
# 프로젝트의 com.example.demo.Router 파일에서 GET / 에 대한 라우터, 핸들러를 만들어두었다.
curl localhost

# ok
```
ok라는 텍스트가 출력이 됐다면 성공적으로 컨테이너가 뜬 것이다.  
혹시나 `curl: (52) Empty reply from server`란 오류가 뜬다면 서버가 아직 뜨지 않은 것이니 10초 정도 기다렸다가 다시 시도해보자.

이제 [Docker Hub](https://hub.docker.com/)에 우리가 작업한 이미지를 올려보자.
(물론 Docker Hub에 Repository가 존재하는 상태로 시작해야한다.)  
```bash
# docker push ${repositoryName}:${tagName}
docker push perfectacle/spring-boot-demo:basic

# The push refers to repository [docker.io/perfectacle/spring-boot-demo]
# b61d0959344e: Pushing [================>                                  ]  6.096MB/18.22MB
# 4bbad98352e9: Mounted from library/openjdk 
# 9f6ec1d0a99c: Mounted from library/openjdk 
# 8eb822456baf: Mounted from library/openjdk 
# 0d59dc1d96ca: Mounted from library/openjdk 
# 93df8ce6d131: Mounted from library/openjdk 
# 5dacd731af1b: Mounted from library/openjdk 
```
Docker Image는 여러 레이어로 겹겹이 쌓여있다.  
우리가 Dockerfile에 선언한 `FROM openjdk:11-jre-slim` 부분에 의해 openjdk:11-jre-slim 이미지의 레이어에서부터 쌓아가는 것이다.  
4bbad98352e9 ~ 5dacd731af1b까지가 openjdk:11-jre-slim 이미지의 레이어를 사용한 것이다.  
그리고 제일 윗 라인에 b61d0959344e 이 부분이 Dockerfile의 `COPY build/libs/demo-0.0.1-SNAPSHOT.jar .`에 의해 생긴 레이어이다.  
바로 저 jar 파일이 하나의 레이어를 차지하고 있는 것이다.  
그럼 이 레이어란 건 어떻게 쓰이는지는 좀이따 살펴보자.

이제 어플리케이션 코드를 한 번 수정해보자.  
`com.example.demo.Router` 파일을 아래와 같이 수정해보자.  
```java
package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;

@Configuration
public class Router {
    @Bean
    public RouterFunction<ServerResponse> route() {
        return RouterFunctions.route(GET(""),
                                     serverRequest -> ServerResponse.ok()
                                                                    .contentType(MediaType.TEXT_PLAIN)
                                                                    .body(BodyInserters.fromObject("ok!")));
    }
}
```
`ok`에서 `ok!`로 바꿨을 뿐이다.  

이제 다시 소스 코드를 빌드해주자.  
```bash
./gradlew build
```

바뀐 소스 코드를 토대로 도커 이미지를 만들자.  
```bash
docker build -t perfectacle/spring-boot-demo:basic-change-app .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.

```bash
# 포트 및 컨테이너 이름 충돌을 방지하고자 전에 띄워놨던 컨테이너를 멈추자.
# 이전에 --rm 옵션을 줬기 때문에 stop을 하면 자동으로 컨테이너까지 죽여버린다.
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:basic-change-app 
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:basic-change-app

# 54f0c4fe51ff: Pushing [=>                                                 ]  590.8kB/18.22MB
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists 
```
레이어의 진가가 여기서 나온다.  
4bbad98352e9 ~ 5dacd731af1b까지가 openjdk:11-jre-slim 이미지의 레이어이고,
perfectacle/spring-boot-demo:basic 이미지에서 이미 사용했고 해당 이미지는 이미 Docker Hub에 올려두었다.  
따라서 해당 레이어를 **재활용**하는 것이다.  
이건 push 뿐만 아니라 pull에도 해당하는 내용이다.  
실제 디스크에서 차지하는 용량도 해당 레이어를 재활용하기 때문에 이미지 push/pull 속도 및 용량 측면에서도 매우 효율적이다.  

## Spring Boot Docker Image 최적화하기
이렇게 레이어를 잘 구성해서 재활용할 수 있는 부분을 최대한 늘리는 게 이번 포스트에서 진행할 최적화의 한 방법이다.
하지만 우리는 레이어를 잘 활용하고 있지 못하고 있다.  

basic 태그의 이미지를 올릴 때도 `b61d0959344e: 18.22MB`를 업로드 했고,
basic-change-app 태그의 이미지를 올릴 때도 `54f0c4fe51ff: 590.8kB/18.22MB`를 업로드 했다.  
우리가 변경한 부분은 매우 작은 것 같은데, 왜 이렇게 많은 용량을 업로드하는 것일까?  
그건 우리가 jar 파일을 하나의 레이어로 구성했기 때문이다. 

우선 jar 파일이 어떻게 구성돼있는지 한 번 까보자.  
```bash
cd build/libs
tar -xvf demo-0.0.1-SNAPSHOT.jar
ls
# 우리가 여기서 눈여겨 볼 것은 BOOT-INF 디렉토리이다.
# BOOT-INF META-INF demo-0.0.1-SNAPSHOT.jar org

ls BOOT-INF
# classes에는 우리가 작성한 어플리케이션 소스 코드가 들어있고, lib 디렉토리에는 라이브러리들(*.jar)이 들어있다.
# classes lib
```
즉, 우리는 classes에 있는 파일만 수정했음에도 불구하고 lib에 있는 파일까지 같은 레이어로 묶어서 push하고 있던 것이다.  
레이어를 재활용하기 위해선 jar 파일을 분해해서 이렇게 어플리케이션 레이어와 라이브러리 레이어를 쪼개야 최대한 레이어를 재활용할 수 있다.  

빌드 후에 매번 저렇게 jar 파일을 분해하기 귀찮으니 build task를 손 봐주자.  
build.gradle에서 아래 내용을 추가해주자.  
```groovy
task unpackJar(type: Copy) {
    def unpackDir = "$buildDir/unpack"
    
    delete unpackDir
    from zipTree(jar.getArchiveFile())
    into unpackDir
}

build {
    finalizedBy unpackJar
}
```

그리고 Dockerfile에서 어플리케이션 레이어와 라이브러리 레이어를 분리시키자.  
```dockerfile
FROM openjdk:11-jre-slim

WORKDIR /root

ARG buildDir=build/unpack

COPY ${buildDir}/BOOT-INF/classes/ app
COPY ${buildDir}/BOOT-INF/lib/ lib

CMD java -cp app:lib/* com.example.demo.DemoApplication
```

이제 바뀐 task로 빌드해보자.  
```bash
./gradlew build
```

jar 파일이 `build/libs/unpack`에 제대로 풀어졌는지 확인해보고 이제 새로운 도커 이미지를 빌드하자.  
```bash
docker build -t perfectacle/spring-boot-demo:unpack-jar .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.

```bash
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:unpack-jar 
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:unpack-jar

# aefdad4cf83c: Pushing [=>                                                 ]  592.9kB/18.12MB
# c132ceeeb517: Pushing [==================================================>]  9.728kB
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists
```
aefdad4cf83c는 라이브러리 레이어이고, c132ceeeb517는 어플리케이션 레이어이다.  

여기까지 문제가 없긴한데 Dockerfile에서 메인 클래스(com.example.demo.DemoApplication)를 하드코딩하는 게 매우 귀찮다.  
JarLauncher를 이용해서 하드코딩 하는 부분을 없애보자! (물론 JarLauncher를 쓰면 main class를 하드코딩하는 거 보다 아주 조금 느리게 서버가 뜬다.)  
Dockerfile을 아래와 같이 수정해주자.
```dockerfile
FROM openjdk:11-jre-slim

WORKDIR /root

ARG buildDir=build/unpack

COPY ${buildDir}/BOOT-INF/classes BOOT-INF/classes
COPY ${buildDir}/BOOT-INF/lib BOOT-INF/lib
COPY ${buildDir}/META-INF META-INF
COPY ${buildDir}/org org

CMD java org.springframework.boot.loader.JarLauncher
```
덕지덕지 클래스패스 붙던 게 사라지고, 메인 클래스 하드코딩하던 부분도 사라졌다.

이미 빌드는 했고, 소스코드에 변경된 건 없으므로 새로운 도커 이미지를 빌드하자.  
```bash
docker build -t perfectacle/spring-boot-demo:unpack-jar-launcher .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.

```bash
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:unpack-jar-launcher 
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:unpack-jar-launcher

# 55e024f80fff: Pushing [==================================================>]  221.7kB
# fb71d1d0e2a1: Pushing [==================================================>]  3.072kB
# 182065791613: Pushing [=>                                                 ]  593.4kB/18.12MB
# b0d121a9a0fe: Pushing [==================================================>]  9.728kB
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists
```

위 Dockerfile에도 단점이 존재한다.  
바로 레이어가 4개나 존재한다는 것이다.  
우리는 어플리케이션 레이어/라이브러리 레이어로만 구분하려고 했는데 **메인 클래스 하드코딩, 클래스패스** 두 가지 문제점 때문에 또 다른 문제점을 만들어냈다.  
이제 레이어를 다시 두 개로 줄여보자.

먼저 Copy의 횟수를 줄여야 레이어를 줄일 수 있으니 Copy하기 좋게 BOOT-INF/lib 폴더만 다른 곳으로 빼야한다.  
그러기 위해서는 build task와 관련된 task들을 아래와 같이 수정해야한다.  
```groovy
task moveLib {
    doLast {
        def unpackDir = "$buildDir/unpack"
        ant.move(file: "${unpackDir}/app/BOOT-INF/lib", toFile: "${unpackDir}/lib")
    }
}

task unpackJar(type: Copy) {
    def unpackDir = "$buildDir/unpack"

    delete unpackDir
    from zipTree(jar.getArchiveFile())
    into "$unpackDir/app"

    finalizedBy moveLib
}

build {
    finalizedBy unpackJar
}
```

그리고 Dockerfile을 아래와 같이 수정해서 레이어를 두 개(어플리케이션, 라이브러리)로 만들자.  
```dockerfile
FROM openjdk:11-jre-slim

WORKDIR /root

ARG buildDir=build/unpack

COPY ${buildDir}/app .
COPY ${buildDir}/lib BOOT-INF/lib

CMD java org.springframework.boot.loader.JarLauncher
```

이제 바뀐 task로 빌드해보자.  
```bash
./gradlew build
```

lib 폴더가 `build/libs/unpack/app/BOOT-INF`에 없고 `build/libs/unpack/`에 있는지 확인해보고
이제 새로운 도커 이미지를 빌드하자.  
```bash
docker build -t perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.

```bash
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer 
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer

# aeafcfee4d7d: Pushing [=>                                                 ]  593.4kB/18.12MB
# f69cb2892736: Pushing [==================================================>]  231.4kB
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists 
```

다시 레이어가 두 개로 줄어들었다.

그럼 이제 어플레이션 코드만 수정하고 과연 라이브러리 레이어는 재활용하는지 살펴보자.  
`com.example.demo.Router` 파일을 아래와 같이 수정해보자.  
```java
package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;

@Configuration
public class Router {
    @Bean
    public RouterFunction<ServerResponse> route() {
        return RouterFunctions.route(GET(""),
                                     serverRequest -> ServerResponse.ok()
                                                                    .contentType(MediaType.TEXT_PLAIN)
                                                                    .body(BodyInserters.fromObject("ok!")));
    }
}
```
`ok!`에서 `ok!!`로 바꿨을 뿐이다.  

소스코드가 바뀌었으니 다시 빌드하자.  
```bash
./gradlew build
```

새로운 도커 이미지로 빌드하자.  
```bash
docker build -t perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer-change-app .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.
```bash
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer-change-app
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer-change-app

# e5ff3f17bd79: Pushing [==>                                                ]    790kB/18.12MB
# 6f4d8004dddf: Pushing [==================================================>]  231.4kB
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists 
```

엥? 어플리케이션 소스코드만 바꿨는데 왜 라이브러리 레이어는 재활용하지 못하는 거지?  
그럼 혹시 라이브러리를 추가했을 때 어플리케이션 레이어는 재활용할까?

build.gradle에 modelmapper를 디펜던시로 추가해보자.  
```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.projectreactor:reactor-test'
    implementation 'org.modelmapper:modelmapper:2.3.3'
}
```

디펜던시를 추가했으니 다시 빌드하자.  
```bash
./gradlew build
```

새로운 도커 이미지로 빌드하자.  
```bash
docker build -t perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer-change-lib .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.
```bash
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer-change-lib
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:unpack-jar-launcher-decrease-layer-change-lib

# 1902203c1efa: Pushing [==>                                                ]  921.1kB/21.94MB
# 6f4d8004dddf: Layer already exists
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists 
```

어플리케이션 레이어는 재활용이 잘 되고 변경된 라이브러리 레이어만 push 하는 걸 볼 수 있다.

근데 통상적으로 라이브러리 레이어보다 어플리케이션 레이어의 변경이 잦고,
라이브러리 레이어의 용량이 더 커서 라이브러리 레이어를 재활용하는 게 훨씬 효율적이다.

혹시 Dockerfile에 선언한 레이어의 순서에 뭔가 연관이 있지 않을까 싶어 Dockerfile을 아래와 같이 수정해보았다.
```dockerfile
FROM openjdk:11-jre-slim

WORKDIR /root

ARG buildDir=build/unpack

COPY ${buildDir}/lib BOOT-INF/lib
COPY ${buildDir}/app .

CMD java org.springframework.boot.loader.JarLauncher
```

COPY 구문의 순서만 뒤바꾼 것이다. (lib 먼저, 그 다음에 app 레이어를 쌓게 끔)  

이미 빌드는 했고, 소스코드에 변경된 건 없으므로 새로운 도커 이미지를 빌드하자.  
```bash
docker build -t perfectacle/spring-boot-demo:change-layer-order .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.

```bash
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:change-layer-order 
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:change-layer-order

# 43e70d9a1e7a: Pushing [==================================================>]  231.4kB
# 44d3b0d75158: Pushing [========>                                          ]  3.919MB/21.94MB
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists
```
레이어 순서를 바꾼 후 첫 Push이기 때문에 어플리케이션/라이브러리 레이어 모두 push 하고 있다.

이제 어플리케이션 코드를 바꿔보자.  
`com.example.demo.Router` 파일을 아래와 같이 수정해보자.  
```java
package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;

@Configuration
public class Router {
    @Bean
    public RouterFunction<ServerResponse> route() {
        return RouterFunctions.route(GET(""),
                                     serverRequest -> ServerResponse.ok()
                                                                    .contentType(MediaType.TEXT_PLAIN)
                                                                    .body(BodyInserters.fromObject("ok!!!!")));
    }
}
```
`ok!!`에서 `ok!!!!`로 바꿨을 뿐이다.

소스코드가 바뀌었으니 다시 빌드하자.  
```bash
./gradlew build
```

새로운 도커 이미지로 빌드하자.  
```bash
docker build -t perfectacle/spring-boot-demo:change-layer-order-and-app .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.
```bash
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:change-layer-order-and-app
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!!!!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:change-layer-order-and-app

# 13f989ce91ed: Pushing [==================================================>]  231.4kB
# 44d3b0d75158: Layer already exists
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists 
```

우리가 바라던대로 용량이 큰 라이브러리 레이어는 재활용하고 있고, 용량이 작은 어플리케이션 레이어는 변경했기 때문에 push하고 있다. 

그럼 혹시 라이브러리 레이어를 수정했을 때 어플리케이션 레이어는 재활용할지 한 번 실험을 해보자.
build.gradle에 modelmapper의 버전을 바꿔보.  
```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.projectreactor:reactor-test'
    implementation 'org.modelmapper:modelmapper:2.3.2'
}
```

디펜던시를 변경했으니 다시 빌드하자.  
```bash
./gradlew build
```

새로운 도커 이미지로 빌드하자.  
```bash
docker build -t perfectacle/spring-boot-demo:change-layer-order-and-lib .
```

이제 새롭게 빌드한 이미지를 통해 컨테이너를 띄워보자.
```bash
docker stop demo
docker run --rm -d -p 80:8080 --name demo perfectacle/spring-boot-demo:change-layer-order-and-lib
```

실제로 어플리케이션이 잘 떴는지 확인해보자.

```bash
curl localhost

# ok!!!!
```

이제 Docker Hub에 좀 전에 새로 생성한 이미지를 올려보자.

```bash
docker push perfectacle/spring-boot-demo:change-layer-order-and-lib

# 7a3da3f26c6b: Pushing [==================================================>]  231.4kB
# c67d124680cf: Pushing [>                                                  ]  265.7kB/25.75MB
# 6f4d8004dddf: Layer already exists
# 4bbad98352e9: Layer already exists 
# 9f6ec1d0a99c: Layer already exists 
# 8eb822456baf: Layer already exists 
# 0d59dc1d96ca: Layer already exists 
# 93df8ce6d131: Layer already exists 
# 5dacd731af1b: Layer already exists 
```

아쉽지만 라이브러리 레이어만 바꿨다고 해서 어플리케이션 레이어를 재활용 할 순 없다.  
그래도 어플리케이션 레이어는 대부분 라이브러리 레이어 보다 용량이 적고,  
라이브러리 레이어가 변경이 되는 거보다 어플리케이션 레이어가 변경될 확률이 훨씬 높다.  
따라서 어플리케이션 레이어를 재활용하는 것보다 라이브러리 레이어를 재활용하는 것이 훨씬 낫다.

## 레이어 순서에 따라서 재활용할 수 있는 레이어가 달라진다
우리의 Dockerfile을 보면 아래와 같다.
```dockerfile
COPY ${buildDir}/lib BOOT-INF/lib
COPY ${buildDir}/app .
```

어플리케이션 레이어
ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
라이브러리 레이어

위와 같이 라이브러리 레이어 위에 어플리케이션 레이어를 쌓고 있다.  
이 상황에서 어플리케이션 레이어만 수정하면 아래 있는 라이브러리 레이어를 재활용 할 수 있다.  
하지만 라이브러리 레이어를 바꾼다면 라이브러리 레이어를 쌓고 그 위에 다시 어플리케이션 레이어를 쌓아야한다.  
따라서 어플리케이션 레이어를 재활용하지 못하는 것이다.  
도커 이미지는 마치 스택 자료구조 안에 레이어들을 쌓아간다고 생각하면 좀 더 이해하기 쉬운 것 같다.

## 참조 링크
* [TOPICAL GUIDE Spring Boot Docker](https://spring.io/guides/topicals/spring-boot-docker)  
* [Optimizing Docker Images for Spring Boot](https://toedter.com/2017/09/23/optimizing-docker-images-for-spring-boot/)