---
title: (함수형 JS) each
tag:
  - JS
  - ES
  - 함수형
category:
  - Programming
  - ECMAScript
  - 함수형 JS
date: 2017-06-26 01:26:15
---

![](thumb.png)

이 포스트는 [인프런](https://www.inflearn.com/)에서 진행한 [유인동](https://www.facebook.com/profile.php?id=100011413063178) 님의 [함수형 자바스크립트](https://www.inflearn.com/course/%ED%95%A8%EC%88%98%ED%98%95-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D/)를 듣고 감명 받아서 쓴 글이다.  
사실 [underscore](http://underscorejs.org/), [lodash](https://lodash.com/) 등 함수형 패러타임으로 코드를 짤 수 있게 끔
미리 이런 함수들을 제공하는 라이브러리들을 쓰고, 이 포스트는 그닥 볼 필요가 없다.  
하지만 이런 원리를 알고 접근을 하다보면 위 라이브러리를 쓴다고 하더라도 추가로 필요한 나의 코드를 함수형으로 더 짜기 유용하지 않을까?  

## each
기본적으로 each는 **반복문을 추상화 할 때** 쓰인다.  
완벽할 것 같은 이 _filter와 _map도 다시 보면 중복이 존재한다.  
이런 중복을 제거하고 추상화 하는 것들이 함수형의 묘미가 아닐까 싶다.  

```javascript
const _filter = (list, predicate) => {
  const newList = [];
  if(list.toString() === '[object Object]') {
    const objValList = [];
    for(const key of Object.keys(list)) key !== 'length' && objValList.push(list[key]);
    list = objValList;
  }
  for(const item of list) predicate(item) && newList.push(item);
  return newList;
};

const _map = (list, iteratee) => {
  const newList = [];
  if(list.toString() === '[object Object]') {
    const objValList = [];
    for(const key of Object.keys(list)) key !== 'length' && objValList.push(list[key]);
    list = objValList;
  }
  for(const item of list) newList.push(iteratee(item))
  return newList;
};
```

바로 for 반복문 부분과 객체를 배열화 시키는 부분이 굉장히 반복스런(?) 냄새를 풍긴다.  
저 부분까지 추상화 해낼 수 있다.  

```javascript
const _each = (list, iteratee) => {
  if(list.toString() === '[object Object]') {
    const objValList = [];
    for(const key of Object.keys(list)) key !== 'length' && objValList.push(list[key]);
    list = objValList;
  }
  for(const item of list) iteratee(item)
};
const _filter = (list, predicate) => {
  const newList = [];
  _each(list, item => predicate(item) && newList.push(item));
  return newList;
};
const _map = (list, iteratee) => {
  const newList = [];
  _each(list, item => newList.push(iteratee(item)));
  return newList;
};
const users = [
  {id: 0, name: '양간장', age: 55},
  {id: 1, name: '간장냥', age: 45},
  {id: 2, name: '장냥이', age: 35},
  {id: 3, name: '양권성', age: 25}
];
const over40 = _filter(users, user => user.age >= 40);
const over40Name = _map(over40, person => person.name);
console.log(over40);
console.log(over40Name);
```

사실 추상화 해놓고 보면 약간 함수 외부에 있는 리스트에 요소를 넣는다거나 사이트 이펙트를 발생시키긴 하지만...  
최소한의 사이드 이펙트 정도는 눈감아줘도 되지 않을까... 싶다.
음... 그리고 코드가 크게 줄어들지 않아서 와닿지 않을 수도 있는데...
ES5 식 코드로 보면 정말 크게 와닿는다.  

```javascript
// ES5
var __filter = function(list, predicate) {
  var newList = [];
  if(list.toString() === '[object Object]') {
    const objValList = [];
    for(var i=0, len=Object.keys(list).length; i<len; i++) key !== 'length' && objValList.push(list[key]);
    list = objValList;
  }
  for(i=0, len=list.length; i<len; i++) predicate(item) && newList.push(item);
  return newList;
};

// ES6
const _each = (list, iteratee) => {
  if(list.toString() === '[object Object]') {
    const objValList = [];
    for(const key of Object.keys(list)) key !== 'length' && objValList.push(list[key]);
    list = objValList;
  }
  for(const item of list) iteratee(item)
};
const _filter = (list, predicate) => {
  const newList = [];
  _each(list, item => predicate(item) && newList.push(item));
  return newList;
};
```
ES5 식으로 작성한 반복문은 굉장히 실수를 하기 좋다.(물론 ES6도 아주 가끔...)  
조건문을 잘못 쓴다거나 등등...  
하지만 잘 작성해 놓은 반복문 하나(each)를 추상화해서 배열의 갯수만큼 순서대로 반복문을 돌릴 때  
반복문 로직을 직접 짜지 않고, 저 추상화한 each 메소드를 쓰면 실수를 할 여지가 많이 줄어드는 것 같다.  

그럼 이제 바로 다음 포스트인 [reduce](/2017/06/26/js-func-05-reduce/)를 공부해보자!  