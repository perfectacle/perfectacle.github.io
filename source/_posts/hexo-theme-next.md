---
title: (Hexo) NexT 테마
tags: [Hexo, Theme, NexT]
categories: [기타, 잡동사니]
date: 2019-08-22 15:38:15
---
## Static Page Blog 테마 선정
Static Page로 만들어진 블로그들은 테마가 굉장히 중요하다.  
네이버나 티스토리에는 있는 기본적인 기능들이 없는 테마들이 상당히 많다. (검색, 카테고리, 태그, 페이지네이션 등등)  
따라서 디자인만 보고 골랐다가 커스터마이징하느라 시간을 날리기 십상이기 때문에 디자인과 기능 사이에 어느정도 절충안을 가지고 골라야한다.  

![](hexo-theme-next/hueman.png)  
나는 이전에 [Hueman](https://github.com/ppoffice/hexo-theme-hueman) 테마를 살짝 커스터마이징해서 사용했다.
검색이나 카테고리, 메뉴 등등의 기능은 좋았지만 디자인이 좀 구려보였다.  
다소 아쉽긴 했지만 블로그의 본질은 **글쓰기**이기 때문에 좀 더 가치있는 일에 집중을 하고 싶어서 큰 불만없이 사용하고 있었다.

![넘나 맛있는 내사랑 돈까스를 매주 공짜로 먹을 수만 있다면...](hexo-theme-next/pork-cutlet.jpeg)
하지만 욕심이 생겨서 구글 애드센스를 통해 조그만 수익이라도 창출해보고 싶었다.  
그러나 번번히 정책에 부합하지 않는다는 답변만 받았다.  
그러다보니 '애드센스 다느라 뻘짓할 시간에 공부해서 연봉 올리는 게 더 낫겠다'는 판단이 들었다.

## 왜 NexT 테마로 바꾸는가?
하지만 인간의 욕심은 끝이 없고, 주변에서 '왜 애드센스 안 다냐, 다른 사람들은 쉽게 통과됐다'라는 소리가 들리길래 다시 욕심이 생겼다.  
애드센스 말고 다른 광고 플랫폼도 있지만 '질떨어지는 광고가 노출되면 어떡하나, 광고가 너무 과해서 사람들의 발길이 끊기면 어떡하나' 이런 걱정들이 들었다.  
그렇다고 해서 애드센스가 통과 잘 되는 다른 플랫폼으로 갈아타고 싶진 않았고, 내가 테마를 커스터마이징하면서 뭔가 웹표준이나 접근성에 위배되는 등등의 잘못을 저지르지 않을까 싶었다.  
따라서 애드센스가 통과된 적이 있고, 사람들이 많이 사용하는 테마를 최대한 커스터마이징하지 않으려고 하다보니 [NexT](https://github.com/theme-next/hexo-theme-next)란 테마를 발견하게 되었다.

우선 카테고리, 메뉴, 태그, 검색 등등의 기능은 이전 Hueman 테마와 동일하다.  
하지만 디자인이 깔끔하고 테마 안에서도 [Muse](https://muse.theme-next.org), [Mist](https://mist.theme-next.org), [Pisces](https://pisces.theme-next.org), [Gemini](https://theme-next.org)와 같은 테마들이 존재한다. (나는 Pisces 테마를 택했다.)  
또한 사이드바에 목차가 나오는 것도 좋고, 예전에는 블로그 홈에 썸네일이 없으면 좀 보기가 안 좋았는데 이 테마는 굳이 썸네일이 없어도 돼서 썸네일을 고르는데 들었던 시간을 단축시킬 수도 있다.  
[문서](https://theme-next.org/docs/)도 굉장히 잘 되있고, 한국어도 잘 지원한다.  
또한 북마크 기능(다음에 해당 페이지 재방문시 스크롤 위치 기억), [PJAX](https://github.com/MoOx/pjax) (AJAX와 pushState를 이용하여 페이지를 처음부터 로딩하는 게 아니라 필요한 컨텐츠만 로딩), 각종 Analytics, 댓글 등등의 플러그인의 사용이 가능하다.
그리고 유지보수도 굉장히 활발히 이루어지고 있다.

테마를 바꾸고 만 하루만에 바로 통과되었다.  
기존 테마를 내 맘대로 커스터마이징 하면서 뭔가 잘못 건드린 모양이다.  
~~주 1회 매콤 치즈 돈까스를 실현하기 위해 블로그를 열심히 해야겠다.~~
