---
title: (함수형 JS) pipe
tag:
  - JS
  - ES
  - 함수형
category:
  - Programming
  - ECMAScript
  - 함수형 JS
date: 2017-06-30 21:30:56
---

![](thumb.png)

이 포스트는 [인프런](https://www.inflearn.com/)에서 진행한 [유인동](https://www.facebook.com/profile.php?id=100011413063178) 님의 [함수형 자바스크립트](https://www.inflearn.com/course/%ED%95%A8%EC%88%98%ED%98%95-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D/)를 듣고 감명 받아서 쓴 글이다.  
사실 [underscore](http://underscorejs.org/), [lodash](https://lodash.com/) 등 함수형 패러타임으로 코드를 짤 수 있게 끔
미리 이런 함수들을 제공하는 라이브러리들을 쓰고, 이 포스트는 그닥 볼 필요가 없다.  
하지만 이런 원리를 알고 접근을 하다보면 위 라이브러리를 쓴다고 하더라도 추가로 필요한 나의 코드를 함수형으로 더 짜기 유용하지 않을까?  

## pipe
다음과 같은 함수를 작성해보자.  
1. [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]이란 배열을 만든다.  
2. 이 배열의 각 요소들을 x3한 배열을 구한다.  
3. x3한 배열에서 2의 배수만 추려내서 새로 배열을 구한다.  
4. 2의 배수들만 모아놓은 각 요소들을 합한 결과를 구하자.  

함수형에 충실한 우리는 아래와 같이 짜게될 것이다.  
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

const _head = list => list.toString() === '[object Object]' ? Object.keys(list)[0] : list[0];

const _tail = list => (
  list.toString() === '[object Object]' ? Object.keys(list).slice(1) :
    list.slice ? list.slice(1) : Array.from(list).slice(1)
);

const _reduce = (list, iteratee, memo) => {
  if(memo === undefined) {
    memo = _head(list);
    list = _tail(list);
  }
  _each(list, item => memo = iteratee(item, memo));
  return memo;
};

// 1번, 배열 만들기
const nums = [];
for(let i=1; i<=10; i++) nums.push(i);
console.log(nums); // [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]

// 2번, x3한 배열 구하기.
const mul3Nums = _map(nums, num => num*3);
console.log(mul3Nums); // [ 3, 6, 9, 12, 15, 18, 21, 24, 27, 30 ]

// 3번, 2의 배수 구하기.
const getEven = _filter(mul3Nums, num => !(num%2));
console.log(getEven); // [ 6, 12, 18, 24, 30 ]

// 4번, 2의 배수들만 구한 배열의 합을 구하기.
const sumEven = _reduce(getEven, (num, memo) => memo+num);
console.log(sumEven); // 90
```

함수형에 더 충실한 사람은 아래와 같이 시도를 해봤을 것이다.  
```javascript
// 1번, 배열 만들기
const nums = [];
for(let i=1; i<=10; i++) nums.push(i);
console.log(nums); // [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]

console.log(
  _reduce( // 4번, 2의 배수들만 구한 배열의 합을 구하기.
    _filter( // 3번, 2의 배수 구하기.
      _map(nums, num => num*3), num => !(num%2) // 2번, x3한 배열 구하기.
    )
  , (num, memo) => memo+num)
); // 90
```

소스를 거꾸로 읽어나가야하고, 마치 콜백 함수 지옥에 빠진 듯한 기분이 든다.  
이러한 콜백 함수 지옥을 헤쳐나가기 위해 나온 것이 pipe이다.  
마치 비동기 함수에서 콜백 함수 지옥을 탈출하기 위해 프로미스가 나온 것과 비슷해보인다.  
~~역시 콜백 함수가 문제다.~~

![이러한 파이프를 타고 요리조리 이동하며 함수를 하나씩 실행하는 원리이다.](pipe.gif)  
우리가 인자로 넘긴 함수를 하나 하나 순차적으로 실행할 수 있게 해주는 pipe 함수를 만들어보자.  
머리를 굴려도 생각이 나지 않아 아래 링크를 ~~베껴~~참조 하였다.  
[(함수형JS) 흐름 기반 프로그래밍](http://blog.jeonghwan.net/js/2017/05/11/pipeline.html)  
최종 결과는 아래와 같을 것이다.  
```javascript
const nums = [];
for(let i=1; i<=10; i++) nums.push(i);

// 함수 목록들을 리듀스 돌려버린다.
const _pipe = (...fn) => _reduce(fn, (fn, memo) => fn(memo));

console.log(_pipe(
  _map(nums, num => num*3), // 첫 번째 memo에 결과값이 담겨서 mul3Nums로 다음 함수에게 넘겨지고 있다.
  mul3Nums => _filter(mul3Nums, num => !(num%2)), // 두 번째 memo에 결과값이 담겨서 getEven으로 다음 함수에게 넘겨지고 있다.
  getEven => _reduce(getEven, (num, memo) => memo+num))); // 세 번째 memo에 결과값이 담겨서 로그 창에 찍힌다.
  // 이렇게 괄호를 쫙쫙쫙 닫아주는 게 함수형 프로그래밍 언어의 컨벤션이며 간지다.
```

역시 얕게 공부하다보니 간단하게 함수 만들고 예제 만들고 끝나는 것 같다.  
이제는 세미나 때 들었던 기억이 고갈되는 기분이라 좀 더 공부를 해야할 것 같다.