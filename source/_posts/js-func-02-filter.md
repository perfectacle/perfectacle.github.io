---
title: (함수형 JS) filter
tag:
  - JS
  - ES
  - 함수형
category:
  - Programming
  - ECMAScript
  - 함수형 JS
date: 2017-06-26 09:26:04
---

![](/images/js-func-02-filter/thumb.png)

이 포스트는 [인프런](https://www.inflearn.com/)에서 진행한 [유인동](https://www.facebook.com/profile.php?id=100011413063178) 님의 [함수형 자바스크립트](https://www.inflearn.com/course/%ED%95%A8%EC%88%98%ED%98%95-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D/)를 듣고 감명 받아서 쓴 글이다.  
사실 [underscore](http://underscorejs.org/), [lodash](https://lodash.com/) 등 함수형 패러타임으로 코드를 짤 수 있게 끔
미리 이런 함수들을 제공하는 라이브러리들을 쓰고, 이 포스트는 그닥 볼 필요가 없다.  
하지만 이런 원리를 알고 접근을 하다보면 위 라이브러리를 쓴다고 하더라도 추가로 필요한 나의 코드를 함수형으로 더 짜기 유용하지 않을까?  

## filter
기본적으로 filter는 필터링, **조건에 맞는 녀석들만 걸러내서 새로운 데이터를 얻는 역할**을 한다.  

### 기존 프로그래밍
우선 서버와 ajax로 통신해서 db에서 다음과 같은 json 데이터를 얻어왔다고 가정해보자.
```javascript
const users = [
  {id: 0, name: '양간장', age: 55},
  {id: 1, name: '간장냥', age: 45},
  {id: 2, name: '장냥이', age: 35},
  {id: 3, name: '양권성', age: 25}  
];
```

이 유저들 중에 40대 이상인 사람과 40대 미만인 사람을 구분하는 필터링을 구현해보자.
```javascript
const over40 = [];
for(const user of users) {
  if(user.age >=40) {
    over40.push(user);
  }
}
const under40 = [];
for(const user of users) {
  if(user.age < 40) {
    under40.push(user);
  }
}
console.log(over40);
console.log(under40);
```

위 코드를 보니 반복문 구문과 새로운 배열에 만족하는 녀석들을 삽입하는 부분이 반복된다.
요것들을 어떻게 추상화 시켜서 재사용이 가능하게 끔 한번 해보고 싶어졌다.
```javascript
const __filter = users => {
  const tmp = [];
  for(const user of users) {
    if(?????) {
      tmp.push(user);
    }
  }
  return tmp;
}
```

우리가 기존에 객체 지향으로 프로그래밍을 했을 때는 조건문 부분은 추상화하기가 힘들다.  
이런 간지러운 부분을 함수형으로 바꾸면 바로 해결이 가능하다.  

### 함수형 프로그래밍
```javascript
// predicate는 참인지 거짓인지를 판별하는 함수?를 뜻하는 것 같다.
// 또한 사용자만 받는 users라는 인자 보다는 좀 더 범용적인 이름인 list를 쓰는 게 좋다.
const _filter = (list, predicate) => {
  // 나는 그냥 임시로 쓰고 말 녀석이기 때문에 별 생각 없이 tmp 등등으로 쉽게 네이밍을 했다.  
  // 하지만 순수 함수는 사이드 이펙트를 발생시키지 않고,
  // 입력값을 토대로 새로운 값을 출력하는 불변성을 가지니 new라는 키워드를 붙여주는 게 좋다. 
  const newList = [];
  // 필터링의 조건을 predicate 함수로 추상화시켰다.  
  // 구현부에서는 조건문을 신경쓰지 않고 해당 함수에게 위임하면 된다.
  // 또한 함수형 프로그래밍에서는 뭔가 한 줄로 적는 게 간지 같아서 조건문을 논리 연산자로 함축시키고, 중괄호도 다 생략했다.
  for(const item of list) predicate(item) && newList.push(item);
  return newList;
};
// 이 유저들 중에 40대 이상인 사람과 40대 미만인 사람을 구분하는 필터링을 구현해보자.  
const over40 = _filter(users, user => user.age >= 40);
const under40 = _filter(users, user => user.age < 40);
console.log(over40);
console.log(under40);
```

위에 _filter 함수를 보면 조건(predicate)를 함수의 인자로 받아서  
그 내부가 어떻게 구현됐건 신경쓰지 않고 predicate 함수에게 배열의 요소만 넘겨서 조건이 참이면 새 배열에 넣게 끔 구현했다.  
이렇게 _filter는 조건을 추상화, predicate 함수에게 위임했기 때문에 좀 더 사용성이 높아졌다.  
위와 같이 짜게 되면 ArrayLike의 대표적인 케이스인 NodeList도 필터링이 가능하다.  

그리고 
predicate(item) && newList.push(item);
위 구문이 이해 안 가는 사람은 [똑똑한 논리 연산자](/2017/02/13/es-logical-operator/)와 [값 vs 식 vs 문](/2017/06/02/js-007-value-expression-statement/)을 참고해보자.  
  
```javascript
const nodeList = document.querySelectorAll('*');
console.log(_filter(nodeList, node => node.nodeName === 'HTML'));
// Uncaught TypeError: nodeList.filter is not a function
console.log(nodeList.filter(node => node.nodeName === 'HTML'));
```
~~key와 value의 쌍으로 이루어져있는 돌림직한 객체를 필터링하는 것은 세미나에서 다루지 않았기 때문에 정리하지 않겠다.~~
key와 value의 쌍으로 이루어져있는 돌림직한 객체를 필터링하는 것은 예제가 잘 떠오르지 않고,  
필요성을 잘 느끼지 못했기 때문에 정리하지 않도록 하겠다.  
혹시 관련된 예제나 필요성 등등을 아신다면 댓글을... ^^

그럼 이제 바로 다음 포스트인 [map](/2017/06/26/js-func-03-map/)을 공부해보자!  