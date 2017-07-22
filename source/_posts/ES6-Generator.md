---
title: ES6 Generator
date: 2017-04-22 17:17:14
category: [Programming, ECMAScript, ES2015+]
tag: [JS, ES, ES6, ES2015, Interface, Symbol, Iterator, Generator]
---
![](thumb.png)  

## 들어가기에 앞서
이 포스트는 [GDG 2016](https://festi.kr/festi/gdg-korea-2016-devfest-seoul/)에서 발표하신 [맹기완](https://www.facebook.com/hika00) 님의 [발표](http://www.bsidesoft.com/?p=2913)를 듣고 감명을 받아 정리해본 글이다.  
[(ES6) Interface](/2016/12/25/es6-interface/)와 [(ES6) Symbol](/2017/04/16/ES6-Symbol/), [(ES6) Iterator](/2017/04/22/ES6-Iterator/)에 대한 내용은 링크를 참조하도록 하자.  

## 사용 사례  
이 사용 사례가 전부는 아니겠지만, 제너레이터는 이터레이터를 구현할 때 좀 더 쉽게 만들어준다.  
우리는 지난 포스트에서 다음과 같이 배열의 요소를 거꾸로 사용하는 이터레이터를 구현해보았다.  
```javascript
// this를 바인딩해야하므로 ES5식 함수 사용
const makeIteratorResultObject = function(idx) {
  return { // IteratorResult 인터페이스를 준수한 객체를 반환
    value: this.slice(-idx)[0], // value 값이 반환됨.
    done: --idx === this.length
  };
};

// this를 바인딩해야하므로 ES5식 함수 사용
const makeIteratorObject = function() {
  let idx = 0;
  return { // Iterator 인터페이스를 준수한 객체를 반환
    next: () => { // 이 next 함수 안에 있는 내용은 매번 실행됨.
      // IteratorResult 인터페이스를 준수한 객체를 반환
      return makeIteratorResultObject.call(this, ++idx);
    }
  }
};

const arr = [1, 2, 3, undefined, 0];

// arr은 Iterable 인터페이스를 준수한 객체가 됨.
arr[Symbol.iterator] = function() { // 요 함수에 있는 내용은 한 번만 실행됨.
  // Iterator 인터페이스를 준수한 객체를 반환
  return makeIteratorObject.call(this);
};

const arr2 = [...arr]; // [0, undefined, 3, 2, 1]
```

IteratorResult 객체, Iterator 객체, Iterable 객체, 이 3개를 다 구현하기란 매우 귀찮고 어렵다.  
따라서 제너레이터를 사용하면 아래와 같이 바꿀 수 있게 된다.  
```javascript
const arr = [1, 2, 3, undefined, 0];

// arr은 Iterable 인터페이스를 준수한 객체가 됨.
arr[Symbol.iterator] = function*() {
  // Iterator 인터페이스를 준수한 객체를 반환
  for(let i=0, length=this.length; i<length; i++) yield this.slice(-i)[0];
};

// 반복문의 횟수를 오타낼 염려가 있으니 아래와 같이도 할 수 있다.
// arr[Symbol.iterator] = function*() {
//   yield* this.map(function(v, idx){
//     return this.slice(-(++idx))[0];
//   }, this);
// }; 

const gen = arr[Symbol.iterator]();

console.dir(gen); // 제너레이터 함수의 실행 결과는 Iterator 객체를 반환한다.
console.log(gen.next()); // { value: 0, done: false }
console.log(gen.next()); // { value: undefined, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: undefined, done: true }

for(const a of arr) console.log(a); // 0 undefined 3 2 1
```
![console.dir로 제너레이터 함수의 실행 결과를 찍어본 결과](00.png)  

마법과도 같은 일이 일어났다.  
그럼 이 마법같은 일을 낱낱이 파헤쳐보자.  

## Generator  
일단 두 가지 케이스가 눈에 띄었다.  
`function 키워드 뒤의 *`와 `yield`.  
funcion 키워드 뒤의 *는 이 함수가 제너레이터 함수라는 것을 명시해주는 기능을 한다.  
그리고 그 일반 함수가 아닌 제너레이터 함수에서는 yield 키워드를 쓸 수 있다.  
이 yield는 return과 마찬가지로 값을 반환하는 기능을 하는데, 함수는 종료시키지 않는다.  
next를 호출할 때마다 yield 구문까지의 코드를 실행하고 yield 값을 반환하게 되는 것이다.  
그리고 실행 컨텍스트를 어디선가 물고 있어서 코드의 흐름과 상관없이 next를 호출할 때마다 그 실행 결과를 보장받게 되는 것이다.  
몇 가지 예제들을 통해 그 특성들을 알아보자.  
```javascript
const gen = function*() {
  console.log('내가 실행됐니?');
  yield 1;
  const b = yield 3;
  console.log(b);
  const c = yield 4;
  console.log(c);
  return 4;
  yield 5;
};

let a = gen(); // 이터레이터 객체를 반환

// 내가 실행됐니?가 출력되고, 1을 반환
console.log(a.next());

// b에 yield 3이 할당되고, 3이 반환됨.
console.log(a.next());

// 하지만 yield 3 자체는 undefined를 반환해서 b에는 undefined가 찍힘.
// 그리고 c에 yield 4가 할당되고, 4가 반환됨.
console.log(a.next());

// 원래 c에는 yield 4가 할당돼 undefined가 찍혀야하지만, next에 매개변수를 주면 c에 새로운 값을 할당하게 됨.
// 따라서 9를 출력.
console.log(a.next(9));

// return 이후로는 닿질 못한다.
console.log(a.next()); // { value: undefined, done: true }
console.log('-----------------');

// 이터레이터 내부의 요소(yield)들을 모두 소모했으므로 재충전(?)
a = gen();
// 이터레이터이므로 for of 구문을 사용할 수 있다.  
// 반환 값으로는 yield에 지정한 값들이 반환된다.
for(const v of a) console.log(v);
```

yield는 모든 타입을 반환할 수 있다.  
```javascript
const gen = function*() {
  const a = {obj: 2};
  yield a;
  yield () => console.log(7777777);
  yield* [1, 2, 3, 4];
  yield* (function*() {yield 5; yield 6;})();
  yield function*() {yield 7; yield 8;};
};

// 제너레이터 함수의 실행 결과로 이터레이터 객체가 a에 담기게 된다.
const a = gen();

// a.next()까지 하게 되면 IterableResult 객체인 { value: { obj: 2 }, done: false }가 반환된다.
// 실제 for of와 같은 문법에서도 value 값을 반환하게 되는 것이다.
console.log(a.next().value);

// 반환값이 함수이니 반환된 함수를 실행하니 7777이 콘솔 로그에 찍힘.
console.log(a.next().value());

// yield에도 *(asterisk)를 찍어줄 수 있는데 yield를 쪼갠다고 보면 된다.
console.log(a.next().value); // 1
console.log(a.next().value); // 2
console.log(a.next().value); // 3
console.log(a.next().value); // 4

// 그 다음엔 제너레이터 함수를 즉시 실행했으므로 이터레이터 객체가 반환된다.
// 그 반환된 이터레이터 객체를 *을 써서 또 쪼갰다.
console.log(a.next().value); // 5
console.log(a.next().value); // 6

// 이번엔 제너레이터 함수의 실행 결과가 아닌 함수 자체를 리턴했으므로 쪼갤 수가 없다.
// 따라서 그 함수를 실행한 이터레이터 객체를 b에 따로 담아서 쪼개줘야한다.
const b = a.next().value();
console.log(b.next().value); // 7
console.log(b.next().value); // 8
```

제너레이터 함수의 스코프를 벗어나는 공간에 yield를 쓸 수 없다.  
```javascript
const gen = function*() {
  const arr = [1, 2, 3];
  // 콜백 함수는 제너레이터 함수가 아니므로 yield를 쓸 수 없다.
  arr.forEach(v => yield v);
}
```

제너레이터를 통해 비동기 함수를 제어하는 방법이 있지만 ES2017의 async와 await를 적극 활용하기 바란다. 
* [(ES6+) ajax를 위한 fetch와 async/await](/2017/01/25/ES6-ajax-with-fetch/)  
* [(ES6+) 비동기 함수를 깔끔하게 처리해보자.](/2017/04/03/js-async-function/)

## 참조 링크
* [[es6] GDG 2016 발표자료](http://www.bsidesoft.com/?p=2913)  
* [function* - JavaScript | MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/function*)  
* [ES6 In Depth: 제너레이터(Generator) ★ Mozilla 웹 기술 블로그](http://hacks.mozilla.or.kr/2015/08/es6-in-depth-generators/)  
* [ES6 Generator with Aysnc | programmist](https://bcnam.github.io/bcnam.github.io/2016/11/29/2016-11-29-ES6-Generator-and-yield/)