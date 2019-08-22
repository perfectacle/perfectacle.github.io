---
title: (ES6+) 비동기 함수를 깔끔하게 처리해보자. 
date: 2017-04-03 21:18:09
category: [Programming, ECMAScript]
tag: [JS, ES, ES6, ES2015, ES6+, callback, promise, async, await]
---
![](/images/js-async-function/thumb.png)

전에 AJAX를 Promise와 Async/Await로 처리하는 방법을 알아봤는데,  
setTimeout과 같은 비동기 함수를 처리하려니 또 버퍼링이 걸려서 정리해봤다.  
너무 사용법 위주로 공부하다보니 나중에 또 정리를 하게 될 것 같다.  
AJAX를 비동기로 처리하고 싶은 사람은 아래 글을 참조하자.  
[(ES6) ajax 위주의 promise 실습](/2017/01/21/ES6-Promise-with-ajax/)  
[(ES6+) ajax를 위한 fetch와 async/await](/2017/01/25/ES6-ajax-with-fetch/)  

## ~ES5(콜백 함수)
순서가 보장되지만 피라미드 같이 생겼다.  
뎁스가 깊어질 수록 컨트롤하기가 어렵다.  
혹시 cb && cb()의 동작 방식과 원리가 궁금한 사람은 아래 글을 참조하자.  
[(ES) 똑똑한 논리 연산자](/2017/02/13/es-logical-operator/#원리-파악)  
```javascript
const f1 = cb => setTimeout(() => {
  console.log(1);
  // setTimeout의 콜백 함수 안에서
  // 콜백함수(f1 함수의 매개변수인 cb)
  // 를 실행해야 실행 순서가 보장됨.
  // 매개변수로 넘어온 콜백함수(cb)
  // 가 없으면 실행하지 않음.
  cb && cb();
}, 1000);
const f2 = cb => setTimeout(() => {
  console.log(2);
  cb && cb();
}, 1000);
const f3 = cb => setTimeout(() => {
  console.log(3);
  cb && cb();
}, 1000);
const f4 = cb => setTimeout(() => {
  console.log(4);
  cb && cb();
}, 1000);
const f5 = cb => setTimeout(() => {
  console.log(5);
  cb && cb();
}, 1000);
const f6 = cb => setTimeout(() => {
  console.log(6);
  cb && cb();
}, 1000);
const f7 = cb => setTimeout(() => {
  console.log(7);
  cb && cb();
}, 1000);
const f8 = cb => setTimeout(() => {
  console.log(8);
  cb && cb();
}, 1000);
const f9 = cb => setTimeout(() => {
  console.log(9);
  cb && cb();
}, 1000);

f1(
  () => f2(
    () => f3(
      () => f4(
        () => f5(
          () => f6(
            () => f7(
              () => f8(
                () => f9()
              )
            )
          )
        )
      )
    )
  )
);
```

## ES6(Promise)
![프라미스 동작 구조](/images/js-async-function/promises.png)  
콜백 함수 패턴이 익숙해서 자주 쓰는데,  
뎁스가 깊어지니 뭔가 깔끔하게 정리해보고 싶었다.  
일단 나는 reject 되는 경우는 생각하지 않았다.  
`그냥 내가 짠 비동기 함수를 동기식으로 실행시키길 원했을 뿐이니까...`  
너무 사용 방법에만 치중하다보니 코드가 다소 복잡해보이기도 한다.  
```javascript
const promise = cb => new Promise(res => {
  // 콜백 함수 안에서 resolve 함수를 실행해야 순서가 보장됨.
  cb(res);
});

const f1 = cb => setTimeout(() => {
  console.log(1);
  // setTimeout의 콜백 함수 안에서
  // 콜백함수(f1 함수의 매개변수인 cb)
  // 를 실행해야 실행 순서가 보장됨.
  // 매개변수로 넘어온 콜백함수(cb)
  // 가 없으면 실행하지 않음.
  cb && cb();
}, 1000);
const f2 = cb => setTimeout(() => {
  console.log(2);
  cb && cb();
}, 1000);
const f3 = cb => setTimeout(() => {
  console.log(3);
  cb && cb();
}, 1000);
const f4 = cb => setTimeout(() => {
  console.log(4);
  cb && cb();
}, 1000);
const f5 = cb => setTimeout(() => {
  console.log(5);
  cb && cb();
}, 1000);
const f6 = cb => setTimeout(() => {
  console.log(6);
  cb && cb();
}, 1000);
const f7 = cb => setTimeout(() => {
  console.log(7);
  cb && cb();
}, 1000);
const f8 = cb => setTimeout(() => {
  console.log(8);
  cb && cb();
}, 1000);
const f9 = cb => setTimeout(() => {
  console.log(9);
  cb && cb();
}, 1000);

promise(f1)
.then(() => promise(f2))
.then(() => promise(f3))
.then(() => promise(f4))
.then(() => promise(f5))
.then(() => promise(f6))
.then(() => promise(f7))
.then(() => promise(f8))
.then(() => promise(f9));
```

## ES2017(Async/Await)
크롬, 파폭, 사파리, 오페라 최신 버전에서는 지원하는 것 같은데 MS 진영은(엣지 포함) 암담하다.  
[ECMAScript Next compatibility table](http://kangax.github.io/compat-table/es2016plus/#test-async_functions)

MS나 하위 브라우저를 지원해야한다면  
[Syntax async functions · Babel](https://babeljs.io/docs/plugins/syntax-async-functions/)을 참고하자.  
Node.js LTS(v6.x)에서도 지원하지 않는 것 같으니 참고하자.  
[Node.js ES2015/ES6, ES2016 and ES2017 support](http://node.green/#ES2017-features-async-functions)
```javascript
const promise = cb => new Promise(res => {
  // 콜백 함수 안에서 resolve 함수를 실행해야 순서가 보장됨.
  cb(res);
});

const f1 = cb => setTimeout(() => {
  console.log(1);
  // setTimeout의 콜백 함수 안에서
  // 콜백함수(f1 함수의 매개변수인 cb)
  // 를 실행해야 실행 순서가 보장됨.
  // 매개변수로 넘어온 콜백함수(cb)
  // 가 없으면 실행하지 않음.
  cb && cb();
}, 1000);
const f2 = cb => setTimeout(() => {
  console.log(2);
  cb && cb();
}, 1000);
const f3 = cb => setTimeout(() => {
  console.log(3);
  cb && cb();
}, 1000);
const f4 = cb => setTimeout(() => {
  console.log(4);
  cb && cb();
}, 1000);
const f5 = cb => setTimeout(() => {
  console.log(5);
  cb && cb();
}, 1000);
const f6 = cb => setTimeout(() => {
  console.log(6);
  cb && cb();
}, 1000);
const f7 = cb => setTimeout(() => {
  console.log(7);
  cb && cb();
}, 1000);
const f8 = cb => setTimeout(() => {
  console.log(8);
  cb && cb();
}, 1000);
const f9 = cb => setTimeout(() => {
  console.log(9);
  cb && cb();
}, 1000);

// async 함수 안에서 비동기 코드 앞에 await를 붙여주면 된다.
// 안타깝게도 async '함수'라서 호출을 위해 즉시 실행함수를 사용했다.
(async () => {
  await promise(f1);
  await promise(f2);
  await promise(f3);
  await promise(f4);
  await promise(f5);
  await promise(f6);
  await promise(f7);
  await promise(f8);
  await promise(f9);
})();
```

## 참조 링크
* [Promise - JavaScript | MDN - Mozilla Developer Network](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise)  
* [바보들을 위한 Promise 강의 - 도대체 Promise는 어떻게 쓰는거야? | 감성 프로그래밍](http://programmingsummaries.tistory.com/325)  
* [Promise 를 사용하는 두 가지 방법, new Promise, Promise.resolve()](http://han41858.tistory.com/11)