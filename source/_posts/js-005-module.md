---
title: (자알쓰) 모듈화 Part. 1
date: 2017-05-20 09:14:47
categories: [Programming, ECMAScript, 자알쓰]
tag: [JS, ES, 자알쓰, Module, Namespace]
---
![](js-005-module/thumb.png)

## 자알쓰란?
`자`바스크립트 `알`고 `쓰`자. (잘 쓰자는 의미도 담겨있다.)  
자바스크립트라는 언어 자체는 내 기준에서는 설계 상 미스가 참 많다.  
함수 단위의 스코프, 호이스팅, 동적 타입 등등  
자바와 같은 깐깐(?)한 언어를 배우고 바라본 자스는 허점 투성이처럼 보였다.  
애초에 자바스크립트는 어떠한 프로그램을 만들기 위해서 탄생했다기 보다는  
웹 페이지에 입력값에 대한 유효성 검사(데이터가 공란인지 아닌지 등등)와 같은  
페이지의 동적 제어가 주된 목적 + 짧은 개발 기간(넷 스케이프 사의 새로운 브라우저에 탑재 예정) 때문에  
설계 상에 미스가 있을 수 밖에 없다고 나는 생각된다.  
일종의 안전 장치가 없어서 개발자가 일일이 구현해주고, 신경써야 하는 느낌이었다.  
그렇다고 해서 자바스크립트를 극혐하거나 그런 것은 아니고 매우 사랑한다.  
또한 그 허점을 아는 사람은 허점을 보완해서 요리조리 피해서 잘 쓰겠지만...  
잘 모르는 부분들은 잘못 써도 동작이 잘 되기 마련이다.  
이는 지금 당장에는 큰 문제가 안 될지 모르겠지만, 추후에 대규모 웹 어플리케이션을 만들거나  
직면할 문제로부터 미리 해방시키기 위해 처음부터 좋은 습관을 들여가는 것이 좋다고 생각한다.  
그 다섯 번째 시리즈는 모듈화를 주제로 진행하겠다.

## 모듈화란?
저번 시간에 아래와 같은 문제점이 존재한다는 것을 발견했다.  
```html
<script src="a.js"></script>
<!-- 요 사이에 내 부사수가 작성한 c.js를 로딩시켰다. -->
<script src="c.js"></script>
<script src="b.js"></script>
```
```javascript
'use strict';
// 내가 작성한 a.js
var num = 1;

// 내 부사수가 작성한 c.js
// 블라블라
var num = 2;
// 블라블라

// 내가 작성한 b.js
window.onload = function() {
  'use strict';
  var btnA = document.getElementById('a');
  var btnB = document.getElementById('b');
  btnA.onclick = function() {
    console.log(num);
  };
  btnB.onclick = function() {
    console.log(num);
  }
};
```

a와 b 버튼을 누르면 내가 작성한 a.js의 num이 아닌 부사수가 작성한 c.js의 num값인 2가 출력된다.  
a보다 c.js를 더 늦게 불러왔고 js의 스코프는 모듈(이해하기 쉽게 설명하면 파일) 단위가 아니기 때문이다.  

이런 문제점을 극복하고자 아래와 같은 패턴이 존재한다.  

### 네임스페이스 패턴
C++에서 처음 이 단어를 접했는데 일단 뭐 그 부분은 알아서들 찾아보고,  
그럼 어떻게 활용하는지 알아보자.  
```javascript
// 내가 작성할 a.js
var util = util || {};
util.num = util.num || 1;

// 부사수가 작성할 c.js
var util2 = util2 || {};
util2.num = util2.num || 2;

// 내가 작성할 b.js
window.onload = function() {
  'use strict';
  var btnA = document.getElementById('a');
  var btnB = document.getElementById('b');
  btnA.onclick = function() {
    console.log(util.num);
  };
  btnB.onclick = function() {
    console.log(util.num);
  }
};
```

이제 부사수가 지지고 볶고 자신의 스크립트를 어디서 불러오든간에  
부사수가 util 객체만 건드리지 않는다면 내 코드는 안전을 보장받는 것이다.  

그럼 저 || or 연산자는 왜 썼는지 알아보자.  
||의 원리가 궁금한 사람은 [(ES) 똑똑한 논리 연산자](/2017/02/13/es-logical-operator/)를 참고하자.  
```javascript
// 내가 작성한 util 모듈
// util 이라는 1차 네임 스페이스
var util = util || {};
// array라는 2차 네임 스페이스
util.array = util.array || {};
util.array.getIdx = util.array.getIdx || function(val, array) { 
  // 블라블라
};


// 자바스크립트 파일이 너무 많아서 util이란 모듈이 존재하는지 모르고
// || 연산자(기본값 지정)을 사용하지 않고 util 모듈을 재정의할 경우
var util = {
  string: {
    getLastChar: function(str) {
      // 블라블라
    }
  }
}

// 내가 작성한 util 모듈을 쓴 다른 코드
var arr = [1, 4, 7];

// 부사수가 정의한 util 모듈에 의해 array 네임스페이스는 날아간 상태임.
// 따라서 오류가 발생함.
var midIdx = util.array.getIdx(7, arr);
```

위와 같은 상황이 발생할까봐 좀 귀찮더라도 || 연산자를 써서 모듈을 정의할 것을 추천한다.  
아래와 같이 작성해야한다.  
```javascript
// 내가 작성한 util 모듈
// util 이라는 1차 네임 스페이스
var util = util || {};
// array라는 2차 네임 스페이스
util.array = util.array || {};
util.array.getIdx = util.array.getIdx || function(val, array) { 
  // 블라블라
};


// 자바스크립트 파일이 너무 많아서 util이란 모듈이 존재할까봐 기본값 패턴을 써서 util 모듈을 정의한 경우
var util = util || {};
util.string = util.string || {};
util.string.getLastChar = function(str) {
  // 블라블라
};

// 따라서 util 모듈은 아래와 같은 형태를 띈다.
// 내가 작성한 util 모듈을 전혀 훼손시키지 않고 부사수의 모듈과 결합이 되었다.
// 뭐 사실 모듈 간에 이름은 최대한 겹치지 않고 작하는 게 맞는 것 같다.
util = {
  array: {
    getIdx: function(val, array) {}
  },
  string: {
    getLastChar: function(str) {}
  }
};

// 내가 작성한 util 모듈을 쓴 다른 코드
var arr = [1, 4, 7];

// 내가 작성한 util 모듈의 array 네임스페이스는 살아있음.
var midIdx = util.array.getIdx(7, arr);
```

하지만 매번 있는지 없는지 기본 연산자로 체크하고 귀찮기도 하고,  
만약에 그 값이 존재한다면 내가 쓰려고 하는 값이 아닌 기존의 값으로 대체가 돼버리니  
재정의가 불가능해질 수도 있다.  
이를 위해서 ES2015에 대한 모듈화 포스팅을 참고하자.  

## 스코프 강제 형성
ES2015+는 블록 단위의 스코프라 {}만 써도 강제로 스코프가 형성이 됐었다.  
그럼 함수 단위의 스코프인 ES5에서는 어떻게 할 수 있을까?  
```javascript
// 함수를 임의로 만들면 된다.
// 근데 함수는 만든다고 실행하는 게 아니니 함수를 만들자마자 실행해야한다.
(function() { // 즉시 실행할 것이기 때문에 재호출할 일이 없으니 이름이 필요 없으니 익명함수로 작
  var a = 11;
  console.log(a);
})(); // 그 함수를 실행

// 이를 즉시 실행함수(IIFE: Immediately Invoked Function Expressions)라고 부른다.  
// 대개 1회성 함수, 한번만 쓰는 코드, 클로저 등등에 쓰는데
// 전역 스코프를 더럽히지 않는다는 장점 때문에 나는 무조건 쓴다.  
// 하지만 외부에서 참조해야하는 경우에는 네임스페이스 패턴을 이용해 모듈화를 진행해서 쓰는 편이다.
// 사실 ES2015+ 들어가면 이렇게 절대 안 쓰니 딥하게 파고들 필요는 없는 것 같다.
(function() {
  console.log(a); // a is not defined
}());
```

위와 같은 즉시 실행함수 패턴은 단순 1회성 코드, 즉 다시는 참조할 일이 없는 코드들만 넣을 때 썼다.  
전역의 스코프를 더럽히지 않아 변수 네이밍이 자유롭다는 장점이 있다.
다음 포스트에서는 [ES2015+에서 모듈화](/2017/05/20/js-006-module/)를 어떻게 진행하는지 알아보자.  
