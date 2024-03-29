---
title: (상식) 컴퓨터에서 2진수, 8진수, 16진수를 쓰게 된 이유
date: 2017-08-07 09:02:39
categories: [기타, 등등]
tag: [IT, Computer, 진법]
---
![](computer-number-making-reason/thumb.png)  
여러 책을 보고 혼자서 내린 결론이기 때문에 틀릴 가능성이 있으니 지적해주면 감사하겠습니다 ^^

## 최초의 컴퓨터는 10진수를 사용했다.  
나는 처음부터 2진수를 사용한 줄 알았는데 최초의 컴퓨터인 [에니악](https://ko.wikipedia.org/wiki/%EC%97%90%EB%8B%88%EC%95%85)은 10진수를 사용했다고 한다.  
아마도 우리의 손가락이 10개이고 평상시에 연산을 할 때도 10진수를 주로 사용하기 때문에 익숙해서 10진수를 사용했던 게 아닐까?  

## 그럼 왜 컴퓨터는 2진수를 사용하게 됐을까?  
전기회로는 전압이 불안정해서 전압을 10단계로 나누어 처리하는데 한계가 있다.  
따라서 에니악과 [에드삭](https://ko.wikipedia.org/wiki/%EC%97%90%EB%93%9C%EC%82%AD)은 10진수를 이용했던 데 반해  
그 후속 시리즈인 [에드박](https://ko.wikipedia.org/wiki/%EC%97%90%EB%93%9C%EB%B0%95)은 전압을 2단계로 나누어 처리하는 2진수를 사용하였다.  
즉, 전기가 흐르면 1, 전기가 흐르지 않으면 0만으로 동작하게 설계하게 된 것이다.  
결론을 내리자면 **전기회로는 전압이 불안정해서 전압을 두 단계로 나누어 처리하는 게 안정적이다 보니 2진수를 사용하게 된 것이다.**

## 8진수, 16진수는 왜 생겼을까? 4진수는 왜 안 쓰이는 것일까?
2진수는 숫자를 표현하기 위해 상당히 많은 자릿수를 차지한다.  
코딩할 때도 이렇게 많은 자릿수는 가독성을 해칠 수 있다.  
따라서 이런 단점을 보완하기 위해 8진수와 16진수가 등장했다.  
그렇다면 왜 8진수와 16진수일까?  
2진수 2자리로는 4진수를  
2진수 3자리로는 8진수를  
2진수 4자리로는 16진수를 표현할 수 있다.  
2진수 2자리는 그닥 많은 자릿수를 절약할 수 없어서 사용을 안 하게 된 게 아닐까 싶다...  
8진수를 사용하는 대표적인 예는 리눅스나 FTP 등에서 파일이나 폴더에 관한 권한을 표현하기 위해 많이 쓰인다.  
777 을 예로 들면  
r 읽기 허용(4) w 쓰기 허용(2) x 실행 허용(1) 을 다 더하면 7이 나오고  
u 사용자(소유자) g 그룹 o 기타(사용자와 그룹을 제외한 사람) 순서로 기술하면 된다.  
16진수를 사용하는 대표적인 예는 rgb 컬러 코드(#ff00ff), 유니코드(\u0061, U+0061, 0x0061 등등)에서 쓰인다.
