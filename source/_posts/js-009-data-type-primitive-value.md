---
title: (자알쓰) 자료형(원시값)
tag:
  - JS
  - ES
  - 자알쓰
  - 자료형
  - 원시값
category:
  - Programming
  - ECMAScript
  - 자알쓰
date: 2017-07-01 09:53:29
---

![](thumb.png)  

## 자알쓰란?
`자`바스크립트 `알`고 `쓰`자. (잘 쓰자는 의미도 담겨있다.)  
자바스크립트라는 언어 자체는 내 기준에서는 설계 상 미스가 참 많다.  
함수 단위의 스코프, 호이스팅, 동적 타입 등등  
자바와 같은 깐깐(?)한 언어를 배우고 바라본 자스는 허점 투성이처럼 보였다.  
애초에 자바스크립트는 어떠한 프로그램을 만들기 위해서 탄생했다기 보다는  
웹 페이지에 입력값에 대한 유효성 검사(데이터가 공란인지 아닌지 등등)와 같은  
페이지의 동적 제어가 주된 목적 + 짧은 개발 기간(넷 스케이프 사의 새로운 브라우저에 탑재 예정) 때문에  
설계 상에 미스가 있을 수 밖에 없다고 나는 생각된다.  
일종의 안전 장치가 없어서 개발자가 일일이 구현해주고, 신경써야 하는 느낌이었다.  
그렇다고 해서 자바스크립트를 극혐하거나 그런 것은 아니고 매우 사랑한다.  
또한 그 허점을 아는 사람은 허점을 보완해서 요리조리 피해서 잘 쓰겠지만...  
잘 모르는 부분들은 잘못 써도 동작이 잘 되기 마련이다.  
이는 지금 당장에는 큰 문제가 안 될지 모르겠지만, 추후에 대규모 웹 어플리케이션을 만들거나  
직면할 문제로부터 미리 해방시키기 위해 처음부터 좋은 습관을 들여가는 것이 좋다고 생각한다.  
그 아홉 번째 시리즈는 자료형 중에 원시값을 주제로 진행하겠다.  

## 자료형
0과 1로 이루어진 데이터를 메모리에서 꺼내서 써야하는데 어떻게 해석할지를 결정하는 유형.  
나는 위와 같이 이해하고 있는데 잘 이해가 가지 않는다면 그냥 넘어가도 무방하다.  
더 딥하게 알고 싶은 사람은 정적 타입의 언어(C, Java 등등)을 공부해보자.

자바스크립트에서 자료형은 크게 두 가지로 나뉜다.  
1. [원시값](#원시값-Primitive-Value)  
2. [객체](/2017/07/01/js-010-data-type-object/)  

하나 하나 파헤쳐보자.  

### 원시값(Primitive Value)
원시값에는 6가지 유형이 있다.  
1. [boolean](#부울-Boolean)  
2. [number](/2016/12/23/ES6-Number-type/)  
3. [string](#문자열-String)  
4. [null](#Null)  
5. [undefined](#Undefined)  
6. [Symbol](/2017/04/16/ES6-Symbol/)(ES2015에서 새로 생김)  

그리고 이 원시값에는 다음과 같은 특징이 있다.  
1. 불변(Immutable)하는 값이다.  
2. 값으로써 비교가 가능하다. (심볼을 제외하고)  
3. typeof 연산자를 쓰면 각자 고유한 타입을 내뱉는다. ([typeof null](https://github.com/FEDevelopers/tech.description/wiki/%E2%80%9Ctypeof-null%E2%80%9D%EC%9D%98-%EC%97%AD%EC%82%AC)을 제외하고)

너무나 당연한 소리를 하고 있어서 이게 무슨 특징인가 싶을 수 있다.  
하지만 다음 파트인 객체를 보고 나면 생각이 달라질 것이다.  
```javascript
// 불변하는 값이다.
var a = 'a';
var b = a;
b = 'b';
console.log(a, b); // 'a', 'b'

// 값으로써 비교가 가능하다.
console.log(false === !!0); // true

// 하지만 항상 유니크한 값을 가지는 심볼은 값으로써 비교가 불가능하다.
var c = Symbol('c');
var d = Symbol('c');
console.log(c === d); // false

// Symbol.for는 심볼 레지스트리에 해당 키값의 심볼이 있다면 새로 만들지 않고 해당 값을 반환한다.
var e = Symbol.for('c');
var f = Symbol.for('c');
console.log(e === f); // true

// 모두 고유한 타입을 내뱉어서 타입을 구분짓기가 쉽다.  
console.log(typeof false); // 'boolean'
console.log(typeof 123); // 'number'
console.log(typeof '123'); // 'string'
console.log(typeof null); // 'object', 버그이다. 상단의 링크를 참조하자.
console.log(typeof undefined); // 'undefined'
console.log(typeof Symbol()); // 'symbol'
```

#### 부울(Boolean)  
참/거짓을 나타내는 자료형이다.  
주로 조건을 명시해야하는 경우에 많이 쓴다.  
```javascript
var a = 1;
var b = 2;
if(a > b) { // 1. 조건문
  console.log(123);
}
for(var i=0; i<10; i++) { // 2. 반복문의 조건부 부분
  console.log(i); // 0~9까지 출력하게 된다.
}
var c = (a%2 === 1) ? 1 : 2; // 2. 삼항 연산자
```

형변환을 위해서는 다음과 같은 방법이 존재한다.  
```javascript
console.log(new Boolean('').valueOf()); // false
console.log(Boolean('')); // false
// ! 연산자는 참을 거짓으로, 거짓을 참으로 바꿔주는 Not 연산자이다.  
// !으로 한 번 뒤집고 !으로 한번 더 뒤집어주면 원래의 참/거짓 값이 나오게 되는 원리다.
console.log(!!''); // false, 가장 짧아서 쓰기 간편해서 자주 쓴다.
```

##### Falsy/Truthy Value
boolean으로 형변환 했을 때 거짓으로 판명되는 값이 Falsy Value, 참으로 판명되는 값이 Truthy Value이다.  
아래의 경우를 제외하고 모두 Truthy Value이다.  
자바스크립트의 유연한 동적 타입의 특성이 여기서 드러나는 것 같다.  
```javascript
console.log(!!0); // false, 숫자 0
console.log(!!undefined); // false, undefined
console.log(!!null); // false, null
console.log(!!false); // false, boolean의 false
console.log(!!''); // false, 빈 문자열(공백 아님, 쌍따옴표 아님)
console.log(!!NaN); // false, 숫자 NaN(Not a Number)

// 위 경우를 제외하고 모두 Truthy Value
console.log(!!12341234); // true, 0을 제외한 숫자
console.log(!!' '); // true, 공백이라도 true로 인식
console.log(!!{}); // true, 빈 개체라도 true로 인식
console.log(!![]); // true 빈 배열이라도 true로 인식
```

#### 문자열(String)
다른 프로그래밍 언어에서 문자열은 기본 자료형에 속하지 않는다.  
C에서는 문자의 배열로 문자열을 다루며, 자바에서는 클래스로 다루고 있는데 자바스크립트에서는 기본 자료형에 속해있다.  
C에서 문자의 배열이라고 말하듯이 자바스크립트에서도 배열과 같이 사용이 가능하다.  
```javascript
// 쌍따옴표, 홑따옴표 개인의 기호에 맞게, 혹은 코딩 컨벤션에 맞게 사용하면 된다.
var url = 'https://perfectacle.github.io/';

// HTML 템플릿을 바인딩 할 때 HTML 템플릿은 쌍따옴표를 사용하므로 홑따옴표 사용을 주장하는 입장도 있다.
var a = '<a href="' + url + '" target="_blank">짱짱맨의 블로그</a>';
var b = "<a href=\"" + url + "\" target=\"_blank\">짱짱맨의 블로그</a>";

// 또한 ES6 들어선 템플릿 리터럴 ``이 등장했기 때문에 이와 구별을 위해 쌍따옴표 사용을 주장하는 입장도 있다.
var c = `<a href="${url}" target="_blank">짱짱맨의 블로그</a>`;

// 배열과 같이 인덱스로 접근이 가능하다.
console.log(url[11], url[0], url[20]); // f h g

// 덧셈 연산자를 쓰면 문자열이 아닌 것을 문자열로 바꾼 후 문자열끼리 합쳐준다.  
// 연산 순서가 매우 중요하므로 먼저 계산해주고 싶은 내용을 앞에 배치하던가 괄호로 묶어 우선순위를 높여줘야한다.
var e = '10';
console.log(e + 2 + 1); // '1021', '10' + '2' + 1 = '102' + '1'
console.log(2 + e + 1); // '2101', '2' + '10' + 1 = '210' + '1'
console.log(2 + 1 + e); // '310', 2 + 1 + '10' = '3' + '10'
```

형변환은 다음과 같이 할 수 있다.  
```javascript
console.log(new String(123).valueOf()); // '123'
console.log(String(false)); // 'false'
console.log(''+false); // 'false', 가장 간결해서 자주 쓰는 방법이다.
```

#### Null
**값이 없음**을 나타내기 위한 자료형이다.  
어떤 사람은 이 null을 할당해주는 작업이 해당 변수를 쓸 준비가 되었다는 것과 같다고 한다.  
또한 null은 어떠한 프로퍼티나 메소드의 사용도 불가능하다.  
```javascript
var a = null;
a += ''; // 'null'
console.log(null.valueOf()); // Cannot read property 'valueOf' of null
```

#### Undefined
**값이 정의되지 않음**을 나타내기 위한 자료형이다.  
null은 값이 정의 됐다, 변수에 할당된 상태이나 undefined는 값이 할당되지 않은 상태이다.  
undefined도 null과 마찬가지로 어떠한 프로퍼티나 메소드의 사용도 불가능하다.
```javascript
var a;
console.log(a); // undefined
var b = 'asd';
console.log(b[3]); // undefined
// 자바스크립트는 요상하게도 초기화되지 않은 변수에 연산자를 써도 오류가 나질 않는다.
// 최대한 프로그램이 죽지 않도록 설계한 것 같다.
a += ''; // 'undefined'
console.log(b[4].valueOf()); // Cannot read property 'valueOf' of undefined
```

분량이 길어졌으니 한 번 끊고 그 다음 자료형인 [객체](/2017/07/01/js-010-data-type-object/)에 대해서 공부해보자.  