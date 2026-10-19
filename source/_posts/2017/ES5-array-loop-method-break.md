---
title: (ES5) 배열의 순회 메소드에서 break 기능 구현하기
date: 2017-02-12 22:51:05
categories: [Programming, ECMAScript]
tags: [JS, ES, ES5, Array]
---
![](ES5-array-loop-method-break/thumb.png)  
이 글은 Outsider 님의 블로그 포스트 중  
[forEach에 break문 대신 some 사용하기](https://blog.outsider.ne.kr/847)를 보고 큰 감명을 받아  
내가 이해한 내용을 토대로 정리해 본 글이다.

## for loop
for 반복문을 써서 배열을 순회하는 것은 할당, 프로퍼티 참조, 조건 분기 등등의 잡다한 일을 해야한다.  
이러한 잡다한 일을 실수로 코딩을 잘못하면 원하지 않는 결과가 나오고, 귀찮음이 몰려오기 마련이다.  
```javascript
const arr = [
  0, 1, 2, 3, 'q', 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3,
  5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3
];

// 배열이 숫자로만 이루어져있는지 파악하는 함수
const isArrNum = arr => {
  let isNum = true;

  // 프로그래머가 실수로 let i = 1;이라고 초기화한다면?
  // 실수로 i<arr.length+1; 이라고 조건식을 잘못 입력한다면?
  // i+=2; 라고 증감식을 잘못 입력한다면?
  // arr[i+1]로 잘못 참조한다면?
  // 이렇게 일일이 초기화, 조건식 지정, 증감식 지정 등등을 일일이 해줘야하므로 귀찮다.
  for(let i=0; i<arr.length; i++) {
    console.log(arr[i]);
    if(!isNaN(arr[i])) { // 숫자라면
      // 아래 있는 코드는 실행할 필요 없이 다음 요소를 검사해야함.
      // 즉 다음 반복문을 실행.
      continue;
    }
    // 숫자가 아니라면
    isNum = false;

    // 바로 반복문을 종료해야함.
    break;
  }

  return isNum;
};


// 0
// 1
// 2
// 3
// q
// false
console.log(isArrNum(arr));

// 사실은 아래와 같이 break와 continue를 쓸 필요도 없는 예제긴 하다.
const isArrNum2 = arr => {
  for(let i=0; i<arr.length; i++) {
    if(isNaN(arr[i])) { // 숫자가 아니라면
      // 반복문 탈출이고 나발이고 return으로 바로 함수를 조기 종료 시키면서
      // false를 반환하게 하면됨.
      return false;
    }
  }
  // 반복문이 무사히 끝났으면 모든 게 숫자였다고 판단하여 true를 반환.
  return true;
};
```

## continue 기능만 있는 배열 순회 메소드(ES5, IE9+)
따라서 그런 점을 해소하고자 ES5(IE9+)에서는 배열의 순환 메소드인  
forEach, reduce, map, filter 등등이 추가됐다.  
하지만!  
이 메소드는 continue는 지원하지만 break는 지원하지 않는다.  
또한 continue 기능은 continue 대신에 함수를 종료 시키는  
return 키워드를 사용하며 반환하는 값은 중요치 않다.(continue 시키는 데에 있어서는)  
return 키워드로 함수를 조기 종료 시켜도, 현재 요소에 대한 콜백 함수(continue)를 종료 시킨 것이지  
모든 요소에 대한 콜백 함수(break)를 종료시켜버리는 것이 아니기 때문에 바로 다음 콜백함수의 실행이 일어난다.  
```javascript
const arr = [
  0, 1, 2, 3, 'q', 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3,
  5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3
];

// 배열이 숫자로만 이루어져있는지 파악하는 함수
const isArrNum3 = arr => {
  let isNum = true;

  // forEach, map, reduce, filter 메소드가
  // continue만 지원하고, break를 지원하지 않아 콘솔창을 보면 비효율적임을 보여준다.
  arr.forEach(v => {
    // 배열 중에 숫자가 아닌 값이 있어도 배열의 요소 끝까지 콜백 함수가 돈다.
    console.log(v);

    // forEach, map, filter, reduce에서 return은 continue와 같다.
    // 반환값은 중요치 않고, break를 지원하지 않는다.
    // return으로 함수를 종료 해도 해당 인덱스의 콜백함수이기 때문에
    // 다음 요소의 콜백 함수가 돈다.

    // 배열 요소 중 숫자가 아닌 값이 있었다면 그 아래 값들은 실행할 필요가 없어짐.
    if(!isNum) return;

    // 숫자가 아니라면
    if(isNaN(v)) isNum = false;
  });

  return isNum;
};

// 0
// 1
// 2
// 3
// q
// 5
// 6
// 3.3
// 5
// 6
// 3.3
// 5
// 6
// 3.3
// 5
// 6
// 3.3
// 5
// 6
// 3.3
// 5
// 6
// 3.3
// 5
// 6
// 3.3
// false
console.log(isArrNum3(arr));

// 사실은 return으로 continue 시킬 것도 없는 예제이다.
const isArrNum4 = arr => {
  let isNum = true;
  arr.forEach(v => isNum = isNum && !isNaN(v));
  return isNum;
};
```

## break 기능까지 있는 배열 순회 메소드(ES5, IE9+)
> falsy values: boolean으로 형변환 했을 때 false로 취급되는 값들
  false, 0, '', null, undefined, NaN
  truthy values: boolean으로 형변환 했을 때 true로 취급되는 값들
  falsy value가 아닌 모든 값들.

* some  
콜백함수가 반환하는 값이 하나라도 true인지 파악하는 메소드  
하나라도 truthy value를 반환하는 순간 콜백함수를 멈춤.
```javascript
const arr = [
  0, 1, 2, 3, 'q', 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3,
  5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3
];

// 배열이 숫자로만 이루어져있는지 파악하는 함수
const isArrNum5 = arr => {
  const isNum = arr.some(v => {
    console.log(v);
    if(isNaN(v)) { // 숫자가 아니라면
      // some에서 truthy value를 반환하면 break와 동일함.
      return true;
    }
    // some에서 falsy value를 반환하면 continue와 동일함.
    return false;
  });

  // 숫자가 아니라면 some은 true를 반환하므로 not 연산자(!)를 써서 반환해줘야함.
  return !isNum;
};

// 0
// 1
// 2
// 3
// q
// false
console.log(isArrNum5(arr));

// 사실 아래와 같이 줄여쓸 수 있는 예제이다.
const isArrNum6 = arr => !arr.some(v => isNaN(v));
```
* every  
콜백함수가 반환하는 값이 모두 true인지 파악하는 메소드  
하나라도 falsy value를 반환하는 순간 콜백함수를 멈춤.
```javascript
const arr = [
  0, 1, 2, 3, 'q', 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3,
  5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3, 5, 6, 3.3
];

// 배열이 숫자로만 이루어져있는지 파악하는 함수
const isArrNum7 = arr => {
  const isNum = arr.every(v => {
    console.log(v);
    if(isNaN(v)) { // 숫자가 아니라면
      // every에서 falsy value를 반환하면 break와 동일함.
      return false;
    }
    // every에서 truthy value를 반환하면 continue와 동일함.
    return true;
  });

  return isNum;
};

// 0
// 1
// 2
// 3
// q
// false
console.log(isArrNum7(arr));

// 사실 아래와 같이 줄여쓸 수 있다.
const isArrNum8 = arr => arr.every(v => !isNaN(v));
```
