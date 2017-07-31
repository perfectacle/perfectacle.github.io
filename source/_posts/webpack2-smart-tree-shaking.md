---
title: (Webpack 2) 트리 쉐이킹을 똑똑하게 해보자!
date: 2017-04-12 00:10:25
category: [Programming, Front-end, Webpack]
tags: [npm, Node.js, Webpack2, babel, ES2015, ES6]
---
![](thumb.png)

## 들어가기에 앞서
이 포스트는 [(Webpack 2) 트리 쉐이킹을 해보자!](/2017/03/12/webpack2-tree-shaking/)의 후속작이다.  
따라서 해당 포스트를 읽고 예제를 진행한 후에 보는 걸 추천한다.  
또한 내가 리액트 말고 할 줄 아는 게 별로 없어서 예제를 리액트로만 진행하다보니  
혹시 헷갈리면 다른 라이브러리로 진행해보길 바란다.  

## 복습
우리는 지난 포스트에서 리액트 라우터를 트리 쉐이킹하였다.  
아래와 같이 기존에 쓰던 방식대로 진행하면 쓰지도 않는 모듈들이 전부 번들링되는 참사가 발생한다.  
```javascript
import {Router, Route, hashHistory} from 'react-router';
```

티끌 모아 태산이라고 우리의 앱이 쓰지도 않는 모듈들로 눈덩이처럼 불어날지도 모른다.  
따라서 우리는 아래와 같이 해주었다.  
```javascript
import Router from 'react-router/es/Router';
import Route from 'react-router/es/Route';
import hashHistory from 'react-router/es/hashHistory';
```

매우 귀찮아보이지 않는가?  
패키지가 늘어나고, 불러올 모듈들이 증가하면 한 줄 한줄 일일이 입력해줘야한다.  

## 실습
그럼 이제 이를 어떻게 해결할지 간단한 예제를 만들자.  
프로젝트 폴더를 만들고 package.json 파일을 만들자.  
그리고 다음과 같은 패키지들을 설치해준다.  

```bash
npm i -S react react-dom react-router@^3.x
npm i -D babel-core babel-preset-env babel-preset-react babel-loader babel-plugin-transform-imports
```

`babel-plugin-transform-imports` 요 녀석이 바로 핵심이다.  

프로젝트 폴더에 .babelrc(바벨 설정 파일)을 만들어주자.
```json
{
  "presets": [
    [
      "env",
      {
        "browsers": ["last 2 versions", "> 10%", "ie 9"],
        "modules": false,
      }
    ],
    "react"
  ],
  "plugins": [
    ["transform-imports", {
      "react-router": {
        "transform": "react-router/es/${member}",
        "preventFullImport": true
      }
    }]
  ]
}
```

플러그인 부분에 내용에 주목하자.
```javascript
plugins: [
    // 배열의 첫 번째 요소로 배열(transform-imports 플러그인 정보를 담은)이 옴.
    // 그 배열 안에는 transform-imports 플러그인 임을 알려주는 요소가 첫 번째로 들어와있고,
    // 두 번째 요소로 객체가 들어오는데 이는 react-router 모듈에 대한 객체이다.
    // transform 프로퍼티에서 어떤 폴더를 기점으로 모듈들을 일일이 불러올지 기술했다고 보면 될 것 같다.
    // preventFullImport, 쓰지도 않는 녀석은 불러오지 않는 걸(트리 쉐이킹) true로 지정했다.
    ["transform-imports", {
      "react-router": {
        "transform": "react-router/es/${member}",
        "preventFullImport": true
      }
    }]
]
```

webpack.config.js(웹팩 설정 파일)도 만들어주자.
```javascript
const webpack = require('webpack');
module.exports = {
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: './',
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
    })
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
        use: 'babel-loader'
      }
    ]
  }
};
// DeprecationWarning: loaderUtils.parseQuery() received a non-string value which can be problematic, see https://github.com/webpack/loader-utils/issues/56
// parseQuery() will be replaced with getOptions() in the next major version of loader-utils.
// 위와 같이 로더 개발자를 위한 로그가 뜨는데 보기 싫다면 주석을 제거하면 된다.
// process.noDeprecation = true;
```

index.html도 만들어주자.  
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
</head>
<body>
<div id="app"></div>
<script src="./bundle.js"></script>
</body>
</html>
```

엔트리(index.js) 파일도 만들어주자.  
```javascript
import React from 'react';
import {render} from 'react-dom';
import {Router, Route, hashHistory} from 'react-router';

const Comp = () => <h2>하이</h2>;

render(
  <Router history={hashHistory}>
    <Route path="/" component={Comp} />
  </Router>,
  document.getElementById('app')
);
```

터미널을 키고 아래와 같이 타이핑해주자.  
```bash
./node_modules/webpack/bin/webpack.js
```

그리고나서 bundle.js 파일을 뒤져봐도 browserHistory에 대한 내용을 찾을 수 없다.  
즉, 모듈 별로 일일이 불러오지 않고도 트리 쉐이킹을 할 수 있게 된 것이다!  
물론 요렇게 해도 안 되는 녀석들도 있는 것 같다.  
아마 웹팩 2가 나오기 전에 만들어진 모듈이거나  
모듈 간에 의존성이 너무 높아서 하나만 불러와도 다른 모듈들까지 불러오지 않는 이상  
사용이 불가능한 모듈인 경우에 그런 것 같다.