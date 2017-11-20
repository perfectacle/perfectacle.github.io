---
title: (CI/CD) Netlify로 github page에서 jekyll 마냥 hexo(hugo, etc.)을 이용해보자.
date: 2017-11-21 09:51:11
category: [Middle-end, Web Server]
tag: [CDN, CI, CD]
---
![](thumb.png)

이 포스트는 [2017 GDG Seoul](https://devfest17-seoul.firebaseapp.com)에서 [Github와 CloudFlare를 이용한 무료 고성능 웹 어플리케이션 호스팅](https://devfest17-seoul.firebaseapp.com/schedule/?sessionId=115)을
주제로 발표하신 [박병진](https://devfest17-seoul.firebaseapp.com/speakers/7) 님의 세션을 듣고 삘이 꽂혀서 바로 실행에 옮긴 삽질을 포스팅했습니다.

## 깃헙 페이지의 문제점
기본적으로 [github page](https://pages.github.com/)는 [지킬](https://jekyllrb.com/)이 내장돼있다.  
따라서 지킬에서 사용한 템플릿들은 별도의 static html 파일로 빌드하지 않아도 서비스가 가능하다.  
하지만 지킬을 설치하기 어려운 환경이거나 윈도우 유저(과거엔 윈도우에서 지킬 설치가 좀 힘들었다.), 비 지킬 유저([hexo](https://hexo.io/), [hugo](https://gohugo.io/), etc.)의 경우에는  
* 빌드 된 정적인 파일  
* 빌드 되기 전인 템플릿 파일  

두 벌을 관리해야했다. (별도의 브랜치 혹은 저장소에서 관리를 해야했다.)  
심지어 자신의 저장소에 빌드 된 파일이 아닌 템플릿 파일이 올라갔다고 착각한 사람들도 많다.  
컴퓨터를 포맷해서 낭패보기 전에 얼른 다른 브랜치나 저장소에 백업을 해두자.  
또한 깃헙 페이지의 경우에는 [CDN](https://ko.wikipedia.org/wiki/%EC%BD%98%ED%85%90%EC%B8%A0_%EC%A0%84%EC%86%A1_%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC)을 제공하지 않아 글로벌 서비스에는 제약이 따르고,
소스의 최적화(minify 및 uglify, 이미지 압축 등등)를 직접 빌드 도구를 돌려야했다.  

## [Netlify](https://www.netlify.com/)
netlify는 CI(빌드 및 배포)+CDN의 개념으로 볼 수 있다.  
그리고 위의 단점들을 고스란히 해결해줬다.
물론 커스텀 도메인이 없다면 *.netlify.com 이란 허접스러운 도메인을 써야해서 github.io라는 간지나는 도메인을 눈물을 머금으며 버릴 수 밖에 없다.  
그나마 닷컴 도메인을 싸게 살 수 있으므로 관심이 있는 사람은 [(DNS) 1331원에 .com 도메인 사기 (feat. GoDaddy)](/2017/11/21/domain-register-godaddy/)를 참고하자.  

당연히 [회원가입](https://app.netlify.com/signup)부터 진행해야한다.  
요즘은 소셜 로그인이 활성화가 돼있어서 좀 덜 귀찮은 편인 것 같다.  
이 포스트에서는 깃헙 페이지+hexo를 netlify로 마이그레이션(?) 할 거기 때문에 github으로 로그인을 진행했다.  

## CD(Continuous Deploy)
깃헙 페이지와 마찬가지로 무중단 배포를 지원한다.  
로그인을 하고 나서는 New site from Git 버튼을 클릭해서 netlify에 빌드+배포 할 깃헙 리파지토리를 선택해주자.  

![](00.png)  
아마 요 설정에서 어떻게 해야할지 막막(?)할 것이다.  
github.io를 버리고 갑자기 도메인 이전을 하면 이전 사용자가 혼란을 겪을 수 있으므로 우선 master 브랜치는 냅두고, 별도의 브랜치(나의 경우엔 netlify)를 팠다.  
만약 신규로 깃헙 페이지를 파는 경우에는 master 브랜치를 바라보게 하면 될 것이다.  

그리고 빌드 명령어도 어떻게 넣어야할지 애매할텐데 나의 경우에는 `hexo clean & hexo deploy; exit 0` 명령을 때리는 npm 스크립트를 집어넣었다. 
`hexo clean & hexo deploy; exit 0`를 넣어도 상관 없는데 뒤에 exit 0를 빼면 `Build script returned non-zero exit code: 2`라면서 빌드에 실패하게 된다.    
퍼블리시 디렉토리는 플랫폼(지킬, 헥소, 휴고, 등등) 별로 다를 가능성이 크니 직접 로컬에서 테스트 해보자.  
위 설정을 다 마쳤다면 deploy를 하자.

![](01.png)  
혹시 배포 중에 빌드 오류 등등이 일어날 지 모르니 배포 중인 항목을 선택해서 로그를 유심히 살펴보자.  
나의 경우에는 빌드하는데 2~3분 가량 걸렸고, CDN의 각 엣지 포인트에 배포되기까지는 5분 가량 걸린 것 같다.  

## Setting
![해괴망측한 도메인](02.png)  
배포를 성공적으로 마쳤으면 저 해괴망측한 도메인으로 접속이 가능하다.  
우선 저 도메인부터 바꾸기 위해 site settings를 누르자.   
그리고 change site name을 눌러서 도메인 및 사이트 이름을 변경해주면 된다.  
하지만 여전히 *.netlify.com으로 세팅되기 때문에 커스텀 도메인을 사용하고 싶은 사람은 [도메인 세팅](#도메인-세팅) 파트를 참조하자.  

## 빌드와 배포 설정
사이트 세팅을 통해서 들어온 페이지에서 좌측 탭을 보면 Build & deploy가 있으니 그걸 클릭해서 들어가자.  
* Deploy settings - 빌드 관련해서 브랜치, 배포 명령어 등등을 설정할 수 있다.  
* Build environment variables - 귀찮으니 [문서](https://www.netlify.com/docs/continuous-deployment/#build-environment-variables)를 참고하자.  
* Build hooks - 빌드하고 나서 incomming, outgoing web hook을 설정할 수 있다.  
* Single page apps - ~~구글은 지원하지만 네이버는 지원하지 않는~~검색 엔진이 자바스크립트를 해석하지 못하는 경우 SEO 측면에서 SPA는 큰 결함을 가지는데 서버사이드 렌더링을 지원해주는 것 같다.  
* Post processing - 가끔 보면 google analytics 등등의 경우에 헤드에 스크립트 등등을 삽입해야하는데 요런 코드들을 여기다가 심어놓으면 된다.  
* Asset optimization - 사이트를 최적화해주면 된다고 보면 된다, 안 할 이유가 없으니 enable 시켜주자.  
* Deploy notifications - 빌드 이벤트가 발생할 때 웹훅을 등록해놓는 설정이다.  

## 도메인 세팅
허접한 netlify 도메인에서 탈출할 시간이다.  
단돈 1331원이면 가능하니 [(DNS) 1331원에 .com 도메인 사기 (feat. GoDaddy)](/2017/11/21/domain-register-godaddy/)를 참고해서 닷컴 도메인을 사두고 진행하자.  
이번엔 좌측 탭에서 Domain management를 클릭해주자.  

Custom domain에서 add custom domain을 선택하고 자신의 도메인을 등록하자.  

![절대 한번에 제대로 되는 법이 없다](03.png)  
아마 위와 같은 오류를 마주치게 될 것이다.  
오류 문구를 읽다보면 다음과 같은 문장과 마주하게 된다.  
>> Warning! With your current configuration, you won’t benefit from the full advantages of a CDN if you use an A record.
   We recommend changing your site’s custom domain to www.*.com, or switching to a DNS provider that supports ANAME or ALIAS records.
   
GoDaddy의 경우에는 dns 관리에서 alias 레코드가 없고 a 레코드만 존재해서 뭔가 CDN의 이점을 충분히 못 받는 것 같아서 찜찜하고,  
www.*.com과 같이 사용하는 걸 권장한다는 것 같아서 뭔가 좀 그렇다.  

따라서 Use Netlify DNS를 눌러서 CDN의 이점을 최대한(?) 누려보자!  
그러면 오류 메세지가 바뀌면서 어떤 네임서버를 추가해야하는지 알려준다.  
도메인의 DNS관리(GoDaddy의 경우 도메인 관리 - 해당 도메인의 DNS 관리로 들어와야 함)로 가서 네임서버를 변경하자.  

![GoDaddy의 경우에는 다음과 같이 하면 된다.](04.png)  
저장을 누르고 약 5분이 지난 후 새로고침을 해보면 아래와 같이 해당 도메인으로 정상적인 접근이 가능하다는 것을 볼 수 있다.  

![감격의 눈물이 주륵주륵](05.png)

아래로 내려서 HTTPS 탭에서 TLS(a.k.a SSL) 인증서를 붙이자.  
별도의 인증서가 없다면 Verify DNS configuration - Let's Encrypt certificate를 클릭하자. (Let's Encrypt 만만세)  
원래 Let's Encrypt에서 발급한 인증서의 경우에는 30일 마다 주기적으로 갱신해줘야하는 귀챠니즘이 존재하는데 알아서 해주는 것 같다.  

Force HTTPS 탭에서는 http to https(reverse proxy)가 가능하다.  
당연히 안 해줄 이유가 없으므로 enable 시키자.  

나머지 설정은 알아서 하자...
