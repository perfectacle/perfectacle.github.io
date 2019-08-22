---
title: (함수형 JS) find
tag:
  - JS
  - ES
  - 함수형
category:
  - Programming
  - ECMAScript
  - 함수형 JS
date: 2017-06-28 09:54:16
---


![](/images/js-func-06-find/thumb.png)

이 포스트는 [인프런](https://www.inflearn.com/)에서 진행한 [유인동](https://www.facebook.com/profile.php?id=100011413063178) 님의 [함수형 자바스크립트](https://www.inflearn.com/course/%ED%95%A8%EC%88%98%ED%98%95-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D/)를 듣고 감명 받아서 쓴 글이다.  
사실 [underscore](http://underscorejs.org/), [lodash](https://lodash.com/) 등 함수형 패러타임으로 코드를 짤 수 있게 끔
미리 이런 함수들을 제공하는 라이브러리들을 쓰고, 이 포스트는 그닥 볼 필요가 없다.  
하지만 이런 원리를 알고 접근을 하다보면 위 라이브러리를 쓴다고 하더라도 추가로 필요한 나의 코드를 함수형으로 더 짜기 유용하지 않을까?  

## find
find는 두 말 하면 입 아프겠지만, **기존 데이터 사이에서 원하는 것을 찾을 때** 사용한다.  
아래 예제를 보자.  
```javascript
const nums = [1, 3, 5, 7, 100];
let no = 0;
for(const num of nums) {
  if(!(num % 2)) { // 짝수인지
    no = num;
    break;
  }
}
const users = [
  {name: 'asdf', age: 12},
  {name: 'qwer', age: 33}
];
let name = ''; 
let over30 = null;
for(const user of users) if(user.age > 30) return over30 = user;
console.log(no); // 100
console.log(over30.age ); // 33
```

위 코드를 보면 일단 반복문이 반복해서 쓰이고 있고, 뭘 구할지도 반복되고 있다.  
이 부분들을 추상화해보자.  
```javascript
const _find = (list, predicate) => {
  for(const item of list) if(predicate(item)) return item;
  // 새로운 변수를 만들어서 거기다 값을 담고 리턴하려니 추상화를 해도 오히려 코드가 길어져서 복잡해보인다.
  //let match;
  //_each(list, item => {
  //  if(predicate(item)) match = item;
  //});
  //return match
};
const nums = [1, 3, 5, 7, 100];
const users = [
  {name: 'asdf', age: 12},
  {name: 'qwer', age: 33}
];
console.log(_find(nums, num => !(num % 2))); // 100
console.log(_find(users, user => user.age >= 30).age); // 33
```

## findIndex
이렇게 배열(과 ArrayLike)을 넘겨서 그 요소 중에서 내가 원하는 조건을 추상화시킨 _find를 써서 원하는 값을 얻어낼 수 있다.  
그럼 이 요소들이 몇 번째에 있는지 구하는 _findIndex도 만들어보자.  
기본적으로 순서가 없는, 인덱스로 접근이 불가능한 객체는 무시하고 만들도록 하겠다.
```javascript
const nums = [1, 3, 100, 2, 7];
let idx = -1; 
for(let i=0, len=nums.length; i<len; i++) {
  if(nums[i] >= 100) {
    idx = i;
    break;
  }
}
console.log(idx); // 2
```
새 리스트를 만들어서 그 리스트에 할당하는 부분은 없으니 반복문은 추상화시키지 못할 것 같다.  
또한 인덱스를 반환해야하니 for of 구문은 쓰지 못할 것 같다.  
추상화시킬 건덕지는 조건문 밖에 없어보인다.  
```javascript
const _findIndex = (list, predicate) => {
  for(let i=0, len=list.length; i<len; i++) if(predicate(list[i])) return i;
  return -1;
  // 새로운 변수를 만들어서 거기다 값을 담고 리턴하려니 추상화를 해도 오히려 코드가 길어져서 복잡해보인다.
  //let idx = -1;
  //_each(list, item => {
  //  _each는 인덱스를 리턴하는 게 아니라 매칭된 값을 리턴하기 때문에 추상화 불가.
  //  if(predicate(item)) idx = item;
  //});
  //return idx;
};
const nums = [1, 3, 100, 2, 7];
console.log(_findIndex(nums, num => num >= 100)); // 2
```
왜 -1을 리턴하는지 모르겠는 사람은 [~(Tilde) 연산자](/2017/02/13/es-tilt-operator/)를 참고하자. 

## some
some은 하나라도 조건을 만족하면 true를 반환하는 함수다.  
||(or)의 특성을 지닌다고 보면 될 것 같다.  
바로 어떤 녀석이 some인지 보자.  
```javascript
let nums = [1, 3, 100, 2, 7];
let no3 = false;
for(const num of nums) if(!(num % 3)) { // 3의 배수라면
  no3 = true;
  break;
}
console.log(no3); // true
nums = [3, 6, 20, 9];
no3 = false;
for(const num of nums) if(!(num % 3)) { // 3의 배수라면
  no3 = true;
  break;
}
console.log(no3); // false
```
조건문 부분만 추상화가 가능해보인다.  
바로 구현해보자.  
```javascript
const _some = (list, predicate) => {
  for(const item of list) if(predicate(item)) return true;
  return false;
};
let nums = [1, 3, 100, 2, 7];
console.log(_some(nums, num => !(num % 3))); // true
nums = [4, 8, 16, 20];
console.log(_some(nums, num => !(num % 3))); // false
```
위 함수를 보면 find에서 return 구문만 바뀐 걸 볼 수 있다.  
find 함수와 조합을 해보면 더 추상화 할 수 있을 것 같다.  
```javascript
const _some = (list, predicate) => (
  !!_find(list, item => predicate(item))
);
let nums = [1, 3, 100, 2, 7];
console.log(_some(nums, num => !(num % 3))); // true
nums = [0, 3, 100, 2, 7];
console.log(_some(nums, num => !(num % 3))); // flase
```
0은 3으로 나눴을 때 0이므로 조건식을 만족해서 find 함수로 0을 땡겨온다.  
하지만 0은 falsy value이므로 거짓이 나온다.  
따라서 find의 반환값으로 falsy value를 의도적으로 검출해낼 수도 있으므로 위와 같이 _find로는 추상화하지 못한다.  

```javascript
const _findIndex = (list, predicate) => {
  for(let i=0, len=list.length; i<len; i++) if(predicate(list[i])) return i;
  return -1;
};

const _some = (list, predicate) => _findIndex(list, item => predicate(item)) !== -1;
// 비트단위의 논리 연산자(Not)인 ~(Tilde)를 쓰면 다음과 같이 할 수 있다.
// const _some = (list, predicate) => !!~_findIndex(list, item => predicate(item));
let nums = [1, 3, 100, 2, 7];
console.log(_some(nums, num => !(num % 3))); // true
nums = [0, 3, 100, 2, 7];
console.log(_some(nums, num => !(num % 3))); // true
```
_find는 조건을 만족하는 값이면 어떤 값이든 땡겨올 수 있고 falsy value는 물론,  
심지어 undefined도 땡겨올 수 있으므로 boolean으로 캐스팅해도 올바른 결과를 얻어낼 수 없다.  
_findIndex는 -1만 아니면 참인 것이기 때문에 -1에 대해서만 대비하면 되므로 추상화하기에 적당하다.

## every
every는 하나라도 조건을 만족하지 않으면 false를 반환하는 함수다.  
&&(and)의 특성을 지닌다고 보면 될 것 같다.  
바로 어떤 녀석이 every인지 보자.  
```javascript
let nums = [1, 3, 100, 2, 7];
let no3 = true;
for(const num of nums) if(!(num % 3 === 0)) { // 3의 배수가 아니라면
  no3 = false;
  break;
}
console.log(no3); // false
nums = [4, 8, 16, 20];
no3 = true;
for(const num of nums) if(!(num % 2 === 0)) { // 2의 배수가 아니라면
  no3 = false;
  break;
}
console.log(no3); // true
```
위 코드는 모두 3의 배수인지, 모두 2의 배수인지를 구한 반복문이다.  
그럼 한 번 추상화해보자.  

```javascript
const _every = (list, predicate) => {
  for(const item of list) if(!(predicate(item))) return false;
  return true;
};
let nums = [1, 3, 100, 2, 7];
console.log(_every(nums, num => num % 3 === 0)); // false
nums = [4, 8, 16, 20];
console.log(_every(nums, num => num % 2 === 0)); // true
```
위에 반복문 부분도 _find로 추상화해보고 싶지만 위의 _some과 같이 falsy value 이슈가 있을 것 같다.  
그럼 falsy value로 부터 자유로운 _findIndex를 가지고 추상화해보자.  

```javascript
const _findIndex = (list, predicate) => {
  for(let i=0, len=list.length; i<len; i++) if(predicate(list[i])) return i;
  return -1;
};
const _every = (list, predicate) => _findIndex(list, item => !predicate(item)) === -1;
// 비트단위의 논리 연산자(Not)인 ~(Tilde)를 쓰면 다음과 같이 할 수 있다.
//const _every = (list, predicate) => !~_findIndex(list, item => !predicate(item));

let nums = [1, 3, 100, 2, 7];
console.log(_every(nums, num => num % 3 === 0)); // false
nums = [4, 8, 16, 20];
console.log(_every(nums, num => num % 2 === 0)); // true
```
오늘은 여기까지만 알아보도록 하자.  
다음 시간에는 함수형의 꽃이라 할 수 있는 [curry](/2017/06/30/js-func-07-curry/)에 대해 알아보도록 하자.  