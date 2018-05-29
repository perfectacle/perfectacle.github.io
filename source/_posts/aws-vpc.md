---
title: (AWS) VPC
tags:
  - AWS
  - VPC
  - Network
category:
  - Middle-end
  - DevOps
date: 2018-04-25 06:00:53
---

![](thumb.png)  
자세한 내용을 보고 싶으면 [Amazon VPC란 무엇인가?](https://docs.aws.amazon.com/ko_kr/AmazonVPC/latest/UserGuide/VPC_Introduction.html)를 참고하면 된다.

## VPC(Virtual Private Cloud)란?
**가상의 네트워크**라고 보면 된다.  
**네트워크**는 분산되어 있는 컴퓨터 자원들끼리 통신이 가능하게 끔 구축되어있는 환경 정도로 이해하면 될 것 같다.  
즉, 네트워크에는 네트워크 외부와 통신이 가능한 인터넷 뿐만 아니라 네트워크 내부에서만 통신이 가능한 인트라넷 등등이 있다.  
그 앞에 가상이 붙었다 싶이 물리적으로 네트워크를 구성한 게 아니라 논리적인 단위로 네트워크를 구성한 것이다.  
이렇듯 클라우드 컴퓨팅은 많은 레이어들을 추상화 해놓고, 자동화 해놓음으로써 물리적으로 구축하기 힘든 환경을 손쉽게 제공해준다는 장점이 존재한다.

## VPC 생성
![region](region.png)
VPC는 [Region](https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)에 생성되므로  
서비스하려는 region을 고민하고 신중하게 생성해야한다.
 
여기서는 VPC Wizards 대신에 직접 VPC를 만들어 볼 것이다.  
AWS 콘솔에서 VPC 서비스로 이동해서 좌측 탭 중에 Your VPCs를 클릭하고, Create VPC를 클릭한다.  

![vpc 생성 화면](create-vpc.png)  
Name Tag와 IPv4 <a href="https://ko.wikipedia.org/wiki/%EC%82%AC%EC%9D%B4%EB%8D%94_(%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%82%B9)" target="_blank">CIDR Block</a>을 정해줘야하는데,
[AWS 공식 문서](https://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_Subnets.html#VPC_Sizing)에서는
[RFC 1918](http://www.faqs.org/rfcs/rfc1918.html)에 명시된 private ip를 권장하고 있다.  
vpc와 같은 서비스는 전 세계에서 공통으로 사용하는 서비스이고 IP 주소는 자원을 식별하기 위한 주소이므로 충돌이 일어나면 안 된다.  
따라서 private ip를 추천하는 것 같고, [ip class](https://ko.wikipedia.org/wiki/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC_%ED%81%B4%EB%9E%98%EC%8A%A4) 별 private ip는 다음과 같다.  
* A 클래스 - 10.0.0.0 - 10.255.255.255 (cidr block 10.0.0.0/8)  
* B 클래스 - 172.16.0.0 - 172.31.255.255 (cidr block 172.16.0.0/12)  
* C 클래스 - 192.168.0.0 - 192.168.255.255 (cidr block 192.168.0.0/16)

vpc에서 netmask는 16(65536개의 네트워크, 65536개의 호스트) ~ 28(약 26억개의 네트워크, 16개의 호스트)을 지정해줘야한다.  

이렇게만 진행하면 간단하게 VPC를 생성했으니 이제 다음으로 [Public Subnet](/2018/04/25/aws-public-subnet)을 만들어보자.
