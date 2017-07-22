---
title: (Webpack 2) 코드를 분할해보자!
date: 2017-03-13 00:32:22
category: [Programming, Node.js]
tags: [npm, Node.js, Webpack2, babel, ES2015, ES6]
---

## 들어가기에 앞서
웹팩 2, 웹팩 1, 바벨, 리액트 등등에 대해서 기본적인 부분은 설명하지 않는다.  
또한 [(Webpack 2) 트리 쉐이킹을 해보자!](/2017/03/12/webpack2-tree-shaking/)를 보고 나서 이 포스팅을 읽는 걸 추천한다.

## 코드를 왜 분할하지?
![](thumb.png)  
SPA(Single Page Application)은 한 번에 모든 리소스를 로딩해서  
초기 로딩 이후에 페이지 이동이 매우 빠르다는 장점을 가지고 있다.  
하지만 앱의 규모가 커지면 모든 리소스를 한 번에 로딩하므로  
`초기 로딩`이 느려져 사용자 이탈을 유발하는 양날의 검을 가지고 있다.  

## 1단계: 내 코드와 서드 파티(라이브러리/프레임워크) 코드를 분리해보자.
HTTP 1.1 프로토콜은 2개의 http 요청을 병렬로 수행하게 돼있지만,  
모던 브라우저는 4개의 http 요청을 병렬로 수행한다.  
아래 링크를 참조하자.  
[브라우저의 리소스 병렬 다운로드를 가로막는 자바스크립트 | 감성 프로그래밍](http://programmingsummaries.tistory.com/285)  
따라서 내 코드와 서드 파티 코드를 동시에 다운로드 받으면 더 빠른 로딩이 가능하다.  
따라서 내 코드(app)와 서드 파티 코드(vendor)를 하나의 bundle.js에서 분리시키는 단계가 필요하다.  
리액트 대신에 다른 서드 파티로 진행해도 무방하다.

일단 프로젝트를 생성하자.  
```bash
npm init --y
npm i -S react react-dom
npm i -D babel-core babel-preset-env babel-preset-react babel-loader webapck
```

`소스 코드는 src 폴더를 만들어 그 안에서 관리하도록 하겠다.`  
엔트리의 진입점인 main.js를 만들자.
```javascript
import React from 'react';
import {render} from 'react-dom';

render(
  <h2>히히헤헤</h2>,
  document.getElementById('app')
);
```

webpack.config.js를 만들자.  
```javascript
const webpack = require('webpack');

module.exports = {
  entry: {
    app: './src/main.js',
    // 아래와 같이 수동적으로 서드 파티들을 다 추가해줘야한다.
    // 장점으로는 자기가 빼고 싶은 서드 파티만 지정할 수 있다는 점이다.
    // 자신의 앱과 벤더의 크기를 균형있게 맞출 수가 있다.
    vendor: ['react', 'react-dom']
  },
  output: {
    // entry에 존재하는 app.js, vendor.js로 뽑혀 나온다.
    filename: '[name].js',
    path: './dist/',
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false, // 터미널 창에 출력되는 게 보기 귀찮아서 추가.
        unused: true // tree shaking
      }
    }),

    // 로더들에게 옵션을 넣어주는 플러그인이다.
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),

    // app.js에 들어갈만한 내용을 vendor로 빼주는 플러그인
    new webpack.optimize.CommonsChunkPlugin({
      // 위에 vendor와 통일시켜줘야한다.
      name: 'vendor'
    }),
    
    // 브라우저의 콘솔 창에 리액트를 프로덕션 모드로 빌드하라는 오류가 뜨는데 그걸 없애주는 플러그인
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              "env",
                {
                  browsers: ['last 2 versions', '> 10%', 'ie 9'],
                  // tree shaking
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

// 로더 개발자를 위한 로그 제거
process.noDeprecation = true;
```

위와 같이 해줘도 되는데 일일이 서드 파티를 적기 귀찮은 사람은 아래와 같이 하면 된다.  
```javascript
const webpack = require('webpack');

module.exports = {
  entry: {
    app: './src/main.js',
  },
  output: {
    // entry에 존재하는 app.js,
    // new webpack.optimize.CommonsChunkPlugin의 name 값인 vendor.js로 뽑혀 나온다.
    filename: '[name].js',
    path: './dist/',
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false, // 터미널 창에 출력되는 게 보기 귀찮아서 추가.
        unused: true // tree shaking
      }
    }),

    // 로더들에게 옵션을 넣어주는 플러그인이다.
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),

    // app.js에 들어갈만한 내용을 vendor로 빼주는 플러그인
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      // 아래 부분이 핵심
      minChunks: function (module) {
        // this assumes your vendor imports exist in the node_modules directory
        return module.context && module.context.indexOf('node_modules') !== -1;
      }
    }),
    
    // 브라우저의 콘솔 창에 프로덕션 모드로 빌드하라는 오류가 뜨는데 그걸 없애주는 플러그인
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              "env",
                {
                  browsers: ['last 2 versions', '> 10%', 'ie 9'],
                  // tree shaking
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

// 로더 개발자를 위한 로그 제거
process.noDeprecation = true;
```

빌드를 할 때 마다 dist 폴더를 제거해야하므로 npm 스크립트를 이용하자.  
packge.json의 scripts 부분을 다음과 같이 수정하자.  
```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "build": "rm -rf dist && ./node_modules/webpack/bin/webpack.js"
}
```
rm -rf는 유닉스 기반 명령어이기 때문에 Mac OS, Linux, Unix 등등에서만 쓸 수 있다.  
윈도우에서는 아마 아래와 같이 하면 될 거다. (될런지는 모르겠다.)  
```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "build": "rmdir dist /s && ./node_modules/webpack/bin/webpack.js"
}
```

그리고 터미널에 아래와 같이 치면 npm script를 쓸 수 있다.  
test, build, start만 아래와 같이 칠 수 있고 나머지는
npm run scriptName과 같이 입력해야한다.
```bash
npm build
```

![](01.png)  
결과를 보면 벤더로 서드파티가 다 빠져서 파일 크기가 더 큰 걸 볼 수 있다.  
아마 우리가 작성한 앱은 아직 규모가 작기 때문일 것이다.

그리고 index.html을 만들어 테스트 해보자.  
vendor 보다 app이 더 먼저 삽입되면 오류가 난다.  
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body>
<div id="app"></div>
<script src="./vendor.js"></script>
<script src="./app.js"></script>
</body>
</html>
```

## 라우터의 코드를 분할해보자!
모든 사용자가 우리 앱의 모든 페이지를 돌아다니지 않는다.  
하지만 app.js에는 우리 앱의 모든 페이지 코드가 담겨있다.  
라우터를 통해 구분했던 페이지대로 코드를 분할시켜보자!  

### hash vs chunkhash
* hash가 뭐지??
기본적으로 브라우저에는 임시 파일, 캐시 데이터라고 불리는 임시 저장공간이 존재한다.  
이 임시 저장공간은 자신의 하드 공간의 일부에 해당한다.  
브라우저 속성에서 찾아보면 나올 것이다.  
만약 파일에 대한 요청이 있으면 처음에는 웹서버에서 다운 받고 임시 저장공간에 저장한다.  
하지만 동일한 요청이 또 오면 웹서버를 거치지 않고 하드에 있는 임시 저장공간에서 뒤져서  
해당 파일을 응답해줘서 더 빠른 응답을 하기 위한 기법이다.  
하지만 파일의 내용이 바뀌었는데도 임시 저장 공간에 있는 내용을 내려줘서  
변경된 파일이 보이지 않아 당황한 적이 많을 것이다.  
이렇게 파일이 변경 됐음에도 반영되지 않는 걸 방지하고자  
파일 이름에 hash라는 걸 붙이는 방법이다.  
hash는 복잡한데 그냥 `암호화된 문자`라고 대충 생각하면 될 것 같다.  
하지만 파일이 변경되지 않았을 때도 계속해서 다른 해쉬를 생성해서  
캐시 데이터의 장점을 전혀 이용할 수가 없다.  
이래서 나온 게 chunkhash다.  
* chunkhash 짱짱맨!  
chunkhash는 해당 파일이 변경 됐을 때만 파일에 hash를 바꿔서 저장하는 것이다.  
즉 파일이 바뀌지 않았으면 똑같은 파일 이름에 대한 요청이므로 캐시 데이터를 쓰고,  
파일이 바뀌었으면 다른 해쉬가 파일 이름에 들어가 웹서버에 새로 요청해서  
수정된 내용을 즉각적으로 볼 수 있는 것이다.  
그렇담 chunk는??  
나도 잘 모르는데 그냥 페이지 별로 소스를 나눈 게 청크인 것으로 안다.  

hash의 사용법은 어렵지 않으므로 chunkhash만 설명하겠다.  
일단 chunkhash를 테스트하기 위해 리액트 라우터를 설치하자.  
또한 HTML5의 History API(리액트 라우터의 browserHistory)를 사용하기 위해  
node.js의 http 모듈을 사용해서 서버를 띄워보자.  
쌩으로 코딩하면 번거로우니까 express 모듈을 사용하도록 하자.
react-router v4는 너무 변경사항이 많아서 일단은 3 버전을 토대로 설명한다.  
```bash
npm i -S react-router@^3.x
npm i -D express
```
라우터를 테스트 하기 위해 두 개의 컴포넌트를 만들자.  
일단은 Comp.js
```javascript
import React from 'react';
import Link from 'react-router/es/Link';

const Comp = () => (
  <div>
    <h2><Link to="aa/bb/cc">하이</Link></h2>
  </div>
);
```

Comp2.js도 만들자.
```javascript
import React from 'react';
import Link from 'react-router/es/Link';

const Comp2 = () => (
  <div>
    <h2><Link to="/">바이</Link></h2>
  </div>
);

export default Comp2;
```

엔트리의 진입점인 main.js도 수정하자.  
청크의 코드를 분할하는 방법에는 세 가지가 있다.  
1. System.import  
[System.import is deprecated](https://webpack.js.org/guides/code-splitting-import/#system-import-is-deprecated)  
deprecated 되었다. 쓰지 말자.  
2. import(module)  
[Dynamic import](https://webpack.js.org/guides/code-splitting-import/)  
귀찮다.  
바벨 플러그인(babel-plugin-syntax-dynamic-import)을 설치하고 설정해줘야 한다.  
청크의 이름을 지정할 수 없다.  
하지만 오류가 났을 때 catch()를 써서 처리 할 수 있다는데,  
뭐 그렇게 처리할만한 상황이 얼마나 있을까 싶다.  
3. require.ensure  
다른 거 설치 안 해도 되고, 청크의 이름을 지정할 수 있다.  
이 포스팅에서는 3번을 통해 청크 스플리팅을 해보겠다.  
```javascript
import React from 'react';
import {render} from 'react-dom';
import  Router  from 'react-router/es/Router';
import  Route  from 'react-router/es/Route';
import  browserHistory  from 'react-router/es/browserHistory';

render(
  // HTML5의 History API를 쓰기 위해 hashHistory 대신에 browserHistory를 사용하였다.
  <Router history={browserHistory}>
    // component 대신에 getComponent를 사용하는 점을 주목하자.
    <Route path="/" getComponent={(location, callback) => {
      // 아래 코드 부분이 핵심이다.
      // [] 부분 안에 디펜던시가 들어간다는데 언제 쓰게 되는지는 잘 모르겠다.
      require.ensure([], (require) => {
        callback(null, require('./Comp').default);
        // 두 번째 인자로 청크의 이름이 들어간다.
      }, 'Comp');
    }} />
    <Route path="/aa/bb/cc" getComponent={(location, callback) => {
      require.ensure([], (require) => {
        callback(null, require('./Comp2').default);
      }, 'Comp2');
    }} />
  </Router>,
  document.getElementById('app')
);
```

이번엔 index.html를 수정하자.  
어떤 청크해쉬가 들어갈지 모르므로 script 태그를 빼버렸다.  
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body>
<div id="app"></div>
</body>
</html>
```

이제 webpack.config.js를 수정해보자.  
```javascript
const webpack = require('webpack');

module.exports = {
  entry: {
    app: './src/main.js',
  },
  output: {
    // 요 놈은 저 위에 엔트리의 app에 대한 내용
    filename: '[name].[chunkhash].js',
    // 요 놈은 페이지 별 청크에 대한 내용
    chunkFilename: '[name].[chunkhash].js',
    path: `./dist`,
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false, // 콘솔 창에 출력되는 게 보기 귀찮아서 추가.
        unused: true // tree shaking
      }
    }),

    // 로더들에게 옵션을 넣어주는 플러그인이다.
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),

    // app.js에 들어갈만한 내용을 vendor로 빼주는 플러그인
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module) {
        // this assumes your vendor imports exist in the node_modules directory
        return module.context && module.context.indexOf('node_modules') !== -1;
      },
      // 요 놈은 vendor에 대한 내용
      fileName: '[name].[chunkhash]'
    }),

    // 브라우저의 콘솔 창에 프로덕션 모드로 빌드하라는 오류가 뜨는데 그걸 없애주는 플러그인
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              "env",
              {
                browsers: ['last 2 versions', '> 10%', 'ie 9'],
                // tree shaking
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

// 로더 개발자를 위한 로그 제거
process.noDeprecation = true;
```

이제 빌드를 해보자
```bash
npm build
```

![](02.png)  
빌드된 파일을 보면 두 가지 문제점이 존재한다.  
1. 뒤에 해쉬 값을 예측할 수가 없다.  
2. html 파일이 dist에 복사되지 않는다.  

이럴 때 필요한 것은 html-webpack-plugin!  
설치하자.  
```bash
npm i -D html-webpack-plugin
```

webpack.config.js를 수정하자.  
```javascript
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    app: './src/main.js',
  },
  output: {
    // 요 놈은 저 위에 엔트리의 app에 대한 내용
    filename: '[name].[chunkhash].js',
    // 요 놈은 페이지 별 청크에 대한 내용
    chunkFilename: '[name].[chunkhash].js',
    path: './dist',
    // HTML5의 History API를 쓰다보면 라우터가
    // http://localhost/aa/bb/cc 와 같이 뎁스가 깊어지는데
    // 그럴 때 js 파일은 localhost를 기준으로 잡아야하므로
    // 루트를 기준으로 잡아준 것이다.
    publicPath: '/'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false, // 콘솔 창에 출력되는 게 보기 귀찮아서 추가.
        unused: true // tree shaking
      }
    }),

    // 로더들에게 옵션을 넣어주는 플러그인이다.
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),

    // app.js에 들어갈만한 내용을 vendor로 빼주는 플러그인
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module) {
        // this assumes your vendor imports exist in the node_modules directory
        return module.context && module.context.indexOf('node_modules') !== -1;
      },
      // 요 놈은 vendor에 대한 내용
      fileName: '[name].[chunkhash]'
    }),

    // 브라우저의 콘솔 창에 프로덕션 모드로 빌드하라는 오류가 뜨는데 그걸 없애주는 플러그인
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),

    // htmlWebpackPlugin을 쓰면 html 파일 복사 및 js, css inject를 할 수 있다.
    // 물론 minify도 가능하다.
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              "env",
              {
                browsers: ['last 2 versions', '> 10%', 'ie 9'],
                // tree shaking
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

// 로더 개발자를 위한 로그 제거
process.noDeprecation = true;
```

이제 빌드를 해보자.  
```bash
npm build
```

dist 디렉토리를 보면 index.html이 생성되있고, 소스 코드를 봐보자.
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body>
<div id="app"></div>
<script type="text/javascript" src="/vendor.916f26b9c3a11d8f3204.js"></script><script type="text/javascript" src="/app.f11205f23697a92f4153.js"></script></body>
</html>
```
해쉬가 정상적으로 붙어서 들어갔고, vendor가 먼저 들어갔고, 다른 페이지 청크는 들어가지 않았다.  
또한 루트 디렉토리를 뜻하는 /도 정상적으로 들어가있다.  
HTML5의 History API를 확인해보려면 실제 서버를 띄워야하므로 서버 코드를 작성해보자.  
server.js를 프로젝트의 최상위 디렉토리에 만들자.  
```javascript
const express = require('express');
const app = express();

// 루트 디렉토리(/)로 오면 dist 디렉토리에 있는 index.html을 불러옴.
// 서버 라우터일 거다. 아마도...
app.use('/', express.static(__dirname + `/dist`));

// 8080 포트로 서버 오픈
app.listen(8080, () => {
  console.log('Express listening on port', 8080);
});

// 클라이언트 라우터(일거다... 아마도...)인 react-router의 HTML5 History API를 사용하기 위함.
// http 메소드 중에 get을 사용해서 모든 라우터(*)로 접근할 경우에(요청할 경우에)
app.get('*', (req, res) => {
  // 요청(request)에 대한 응답(response)으로 dist 디렉토리의 index.html을 돌려준다.  
  // __dirname은 노드 js의 전역 변수인데 현재 디렉토리(풀 디렉토리, 절대 경로)를 반환하는 변수이다.
  res.sendFile(__dirname + '/dist/index.html');
});
```

터미널에서 이제 노드 서버를 켜보자.  
```bash
node server
```

브라우저에서 실제로 테스트 해보자.
http://localhost:8080으로 접속한 결과다.
![Comp 컴포넌트](03.png)  
크롬 개발자 도구의 네트워크 탭을 보면 Comp.[chunkhash]만 있고 Comp2는 로드하지 않았다.  
하이 라는 링크를 클릭하면 http://localhost:8080/aa/bb/cc로 이동한다.  
여기서 다시 네트워크 탭을 봐보자.  
![Comp2 컴포넌트](04.png)  
페이지를 처음부터 로딩하는 게 아니라 새로운 부분인  
Comp2.[chunkhash] 부분만 로딩한 것을 볼 수 있다.  
여기서 새로고침을 해보자.  
![Comp2 컴포넌트](05.png)  
역시 Comp2.[chunkhash]만 로드하고 Comp는 로드하지 않았다.  
바이 라는 링크를 클릭하면 http://localhost:8080/으로 이동한다.  
![Comp 컴포넌트](06.png)  
역시 페이지를 처음부터 로딩하는 게 아니라 새로운 부분인
Comp.[chunkhash] 부분만 로딩한 것을 볼 수 있다.  

조금이나마 최적화에 한 단계 다가간 것 같아 뿌듯하다.  
끝 !!

## 참조링크
* [웹팩2로 청크 관리 및 코드 스플리팅 하기](https://www.zerocho.com/category/Javascript/post/58ad4c9d1136440018ba44e7)  
* [브라우저의 리소스 병렬 다운로드를 가로막는 자바스크립트 | 감성 프로그래밍](http://programmingsummaries.tistory.com/285)  
* [Code Splitting - Libraries](https://webpack.js.org/guides/code-splitting-libraries/)  
* [A beginner’s step-by-step guide to Code Splitting with Webpack 2 and React Router](https://brotzky.co/blog/code-splitting-react-router-webpack-2/)  
등등...