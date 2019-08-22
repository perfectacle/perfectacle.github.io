---
title: (JS) 숫자가 증가하는 애니메이션 구현하기
date: 2017-05-03 09:39:29
category: [Programming, ECMAScript]
tag: [JS, ES, ES6, ES2015, ES6+, callback, promise, async, await]
---
![](/images/js-async-number-animation/thumb.png)

숫자가 0~100까지 순서대로 변하는 예제를 만들어볼 것이다.  
일단 예제 파일에 쓰일 index.html을 하나 만들어보자.  
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <title>Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
</head>
<body>
<div id="root"></div>
<script src="./index.js"></script>
</body>
</html>
```
이제 index.js 파일을 만들자.  
1~10까지 출력이니 반복문을 쓰면 될 것 같다.  
아래와 같이 콘솔창에 찍어보면 1~10까지 아주 잘 나온다.  

```javascript
for(var i=1; i<11; i++) {
  console.log(i);
}
```
이제 실제 DOM에다 렌더링 시켜보자.  
[예제 보기](https://codesandbox.io/s/qj5lKYMvr)

숫자를 보여줄 때 그냥 보여주기만 하면 재미 없죠?  
한 번 쯤은 0~100까지 숫자가 순차적으로 올라가면서 보여주면  
더 역동적일 것 같다고 생각해보신 적들 있을 겁니다.  
저도 같은 생각을 해보며 글을 작성해보았습니다.
콜백 함수, Promise, Async

```javascript
var domRoot = document.getElementById('root');
domRoot.innerText = 0; // 0으로 초기값 설정.

for(var i=1; i<11; i++) {
  domRoot.innerText = i;
}
```
결과를 확인하면 너무 한 순간에 값이 바뀌어서 눈으로 확인이 불가능할 정도다.  
그렇다면 setTimeout으로 딜레이를 걸어보자!
[예제 보기](https://codesandbox.io/s/LgV53Wo5w)

```javascript
var domRoot = document.getElementById('root');
domRoot.innerText = 0; // 0으로 초기값 설정.

for(var i=1; i<11; i++) {
  // ES5까지는 함수 단위의 스코프여서 아래와 같이 하면 함수를 실행하는 시점은
  // 반복문이 끝난 시점이라 i에는 10이 10번 들어가게 된다.
  //setTimeout(function() {
  //  domRoot.innerText = i;
  //});
  
  // ES5까지는 함수 단위의 스코프라 즉시 실행함수를 통해 변수의 스코프를 가두었다.  
  // 즉시 실행 함수의 내부에 있는 함수를 실행하는 시점은 역시 반복문이 끝난 시점이다.  
  // 하지만 즉시 실행 함수를 통해 변수를 가둬두었으므로 클로저를 통해 해당 변수에 들어간 값을 렌더링한다.
  (function(i) {
    setTimeout(function() {
      domRoot.innerText = i;
    }, 100)
  }(i));
}
```
하지만 위의 결과도 우리가 원하던 결과가 아니다.  
100ms 동안은 가만히 있지만 그 이후에 함수가 물밀듯 실행한다.  
setTimeout 함수는 동기식으로 동작하는 게 아니라 비동기 식으로 동작하기 때문이다.  
이를 위해서 우리에겐 콜백 함수란 게 존재한다!
[예제 보기](https://codesandbox.io/s/oQvLXL26K)

```javascript
// 콜백 함수를 익명 함수로 일일이 작성하기 귀찮으니 따로 빼주자.
// 돔에 숫자를 렌더링하는 함수이다.
var changeNum = function(dom, num) {
  dom.innerText = num;
};

var MS = 100;
var domRoot = document.getElementById('root');
domRoot.innerText = 0; // 0으로 초기값 설정.

setTimeout(function() {
  changeNum(domRoot, 1);
  setTimeout(function() {
    changeNum(domRoot, 2);
    setTimeout(function() {
      changeNum(domRoot, 3);
      setTimeout(function() {
        changeNum(domRoot, 4);
        setTimeout(function() {
          changeNum(domRoot, 5);
          setTimeout(function() {
            changeNum(domRoot, 6);
            setTimeout(function() {
              changeNum(domRoot, 7);
              setTimeout(function() {
                changeNum(domRoot, 8);
                setTimeout(function() {
                  changeNum(domRoot, 9);
                  setTimeout(function() {
                    changeNum(domRoot, 10);
                  }, MS)
                }, MS)
              }, MS)
            }, MS)
          }, MS)
        }, MS)
      }, MS)
    }, MS)
  }, MS)
}, MS);
```
코드가 보기 좋은가?  
이를 위한 대안으로 ES2015에 나온 Promise를 써보자.
[예제 보기](https://codesandbox.io/s/KZ8QP37Zn)

```javascript
// promise 함수는 콜백 함수를 매개변수로 받아서 Promise 객체를 반환한다.  
// 그 Promise 객체는 매개변수로 받은 콜백 함수를 실행한다.
const promise = cb => new Promise(res => {
  // 요 res 위치에 앞으로 실행할 콜백 함수가 들어온다고 생각하면 된다.
  cb(res);
});

// 콜백 함수를 익명 함수로 일일이 작성하기 귀찮으니 따로 빼주자.
// 돔에 숫자를 렌더링하는 함수이다.
const changeNum = (dom, num) => dom.innerText = num;

// promise 함수에 전달할 콜백 함수.
// 비동기 함수인 setTimeout을 동기식으로 실행시켜주게 바꾼 코드이다.
const syncSetTimeout = (cb, ms, promiseCb) => setTimeout(() => {
  cb();
  // 함수 마지막에 이 콜백 함수는 위에 promise 함수의 cb(res) 요 부분이 실행되는 거라고 보면 된다.
  promiseCb();
}, ms);

const MS = 100;
const domRoot = document.getElementById('root');
domRoot.innerText = 0; // 0으로 초기값 설정.

promise( // promise 함수의 콜백으로 (동기식으로 바꾼) 비동기 함수가 들어가게 된다.
  syncSetTimeout.bind(null, // 매개변수로 콜백 함수를 넘겨줘야하기에 bind 함수 사용.
    // 콜백함수로 dom에 숫자를 렌더링하는 changeNum 함수 실행
    changeNum.bind(null, domRoot, 1),
  MS)
)
// 요 then을 타고 cb(res) 요 안으로 계속해서 함수를 침투시킨다고 생각하면 된다.
// 그렇게 침투시켜서 콜백 함수 피라미드와 같은 효과를 내는 거다.
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 2), MS)))
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 3), MS)))
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 4), MS)))
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 5), MS)))
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 6), MS)))
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 7), MS)))
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 8), MS)))
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 9), MS)))
.then(() => promise(syncSetTimeout.bind(null, changeNum.bind(null, domRoot, 10), MS)));
```
뭐 썩 보기 좋은 건 아니지만 콜백 함수 지옥에 비하면 훨씬 봐주기가 좋아졌다.  
하지만 숫자를 1~10이 아닌 100까지 표현해야한다면...?  
저걸 100줄을 쓰고 있어야한다.  
그럼 이제 남은 방안은 ES2017의 async/await가 있다!
[예제 보기](https://codesandbox.io/s/jLy5BDqR)

```javascript
// promise 함수는 콜백 함수를 매개변수로 받아서 Promise 객체를 반환한다.  
// 그 Promise 객체는 매개변수로 받은 콜백 함수를 실행한다.
const promise = cb => new Promise(res => {
  // 요 res 위치에 앞으로 실행할 콜백 함수가 들어온다고 생각하면 된다.
  cb(res);
});

// 콜백 함수를 익명 함수로 일일이 작성하기 귀찮으니 따로 빼주자.
// 돔에 숫자를 렌더링하는 함수이다.
const changeNum = (dom, num) => dom.innerText = num;

// promise 함수에 전달할 콜백 함수.
// 비동기 함수인 setTimeout을 동기식으로 실행시켜주게 바꾼 코드이다.
// promiseCb는 promise 함수로부터 전달받은 콜백함수이다.
const syncSetTimeout = (cb, ms, promiseCb) => setTimeout(() => {
  cb();
  // 함수 마지막에 이 콜백 함수는 위에 promise 함수의 cb(res) 요 부분이 실행되는 거라고 보면 된다.
  promiseCb();
}, ms);

const MS = 100;
const domRoot = document.getElementById('root');
domRoot.innerText = 0; // 0으로 초기값 설정.

(async() => { // async는 함수이기 때문에 실행하려면 즉시 실행 함수를 써야한다.
  for(let i=1; i<101;) { // 반복문을 통해 1~100까지 반복하고 있다.
    // await 함수는 비동기 함수를 동기식으로 실행시키는 데 쓰이는 함수이다.
    // 내가 알기로는 Promise 없이는 죽도 밥도 안되는 것으로 알고 있다.
    await(
      promise( // promise 함수의 콜백으로 (동기식으로 바꾼) 비동기 함수가 들어가게 된다.
        syncSetTimeout.bind(null, // 매개변수로 콜백 함수를 넘겨줘야하기에 bind 함수 사용.
          changeNum.bind(null, domRoot, i++), // 콜백함수로 dom에 숫자를 렌더링하는 changeNum 함수 실행
        MS)
      )
    );
  }
})();
```

하지만 async/await와 Promise를 학습하는 것은 어느 정도 러닝 커브가 있다.  
한번 내가 만들어본 async-to-sync 라이브러리를 이용하여 바꿔보자.
[예제 보기](https://codesandbox.io/s/2RM10B3PJ)
```javascript
// 비동기 함수를 동기식으로 실행해주는 async-to-sync 모듈을 로드하자.
import ats from 'async-to-sync';

// 콜백 함수를 익명 함수로 일일이 작성하기 귀찮으니 따로 빼주자.
// 돔에 숫자를 렌더링하는 함수이다.
const changeNum = (dom, num) => dom.innerText = num;

// 기본적으로 async-to-sync 모듈은 위 async/await + Promise를 짬뽕한 라이브러리다.
// 비동기 함수를 동기 함수로 바꾸는 방법은 위의 예제와 같다.
// 함수 매개변수에 promise 함수에서 전달받은 promiseCb를 추가하고, 함수 마지막 부분에 그 콜백 함수를 실행시키면 된다.
// promise 함수에 전달할 콜백 함수.
// 비동기 함수인 setTimeout을 동기식으로 실행시켜주게 바꾼 코드이다.
const syncSetTimeout = (cb, ms, promiseCb) => setTimeout(() => {
  cb();
  // 함수 마지막에 이 콜백 함수는 위에 promise 함수의 cb(res) 요 부분이 실행되는 거라고 보면 된다.
  promiseCb();
}, ms);

const arrAsync = []; // async-to-sync는 비동기 함수들이 담겨있는 배열을 매개변수로 받아서 실행시킨다.
const MS = 100;
const domRoot = document.getElementById('root');
domRoot.innerText = 0; // 0으로 초기값 설정.

for(let i=1; i<101;) { // 반복문을 통해 1~100까지 반복하고 있다.
  arrAsync.push( // 배열에 비동기 함수들을 하나씩 담고 있다.
    syncSetTimeout.bind(null, // 매개변수로 콜백 함수를 넘겨줘야하기에 bind 함수 사용.
      changeNum.bind(null, domRoot, i++), // 콜백함수로 dom에 숫자를 렌더링하는 changeNum 함수 실행
    MS)
  );
}

ats(arrAsync); // 배열에 담은 비동기 함수들을 한 번에 실행시키고 있다.
```

## 더 쉬운 방법
역시 구글링을 해보니 더 쉬운 방법이 존재하였다.  
왜 이런 뻘짓을 했는지...  
```javascript
let current = 0; // 현재 숫자

// 콜백 함수를 익명 함수로 일일이 작성하기 귀찮으니 따로 빼주자.
// 돔에 숫자를 렌더링하는 함수이다.
// 외부에 있는 변수를 건드리므로 좋지는 않지만 어쩔 수 없다.
const changeNum = (dom) => dom.innerText = ++current;

// setTimeout 말고 setInterval이 더 간결하다.
const SetInterval = (cb, ms) => setInterval(() => {
  if(current >= 100) return clearInterval(SetInterval);
  cb();
}, ms);

const MS = 100;
const domRoot = document.getElementById('root');
domRoot.innerText = 0; // 0으로 초기값 설정.

// 이 함수를 실행할 때는 current가 1이 되므로 계속해서 1로 고정하게 된다.  
// 그래서 부득이하게 콜백 함수 안에서 외부 변수를 불러오게 했다.
SetInterval(changeNum.bind(null, domRoot), MS);
```