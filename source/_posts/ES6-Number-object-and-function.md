---
title: (ES6) Number 객체와 함수
date: 2016-12-24 15:11:28
category: [Programming, ECMAScript, ES2015+]
tag: [JS, ES, ES6, ES2015, Number]
---
![](ES6-Number-object-and-function/thumb.png)  
[(ES6) 숫자형](/2016/12/23/ES6-Number-type/)을 보고 이 글을 보는 걸 추천한다.

## 목차
* [Number 객체(Global 객체)](#Number-객체-Global-객체)  
  * [Properties](#Properties)  
  * [Methods](#Methods)  
* [Number 함수](#Number-함수)  
  * [함수](#함수)  
  * [생성자](#생성자)
* [Number ↔ String](#Number-↔-String)

## Number 객체(Global 객체)
ES5까지 Number 객체는 거의 [래퍼 객체](http://noritersand.tistory.com/536)의 역할만을 수행했다.  
하지만 ES6에 들어서면서 다양한 프로퍼티와 메소드들이 생기면서  
래퍼 객체 이상의 역할을 수행하는 전역 객체와 같이 쓸 수 있게 되었다.  
래퍼 객체는 원시 타입의 값을 객체로 다루기 위한 객체이며,  
래퍼 객체의 진가는 prototype 프로퍼티를 통해 드러나게 된다.  
래퍼 객체를 어떻게 사용하는지는 나중에 보도록 하고,  
일단 Number 객체의 구조를 보도록 하자.  
```javascript
console.dir(Number);
```
![](ES6-Number-object-and-function/number-object.png)  

### Properties
`*` 표시는 ES6에서 새로 추가됨.
* [Number.POSITIVE_INFINITY](#Number-POSITIVE-INFINITY-amp-Number-NEGATIVE-INFINITY-amp-Number-NaN)  
* [Number.NEGATIVE_INFINITY](#Number-POSITIVE-INFINITY-amp-Number-NEGATIVE-INFINITY-amp-Number-NaN)  
* [Number.NaN](#Number-POSITIVE-INFINITY-amp-Number-NEGATIVE-INFINITY-amp-Number-NaN)  
* [Number.MIN_VALUE](#Number-MIN-VALUE-amp-Number-MAX-VALUE)  
* [Number.MAX_VALUE](#Number-MIN-VALUE-amp-Number-MAX-VALUE)  
* [Number.MIN_SAFE_INTEGER](#Number-MIN-SAFE-INTEGER-amp-Number-MAX-SAFE-INTEGER) `*`  
* [Number.MAX_SAFE_INTEGER](#Number-MIN-SAFE-INTEGER-amp-Number-MAX-SAFE-INTEGER) `*`   
* [Number.EPSILON](#Number-EPSILON) `*`
* [Number.prototype](#Number-prototype)

표준 프로퍼티들은 상수이다.  
즉 변경이 불가능하다.  
```javascript
Number.EPSILON = "asdf"; // 오류는 나지 않는다.
console.log(Number.EPSILON); // 2.220446049250313e-16
```

#### [Number.POSITIVE_INFINITY](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/POSITIVE_INFINITY) & [Number.NEGATIVE_INFINITY](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/NEGATIVE_INFINITY) & [Number.NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/NaN)
```javascript
console.log(Number.POSITIVE_INFINITY === Infinity); // true
console.log(Number.NEGATIVE_INFINITY === -Infinity); // true
console.log(isNaN(Number.NaN)); // true
```

#### [Number.MIN_VALUE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_VALUE) & [Number.MAX_VALUE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_VALUE)
##### Problem in ES
[부동 소수점에 대한 이해](http://thrillfighter.tistory.com/349)  
[수의 표현범위가 다른 int와 float, 그리고 신뢰할 수 없는 부동소수점](http://slame.tistory.com/2)
```javascript
console.log(Number.MIN_VALUE); // 5e-324
console.log(Number.MIN_VALUE - 1); // -1
console.log(Number.MIN_VALUE + 1); // 1
console.log(Number.MAX_VALUE); // 1.7976931348623157e+308
console.log(Number.MAX_VALUE + 1); // 1.7976931348623157e+308
console.log(Number.MAX_VALUE + 1 === Number.MAX_VALUE - 1); // true
```

#### [Number.MIN_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER) `*` & [Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) `*`
##### Solution in ES6
```javascript
console.log(Number.MIN_SAFE_INTEGER); // -9007199254740991
console.log(-(Math.pow(2, 53) - 1)); // -9007199254740991
console.log(Number.MIN_SAFE_INTEGER !== Number.MIN_SAFE_INTEGER + 1); // true
console.log(Number.MIN_SAFE_INTEGER - 1 !== Number.MIN_SAFE_INTEGER - 2); // false
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(Math.pow(2, 53) - 1); // 9007199254740991
console.log(Number.MAX_SAFE_INTEGER !== Number.MAX_SAFE_INTEGER - 1); // true
console.log(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2); // true
```

##### Polyfill
```javascript
if(!Number.MIN_SAFE_INTEGER) {
  if(!Object.create) { // in ES3
    Number.MIN_SAFE_INTEGER = -(Math.pow(2, 53) - 1);
  } else { // in ES5
    Object.defineProperty(Number, "MIN_SAFE_INTEGER", {
      value: -(Math.pow(2, 53) - 1)
    });
  }
}
if(!Number.MAX_SAFE_INTEGER) {
  if(!Object.create) { // in ES3
    Number.MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  } else { // in ES5
    Object.defineProperty(Number, "MAX_SAFE_INTEGER", {
      value: Math.pow(2, 53) - 1
    });
  }
}
```

#### [Number.EPSILON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON) `*`
##### Problem in ES
```javascript
console.log(.1 + .2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false
```
ES에서는 위와 같이 소수점 계산에서 고질적인 문제를 안고 있다.  
이는 아마 [IEEE에서 제정한 부동소수점 표현 형식인 IEE754의 고질적인 문제](https://ko.wikipedia.org/wiki/IEEE_754)라고 보여진다.  
[실수 표현 문제 발생 이유 or 오차 발생 이유](http://karmainearth.tistory.com/143)
> 자바스크립트의 숫자는 십진 부동 소수점 숫자로 접근하는데 반해  
  그 내부 동작 원리는 이진 부동 소수점 숫자이기 때문에 오차가 발생한다.  
> [원문 보기](http://speakingjs.com/es5/ch11.html#rounding_errors)
JavaScript’s numbers are usually entered as decimal floating-point numbers,
but they are internally represented as binary floating-point numbers.
That leads to imprecision.

위와 같은 문제는 IEE754를 사용하는 Java에서도 동일하게 발생한다.
```java
public class test {
    public static void main(String[] args) {
        System.out.println(0.1 + 0.2);      // 0.30000000000000004
        System.out.println(0.3 == 0.1+0.2); // false
    }
}
```

어찌보면 0.00000000000000004 정도의 오차는 무시되도 되는 작은 숫자이다.  

##### Solution in ES6
Number.EPSILON은 오차없이 나타낼 수 있는 가장 작은 양의 소수를 나타낸다.  
이렇게 무시되어도 될 정도의 작은 오차를 구분하기 위해 등장한 프로퍼티이다.
```javascript
console.log(5e2); // 500
console.log(5e-2); // 0.05
console.log(0.5e2); // 50

console.log(Number.EPSILON); // 2.220446049250313e-16
console.log(Number.EPSILON.toFixed(20)); // 0.00000000000000022204
```

과연 0.0000000000000004는 무시돼도 될 정도로 작은 오차인지 살펴보자.
```javascript
/*
 * 0.00000000000000004
 * 0.00000000000000022204
 */
console.log(0.0000000000000004 < Number.EPSILON); // true
```

즉 좌변에 있는 값이 우변에 있는 Number.EPSILON 보다도 작다면 무시해도 되는 오차다.  

##### Usage
```javascript
// 이 함수가 true를 반환하면 formula와 result는 동일하다고 보면 됨.
// Number.EPILON은 항상 양수이기 때문에 Math.abs 메소드를 사용하여
// 계산식의 결과를 절대값으로 바꾼 후 오차를 비교해야함.
const isEqual = (formula, result) => 
  Math.abs(formula - result) < Number.EPSILON;
console.log(isEqual(0.1 + 1 - 2.2, -1.1)); // true
console.log(isEqual(0.1 + 1 - 2.2, -1.2)); // false
```

##### Polyfill
```javascript
if(!Number.EPSILON) {
  if(!Object.create) { // in ES3
    Number.EPSILON = 2.220446049250313e-16;
  } else { // in ES5
    Object.defineProperty(Number, "EPSILON", {
      value: 2.220446049250313e-16
    });
  }
}
```

#### [Number.prototype](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/prototype)
숫자가 상속받는 프로퍼티와 메소들을 정의해놓은 프로퍼티이다.  
표준 메소드 및 프로퍼티가 미리 정의돼있으며, 사용자가 직접 정의하려면 아래와 같이 하면 된다.
```javascript
Number.prototype.lastNum = function() {
  return this % 10;
};
console.log(12.0.lastNum()); // 2
```

### Methods
`*` 표시는 ES6에서 새로 추가됨.  
* [Number.isFinite()](#Number-isFinite) `*`  
* [Number.isInteger()](#Number-isInteger) `*`  
* [Number.isNaN()](#Number-isNaN) `*`  
* [Number.isSafeInteger()](#Number-isSafeInteger) `*`  
* [Number.parseInt()](#Number-parseInt) `*`  
* [Number.parseFloat()](#Number-parseFloat) `*`  
* [Number.prototype.toFixed()](#Number-prototype-toFixed-amp-Number-prototype-toPrecision)  
* [Number.prototype.toPrecision()](#Number-prototype-toFixed-amp-Number-prototype-toPrecision)  
* [Number.prototype.toExponential()](#Number-prototype-toExponential)  
* [Number.prototype.toString()](#Number-prototype-toString)  
* [Number.prototype.valueOf()](#Number-prototype-valueOf)
* [Number.prototype.toLocaleString()](#Number-prototype-toLocaleString)

메소드는 수정 가능하다.  
```javascript
Number.isFinite = () => "a";
console.log(Number.isFinite(123)); // "a"
```

#### [Number.isFinite()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite) `*`
##### in ES
```javascript
console.log(isFinite(0)); // true
console.log(isFinite(255)); // true
console.log(isFinite(-254)); // true
console.log(isFinite("1")); // true
console.log(isFinite(NaN)); // false
console.log(isFinite(Infinity)); // false
console.log(isFinite(-Infinity)); // false
console.log(isFinite(null)); // true
console.log(isFinite({})); // false
console.log(isFinite(undefined)); // false
console.log(isFinite([])); // true
```

##### in ES6
```javascript
console.log(Number.isFinite(0)); // true
console.log(Number.isFinite(255)); // true
console.log(Number.isFinite(-254)); // true
console.log(Number.isFinite("1")); // false
console.log(Number.isFinite(NaN)); // false
console.log(Number.isFinite(Infinity)); // false
console.log(Number.isFinite(-Infinity)); // false
console.log(Number.isFinite(null)); // false
console.log(Number.isFinite({})); // false
console.log(Number.isFinite(undefined)); // false
console.log(Number.isFinite([])); // false
```

##### Polyfill
```javascript
Number.isFinite = Number.isFinite || function(value) {
    return typeof value === "number" && isFinite(value);
}
```

#### [Number.isInteger()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger) `*`
```javascript
console.log(Number.isInteger(0)); // true
console.log(Number.isInteger(255)); // true
console.log(Number.isInteger(-254)); // true
console.log(Number.isInteger(1.1)); // false
console.log(Number.isInteger("1")); // false
console.log(Number.isInteger(NaN)); // false
console.log(Number.isInteger(Infinity)); // false
console.log(Number.isInteger(-Infinity)); // false
console.log(Number.isInteger(null)); // false
console.log(Number.isInteger({})); // false
console.log(Number.isInteger(undefined)); // false
console.log(Number.isInteger([])); // false
```

##### Polyfill
```javascript
Number.isInteger = Number.isInteger || function(value) {
  return typeof value === "number" && 
    isFinite(value) && 
    Math.floor(value) === value;
};
```

#### [Number.isNaN()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN) `*`
##### Problem
```javascript
console.log(NaN === NaN); // false
```

##### in ES
```javascript
console.log(isNaN(0)); // false
console.log(isNaN(-Infinity)); // false
console.log(isNaN("1.1")); // false
console.log(isNaN(NaN)); // true
console.log(isNaN("NaN")); // true
console.log(isNaN("a")); // true
console.log(isNaN(0 / 0)); // true
console.log(isNaN({})); // true
console.log(isNaN([])); // false
console.log(isNaN(undefined)); // true
console.log(isNaN(null)); // false
console.log(isNaN(/a/)); // true
```

##### in ES6
```javascript
console.log(Number.isNaN(0)); // false
console.log(Number.isNaN(-Infinity)); // false
console.log(Number.isNaN("1.1")); // false
console.log(Number.isNaN(NaN)); // true
console.log(Number.isNaN("NaN")); // false
console.log(Number.isNaN("a")); // false
console.log(Number.isNaN(0 / 0)); // true
console.log(Number.isNaN({})); // false
console.log(Number.isNaN([])); // false
console.log(Number.isNaN(undefined)); // false
console.log(Number.isNaN(null)); // false
console.log(Number.isNaN(/a/)); // false
```

##### Polyfill
```javascript
Number.isNaN = Number.isNaN || function(value) {
    return typeof value === "number" && isNaN(value);
};

// Or
Number.isNaN = Number.isNaN || function(value) {     
    return value !== value;
};
```

#### [Number.isSafeInteger()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger) `*`
```javascript
console.log(Number.isSafeInteger(3)); // true
console.log(Number.isSafeInteger(Math.pow(2, 53))); // false
console.log(Number.isSafeInteger(Math.pow(2, 53) - 1)); // true
console.log(Number.isSafeInteger(NaN)); // false
console.log(Number.isSafeInteger(Infinity)); // false
console.log(Number.isSafeInteger("3")); // false
console.log(Number.isSafeInteger(3.1)); // false
console.log(Number.isSafeInteger(3.0)); // true
```

##### Polyfill
```javascript
Number.isSafeInteger = Number.isSafeInteger || function (value) {
   return Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
};
```

#### [Number.parseInt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseInt) `*`
##### Syntax
```javascript
Number.parseInt(string[, radix])
```

##### Parameters
* string: 문자열  
* radix: 2~36진수, 10이 기본값.

##### Example
```javascript
console.log(Number.parseInt === parseInt); // true
console.log(Number.parseInt("11")); // 11
console.log(Number.parseInt("11.11")); // 11
console.log(Number.parseInt("11A")); // 11
console.log(Number.parseInt("A11")); // NaN
console.log(Number.parseInt("11A1")); // 11
console.log(Number.parseInt("11.A")); // 11
console.log(Number.parseInt("011")); // 11
console.log(Number.parseInt("11 0")); // 11
console.log(Number.parseInt("0xFF")); // 255
console.log(Number.parseInt(true)); // NaN
console.log(Number.parseInt(new Date())); // NaN
```

##### Problem
```javascript
console.log(Number.parseInt("0b111")); // 0
console.log(Number.parseInt("0b111", 2)); // 0
console.log(Number.parseInt("0o10")); // 0
console.log(Number.parseInt("0o10", 8)); // 0
```

##### Solution
```javascript
console.log(Number.parseInt("111", 2)); // 7
console.log(new Number("0b111").valueOf()); // 7
console.log(Number("0b111")); // 7
console.log(+"0b111"); // 7
console.log(Number.parseInt("10", 8)); // 8
console.log(new Number("0o10").valueOf()); // 8
console.log(Number("0o10")); // 8
console.log(+"0o10"); // 8
```

##### Polyfill
```javascript
Number.parseInt = Number.parseInt || parseInt;
```

#### [Number.parseFloat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseFloat) `*`
```javascript
console.log(Number.parseFloat === parseFloat); // true
console.log(Number.parseFloat("11")); // 11
console.log(Number.parseFloat("11.11")); // 11.11
console.log(Number.parseFloat("11A")); // 11
console.log(Number.parseFloat("A11")); // NaN
console.log(Number.parseFloat("11A1")); // 11
console.log(Number.parseFloat("11.A")); // 11
console.log(Number.parseFloat("011")); // 11
console.log(Number.parseFloat("11 0")); // 11
console.log(Number.parseFloat("0xFF")); // 0
console.log(Number.parseFloat(true)); // NaN
console.log(Number.parseFloat(new Date())); // NaN
```

##### Polyfill
```javascript
Number.parseFloat = Number.parseFloat || parseFloat;
```

#### [Number.prototype.toFixed()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed) & [Number.prototype.toPrecision()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toPrecision)
실수를 반올림 할 때 쓰인다.
```javascript
const num = 123.45678;
console.log(num.toFixed()); // "123"
console.log(num.toPrecision()); // "123.45678"
console.log(num.toString()); // "123.45678"
console.log(num.toFixed(4)); // "123.4568"
console.log(num.toPrecision(4)); // "123.5"
```

#### [Number.prototype.toExponential](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toExponential)
숫자를 지수를 통해 표현할 때 쓰인다.
```javascript
let num = 7817.1278;
console.log(num.toExponential()); // "7.8171278e+3"
console.log(num.toExponential(2)); // "7.82e+3"
console.log(num.toExponential(6)); // "7.817128e+3"
num = 0.1445;
console.log(num.toExponential()); // "1.445e-1"
```
#### [Number.prototype.toString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString)
숫자를 문자열로 바꿀 때 쓰인다.
```javascript
console.log(1.1.toString()); // "1.1"
console.log(1.0.toString()); // "1"
console.log(0b11.toString()); // "3"
console.log(NaN.toString()); // "NaN"
console.log(Infinity.toString()); // "Infinity"
console.log(-Infinity.toString()); // -Infinity
console.log(0.0.toString()); // "0"
```

#### [Number.prototype.valueOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/valueOf)
숫자 객체의 인스턴스에서 숫자값을 얻어올 때 쓰인다.
```javascript
console.log(new Number(11).valueOf()); // 11
console.log(new Number(0b11).valueOf()); // 3
console.log(new Number({}).valueOf()); // NaN
```

#### [Number.prototype.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString)
##### Syntax
```javascript
Number.prototype.toLocaleString([locales [, options]]);
```

##### Parameters  
1. locales  
[BCP 47 language tag](https://tools.ietf.org/html/rfc5646)  
language[-script][-region]\*(-variant)\*(-extension)[-privateuse]  
"en-US", "en-CA", "tlh-Kore-AQ-fonipa", "ja-JP", "zh-Hans-CN", etc.

2. Options  
style: "currency", "percent", "decimal"(default)  
currency: [Current currency & funds code list](http://www.currency-iso.org/en/home/tables/table-a1.html)  
"USD", "EUR", "KRW", "JPY", "CNY", etc.  
etc options.

##### Checking for support
```javascript
const isSupportToLocaleString = () =>
  !!(Intl && typeof Intl === "object" && typeof Intl.NumberFormat === "function");
if(isSupportToLocaleString()) { // if support toLocaleString()
  // blahblah...
} else { // if not support toLoacleString()
  // blahblah...
}
```

##### Usage
```javascript
const num = 123456.789;
console.log(num.toLocaleString("en-US")); // "123.456.789"
console.log(num.toLocaleString("zh-Hans-CN-u-nu-hanidec")); // "一二三,四五六.七八九"
console.log(num.toLocaleString("en-US", {style: "currency", currency: "USD"})); // "$123,456.79"
console.log(num.toLocaleString("en-UK", {style: "currency", currency: "EUR"})); // "€123,456.79"
console.log(num.toLocaleString("tlh-Kore-AQ-fonipa", {style: "currency", currency: "KRW"})); // "₩123,457"
console.log(num.toLocaleString("ja-JP", {style: "currency", currency: "JPY"})); // "￥123,457"
console.log(num.toLocaleString("zh-Hans-CN", {style: "currency", currency: "CNY"})); // "￥123,456.79"
```

## Number 함수
* 함수
* 생성자

### 함수
#### Syntax
```javascript
Number(value);
```
#### Parameter
value: 어떠한 데이터 타입의 값도 올 수 있다.

#### Usage
매개변수로 넘긴 값들을 숫자로 바꿀 때 사용한다.

#### Example
```javascript
console.log(Number("11")); // 11
console.log(Number("11.11")); // 11.11
console.log(Number("11A")); // NaN
console.log(Number("A11")); // NaN
console.log(Number("11A1")); // NaN
console.log(Number("11.A")); // NaN
console.log(Number("011")); // 11
console.log(Number(true)); // 1
console.log(Number(new Date())); // 1481186433309
console.log(Number([0, 1])); // NaN
console.log(Number({a: "b"})); // NaN
console.log(Number(11)); // 11
```

### 생성자
#### Syntax
```javascript
new Number(value);
```

#### Parameter
value: 어떠한 데이터 타입의 값도 올 수 있다.

#### Structure
```javascript
const objNum = new Number(11);
console.log(typeof objNum); // "object"
console.dir(objNum);
```
![Number Constructor Structure](ES6-Number-object-and-function/number-constructor.png)

#### \_\_proto\_\_
```javascript
const objNum = new Number(11);
console.log(Number.prototype === objNum.__proto__); // true
```

숫자의 래퍼 객체(Number)에서 미리 정의해놓은 프로퍼티(prototype)이다.  
이 프로퍼티에는 숫자의 표준 메소드와 프로퍼티가 정의돼있다.   
숫자 객체의 인스턴스(new Number())는 숫자 래퍼 객체(Number)로부터  
prototype 프로퍼티를 \_\_proto\_\_라는 이름으로 상속받는다. 

#### Necessity
[The Secret Life of JavaScript Primitives](https://javascriptweblog.wordpress.com/2010/09/27/the-secret-life-of-javascript-primitives/)  
ES에서 숫자 원시값의 프로퍼티와 메소드를 사용할 때 내부 동작 원리는 아래와 같다.
```javascript
// 우리가 알던 방식대로 메소드 사용해보자.
11.1.toString(); // "11.1";

/*
 * Number.prototype.toString() 메소드를 쓰기 위해서
 * 원시값인 11.1을 Number 객체로 바꿔줘야한다.
 * 따라서 위 내용은 아래와 같이 자동으로 동작하게 된다.
 */
new Number(11.1).toString(); // 11.1
```

## Number ↔ String
```javascript
const num1 = "10";
const num2 = "10";
const sum = num1 + num2; // "1010"
const sub = num1 - num2; // 0
const mul = num1 * num2; // 100
const div = num1 / num2; // 1
```

### String to Number
* Number.parseInt(string[, radix])
* Number.parseFloat(string)
* new Number(string).valueOf()
* Number()
* +string, 1*string

#### Number.parseInt(str[, radix])
```javascript
console.log(Number.parseInt("11")); // 11
console.log(Number.parseInt("11.11")); // 11
console.log(Number.parseInt("11A")); // 11
console.log(Number.parseInt("A11")); // NaN
console.log(Number.parseInt("11A1")); // 11
console.log(Number.parseInt("11.A")); // 11
console.log(Number.parseInt("011")); // 11
console.log(Number.parseInt("11 0")); // 11
console.log(Number.parseInt("0b11")); // 0
console.log(Number.parseInt("0o11")); // 0
```

#### Number.parseFloat(str)
```javascript
console.log(Number.parseFloat("11")); // 11
console.log(Number.parseFloat("11.11")); // 11.11
console.log(Number.parseFloat("11A")); // 11
console.log(Number.parseFloat("A11")); // NaN
console.log(Number.parseFloat("11A1")); // 11
console.log(Number.parseFloat("11.A")); // 11
console.log(Number.parseFloat("011")); // 11
console.log(Number.parseFloat("11 0")); // 11
console.log(Number.parseFloat("0b11")); // 0
console.log(Number.parseFloat("0o11")); // 0
```

#### new Number(string).valueOf()
```javascript
console.log(new Number("11").valueOf()); // 11
console.log(new Number("11.11").valueOf()); // 11.11
console.log(new Number("11A").valueOf()); // NaN
console.log(new Number("A11").valueOf()); // NaN
console.log(new Number("11A1").valueOf()); // NaN
console.log(new Number("11.A").valueOf()); // NaN
console.log(new Number("011").valueOf()); // 11
console.log(new Number("11 0").valueOf()); // NaN
console.log(new Number("0b11").valueOf()); // 3
console.log(new Number("0o11").valueOf()); // 9
```

#### Number(string)
```javascript
console.log(Number("11")); // 11
console.log(Number("11.11")); // 11.11
console.log(Number("11A")); // NaN
console.log(Number("A11")); // NaN
console.log(Number("11A1")); // NaN
console.log(Number("11.A")); // NaN
console.log(Number("011")); // 11
console.log(Number("0b11")); // 3
console.log(Number("0o11")); // 9
```

#### +string, 1*string
```javascript
console.log(+"11"); // 11
console.log(+"11.11"); // 11.11
console.log(+"11A"); // NaN
console.log(+"A11"); // NaN
console.log(+"11A1"); // NaN
console.log(+"11.A"); // NaN
console.log(+"011"); // 11
console.log(+"0b11"); // 3
console.log(+"0o11"); // 9
```

#### Performance
```javascript
const iterations = 10000000;
console.time("Number.parseInt()");
for(let i=0; i<iterations; i++){
    Number.parseInt("1.1"); // Number.parseInt(): 561.062ms
}
console.timeEnd("Number.parseInt()");
console.time("Number.parseInt() with radix");
for(let i=0; i<iterations; i++){
    Number.parseInt("1.1", 10); // Number.parseInt() with radix: 511.062ms
}
console.timeEnd("Number.parseInt() with radix");
console.time("Number.parseFloat()");
for(let i=0; i<iterations; i++){
    Number.parseFloat("1.1"); // Number.parseFloat(): 737.437ms
}
console.timeEnd("Number.parseFloat()");
console.time("new Number().valueOf()");
for(let i=0; i<iterations; i++){
    new Number("1.1").valueOf(); // new Number().valueOf(): 1112.782ms
}
console.timeEnd("new Number().valueOf()");
console.time("Number()");
for(let i=0; i<iterations; i++){
    Number("1.1"); // Number(): 1066.577ms
}
console.timeEnd("Number()");
console.time("+string");
for(let i=0; i<iterations; i++){
    +"1.1"; // +string: 20.724ms
}
console.timeEnd("+string");
console.time("1*string");
for(let i=0; i<iterations; i++){
    1*"1.1"; // 1*string: 21.459ms
}
console.timeEnd("1*string");
```

### Number to String
* Number.prototype.toString()
* String(number)
* "" + number

#### Number.prototype.toString()
```javascript
console.log(1.1.toString()); // "1.1"
console.log(1.0.toString()); // "1"
console.log(0b11.toString()); // "3"
console.log(NaN.toString()); // "NaN"
console.log(Infinity.toString()); // "Infinity"
console.log(-Infinity.toString()); // -Infinity
console.log(0.0.toString()); // "0"
```

#### String(number)
```javascript
console.log(String(1.1)); // "1.1"
console.log(String(1)); // "1"
console.log(String(0b11)); // "3"
console.log(String(NaN)); // "NaN"
console.log(String(Infinity)); // "Infinity"
console.log(String(-Infinity)); // "-Infinity"
console.log(String(0)); // "0"
```

#### "" + number
```javascript
console.log("" + 1.1); // "1.1"
console.log("" + 1); // "1"
console.log("" + 0b11); // "3"
console.log("" + NaN); // "NaN"
console.log("" + Infinity); // "Infinity"
console.log("" + -Infinity); // "-Infinity"
console.log("" + 0); // "0"
```

#### Performance
```javascript
const iterations = 10000000;
console.time("Number.prototype.toString()");
for(let i=0; i<iterations; i++){
    1.1.toString(); // Number.prototype.toString(): 268.619ms
}
console.timeEnd("Number.prototype.toString()");
console.time("String(number)");
for(let i=0; i<iterations; i++){
    String(1.1); // String(): 159.045ms
}
console.timeEnd("String(number)");
console.time("\"\" + number");
for(let i=0; i<iterations; i++){
    "" + 1.1; // "" + number: 20.594ms
}
console.timeEnd("\"\" + number");
```