---
title: (자알쓰) 전역 변수
date: 2017-08-08 18:51:57
category: [Programming, ECMAScript, 자알쓰]
tag: [JS, ES, 자알쓰, JIT]
---
![](js-global-variable-truth/thumb.png)

해당 포스트는 [김훈민](https://www.facebook.com/jeokrang?fref=ts) 님의 [Lexical Environment in ECMA-262 5th edition](http://huns.me/development/1407)를 감명깊게 보고
전역 컨텍스트와 전역 변수를 엮어서 설명을 해본 글이다.

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
이번에는 번외편 격인 전역 변수에 대해 간단히 다뤄보았다.  

## 전역 변수(Global Variable)
전역 변수는 소스 코드 어디서나 접근 가능하다는 장점이 존재하다.  
물론 어디서나 접근 가능하기 때문에 변수명의 충돌 가능성이 높아서 코드의 안정성이 보장되지 않아 과한 사용을 지양해야한다.  
그리고 이 전역 변수는 전역 실행 컨텍스트 내에 존재한다.

## 실행 컨텍스트(Execution Context)
EC(실행 컨텍스트)는 소스 코드가 실행되기 위해 제공해주는 환경이라고 보면 될 것 같다.  
이 EC는 세 가지 경우에 형성이 되며 콜스택(함수 호출 정보를 모아두는 곳)에 차곡 차곡 쌓이게 된다.  
세 가지 경우로 나눈 이유는 각각 EC를 초기화하는 방법이 상이하기 때문이다.  
1. Global  
소스 코드가 실행되면 자동으로 Global EC가 형성된다.  
이 포스트는 전역 변수에 포커싱이 맞춰져있으므로 전역 실행 컨텍스트만 설명하겠다.
2. Function  
함수가 호출되면 해당 함수의 EC가 형성된다.  
3. Eval  
eval() 함수가 호출되면 Eval EC가 형성된다.  

그렇다면 이 EC는 어떻게 생겨먹은 녀석일까?  
ES5 버전부터는 이전과 상이한 내용이 존재하기 때문에 설명은 ES5 스펙을 기준으로 하겠다.  
[...]안에 들어있는 녀석들은 해당 타입을 의미한다.  

```javascript
ExecutionContext = {
  LexicalEnvironment: [LexicalEnvironment],
  VariableEnvironment: [LexicalEnvironment],
  ThisBinding: [object]
};
```
ThisBinding은 해당 EC 내에서 this를 어떤 객체로 바인딩할 지에 대한 프로퍼티이다.  
LexicalEnvironment와 VariableEnvironment는 동일한 타입을 가지며 동일한 값을 가진다.  
둘의 차이점은 LE는 변경할 가능성이 있는데 VE는 변경할 가능성이 없다는 점이다.  
변경한 LE를 원래의 LE로 회귀해야할 때 VE를 사용하기 위해서 둘을 따로 구분한 것 같다.  
LE가 바뀌는 경우는 거의 없는데 with 문을 사용하면 LE가 바뀐다고 한다.  
하지만 with는 성능 이슈와 모호함 때문에 사용을 지양해야하므로 거의 없다고 보는 게 맞는 것 같다.  
이 포스트의 주제와는 다소 동떨어지므로 자세한 생략은 생략하겠다.

그리고 LexicalEnvironment 타입은 다음과 같다.  
```javascript
LexicalEnvironment = {
  EnvironmentRecord: [DeclarativeEnvironmentRecord|ObjectEnvironmentRecord],
  OuterEnvironmentReference: [object]
};
```
OuterEnvironmentReference의 경우에는 자신의 바로 상위 스코프를 가리키며  
이 OuterEnvironmentReference를 타고 타고 스코프 체인이 일어나는 것이다.  
EnvironmentRecord는 지역 변수들을 담는 공간이다.  
EnvironmentRecord는 두 가지 타입 중 하나이면 된다.  

* DeclarativeEnvironmentRecord
Environment Object를 리터럴로 선언하는 거랑 동일하다고 보면 된다.  
함수 EC의 EnvironmentRecord는 이러한 형태로 정의된다.   
예를 들면 다음과 같이 말이다.  
```javascript
DeclarativeEnvironmentRecord = {
  x: 2,
  y: 10
};
```

* ObjectEnvironmentRecord  
ObjectEnvironmentRecord는 다른 Environment Object를 참조하는 거랑 비슷하다고 보면 된다.  
그로벌 EC의 EnvironmentRecord는 이러한 형태로 정의된다.
```javascript
ObjectEnvironmentRecord = {
  bindObject: [object]
};
```

### 전역 실행 컨텍스트(Global Execution Context)
아래와 같은 코드가 있다고 쳐보자.  
```javascript
'use strict';
var a = 2;
```

그럼 전역 EC는 다음과 같이 생성된다.  
```javascript
GlobalExecutionContext = {
  LexicalEnvironment: {
    EnvironmentRecord: {
      bindingObject: window,
    },
    OuterEnvironmentReference: null
  },
  VariableEnvironment: {
    EnvironmentRecord: {
      bindingObject: window,
    },
    OuterEnvironmentReference: null
  },
  ThisBinding: null
};
```
