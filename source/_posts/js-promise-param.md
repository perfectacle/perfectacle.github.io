---
title: (ES6) Promise에 파라미터를 넘겨서 사용해보자
date: 2017-04-04 21:09:43
category: [Programming, ECMAScript]
tag: [JS, ES, ES6, ES2015, callback, promise]
---
![](js-promise-param/thumb.png)

## 들어가기에 앞서
어제 프라미스를 쓰면서 정리 해봤는데,  
또 파라미터를 넘겨서쓰거나 하려니 제대로 쓸 수가 없어서 정리해봤다.  
일단 reject 되는 경우는 생각하지 않고, `그냥 내가 짠 비동기 함수를 동기식으로 실행시키길 원했을 뿐`이었다.   
지극히 사용 방법 위주로 적었으니 아래 링크들을 참조해서 이해하자.  
일단 구현이 먼저인 사람은 코드를 적극 참조하면 될 것 같다.  
* [Promise - JavaScript | MDN - Mozilla Developer Network](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise)  
* [바보들을 위한 Promise 강의 - 도대체 Promise는 어떻게 쓰는거야? | 감성 프로그래밍](http://programmingsummaries.tistory.com/325)  
* [Promise 를 사용하는 두 가지 방법, new Promise, Promise.resolve()](http://han41858.tistory.com/11)

## 파라미터 없는 일반 비동기 함수
```javascript
const f1 = () => new Promise(res => (
  setTimeout(() => {
    console.log(1);
    // 비동기 함수(setTimeout)의 콜백 함수 안에서
    // resolve 시켜줘야 순서를 보장할 수 있음.
    // 이 res 부분부터 then 안에 구문이 실행된다고 보면 된다.
    res();
  }, 1000)
));
const f2 = () => new Promise(res => (
  setTimeout(() => {
    console.log(2);
    res();
  }, 1000)
));
const f3 = () => new Promise(res => (
  setTimeout(() => {
    console.log(3);
    res();
  }, 1000)
));
const f4 = () => new Promise(res => (
  setTimeout(() => {
    console.log(4);
    res();
  }, 1000)
));
const f5 = () => new Promise(res => (
  setTimeout(() => {
    console.log(5);
    res();
  }, 1000)
));
const f6 = () => new Promise(res => (
  setTimeout(() => {
    console.log(6);
    res();
  }, 1000)
));
const f7 = () => new Promise(res => (
  setTimeout(() => {
    console.log(7);
    res();
  }, 1000)
));
const f8 = () => new Promise(res => (
  setTimeout(() => {
    console.log(8);
    res();
  }, 1000)
));
const f9 = () => new Promise(res => (
  setTimeout(() => {
    console.log(9);
    res();
  }, 1000)
));

// 후속 함수에게 Promise를 리턴해주므로 thenable해서 계속 체이닝이 가능.
f1()       // 1
.then(f2)  // 2
.then(f3)  // 3
.then(f4)  // 4
.then(f5)  // 5
.then(f6)  // 6
.then(f7)  // 7
.then(f8)  // 8
.then(f9); // 9
```

## 파라미터가 있는 비동기 함수
```javascript
const f = (param) => new Promise(res => (
  setTimeout(() => {
    console.log(param);
    // 비동기 함수(setTimeout)의 콜백 함수 안에서
    // resolve 시켜줘야 순서를 보장할 수 있음.
    // 이 res 부분부터 then 안에 구문이 실행된다고 보면 된다.
    res();
  }, 1000)
));

// 후속 함수에게 new Promise를 리턴해주므로 thenable해서 계속 체이닝이 가능.
f(1)               // 1
.then(() => f(2))  // 2
.then(() => f(3))  // 3
.then(() => f(4))  // 4
.then(() => f(5))  // 5
.then(() => f(6))  // 6
.then(() => f(7))  // 7
.then(() => f(8))  // 8
.then(() => f(9)); // 9
```

## 현재 함수의 변수를 후속 함수에게 넘겨줘야하는 경우
```javascript
const f = (param) => new Promise(res => (
  setTimeout(() => {
    console.log(param);
    // 비동기 함수(setTimeout)의 콜백 함수 안에서
    // resolve 시켜줘야 순서를 보장할 수 있음.
    // 덤으로 후속 함수에게 파라미터(++param)을 넘기고 있음.
    // 이 res 부분부터 then 안에 구문이 실행된다고 보면 된다.
    res(++param);
  }, 1000)
));

const f2 = (param) => new Promise(res => (
  setTimeout(() => {
    console.log(param);
    res();
  }, 1000)
));

// 후속 함수에게 Promise를 리턴해주므로 thenable해서 계속 체이닝이 가능.
f(1)                      // 1
.then(param => f2(param)) // 2
.then(() => f(3))         // 3
.then(param => f2(param)) // 4
.then(() => f(5))         // 5
.then(param => f2(param)) // 6
.then(() => f(7))         // 7
.then(param => f2(param)) // 8
.then(() => f(9));        // 9
```