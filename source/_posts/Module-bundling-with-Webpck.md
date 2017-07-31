---
title: (Webpack) 모듈? 번들링?
date: 2016-11-18 01:38:50
category: [Programming, Front-end, Webpack]
tags: [Cross Browsing, npm, Node.js, Webpack]
---
![](thumb.png)  

## 목차
1. [들어가기에 앞서](#들어가기에-앞서)
2. [모듈, 너는 누구니?](#모듈-너는-누구니)
3. [웹팩을 사용해보자](#웹팩을-사용해보자)
4. [웹팩에게 모듈이란...?](#웹팩에게-모듈이란…)
5. [개발용? 배포용?](#바벨은-안전한가)
6. [부트스트랩, 폰트어썸, 제이쿼리, 이미지 모듈을 사용해보자.](#부트스트랩-폰트어썸-제이쿼리-이미지-모듈을-사용해보자)
7. [홈페이지, IE8에서도 웹팩을 써보자.](#홈페이지-IE8에서도-웹팩을-써보자)
8. [마치며...](#마치며…) 
 
## 들어가기에 앞서  
아주 많이 참조한 링크  
[웹팩입문자를 위한 튜토리얼 파트1 - 웹팩 입문 !](https://github.com/AriaFallah/WebpackTutorial/tree/master/ko-arahansa/part1)

이 포스트에서는 **Node.js**, **npm**, **ES(ECMAScript)**, **[Babel](/2016/11/11/Babel-ES6-with-IE8/)** 등등에 대해서는 설명하지 않는다.  
해당 내용들은 구글링을 통해 직접 찾아보길 바란다.

이번 포스트에서는 모듈이 왜 필요한지, 무엇인지, 번들링이란 무엇인지 등등에 대해 다룬다.  
또한 홈페이지나 SPA가 여러 개 있는 다중 페이지, IE8에서도 모듈 번들링을 하는 방법까지 다뤄보자.

## 모듈, 너는 누구니?  
ES5(3)를 공부해본 사람이라면 자바스크립트의 스코프 관리는 지저분하다는 것을 알 수 있다.  
이를 해결하고자 아래와 같은 방법들이 있다.  
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
// 네임스페이스 패턴이라고 부른다.
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
// 이 방법이 베스트인데, 크롬마저도 미지원이다.
// script.js
let color = 'blue';
export const getColor = () => color;
export const setColor = (_color) => color = _color;
```

```javascript
// ES6 (현재 지원하는 브라우저 없음)
// 이 방법이 베스트인데, 크롬마저도 미지원이다.
// script2.js
import {getColor, setColor} from './script';
console.log(getColor());
setColor('red');
console.log(getColor());
```

이렇 듯 모듈은 변수의 스코프를 관리하는 기능을 한다.  
물론 이게 모듈의 전부는 아니지만, 그건 이 포스트의 주제를 벗어나므로 설명하지 않겠다.  
브라우저에서 ES6의 모듈이 지원되지는 않지만 모듈을 사용하는 두 가지 방법이 존재한다.

1. 자바스크립트 파일/모듈 로더인 requireJS를 사용.
2. 모듈 번들러인 Webpack이나 Browserify 등등을 사용.

이 중에서 나는 2번의 Webpack을 택했다.  
참고로 번들러는 번들링하는 놈을 지칭하고,  
번들링은 여러가지 파일을 모아서 하나로 만드는 것이라고 보면 된다.  
여러 모듈을 하나로 합쳐서 http 리퀘스트 횟수를 줄여서  
퍼포먼스를 향상시키는 등등의 효과를 불러일으킬 수 있다.

## 웹팩을 사용해보자  
터미널 창에서 아래와 같이 입력해보자.  
```
$ npm i -g webpack
$ npm i -D webpack babel-core babel-preset-latest babel-loader
```

위 명령어들을 하나 하나 헤짚어 보자.

1. npm i -g webpack  
터미널에서 webpack 명령어를 사용하기 위해 글로벌로 웹팩을 설치
2. npm i -D webpack  
현재 프로젝트에서 웹팩을 사용하기 위해 설치
3. babel-core  
requireJS 문법을 이용해도 모듈 번들링을 할 수 있지만,  
ES6의 import, export를 사용해보기 위해 babel을 사용하였다.
4. babel-preset-latest  
babel에는 plugin이라는 게 존재한다.  
이 plugin은 es6의 애로우 펑션을 지원하는 플러그인, 클래스를 지원하는 플러그인 등등이 있다.  
그러한 플러그인을 모아놓은 걸 preset이라고 부른다.  
es2015 preset은 es6의 플러그인들을 모아놓은 것이고,  
latest preset은 ES2015~ES2017까지의 프리셋들을 모아놓은 것이다.  
시간이 지나면 latest의 지원 프리셋 범위는 더 늘어날 수도 있다.
5. babel-loader  
웹팩과 바벨을 연동해서 사용하기 위한 로더.

이제는 아래와 같이 디렉토리를 구성해보자.

1. .babelrc
2. entry-index.js
3. index.html
4. module-a.js
5. module-b.js
6. module-c.js
7. webpack.config.js

```html
<!-- index.html -->
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>Title</title>
</head>
<body>
<script src="./bundle.js"></script>
</body>
</html>
```

ES6의 import와 export 문은 이 포스트에서 다루지 않겠다.   
```javascript
// module-a.js
const a = '나는 a';
export const ab = a + ', a를 외부에 노출시키지 않고 변수 a를 활용!';
```
```javascript
// module-b.js
export const a = '모듈 a에 존재하는 변수 a와는 다른 스코프를 가짐';
```
```javascript
// module-c.js
export const b = '나도 써주랑!';
```
```javascript
// entry-index.js
import {ab} from './module-a';
import {a} from './module-b';
import {b} from './module-c';  
console.log(ab); // "나는 a, a를 외부에 노출시키지 않고 변수 a를 활용!"
console.log(a); // "모듈 a에 존재하는 변수 a와는 다른 스코프를 가짐"
```

.babelrc 파일은 바벨의 설정 파일이다.  
아래와 같이 써주자.
```json
{
  "presets": ["latest"]
}
```

webpack.config.js 파일은 웹팩의 기본 설정 파일이다.  
아래와 같이 써주자.  
``` javascript
const webpack = require('webpack');  
module.exports = {
  devtool: 'source-map',
  entry: './entry-index.js',
  output: {
    filename: "bundle.js",
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /(node_modules|bower_components)/
    }]
  }
};
```

설정 파일을 하나씩 파헤쳐보자.

1. devtool
소스맵과 디버깅을 요긴하게 하기 위한 옵션이다.  
자세한 건 [devtool 옵션 퍼포먼스](/2016/11/14/Webpack-devtool-option-Performance/)를 참고하자.
2. entry  
[JavaScript 모듈화 도구, webpack](http://d2.naver.com/helloworld/0239818)에서는 아래와 같이 말하고 있다.
<blockquote>
![](01.png)  
서로 의존 관계에 있는 다양한 모듈을 사용하는 시작점이 되는 파일이다.
</blockquote>
[Webpack 적용기 2 : 어떻게 사용하는가?](https://hjlog.me/post/118)에서는 다음과 같이 설명하고 있다.  
> 번들링의 진입점에 해당하는 entry point에서부터 require으로 명시된 의존성들을 해석하며 의존성 트리(dependency tree)를 그린다.

3. output  
결과물이 어느 폴더, 어떤 파일명으로 저장될지 정하는 옵션이다.

4. plugins  
js 난독화 플러그인, 번들 파일을 html에 자동으로 삽입해주는 플러그인 등등 종류가 많다.

5. UglifyJsPlugin  
js 난독화 플러그인

6. modules  
파일들에 영향을 주는 옵션들

7. loaders  
[Webpack 적용기 2 : 어떻게 사용하는가?](https://hjlog.me/post/118)에서는 다음과 같이 설명하고 있다.
> 이 때 require된 모듈들은 불러들어지는 과정에서 파이프라이닝 된  
일련의 로더 들을 거치게 된다.  
**로더**를 하나의 정해진 **역할을 수행**하는, 일종의 **함수**라고 생각할 수 있다.  
로더는 직전 단계의 모듈을 입력으로 받아,  
다양한 변형을 가한 뒤 다음 로더의 입력으로 넘겨준다.  
마지막 로더는 최종적으로 적절하게 변형된 모듈을  
번들 자바스크립트 파일에 넣어주게 된다.

그럼 실제로 번들링을 해보자.  
```
$ webpack -w
```

위 명령어를 실행하면 모듈들이 번들링되며 엔트리 포인트와 엔트리 포인트에 관련된 모듈들이  
변경될 때마다 다시 번들링되는 감시(watch)를 진행하게 된다.  
Ctrl+C 키를 누르면 빠져나올 수 있다.

그리고나서 다시 디렉토리를 보면 다음과 같은 파일이 생긴 것을 볼 수 있다.

1. bundle.js
2. bundle.js.map

한번 index.html 파일을 열어보고 콘솔창을 보자.  
![index.html은 bundle.js만 로드했지만 bundle.js.map이 원본 파일 정보를 들고 있어서 어떠한 파일에서 오류가 났는지 쉽게 알 수 있다.](02.png)  
디버깅하여 모듈은 어떠한 스코프를 가지는지 알아보자.  
![모듈은 로컬 스코프에 별도의 객체를 만들어 스코프를 관리한다.](03.png)  
6번 라인에 브레이크 포인트를 걸고 새로고침을 해보았다.  
module-c는 import 시켰지만 모듈의 변수를 사용하지 않았으므로  
불필요하게 스코프를 생성하지 않았다.

만약 모듈화가 브라우저 자체 내에서 지원된다면  
index.html은 아래와 같이 마크업해야하지 않을까 싶다.  
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>Title</title>
</head>
<body>
<script type="module" src="./module-a.js"></script>
<script type="module" src="./module-b.js"></script>
<script type="module" src="./module-c.js"></script>
<script src="./entry-index.js"></script>
</body>
</html>
```

웹팩의 모듈 번들링 방식은 bundle.js 파일 하나만 요청해서 리퀘스트 횟수가 1회였는데,  
저렇게 의존하는 모듈이 많으면 많을 수록 리퀘스트 횟수가 증가하여 큰 비용을 지불하게 될 것이다.  
위와 같이 웹팩을 사용하면 큰 효과를 얻어낼 수 있다.

## 웹팩에게 모듈이란...?  
ES6의 관점에서 모듈과 웹팩의 관점에서 모듈은 다르다.  
ES6는 js 파일만 모듈이라고 한정하는데 반해 웹팩은 이미지, css 파일 등등도 모듈로 취급한다.  
js 모듈을 import 시키는 것은 따로 로더를 요구하지 않지만,  
다른 모듈들은 로더를 필요로 한다.  
다음 예제를 통해 css, scss 모듈을 import 시켜보자.  
또한 번들링 된 모듈(bundle.js)을 자동으로 추가시켜보자.  
위 디렉토리에서 아래 파일들을 추가하자.

1. style.css
2. style.scss

```css
/* style.css */
p {
  user-select: none
}
```
```scss
/* style.scss */
$color: red;
h1 {
  color: $color
}
```

그리고 index.html을 아래와 같이 수정해주자.  
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>Title</title>
</head>
<body>
<h1>나는 문서의 제목이얌! 내가 짱이지!</h1>
<p>IE11+에서 나는 드래그 안 될 걸?!</p>
</body>
</html>
```

이제 entry-index.js에 (s)css 모듈을 추가해보자.
```javascript
import '../styles/style.css';
import '../styles/style.scss';  
import {ab} from './module-a';
import {a} from './module-b';
import {b} from './module-c';  
console.log(ab); // "나는 a, a를 외부에 노출시키지 않고 변수 a를 활용!"
console.log(a); // "모듈 a에 존재하는 변수 a와는 다른 스코프를 가짐"
```

그리고 관련 로더들을 설치해보자.  
```
$ npm i -D html-webpack-plugin style-loader css-loader node-sass sass-loader postcss-loader autoprefixer
```

하나씩 까보자.

1. html-webpack-plugin  
html에 번들링 된 bundle.js 파일을 넣어주는 역할을 한다.
 
2. style-loader css-loader  
css 모듈을 import 시키기 위한 로더이다.
  
3. node-sass sass-loader  
scss 모듈을 import 시키기 위한 로더이다.  

4. postcss-loader autoprefixer  
(s)css 파일 등등에 벤더 프리픽스를 자동으로 붙이는 로더이다.

webpack.config.js는 아래와 같이 고쳐보자.  
```javascript
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');  
module.exports = {
  devtool: 'source-map',
  entry: './entry-index.js',
  output: {
    filename: "bundle.js",
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: './index2.html'
    })
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions', '> 10%', 'ie 9']
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /(node_modules|bower_components)/
    }, {
      test: /\.css$/,
      loaders: ['style', 'css?sourceMap', 'postcss-loader']
    }, {
      test: /\.scss$/,
      loaders: ['style', 'css?sourceMap', 'sass?sourceMap', 'postcss-loader']
    }]
  }
};
```

추가된 옵션들을 하나씩 살펴보자.

1. html webpack plugin  
html에 번들링 한 파일을 자동으로 삽입해준다.  
tmplate에 ejs 등등의 html 템플릿 엔진으로 작성한 걸 넣어주고,  
filename에 그 템플릿을 토대로 새롭게 만들어질 html 파일을 지정해주면 된다.  
자세한 내용은 [플러그인 api](https://github.com/ampedandwired/html-webpack-plugin)를 참조하길 바란다.

2. postcss  
스타일 시트에 벤더 프리픽스를 지정하기 위해 추가하였다.  
사용하고자 하는 쿼리는 [Browserslist](https://github.com/ai/browserslist)에서 확인 가능하고,  
쿼리문 테스트는 [browserl.ist](http://browserl.ist/)에서 확인 가능하며,  
데모는 [Autoprefixer CSS online](http://autoprefixer.github.io/)에서 가능하다.

3. css-loader, sass-loader  
test에는 정규표현식이 들어가고, 로더의 순서는 바뀌면 오류가 난다.  
아마 오른쪽에서부터 왼쪽으로 적용이 되는 게 아닐까 싶다.  
또한 소스맵 옵션을 제거하면 아래와 같이 난독화된 소스를 보게돼 디버깅하기가 쉽지 않다.  
![스타일의 규모가 크다고 가정하면 생각만해도 끔찍하다](04.png)

## 개발용? 배포용?  
뭔가 이제 그럴듯 하게 보이긴 하지만 현재 프로젝트 디렉토리를 보자.

1. node_modules - 패키지들이 설치된 폴더로 개발할 때 수정할 일이 없는 파일.
2. .babelrc - 바벨의 설정파일로서 개발할 때 수정할 일이 없는 파일.
3. bundle.js - 개발할 때는 필요없는 배포용 파일
4. bundle.js.map - 실제 사용자가 디버깅 할 필요는 없으므로 이 파일도 개발용 파일.
5. entry-index.js - 개발용 파일
6. index.html - 템플릿이 되는 파일이므로 개발용 파일
7. index2.html - 템플릿을 토대로 만들어진 배포용 파일
8. module-a.js - bundle.js에 번들링된 내용이므로 실제 배포할 때 필요없는 개발용 파일
9. module-b.js - bundle.js에 번들링된 내용이므로 실제 배포할 때 필요없는 개발용 파일
10. module-c.js - bundle.js에 번들링된 내용이므로 실제 배포할 때 필요없는 개발용 파일
11. package.json - 패키지들의 의존성을 도와주는 파일로서 바벨의 설정파일로서 개발할 때 수정할 일이 없는 파일.
12. style.css - bundle.js에 번들링된 내용이므로 실제 배포할 때 필요없는 개발용 파일
13. styles.css - bundle.js에 번들링된 내용이므로 실제 배포할 때 필요없는 개발용 파일
14. webpack.config.js - 번들을 하기 위한 설정 파일이므로 개발할 때 수정할 일이 없는 파일.

개발용 파일과 배포용 파일이 너무 난잡하게 섞여있다.  
이는 나중에 개발 & 배포를 할 때 상당한 혼란을 초래한다.

또한 스타일 시트를 bundle.js 안에 번들링하면 아래와 같은 현상이 발생한다.  
![새로고침을 하면 일시적으로 스타일이 적용되지 않은 모습이 보인다.](05.gif)  
위 현상은 스타일 시트의 규모가 커질 수록 스타일이 적용되지 않은 모습이 노출되는 시간이 길어진다.  
이를 해결하고자 css 파일에 소스맵을 안 붙여서 내부 스타일 시트로 배포하는 수가 있지만,  
bundle.js의 몸뚱아리만 키워 로딩속도를 저하시키는 요인이 되기도 한다.  
http 리퀘스트 횟수를 줄이라고는 하지만 기본적으로 http 리퀘스트는 4개의 병렬로 처리된다.  
따라서 몸뚱아리만 큰 bundle.js를 로딩시키는 것보다  
css 파일을 따로 빼서 bundle.js와 병렬로 로딩시키게끔 처리하는 게 훨씬 효율적이다.

그럼 개발용 파일과 배포용 파일을 분리해 보자!  
우선 디렉토리를 아래와 같이 바꾼다.  
```
+ node_modules
+ src
  - index.html
  + scripts
    - entry-index.js
    - module-a.js
    - module-b.js
    - module-c.js
  + styles
    - style.css
    - style.scss
.babelrc
package.json
webpack.config.dev.js
webpack.config.prod.js
```

우선 개발과 상관없는 설정 파일들은 루트 디렉토리로 빼버렸다.  
그리고 개발에 집중하고자 개발용 파일들을 src 폴더에 체계적으로 분류하였다.  
또한 웹팩의 설정 파일을 개발용과 배포용으로 나눴는데 이유는 다음과 같다.

* 개발용 파일은 디버깅이 주 목적이라 소스맵이 필요하다.
또한 난독화시키는 것은 번들링 타임을 증가시키는 주범이므로 뺀다.
그리고 HTML 파일을 핫리로드하게 만들어야 한다.
<blockquote>
핫리로드란 서버의 재시작 없이 내용이 재교체되는 것을 뜻한다.
또한 브라우저에서 자동으로 새로고침이 이루어진다.
</blockquote>
그리고 스타일 시트를 외부로 빼면 HMR을 이용할 수 없으므로 따로 빼지 않는다.
> HMR(Hot Module Replacement)이란 서버의 재시작 없이,
브라우저가 새로고침하지 않고, 수정된 부분만 바꾸는 것을 의미한다.
 
* 배포용 파일은 실 사용이 주 목적이라 용량을 경량화 시킬 난독화 작업이 진행되고,  
디버깅 할 필요가 없으므로 소스맵도 붙이지 않고,  
또한 HTML 파일은 핫리로드하게 만들 필요가 없고,  
HMR을 사용할 필요가 없으므로 스타일 시트를 외부로 뺀다.

이를 위해서 추가로 패키지를 설치할 필요가 있다.  
```
$ npm i -g webpack-dev-server
$ npm i -D webpack-dev-server raw-loader webpack-browser-plugin extract-text-webpack-plugin webpack-strip clean-webpack-plugin
```

1. webpack-dev-server  
-g로 설치하는 이유는 해당 명령어를 터미널에서 쓰기 위함이고  
다시 한 번 -D로 설치하는 이유는 현재 프로젝트에서 해당 패키지를 쓰기 위함이다.  
webpack-dev-server는 실제 눈에 보이지 않는 디렉토리를 만들고 그 디렉토리에  
번들링을 진행하고 watch하며 테스트를 하는 웹팩 개발용 서버이다.

2. raw-loader는 html 파일을 핫리로드하게 만드는 로더이다.  

3. webpack-browser-plugin  
webpack-dev-server에서 번들링을 끝낸 후 자동으로 브라우저를 열어주는 플러그인이다.  
자세한 옵션은 [webpack-browser-plugin](https://www.npmjs.com/package/webpack-browser-plugin)을 확인하자.

4. extract-text-webpack-plugin  
스타일 시트를 따로 빼기 위한 플러그인이다.

5. webpack-strip  
js 파일에서 디버깅을 위해 찍어본 로그를 삭제해준다. 
 
6. clean-webpack-plugin  
배포용 파일을 빌드하기 전에 배포용 디렉토리를 지워주는 플러그인이다.


이제 webpack.config.dev.js 부터 수정해보자.  
```javascript
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const WebpackBrowserPlugin = require('webpack-browser-plugin');

module.exports = {
  devtool: 'cheap-eval-source-map',
  entry: [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/dev-server',
    './src/scripts/entry-index.js'
  ],
  output: {
    publicPath: 'http://127.0.0.1:8080/',
    filename: 'scripts/bundle.js',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new WebpackBrowserPlugin()
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions', '> 10%', 'ie 9']
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /(node_modules|bower_components)/
    }, {
      test: /\.css$/,
      loaders: ['style', 'css?sourceMap,-minimize', 'postcss-loader']
    }, {
      test: /\.scss$/,
      loaders: ['style', 'css?sourceMap,-minimize', 'sass?sourceMap,outputStyle=expanded', 'postcss-loader']
    }, {
      test: /\.html$/,
      loader: 'raw-loader'
    }]
  },
  devServer: {
    hot: true
  }
};
```

추가된 속성들을 하나씩 살펴보자.

1. entry  
두 개의 새로운 엔트리포인트가 서버와 브라우저에 접속하여 HMR을 허용한다.
 
2. publicPath  
자세히는 모르겠지만 저렇게 설정해주지 않으면, 이미지나 폰트가 제대로 붙지 않음.

3. new webpack.HotModuleReplacementPlugin()  
HMR을 사용하기 위한 플러그인

4. new WebpackBrowserPlugin()  
번들링이 끝나면 자동으로 브라우저를 열어줌.

5. css?sourceMap,-minimize, sass?sourceMap,outputStyle=expanded  
(s)css 파일을 압축시키지 않으면서 소스맵을 붙이고자 할 때 씀.

6. raw-loader  
HTML을 핫리로드하게 만드는 로더.

7. devServer  
hot은 HMR의 활성화 여부이다.

이제는 배포용 설정 파일인 webpack.config.prod.js를 아래와 같이 바꿔보자.  
```javascript
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
  
module.exports = {
  entry: './src/scripts/entry-index.js',
  output: {
    path: './dist',
    filename: 'scripts/bundle.js',
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
      },
      xhtml: true
    }),
    new ExtractTextPlugin('styles/bundle.css')
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions', '> 10%', 'ie 9']
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel', 'webpack-strip?strip[]=debug,strip[]=console.log,strip[]=console.dir'],
      exclude: /(node_modules|bower_components)/
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style', 'css!postcss-loader')
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('style', 'css!sass!postcss-loader')
    }]
  }
};
```

추가된 속성들을 하나씩 살펴보자.

1. new CleanWebpackPlugin(['dist'])  
빌드를 시작하기 전에 먼저 배포용 디렉토리를 지워줘야한다.

2. new webpack.DefinePlugin()  
*process.env.NODE_ENV*는 개발환경인지 배포환경인지 알고자 할 때 쓰인다.  
production이면 배포 모드, development이면 개발환경이다.  
이는 HTML을 핫리로드하게 만들지 안 만들지를 결정하기 위해 썼다.

3. new webpack.optimize.OccurrenceOrderPlugin()
> 모듈을 할당하고 발생 카운트 아이디들을 발생(?chunk)시킨다.  
ID들은 종종 적은(짧은) id들을 얻는데 사용된다.  
이것은 id가 예상가능하며 파일 전체 크기를 경감시켜 추천한다.

4. new HtmlWebpackPlugin({ minify: {}})  
[html 난독화 옵션](https://github.com/kangax/html-minifier#options-quick-reference)을 참고하자.

5. new ExtractTextPlugin('styles/bundle.css')  
번들링한 스타일 시트 파일을 어디에다 추출할지 정해주는 플러그인.

6. 'webpack-strip?strip[]=debug,strip[]=console.log,strip[]=console.dir'  
webpack-strip 로더를 사용하여 디버깅을 위해 로그에 찍었던 로그를 삭제했다.

7. ExtractTextPlugin.extract()  
해당 스타일 시트를 css파일로 뽑아내는 로더이다.

또한 html을 핫리로드하게 만들어주려면 엔트리에 html 모듈을 추가해야한다.  
하지만 배포용에서는 핫리로드하게 만들어줄 필요가 없기 때에 조건문을 쓰면 된다.  
```javascript
// entry-index.js
if (process.env.NODE_ENV !== 'production') {
  require('../index.html')
}

import '../styles/style.css';
import '../styles/style.scss'; 
 
import {ab} from './module-a';
import {a} from './module-b';
import {b} from './module-c'; 
 
console.log(ab);
console.log(a);
```

웹팩의 설정 파일의 기본적인 이름은 webpack.config.js이다.  
그래서 webpack 이라는 명령어만 붙여도 자동으로 webpack.config.js 파일을 인식했는데,  
우리는 임의로 설정 파일의 이름을 바꿨기 때문에 달리 진행해야한다.  

개발을 진행하기 위해서는 터미널에 아래와 같이 입력을 해야한다.
```
$ webpack-dev-server -d --config webpack.config.dev.js
```

배포를 진행하기 위해서는 아래와 같이 입력을 해야한다.
```
$ webpack --config webpack.config.prod.js
```

하지만 위와 같은 작업은 매우 귀찮다.  
npm의 스크립트를 이용해보자.  
우선 package.json에서 scripts 부분을 아래와 같이 수정해준다.
```json
"scripts": {
  "dev": "webpack-dev-server -d --config webpack.config.dev.js",
  "build": "webpack --config webpack.config.prod.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

이제는 개발을 진행하고자 할 때는 아래와 같이 입력해주면 된다.
```
$ npm run dev
```

배포를 진행하고자 할 때는 아래과 같이 입력해주면 된다.
```
$ npm run build
```

우선 개발용 서버로 진입해서 살펴보자.  
![http://localhost:8080/ 으로 접속해보자.](06.png)
js 파일에서 스타일을 렌더링하는 코드가 있기 때문에 js파일을 전부 로드한 이후에  
스타일 시트가 적용돼서 초반에 스타일 시트가 적용되지 않은 모습이 잠깐 보이게 된다.  
또한 html 파일에 넣지 않았던 번들링된 파일과 스타일 시트가 들어가있다.

그럼 style.scss 파일을 고쳐보자.
```scss
$color: red;
/*gg*/
h1 {
  color: $color
}
```

![크롬의 네트워크탭을 보면 처음부터 리퀘스트를 때리는 게 아니라 필요한 부분만 때린다.](07.gif)  
위와 같이 새로고침 없이 필요한 부분만 갱신하는 게 HMR이다.

그럼 index.html 파일을 고쳐보자.
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>Title</title>
</head>
<body>
<h1>댓글을 달아주시면 짱짱맨</h1>
<p>IE11+에서 나는 드래그 안 될 걸?!</p>
</body>
</html>
```
![크롬의 네트워크탭을 보면 처음부터 리퀘스트를 때린다.](07.gif)  
이는 js 파일도 마찬가지인데, js 파일과 html 파일은 핫모듈이 아니기 때문에 핫리로드를 하는 것이다.

그럼 이제 실제 배포를 진행해보자.  
빌드를 하고 나서 배포용 디렉토리를 살펴보자.
```
+ dist
  + scripts
    - bundle.js
  + styles
    - bundle.css
  - index.html
```

각각의 파일을 열어보면 파일이 1줄로 압축돼있어서 용량을 최소화하여  
트래픽을 줄이고 로딩 속도를 높여 퍼포먼스를 향상시켰다.

이제 index.html 파일을 브라우저에서 열어보자.
![우리가 html 소스 코드에 넣지 않았던 css 파일과 js 파일이 들어있다.](09.png)  
![우리가 테스트 용도로 넣었던 로그가 지워져있다.](10.png)

실제로 웹팩으로 모듈 번들링을 할 때는 이렇게 개발용과 배포용으로 나누어서 진행하고,  
개발용 서버로 개발하다 개발을 완료하면  
빌드를 해서 배포용 디렉토리 안의 파일만 실서버에 올리면 된다.

## 부트스트랩, 폰트어썸, 제이쿼리, 이미지 모듈을 사용해보자.
우선 위 모듈들을 설치해야한다.
```
$ npm i -S jquery bootstrap font-awesome
$ npm i -D url-loader file-loader
```

font-awesome은 폰트를 쓰는 대표적인 라이브러리이다.  
웹팩에서는 폰트와 이미지도 하나의 모듈로 보고, 그러한 모듈을 사용하기 위해서는  
url-loader와 file-loader가 필요한 것이다.

이를 위해서는 개발용, 배포용 설정 파일의 모듈 로더에 다음과 같은 걸 추가해줘야한다.
```javascript
{
  test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
  loader: 'url?limit=10000&mimetype=application/font-woff&name=fonts/[name].[ext]'
}, {
  test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
  loader: 'file?name=fonts/[name].[ext]'
}, {
  test: /\.(jp(e)g|gif|png)?$/,
  loader: 'file?name=img/[name].[ext]'
}
```
폰트와 이미지는 로더를 통해야만 정상적으로 작업이 가능하고,  
name 파라미터를 통해 저장될 디렉토리와 이름을 정했다.

추가적으로 extract-text-webpack-plugin의 버그 때문에 배포용 설정에서  
(s)css 로더 부분을 수정해주자.
```javaxcript
{
  test: /\.css$/,
  loader: ExtractTextPlugin.extract('style', 'css!postcss-loader', {publicPath: '../'}),
}, {
  test: /\.scss$/,
  loader: ExtractTextPlugin.extract('style', 'css!sass!postcss-loader', {publicPath: '../'})
}
```
번들된 css 파일에서 url()과 같은 경로가 꼬이길래 강제로 경로를 지정해준 것이다.


그리고 src 디렉토리 내에 img 폴더를 만들고 임의의 이미지를 넣는다.  
그 후에 src/index.html을 다음과 같이 수정하자.  
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>Title</title>
</head>
<body>
<h1>댓글을 달아주시면 짱짱맨</h1>
<p>IE11+에서 나는 드래그 안 될 걸?!</p>
<span></span>
<button id="btn" class="btn btn-warning"><i class="fa fa-address-book" aria-hidden="true"></i></button>
<img src="./img/logo.png" alt="로고" />
</body>
</html>
```

부트스트랩과 폰트 어썸을 썼다.

src/styles/style.scss는 아래와 같이 수정해주자.
```scss
$color: blue;
$square: 90px;

h1 {
  color: $color
}
span {
  display: inline-block;
  background-image: url('../img/logo.png');
  width: $square;
  height: $square;
}
```

실제로 라이브러리&프레임워크를 써보자.  
src/scripts/entry-index.js를 수정하자.
```javascript
if (process.env.NODE_ENV !== 'production') {
  require('../index.html')
}

import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import $ from 'jquery';

import '../styles/style.css';
import '../styles/style.scss';

import {ab} from './module-a';
import {a} from './module-b';
import {b} from './module-c';

console.log(ab);
console.log(a);

$('#btn').click(function() {
  alert('a');
});
```

제이쿼리, 부트스트랩, 폰트 어썸을 import 시켰고,  
btn 아이디를 가진 엘리먼트를 클릭하면 경고창이 뜨게 제이쿼리를 사용하였다.

이제 $ npm run dev를 치고 실제 개발용 서버에서 보자.  
![제이쿼리, 부트스트랩, 폰트어썸 모두 동작을 잘 한다.](11.png)  
버튼을 누르면 경고창도 뜨고, (s)css와 js의 소스맵 모두 잘 붙는다.

이제 $ npm run build를 치고 실제 배포용 파일을 보자.  
![확장자 별로 잘 분리가 되었다.](12.png)

index.html을 브라우저에 띄워보자.  
![아주 잘 나온다.](13.png)  
디버깅 용 로그도 사라졌고, 디버깅 할 필요가 없으니 소스맵도 안 붙였다.

기본적인 외부 모듈들 사용방법은 이러하고,  
자신이 필요한 건 그때 그때 사용법을 익히면 된다.

## 홈페이지, IE8에서도 웹팩을 써보자.

기본적으로 홈페이지와 SPA 사이에는 차이점을 모듈화 관점에서 바라보자.  
홈페이지는...

1. 페이지가 여러 개다.
2. 각 페이지 별로 적용되는 모듈들이 다르다.
3. IE8을 지원해야하는 경우가 많다.

우리가 예제로 작업한 페이지는 하나였다.

그럼 다중 페이지에서 모듈화를 진행하고자 할 때를 가정하고 실습을 진행하자.  
우선 디렉토리를 아래와 같이 만든다.
```
+ node_modules
+ src
  + img
    - 임의의 이미지 파일
  + scripts
    - entry-index.js
    - entry-sub.js
    - module-a.js
    - module-b.js
    - module-c.js
  + styles
    - style.css
    - style.scss
    - sub.css
    - sub.scss
  - index.html
  - sub.html
- .babelrc
- package.json
- webpack.config.dev.js
- webpack.config.prod.js
```

새로 추가된 파일의 소스는 아래와 같이 바꾸자.
```javascript
// entry-sub.js
if (process.env.NODE_ENV !== 'production') {
  require('../sub.html')
}

import '../styles/sub.css';
import '../styles/sub.scss';

import {b} from './module-c';

const btn = document.getElementById('btn');
btn.addEventListener('click', function() {
  alert(b);
});
```

```css
/* sub.css */
button {
  width: 500px
}
```

```scss
/* sub.scss */
$bgColor: orange;
$boxSize: 500px;

button {
  background-color: $bgColor
}

section {
  width: $boxSize;
  height: $boxSize + 100px;
  background-color: $bgColor
}
```

```html
<!-- sub.html -->
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>Title</title>
</head>
<body>
<section>IE8에서도 제대로 보이나?</section>
<button id="btn">내가 바로 버튼이다.</button>
</body>
</html>
```

이제 개발용 파일을 수정해보자.
```javascript
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const WebpackBrowserPlugin = require('webpack-browser-plugin');
const dev = [
  'webpack-dev-server/client?http://localhost:8080',
  'webpack/hot/dev-server'
];

module.exports = {
  devtool: 'cheap-eval-source-map',
  entry: {
    index: [
      dev[0], dev[1],
      './src/scripts/entry-index.js'
    ],
    sub: [
      dev[0], dev[1],
      './src/scripts/entry-sub.js'
    ]
  },
  output: {
    publicPath: 'http://127.0.0.1:8080/',
    filename: 'scripts/[name].bundle.js',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunks: ['index']
    }),
    new HtmlWebpackPlugin({
      template: './src/sub.html',
      filename: 'sub.html',
      chunks: ['sub']
    }),
    new WebpackBrowserPlugin()
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions', '> 10%', 'ie 9']
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /(node_modules|bower_components)/
    }, {
      test: /\.css$/,
      loaders: ['style', 'css?sourceMap,-minimize', 'postcss-loader']
    }, {
      test: /\.scss$/,
      loaders: ['style', 'css?sourceMap,-minimize', 'sass?sourceMap,outputStyle=expanded', 'postcss-loader']
    }, {
      test: /\.html$/,
      loader: 'raw'
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url?limit=10000&mimetype=application/font-woff&name=fonts/[name].[ext]'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file?name=fonts/[name].[ext]'
    }, {
      test: /\.(jp(e)g|gif|png)?$/,
      loader: 'file?name=img/[name].[ext]'
    }]
  },
  devServer: {
    hot: true
  }
};
```

1. entry  
entry를 객체로 만들어서 객체 프로퍼티들이 엔트리가 되게 된다.  
각 엔트리별로 webpack-dev-server 설정들을 붙여야해서 배열화 시켜서 넣었다.

2. filename  
[name]에는 엔트리의 이름이 들어간다.

3. new HtmlWebpackPlugin()  
각 엔트리별로 모듈을 각각 삽입해줘야한다.  
filename은 기본이 index.html이라 생략을 했고,  
chunks에는 원하는 엔트리들을 넣으면 된다.

이번엔 배포용 설정 파일을 수정하자.
```javascript
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    index: './src/scripts/entry-index.js',
    sub: './src/scripts/entry-sub.js'
  },
  output: {
    path: './dist',
    filename: 'scripts/[name].bundle.js',
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunks: ['index'],
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
      },
      xhtml: true
    }),
    new HtmlWebpackPlugin({
      template: './src/sub.html',
      filename: 'sub.html',
      chunks: ['sub'],
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
      },
      xhtml: true
    }),
    new ExtractTextPlugin('style/[name].bundle.css')
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions', '> 10%', 'ie 9']
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel', 'webpack-strip?strip[]=debug,strip[]=console.log,strip[]=console.dir'],
      exclude: /(node_modules|bower_components)/
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style', 'css!postcss-loader', {publicPath: '../'}),
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('style', 'css!sass!postcss-loader', {publicPath: '../'})
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url?limit=10000&mimetype=application/font-woff&name=fonts/[name].[ext]'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file?name=fonts/[name].[ext]'
    }, {
      test: /\.(jp(e)g|gif|png)?$/,
      loader: 'file?name=img/[name].[ext]'
    }]
  }
};
```

new ExtractTextPlugin()에서도 [name]은 각 엔트리 별 이름이 들어간다.

$ npm run dev 를 치고 한 번 확인해보자.  
![번들된 index 엔트리가 잘 붙었다.](14.png)

http://127.0.0.1/8080/sub.html 으로 접속해보자.  
![번들된 sub 엔트리가 잘 붙었다.](15.png)

$ npm run build 를 치고 배포용 파일을 확인해보자.  
![각 페이지 별로 쓸 모듈들이 번들링 된 파일들이 잘 뽑아졌다.](16.png)

하지만 IE8에서 결과를 확인하면 처참한 결과를 확인할 수 있다.  
![노답](17.png)

이를 위해서는

1. ES5 Polyfill 붙이기  
babel로 트랜스파일한 ES5 전용 폴리필인 babel-polyfill이 있고,  
이벤트 리스너 관련해서는 수동으로 추가해줘야한다.  
자세한 내용은 아래 링크를 참고하자.  
[(Babel) ES6를 IE8에서도 써보자](/2016/11/11/Babel-ES6-with-IE8/#ES5를-IE8에서도-지원하기)

2. HTML5 Sectioning Elements Polyfill 붙이기
HTML5는 다양한 API가 있어서 하나의 폴리필로는 커버가 힘들다.  
우선 내가 쓴 section 엘리먼트를 커버하기 위해 html5shiv를 쓰겠다.

3. CSS3 폴리필도 상당히 많으므로 본인이 원하는 걸 직접 찾아봐야한다.  
이는 이번 포스트에서 생략한다.

폴리필들을 설치하자.  
```
$ npm i -S html5shiv
$ npm i -D babel-plugin-transform-es3-property-literals babel-plugin-transform-es3-member-expression-literals
```

그리고 src/scripts 폴더 안에 eventListener.polyfill.js 파일을 만들자.
```javascript
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

src/scripts 폴더 안에 preRender.polyfill.js 파일을 만들자.  
이 파일에는 렌더링 되기 이전, head에 들어가야하는 폴리필,  
대표적인 게 html5, css3 폴리필 등등이 해당한다.
```javascript
import 'html5shiv';
```

폴리필을 적용하고자하는 엔트리와 html 파일을 수정해줘야한다.  
sub만 건드려보자.
```javascript
// entry-sub.js
if (process.env.NODE_ENV !== 'production') {
  require('../sub.html')
}

import './eventListener.polyfill';

import '../styles/sub.css';
import '../styles/sub.scss';

import {b} from './module-c';

const btn = document.getElementById('btn');
btn.addEventListener('click', function() {
  alert(b);
});
```
다른 코드가 오기 전에 폴리필을 먼저 import 시켜야한다.

```html
<!-- sub.html -->
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>Title</title>
  <script src="./scripts/preRender.polyfill.bundle.js"></script>
</head>
<body>
<section>IE8에서도 제대로 보이나?</section>
<button id="btn">내가 바로 버튼이다.</button>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js"></script>
</body>
</html>
```
head에 폴리필을 넣어줬다.  
현재는 존재하지 않지만 번들링을 통해 만들 예정이다.  
html webpack plugin이 head와 body 동시에 다른 파일 삽입이 불가능해서  
부득이하게 이러한 방법을 사용했다.  
또한 babel-polyfill을 minify하게 되면 IE8에서 오류가 나게 된다.  
따라서 부득이하게 cdn을 이용하였다.

.babelrc 설정도 바꿔주자.
```json
{
  "presets": ["latest"],
  "plugins": [
    "transform-es3-property-literals",
    "transform-es3-member-expression-literals"
  ]
}
```

이제 웹팩 설정들을 바꿔보자.  
우선 개발용 파일부터 손 보자.

```javascript
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const WebpackBrowserPlugin = require('webpack-browser-plugin');
const dev = 'webpack-dev-server/client?http://localhost:8080';

module.exports = {
  devtool: 'cheap-eval-source-map',
  entry: {
    index: [dev, './src/scripts/entry-index.js'],
    sub: [dev, './src/scripts/entry-sub.js'],
    ['preRender.polyfill']: './src/scripts/preRender.polyfill.js'
  },
  output: {
    publicPath: 'http://127.0.0.1:8080/',
    filename: 'scripts/[name].bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunks: ['index']
    }),
    new HtmlWebpackPlugin({
      template: './src/sub.html',
      filename: 'sub.html',
      chunks: ['sub']
    }),
    new WebpackBrowserPlugin()
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions', '> 10%', 'ie 9']
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /(node_modules|bower_components)/
    }, {
      test: /\.css$/,
      loaders: ['style', 'css?sourceMap,-minimize', 'postcss-loader']
    }, {
      test: /\.scss$/,
      loaders: ['style', 'css?sourceMap,-minimize', 'sass?sourceMap,outputStyle=expanded', 'postcss-loader']
    }, {
      test: /\.html$/,
      loader: 'raw'
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url?limit=10000&mimetype=application/font-woff&name=fonts/[name].[ext]'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file?name=fonts/[name].[ext]'
    }, {
      test: /\.(jp(e)g|gif|png)?$/,
      loader: 'file?name=img/[name].[ext]'
    }]
  }
};
```

1. 우선 IE8에서는 HMR을 못 쓴다.  
ES5 폴리필이 붙기 전에 HMR이 먼저 로딩돼서 오류가 난다.  
따라서 해당 내용을 빼버렸다.

2. preRender.polyfill을 번들링했다.

![콘솔 창에 오류가 나오는 게 찝찝하지만 잘 나온다.](18.png)

이번에는 배포용 설정 파일을 손대자.
```javascript
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    index: ['./src/scripts/entry-index.js'],
    sub: ['./src/scripts/entry-sub.js'],
    ['preRender.polyfill']: ['./src/scripts/preRender.polyfill.js']
  },
  output: {
    path: './dist',
    filename: 'scripts/[name].bundle.js',
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunks: ['index'],
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
      },
      xhtml: true
    }),
    new HtmlWebpackPlugin({
      template: './src/sub.html',
      filename: 'sub.html',
      chunks: ['sub'],
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
      },
      xhtml: true
    }),
    new ExtractTextPlugin('style/[name].bundle.css')
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions', '> 10%', 'ie 9']
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel', 'webpack-strip?strip[]=debug,strip[]=console.log,strip[]=console.dir'],
      exclude: /(node_modules|bower_components)/
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style', 'css!postcss-loader', {publicPath: '../'}),
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('style', 'css!sass!postcss-loader', {publicPath: '../'})
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url?limit=10000&mimetype=application/font-woff&name=fonts/[name].[ext]'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file?name=fonts/[name].[ext]'
    }, {
      test: /\.(jp(e)g|gif|png)?$/,
      loader: 'file?name=img/[name].[ext]'
    }]
  }
};
```
크게 바뀐 건 없고, 바뀐 사항은 위에서 다 설명하였다.

$ npm run build를 쳐서 빌드를 하고 dist/sub.html을 IE8에서 켜보자.  
![IE8에서도 잘 작동한다.](19.png)

## 마치며...
이번 글은 작성하는데 엄청난 시간이 걸렸다.  
또한 나의 지식이 매우 부족하여 구글링을 하여도 당췌 답이 안 나오는 게 태반이었고,  
지금 포스트를 쓰면서도 내가 맞게 쓰고 있는 건지도 모르겠다.  
방문자 분들께서 잘못된 부분을 지적해주시면 정말 감사할 것 같다.