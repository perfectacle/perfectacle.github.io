---
title: (Webpack 2) 트리 쉐이킹을 해보자!
date: 2017-03-12 19:32:22
category: [Front-end, Webpack]
tags: [npm, Node.js, Webpack2, babel, ES2015, ES6]
---
## 들어가기에 앞서
여기선 기본적으로 웹팩 1, 바벨, ES2015(ES6)을 알고 있다는 전제로 진행한다.  
리액트 대신에 다른 서드 파티(라이브러리/프레임워크) 가지고 테스트하면서 이 글을 봐도 된다.  
또한 이 글을 보고 나서 [(Webpack 2) 코드를 분할해보자!](/2017/03/13/webpack2-code-splitting/)도 보는 걸 추천한다.

## 트리 쉐이킹(Tree Shaking)??
![나무를 흔들어 썩은 과일(필요없는 놈)을 떨어트리자!](thumb.png)  
트리 쉐이킹이란 나무를 흔들어서 필요없는 걸 떨어트리는 행위를 말한다.  
여기서 우리에게 필요없는 것이란 쓰지 않는 코드를 뜻한다.  

## 우리의 코드를 트리 쉐이킹 해보자
기존 웹팩 1에서 번들링이 어떻게 이루어졌는지 보자.  

우선 모듈을 하나 만들어보자. (module.js)
```javascript
export const a = 123123123123;
export const b = 45645646456;
```

그리고 이 모듈을 불러다 쓰는 우리의 앱을 만들자. (app.js)
```javascript
import {a} from './module';
console.log(a);
```

하지만 번들링을 해보면 아래와 같이 쓰지도 않은 b가 들어가있는 반쪽짜리 모듈화가 된 셈이다.  
아마 이게 ES2015의 Native Import가 아닌 CommonJS 스타일?인 것으로 알고 있다.
```javascript
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _moduleA = __webpack_require__(1);

	console.log(_moduleA.a);

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var a = exports.a = 123123123123;
	var b = exports.b = 45645646456;

/***/ }
/******/ ]);
```

하지만 웹팩 2에서는 이런 ES2015 Native Import를 지원함으로써  
쓸 데 없는 녀석(const b)을 나무에서 떨어트리는 트리 쉐이킹이 가능해진 것이다.  
바로 알아보자!  

일단 프로젝트를 하나 만들고 웹팩을 설치해보자.  
```bash
npm init --y
npm i -D webpack
```

위에 적어놓은 app.js와 module.js를 똑같이 만들자.  
그리고 webpack.config.js를 만들어서 아래와 같이 만들어주자.  
바벨 없이 import/export를 쓸 수 있는 건 혁명이다!!  
```javascript
module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js',
    path: `./`
  }
};
```

그리고 터미널에서 아래와 같이 번들링을 해보자.  
```bash
./node_modules/webpack/bin/webpack.js
```

하지만 번들링된 녀석을 보면 여전히 b가 남아있다.  
```javascript
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const a = 123123123123;
/* harmony export (immutable) */ __webpack_exports__["a"] = a;

const b = 45645646456;
/* unused harmony export b */


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__module__ = __webpack_require__(0);

console.log(__WEBPACK_IMPORTED_MODULE_0__module__["a"]);

/***/ })
/******/ ]);
```

트리 쉐이킹을 위해선 웹팩 2의 플러그인인 [UglifyJS2](https://github.com/mishoo/UglifyJS2)를 이용하면 된다.  
이제 webpack.config.js를 수정해주자.  
```javascript
const webpack = require('webpack');

module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js',
    path: `./`,
  },
  
  // 여기부터 추가된 내용
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      // 사실 아래와 같이만 써도 트리 쉐이킹이 된다.
      // compress: true
      
      compress: {
        // warnings: false, // 콘솔 창에 출력되는 게 보기 귀찮다면 요 놈을 주석 제거하면 된다.
        unused: true // 요 놈이 핵심
      },
      mangle: false,    // DEMO ONLY: Don't change variable names.(난독화)
      beautify: true,   // DEMO ONLY: Preserve whitespace (가독성 좋게 함)
      output: {
        comments: true  // DEMO ONLY: Helpful comments (주석 삭제 안 함)
      }
    })
  ]
};
```
그리고 다시 아래와 같이 터미널에서 번들링을 해주자.  
```bash
./node_modules/webpack/bin/webpack.js
```
그럼 아래와 같은 로그가 터미널에 뜬다.  
```bash
WARNING in bundle.js from UglifyJs
Collapsing constant a [bundle.js:75,60]
Dropping unused variable b [bundle.js:77,6]
```

`Dropping unused variable b [bundle.js:77,6]`  
위 부분이 핵심이다.
다시 번들링 된 코드를 보면 깔끔하게 b가 제거된 것을 볼 수 있다.

```javascript
/* 0 */
/***/
function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    /* harmony export (immutable) */
    __webpack_exports__.a = 123123123123;
}
```

## 서드파티(라이브러리/프레임워크)를 트리 쉐이킹 해보자
`이 챕터는 다소 문제가 많다.`  
서드파티마다 모듈화 한 방식이 제각각이라 트리 쉐이킹 하는 방법이 다양하고,  
나도 처음 접하다 보니 모든 서드 파티를 테스트 할 수가 없어서 대표적으로  
react-router(4는 너무 변경 사항이 많아서 3) 요 놈만 건드려보았다.  

react-router를 사용하기 위해 react를 설치해야 하고,  
react를 사용하려면 react-dom도 설치해야하고,  
또한 react를 쓰기 위해선 babel-preset-react를 설치해야하는데,  
babel-preset-react를 쓰기 위해선 babel-core도 설치해야하고,  
webpack에서 bable을 사용하기 위해선 bable-loader도 설치해야 하고,  
uglifyJS2가 ES2015를 완벽하게 지원하지 않아서  
babel-preset-2015(여기선 babel-preset-env)를 설치해야한다.  
위에 절차가 복잡하므로 이해하지 말고 그냥 설치해버리자.  
```bash
npm i -S react react-dom react-router@^3.x
npm i -D babel-core babel-preset-env babel-preset-react babel-loader
```

index.html 파일을 만들자.  
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
</head>
<body>
<div id="app"></div>
<script src="./bundle.js"></script>
</body>
</html>
```

라우팅 할 컴포넌트 Comp.js를 하나 만들자.  
```javascript
import React from 'react';

const Comp = () => <h2>하이</h2>;

export default Comp;
```

그리고 app.js를 다음과 같이 수정해보자.  
```javascript
import React from 'react/lib/React';
import {render} from 'react-dom/lib/ReactDOM'; 
import {Router, Route, hashHistory} from 'react-router';

import Comp from './Comp';

render(
  <Router history={hashHistory}>
    <Route path="/" component={Comp} />
  </Router>,
  document.getElementById('app')
);
```

webpack.config.json에 바벨 로더를 붙이자.  
```javascript
const webpack = require('webpack');

module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js',
    path: `./`,
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      // 사실 아래와 같이만 써도 트리 쉐이킹이 된다.
      // compress: true

      compress: {
        // warnings: false, // 콘솔 창에 출력되는 게 보기 귀찮다면 요 놈을 주석 제거를 하면 된다.
        unused: true // 요 놈이 핵심
      },
      mangle: false,    // DEMO ONLY: Don't change variable names.(난독화)
      beautify: true,   // DEMO ONLY: Preserve whitespace (가독성 좋게 함)
      output: {
        comments: true  // DEMO ONLY: Helpful comments (주석 삭제 안 함)
      }
    }),

    // 여기서부터 추가된 내용.
    // 로더들에게 옵션을 넣어주는 플러그인이다.
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
  ],
  module: {
    // 웹팩 1에서는 loaders를 썼지만 2에선 rules
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // 쿼리가 필요한 로더는 loader로 써줘야함.
        // 쿼리가 필요 없는 로더는 use로 써도 된다.
        // 웹팩 2에선 babel-loader와 같이 -loader 생략이 불가능해졌다.
        loader: 'babel-loader',
        // babel-loader?머시기와 같은 쿼리나 query: 옵션 대신에
        // 웹팩 2에선 options: 로 바뀜.
        // .babelrc로 따로 빼줘도 상관 없다.
        options: {
          presets: [
            [
              "env",
              {
                browsers: ['last 2 versions', '> 10%', 'ie 9'],
                // babel-preset-2015에서는 Native Module을 쓰지 않는 것인지
                // 아래 옵션을 주지 않으면 우리가 만든 코드(ES2015의 import/export Syntax)가
                // 트리 쉐이킹 되질 않는다.
                "modules": false
              }
            ],
            "react"
          ]
        }
      }
    ]
  }
};

// DeprecationWarning: loaderUtils.parseQuery() received a non-string value which can be problematic, see https://github.com/webpack/loader-utils/issues/56
// parseQuery() will be replaced with getOptions() in the next major version of loader-utils.
// 위와 같이 로더 개발자를 위한 로그가 뜨는데 보기 싫다면 주석을 제거하면 된다.
// process.noDeprecation = true;
```

이제 번들링 된 파일을 보면 우리가 import 시키지도 않은 browserHistory가 들어있다.
```javascript
/* 211 */
/***/
function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_history_lib_createBrowserHistory__ = __webpack_require__(129), __WEBPACK_IMPORTED_MODULE_0_history_lib_createBrowserHistory___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_history_lib_createBrowserHistory__), __WEBPACK_IMPORTED_MODULE_1__createRouterHistory__ = __webpack_require__(103);
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__createRouterHistory__.a)(__WEBPACK_IMPORTED_MODULE_0_history_lib_createBrowserHistory___default.a);
}
```

이렇듯 서드 파티들은 트리 쉐이킹이 제대로 되지 않는다.  
아마 서드파티 제작자들도 우리가 쓴 ES2015의 import/export 문법을 썼지만 배포할 때는  
babel-preset-2015의 Native가 아닌 모듈로 트랜스파일 된 놈이 배포되기 때문에 그런 게 아닐까 싶다.
따라서 아래와 같이 별개의 모듈일 일일이 불러오는 번거로운 작업을 해줘야한다.  
```javascript
import React from 'react/lib/React';
import {render} from 'react-dom/lib/ReactDOM';
import Router from 'react-router/es/Router';
import Route from 'react-router/es/Route';
import hashHistory from 'react-router/es/hashHistory';

import Comp from './Comp';

render(
  <Router history={hashHistory}>
    <Route path="/" component={Comp} />
  </Router>,
  document.getElementById('app')
);
```

다른 서드 파티들은 바로 import 시켜도 트리 쉐이킹 되는 애들도 있을 것이지만,  
대부분의 서드 파티가 업데이트 되기 전까지는 저렇게 일일이 import 시켜줘야하는 번거로움이 있다.  

## 참조 링크
* [웹팩2(Webpack) 설정하기](https://www.zerocho.com/category/Javascript/post/58aa916d745ca90018e5301d)  
* [Webpack 2 Tree Shaking Configuration](http://moduscreate.com/webpack-2-tree-shaking-configuration/)  
* [Webpack2 Guides](https://webpack.js.org/guides/)  
* [UglifyJS2](https://github.com/mishoo/UglifyJS2)  
등등 너무 많아서 증발함...

`혹시 틀린 내용이 있다면 무한 태클 환영입니다 ~`