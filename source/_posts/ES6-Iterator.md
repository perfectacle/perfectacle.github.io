---
title: (ES6) Iterator
date: 2017-04-22 16:17:14
category: [Programming, ECMAScript, ES2015+]
tag: [JS, ES, ES6, ES2015, Interface, Symbol, Iterator]
---
![](thumb.png)  

## 들어가기에 앞서
이 포스트는 [GDG 2016](https://festi.kr/festi/gdg-korea-2016-devfest-seoul/)에서 발표하신 [맹기완](https://www.facebook.com/hika00) 님의 [발표](http://www.bsidesoft.com/?p=2913)를 듣고 감명을 받아 정리해본 글이다.  
[(ES6) Interface](/2016/12/25/es6-interface/)와 [(ES6) Symbol](/2017/04/16/ES6-Symbol/)에 대한 내용은 링크를 참조하도록 하자.  
또한 이 글을 다 읽고 나서 [ES6 Generator](/2017/04/22/ES6-Generator/)도 읽어보자.  
`Iterator는 반복자`란 뜻을 가지고 있으며, 대충 반복과 관련된 용어라는 것만 알고 글을 읽어보자.

## 다음에 나오는 예제는 이터레이터를 쓴다.
ES6에서는 다음과 같은 문법에서 알게 모르게 이터레이터를 쓰고 있다.  
```javascript
// 1. for of
for(const num of [1, 2, 3, 4]) console.log(num); // 1 2 3 4

// 2. spread operator
const arr = [1, 2, 3];
const arr2 = [...arr]; // shallow copy

// 3. destructuring assignment
const str = 'asdf';
const [a, ...b] = str;
console.log(a, b); // 'a', ['s', 'd', 'f']

// 4. rest parameter
const func = (a, ...args) =>  console.log(a, args);
func(1, 2, 3, 4, 5); // 1, [2, 3, 4, 5]

```
위 문법은 이터러블한 객체(Iterable Interface를 준수한 객체, (Typed )Array, String, (Weak)Map/Set)만 쓸 수 있는 문법이다.  
```javascript
console.log(Array.prototype);
```
![Array의 프로토타입에는 Symbol.iterator 메소드가 있다.](array-prototype.png)  

반면에 Object는 이터러블한 객체가 아니다.  
```javascript
console.dir(Object.prototype);
```
Symbol.iterator() 메소드를 눈 씻고 찾아볼 수가 없다.  
따라서 for of와 같은 문법을 쓸 수 없다.  
하지만 현재 object에도 spread operator와 destructuring assignment를 쓸 수 있게 한 제안이 Stage-3까지 올라가 있어서  
[바벨](/2016/11/11/Babel-ES6-with-IE8/)의 [transform-object-rest-spread](https://babeljs.io/docs/plugins/transform-object-rest-spread/)나 [Stage 3 preset](https://babeljs.io/docs/plugins/preset-stage-3/)을 쓰면 된다.  
그럼 이제 이터러블과 이터레이터가 뭔지 알아보자.

## Iterator 관련 Interface
타입스크립트의 인터페이스 표기법을 사용하고 있으므로 타입스크립트에 익숙한 사람은
이미지를 보자마자 무슨 의미인지 알 수 있을 것이다.

### Iterable Interface
![](iterable.png)
인터페이스이기 때문에 객체가 가져야하는 키와 그 키가 가져야하는 값을 명시하고 있다.  
* 가져야하는 키: Symbol.iterator(well-known symbol 중 하나)
* 키(Symbol.iterator): 함수인데 반환 값은 [Iterator 인터페이스](#Iterator-Interface)를 준수한 객체가 오면 된다.
```javascript
// Iterable 인터페이스를 준수한 obj 객체
const IterableObject = {
  [Symbol.iterator]() {
    return IteratorObject;
  }
}
```

### Iterator Interface
![](iterator.png)
인터페이스이기 때문에 객체가 가져야하는 키와 그 키가 가져야하는 값을 명시하고 있다.  
* 가져야하는 키: next라는 키를 가진다.  
* 키(next)가 가져야할 값: 함수인데 반환 값은 [IteratorResult 인터페이스](IteratorResult-Interface)를 준수한 객체이다.  
```javascript
// Iterator 인터페이스를 준수한 IteratorObject 객체.
const IteratorObject = {
  next() {
    return IteratorResultObject;
  }
}
```

### IteratorResult Interface
인터페이스이기 때문에 객체가 가져야하는 키와 그 키가 가져야하는 값을 명시하고 있다.  
![](iterator-result.png)
* 가져야하는 키: value와 done이라는 키를 가진다.  
* 키(value, done)가 가져야할 값: value에는 어떤 값이든 와도 상관 없고, done에는 boolean 값만 허용하고 있다.  
```javascript
// IteratorResult 인터페이스를 준수한 IteratorResultObject 객체
const IteratorResultObject = {
  value: console.log('뭐든 들어와도 상관 없어!'),
  done: 1 <= 0
}
```

## 커스텀 이터레이터를 만들어보자.  
위의 따분한 이론은 집어치우고 이제 배열의 요소를 거꾸로 반환하는 커스텀 이터레이터를 만들어보자.  
Array.prototype.reverse()가 없다고 생각해보자.  
```javascript
// this를 바인딩해야하므로 ES5식 함수 사용
const makeIteratorResultObject = function() {
  return { // IteratorResult 인터페이스를 준수한 객체를 반환    
    value: this.pop(), // value 값이 반환됨.
    done: this.length === 0
  };
};

// this를 바인딩해야하므로 ES5식 함수 사용
const makeIteratorObject = function() {
  return { // Iterator 인터페이스를 준수한 객체를 반환
    next: () => { // IteratorResult 인터페이스를 준수한 객체를 반환
      return makeIteratorResultObject.call(this);
    }
  }
};

const arr = [1, 2, 3, undefined, 0];

// arr은 Iterable 인터페이스를 준수한 객체가 됨.
arr[Symbol.iterator] = function() {
  // Iterator 인터페이스를 준수한 객체를 반환
  return makeIteratorObject.call(this)
};

for(const a of arr) console.log(a); // 0 undefined 3 2 까지만 찍히게 된다.
for(const a of arr) console.log(a); // this.pop()으로 원본 배열을 손상시켜서 이터레이터가 1회성을 띈다.
```

그러면 이터레이터를 하나씩 분리해서 찍어보자.  
다시 말해 이터러블 객체는 반복 요소를 끊어서 실행할 수 있다.  
```javascript
// this를 바인딩해야하므로 ES5식 함수 사용
const makeIteratorResultObject = function() {
  console.log(this.length)
  return { // IteratorResult 인터페이스를 준수한 객체를 반환
    value: this.pop(), // value 값이 반환됨.
    done: this.length === 0
  };
};

// this를 바인딩해야하므로 ES5식 함수 사용
const makeIteratorObject = function() {
  return { // Iterator 인터페이스를 준수한 객체를 반환
    next: () => { // IteratorResult 인터페이스를 준수한 객체를 반환
      return makeIteratorResultObject.call(this);
    }
  }
};

const arr = [1, 2, 3, undefined, 0];

// arr은 Iterable 인터페이스를 준수한 객체가 됨.
arr[Symbol.iterator] = function() {
  // Iterator 인터페이스를 준수한 객체를 반환
  return makeIteratorObject.call(this)
};

const iter = arr[Symbol.iterator]();

console.dir(iter); // Iterator 오브젝트를 반환함.
// pop 하기 전 length: 5, pop 한 후 length 4
console.log(iter.next()); // Object {value: 0, done: false}
// pop 하기 전 length: 4, pop 한 후 length 3
console.log(iter.next()); // Object {value: undefined, done: false}
// pop 하기 전 length: 3, pop 한 후 length 2
console.log(iter.next()); // Object {value: 3, done: false}
// pop 하기 전 length: 2, pop 한 후 length 1
console.log(iter.next()); // Object {value: 2, done: false}
// pop 하기 전 length: 1, pop 한 후 length 0
// 즉 value를 실행해서 pop을 먼저 실행하고 그 이후의 length인 0을 가지고 done이 평가되는 거임.
// 그리고 그 done이 true이면 value를 반환하지 않게되니 1이 반환되지 않는 거였음.
console.log(iter.next()); // Object {value: 1, done: true}
console.log(iter.next()); // Object {value: undefined, done: true}
```
![콘솔 로그에서 찍어본 결과](00.png)  

그럼 위에서 기술한 커스텀 이터레이터를 수정해보자.  
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

const iter = arr[Symbol.iterator]();

console.log(iter.next()); // Object {value: 0, done: false}
console.log(iter.next()); // Object {value: undefined, done: false}
console.log(iter.next()); // Object {value: 3, done: false}
console.log(iter.next()); // Object {value: 2, done: false}
console.log(iter.next()); // Object {value: 1, done: false}
console.log(iter.next()); // Object {value: undefined, done: true}

// 원본 배열을 손상시키지 않으므로 이터레이터를 무한정 쓸 수 있다.
for(const num of arr) console.log(num);
for(const num of arr) console.log(num);
```

## 객체 관련 이터레이터  
객체 관련해서도 커스텀 이터레이터를 만들 수 있지만, 커스텀 이터레이터를 쓰지 않고도 이터레이터를 쓸만한 방법이 있다.  
```javascript
const obj = {
  name: '간장냥',
  age: 25,
  [Symbol('symbol')]: '오 마이 심볼!'
};
obj.__proto__.asdf = 'qwer';

// 객체의 키 뽑아내기(name과 age, [Symbol('symbol')])
// ES5(Symbol로 지정한 키는 못 뽑아냄)
for(const key in obj) {
  if(obj.hasOwnProperty(key)) console.log(key);
}

// ES6(Symbol로 지정한 키가 없으면 그냥 Object.keys를 쓰면 된다.)
for(const key of Reflect.ownKeys(obj)) console.log(key);

// 객체의 값 뽑아내기(간장냥과 25, '오 마이 심볼!')
// ES5(Symbol로 지정한 키는 못 뽑아냄)
for(const key in obj) {
  if(obj.hasOwnProperty(key)) console.log(obj[key]);
}

// ES6(Symbol로 지정한 키가 없으면 그냥 Object.keys를 쓰면 된다.)
for(const key of Reflect.ownKeys(obj)) console.log(obj[key]);
```

## 배열 순환 메소드를 개선시킨 break & continue  
우리는 에서 [(ES5) 배열의 순회 메소드에서 break 기능 구현하기](/2017/02/12/ES5-array-loop-method-break/)배열에서 반복문에서 break, continue를 어떻게 구현할지 생각해보았다.  
```javascript
var arr = [
  0, 1, 2, 3, 'q', 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3,
  5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3
];

// 배열이 숫자로만 이루어져있는지 파악하는 함수
//ES3
var isArrNum = function(arr) {
  var isNum = false;
  
  // 프로그래머가 실수로 let i = 1;이라고 초기화한다면?
  // 실수로 i<arr.length+1; 이라고 조건식을 잘못 입력한다면?
  // i+=2; 라고 증감식을 잘못 입력한다면?
  // arr[i+1]로 잘못 참조한다면?
  // 이렇게 일일이 초기화, 조건식 지정, 증감식 지정 등등을 일일이 해줘야하므로 귀찮다.
  for(var i=0; i<arr.length; i++) {
    console.log(arr[i]);
    if(!isNaN(arr[i])) { // 숫자라면
      // 아래 있는 코드는 실행할 필요 없이 다음 요소를 검사해야함.
      // 즉 다음 반복문을 실행.
      continue;
    }
    // 숫자가 아니라면
    isNum = false;
    break;
  }

  return isNum;
};

// ES5
var isArrNum2 = function(arr) { // 과연 직관적이라고 말할 수 있는가?
  return !arr.some(v => {
    console.log(v);
    return isNaN(v);
  });
};


// ES6
const isArrNum3 = arr => {
  // 실수할 요소가 확연히 줄어들고 ES5보다 훨씬 직관적으로 변하였다.
  let isNum = true;
  for(const v of arr) {
    console.log(v);
    if(!Number.isNaN(+v)) continue;
    isNum = false;
    break;
  }
  return isNum;
}

// 0
// 1
// 2
// 3
// q
// false
console.log(isArrNum(arr));
console.log(isArrNum2(arr));
console.log(isArrNum3(arr));
```

## 참조 링크
* [[es6] GDG 2016 발표자료](http://www.bsidesoft.com/?p=2913)  
* [[MDN] Iteration protocols](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Iteration_protocols)  
* [ES6 Iterable and Iterator | programmist](https://bcnam.github.io/bcnam.github.io/2016/11/25/2016-11-25-ES6-Iterable-and-Iterator/)  
* [21. Iterables and iterators](http://exploringjs.com/es6/ch_iteration.html)