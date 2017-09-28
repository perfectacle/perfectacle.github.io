---
title: (Babel) ES6를 IE8에서도 써보자
date: 2016-11-11 23:09:39
category: [Front-end, Babel]
tags: [Babel, ES6, ES2015, ES, JS, Cross Browsing, npm, Node.js]
---
![](thumb.png)  

## 목차
1. [들어가기에 앞서](#들어가기에-앞서)
2. [ES6 왜 써?](#ES6-왜-써)
3. [ES6에서 ES5로 트랜스파일하기](#ES6에서-ES5로-트랜스파일하기)
4. [ES5를 IE8에서도 지원하기](#ES5를-IE8에서도-지원하기)
5. [바벨은 안전한가?](#바벨은-안전한가)  

## 들어가기에 앞서  
아주 많이 참조한 링크  
[지금 바로 시작하는 ES6](http://meetup.toast.com/posts/85)

이 포스트에서는 **Node.js**, **npm**, **ES(ECMAScript)** 등등에 대해서는 설명하지 않는다.  
해당 내용들은 구글링을 통해 직접 찾아보길 바란다.  
또한 import, export로 모듈화 시키는 것은 현재 지원 브라우저도 없고,  
다양한 모듈 번들러 중 하나인 [웹팩](/2016/11/18/Module-bundling-with-Webpck/)를 이용하거나 RequireJS를 이용하거나 등등 방법은 많지만  
해당 포스트에서는 다루지 않고 건너 뛴다.

해당 포스트에서는 ES6를 왜 써야하는지,  
어떻게 하면 Windows XP IE8 유저들에게까지  
우리의 우아한 코드를 전달할 수 있는지에 대해 중점을 뒀다. 
 
## ES6 왜 써?

백문이 불여일견. 코드로 보자.

배열의 모든 요소를 더한 후 반환하는 코드.

```javascript
// ES3 (IE 8+)
var arr = [1, 2, 3];
var sumArr = 0;
for(var i = 0; i < arr.length;) {
  sumArr += arr[i++];
}
console.log(sumArr); // 6
```

```javascript
// ES5 (IE 9+)
'use strict';
var arr = [1, 2, 3, 0];
var sumArr = arr.reduce(function(p, c) {
  return a+b;
});
console.log(sumArr); // 6
```

```javascript
// ES6 (Modern Browser)
const arr = [1, 2, 3, 0];
const sumArr = arr.reduce((p, c) => p+c);
console.log(sumArr); // 6
```

private module을 구현하는 코드 (전역의 공간을 더럽히지 않는 코드)  
대신 script 모듈에서 script2 모듈에 있는 데이터를 불러올 수 없다.
```javascript
// ES3+ (IE 8+)
(function() {
  'use strict';
  // 소스코드 끄적끄적...
}());
```

```javascript
// ES6 (Moden Browser)
{
  // 소스코드 끄적끄적...
}
```

public module을 구현하는 코드  
script 모듈에서 script2 모듈에 있는 데이터를 불러올 수 있다.

```javascript
// ES3+ (IE 8+), 전역 스코프에 변수가 추가된다는 단점이 존재한다.
// script.js
'use strict';
var car = (function() {
  var namespace = {};
  var color = 'blue'; // 외부에 노출시키지 않음, 캡슐화.
  // 아래 메소드는 네임스페이스의 메소드임.
  namespace.getColor = function() {
    return color;
  };
  namespace.setColor = function(_color) {
    color = _color;
  };
  // 메소드를 달고 있는 네임스페이스 객체 리턴.
  return namespace;
}());
```

```javascript
// ES3+ (IE 8+), 전역 스코프에 car라는 변수가 추가된다는 단점이 존재한다.
// script2.js
'use strict';
console.log(car.getColor()); // 'blue';
car.setColor('red');
console.log(car.getColor()); // 'red';
```

```javascript
// ES6 (현재 지원하는 브라우저 없음)
// 바벨을 사용하면 CommonJS 모듈로 변환해주는데
// Node.js는 CommonJS를 지원해주는데 반해 브라우저는 이를 미지원한다.
// 이를 위해서는 모듈 번들러인 Browserify나 Webpack을 쓰거나
// 브라우저에서 지원이 되는 RequireJS 모듈로 변환해주는 바벨용 플러그인을 쓴 후
// RequireJS를 사용하면 된다.
// script.js
let color = 'blue';
export const getColor = () => color;
export const setColor = (_color) => color = _color;
```

```javascript
// ES6 (현재 지원하는 브라우저 없음)
// 바벨을 사용하면 CommonJS 모듈로 변환해주는데
// Node.js는 CommonJS를 지원해주는데 반해 브라우저는 이를 미지원한다.
// 이를 위해서는 모듈 번들러인 Browserify나 Webpack을 쓰거나
// 브라우저에서 지원이 되는 RequireJS 모듈로 변환해주는 바벨용 플러그인을 쓴 후
// RequireJS를 사용하면 된다.
// script2.js
import {getColor, setColor} from './script';
console.log(getColor());
setColor('red');
console.log(getColor());
```

이외에도 정말 무궁무진할 정도로 생산성을 향상시키는 코드들이 많다.
  
## ES6에서 ES5로 트랜스파일하기
[ES6의 호환성 보기](http://kangax.github.io/compat-table/es6/)  
![IE11의 ES6 지원율은 심히 안습이다.](es6-compatibility.png)  
![혹시나 문제가 있는 짤이라면 말씀해주세요.](babel.jpg)  
![ES5는 IE8을 제외하고는 많이 커버가 된다.](es5-compatibility.png)  
하지만 우리에게는 방법이 있다!  
바로 **트랜스파일러**인 **바벨**을 이용하는 것이다.  
**컴파일**은 사람이 이해할 수 있는 **하이 레벨의 코드**를  
컴퓨터가 이해할 수 있는 **로우 레벨의 기계어**로 바꾸는 것을 말한다.  
**트랜스파일**이란 **같은 레벨**의 **다른 언어**로 변환하는 것을 뜻한다.  
브라우저별로 ES6의 지원율이 상이하기 때문에  
같은 레벨인 ES6를 같은 레벨의 ES5로 트랜스파일하면 되는 것이다.  
그럼 우선 babel을 설치해보자.

```
$ npm i -g babel-cli
$ npm i -D babel-cli babel-preset-latest
```

위 명령어를 하나씩 파헤쳐보자.

1. babel-cli를 global로 설치하지 않으면, 터미널에서 *babel*이라는 명령어를 인식하지 못한다.
2. babel-cli는 터미널에서 babel을 돌려주는 것으로써 현재 프로젝트에 또 설치를 해줘야 동작을 제대로 한다.
3. babel에는 plugin이라는 게 존재한다.  
이 plugin은 es6의 애로우 펑션을 지원하는 플러그인, 클래스를 지원하는 플러그인 등등이 있다.  
그러한 플러그인을 모아놓은 걸 preset이라고 부른다.  
es2015 preset은 es6의 플러그인들을 모아놓은 것이고,  
latest preset은 ES2015~ES2017까지의 프리셋들을 모아놓은 것이다.  
시간이 지나면 latest의 지원 프리셋 범위는 더 늘어날 수도 있다.  

그리고 바벨 설정 파일을 하나 만들어줘야한다.  
**.babelrc**라는 파일을 만들고 아래와 같이 적어주자.

```json
{
  "presets": ["latest"]
}
```

바벨의 설정파일이 바뀔 때마다 babel-cli가 watch중이라면 꺼줬다 켜야 제대로 적용된다.  
그리고 폴더 구조를 아래와 같이 만들어보자. (다르게 해도 상관없다.)

```
+ es6
  - script.js
.babelrc
index.html
packge.json
```

es6 폴더에는 es6+로 작성한 코드가 담길 것이다.  
script.js에는 아래와 같이 코딩해보자.

```javascript
{
  const A = '1';
  const arr = [1, 2];
  const sumArr = arr.reduce((p, c) => p+c);
  console.log(sumArr); // 3
  const btn = document.getElementById('btn');
  const evtClick = () => console.log(A);
  btn.addEventListener('click', evtClick);
}
```

그 이후 터미널 창에서 아래와 같이 입력한다.  

```
$ babel es6 -d script -w
```

또 하나하나 파헤쳐보자.

1. babel: babel-cli를 쓴다는 것이다.
2. es6: es6 디렉토리에 있는 파일을 트랜스파일 한다.
3. -d script: 결과물을 script라는 폴더에다가 던져준다.
4. -w: watch, 계속 주시하면서 파일이 바뀔 때마다 트랜스파일해준다.  
watch를 끝내려면 Ctrl+C키를 누른 후 y키를 누른 후 Enter 키를 누르면 된다.

그리고 나서 디렉토리를 보면 다음과 같다.  
```
+ es6
  - script.js
+ script
  - script.js
.babelrc
index.html
packge.json
```

한 번 우리의 코드가 어떻게 바뀌었는지 script/script.js를 열어보자.

```javascript
'use strict';  
{
  (function () {
    var A = '1';
    var arr = [1, 2];
    var sumArr = arr.reduce(function (p, c) {
      return p + c;
    });
    console.log(sumArr); // 3
    var btn = document.getElementById('btn');
    var evtClick = function evtClick() {
      return console.log(A);
    };
    btn.addEventListener('click', evtClick);
  })();
}
```

쓸 데 없는 블록으로 감싸고 있긴 하지만 그래도 전역을 더럽히지 않고,  
훌륭하게 코드를 ES5로 트랜스파일 하였다.  
즉 우리가 개발할 때는 es6의 디렉토리 내의 파일로 개발을 하고  
배포할 때는 script 디렉토리 내의 코드를 배포하면 된다.  
여기까지가 IE9+ 프로젝트에서 하면 되는 내용이다.

## ES5를 IE8에서도 지원하기

우리나라는 MS 공화국이다.  
저기 산골짝에 가면 XP를 쓰는 사람도 있고, 아직도 공공기관에서도 XP를 쓴다는 소리가 들린다.  
XP가 날고 기어봤자 IE8까지 밖에 지원이 안 되고, 그러한 악의 근원들까지 커버를 쳐야할 때가 온다.  
또한 윈도우 7의 기본 브라우저도 IE8이기 때문에 업데이트를 안 하는 사람들이 많다.  
그럴 경우를 대비해 바벨에서도 *Polyfill*을 준비해두었다.  
Polyfill이란 아래와 같이 미지원 환경에서도 해당 내용을 지원하게끔 하는 것이다.
  
```javascript
if ( !Array.prototype.forEach ) { // for IE8
  Array.prototype.forEach = function(fn, scope) {
    for(var i = 0, len = this.length; i < len; ++i) {
      if (i in this) {
        fn.call(scope, this[i], i, this);
      }
    }
  };
}
```

설치하기 귀찮은 사람을 CDN을 이용하자. (이상하게 min은 오류가 나는 것 같다.)
  
```
https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
```

아닌 사람은 아래와 같이 입력하여 설치해보자.
  
```
$ npm i -S babel-polyfill
```

그리고 index.html에 폴리필을 넣어주자. (무조건 사용자가 작성한 코드보다 위에 존재해야한다.)
  
```html
<script src="./node_modules/babel-polyfill/dist/polyfill.js"></script>
<script src="./script/script.js"></script>
```

그리고 IE8에서 실행해보자.  
![역시 IE는 실망을 저버리지 않는다.](ie8.png)  
addEventListener, removeEventListener 등등의 Polyfill을 수동으로 추가해줘야한다.  
아래 링크로 가면 minify 버전의 소스코드도 볼 수 있다.  
[Polyfill the EventListener interface in IE8](https://gist.github.com/jonathantneal/3748027)

```javascript
// eventListener.polyfill.js
!window.addEventListener && (function(WindowPrototype, DocumentPrototype, ElementPrototype, addEventListener, removeEventListener, dispatchEvent, registry) {
  WindowPrototype[addEventListener] = DocumentPrototype[addEventListener] = ElementPrototype[addEventListener] = function(type, listener) {
    var target = this;
    registry.unshift([target, type, listener, function(event) {
      event.currentTarget = target;
      event.preventDefault = function() {
        event.returnValue = false
      };
      event.stopPropagation = function() {
        event.cancelBubble = true
      };
      event.target = event.srcElement || target;
      listener.call(target, event);
    }]);
    this.attachEvent("on" + type, registry[0][3]);
  };
  WindowPrototype[removeEventListener] = DocumentPrototype[removeEventListener] = ElementPrototype[removeEventListener] = function(type, listener) {
    for(var index = 0, register; register = registry[index]; ++index) {
      if(register[0] == this && register[1] == type && register[2] == listener) {
        return this.detachEvent("on" + type, registry.splice(index, 1)[0][3]);
      }
    }
  };
  WindowPrototype[dispatchEvent] = DocumentPrototype[dispatchEvent] = ElementPrototype[dispatchEvent] = function(eventObject) {
    return this.fireEvent("on" + eventObject.type, eventObject);
  };
})(Window.prototype, HTMLDocument.prototype, Element.prototype, "addEventListener", "removeEventListener", "dispatchEvent", []);
```

그리고 index.html에 폴리필을 넣어주자. (무조건 사용자가 작성한 코드보다 위에 존재해야한다.)

```html
<script src="./node_modules/babel-polyfill/dist/polyfill.js"></script>
<script src="./script/eventListener.polyfill.js"></script>
<script src="./script/script.js"></script>
```

![저렇게 오류를 뿜어도 작동은 제대로 한다.](ie8-2.png)  
아직 끝난 게 아니다.  
아래와 같은 코드를 보자.

```javascript
const foo = {
  catch: function () {}
};
foo.catch();
```

이제 위 코드가 어떻게 트랜스파일 되는지 보자.

```javascript
"use strict";  
var foo = {
  catch: function _catch() {}
};
foo.catch();
```

위와 같은 코드를 IE8에서 테스트 해보자.  
![결과는 참담하다.](ie8-3.png)  
2번 라인과 4번 라인에서 객체의 메소드와 메소드 호출로 **catch**를 사용하였다.  
IE8은 ES3를 지원하고, ES3에서는 catch 같은 키워드를 저렇게 식별자로 쓰게 되면 오류를 뿜는다.  
ES3를 위한 플러그인이 바벨에는 또 존재한다.

```
$ npm i -D babel-plugin-transform-es3-property-literals babel-plugin-transform-es3-member-expression-literals
```

* babel-plugin-transform-es3-property-literals을 쓰면 아래와 같이 바뀐다.

```javascript
var foo = {
  "catch": function _catch() {}
};
```

프로퍼티에서 키워드인 catch에 쌍따옴표를 붙인 걸 볼 수 있다.


* babel-plugin-transform-es3-member-expression-literals을 쓰면 아래와 같이 바뀐다.

```javascript
foo["catch"]();
```

표현식에서 키워드인 catch를 []로 감싸고, 쌍따옴표를 붙인 걸 볼 수 있다.  
플러그인을 쓰기 위해 .babelrc 파일을 수정하자.

```json
{
  "presets": ["latest"],
  "plugins": [
    "transform-es3-property-literals",
    "transform-es3-member-expression-literals"
  ]
}
```

여기까지 완료하면 IE8까지 ES6의 문법을 그대로 쓸 수 있다.  

## 바벨은 안전한가?  
아래와 같은 ES6 코드를 보자. 
 
```javascript
console.log(a); // Uncaught ReferenceError: a is not defined
const a = 2;
```

변수 a가 선언 되기도 전에 사용을 하고 있고, [TDZ](/2016/11/10/ES6-Scope/#TDZ)에 존재하는 a는 사용할 수 없는 예제이다.  
하지만 위 코드를 ES5로 트랜스파일하면 아래와 같다.

```javascript
"use strict";  
console.log(a); // undefined
var a = 2;
```

var의 호이스팅 때문에 ES6와는 다른 값이 나오게 된다.  
이러한 점 말고도 더 있는지 모르겠지만 바벨이 ES5 전부를 커버할 수 있는 건 아니다.  
이는 바벨이 꼬지기 때문이 아니라 ES6와 ES5 사이의 언어의 설계에 대한 차이 때문에  
일어나는 어쩔 수 없는 현상이다.  
실제 배포하는 파일은 ES5 파일이기 때문에 바벨이 존재한다 하더라도 ES5까지 알아둬야  
개발하는데 훨씬 수월할 것이다.  
따라서 ES5와 ES6를 병행하여 공부하는 게 현명한 방법이 아닐까 싶다.  
또한 팀원들이 ES6, npm 등등에 대한 지식이 없다면 학습하는 비용까지 포함하면  
지금 당장은 실무에 적용하기엔 무리가 있을 것이다.  
하지만 다같이 스터디를 하고, 추후에 있을 프로젝트에서 사용한다고 가정했을 때  
생산성이 향상되는 효과를 볼 수 있지 않을까 싶다.