---
title: rollup.js를 통해 모듈 번들링하기
date: 2017-12-10 17:32:52
category: [Front-end]
tags: [Rollup, CommonJS, ESModule, UMD]
---
![](/images/bundle-with-rollup/thumb.png)

이 글은 [Typescript + TSLint + Mocha + Chai + ts-node + NYC로 모던한 프론트 엔드 테스트 환경 구축하기](/2017/12/10/ts-node-mocha-chai)에서 이어지는 내용이며,  
이 글을 본 이후에 [travis-ci와 coveralls를 이용하여 좀 더 안전하게 협업하기](/2017/12/10/travis-ci-coveralls)를 보는 걸 추천드립니다.   
여러 주제를 다루다보니 깊게 다루지는 않고 각각이 무엇을 하는 것인지만 간단하게 설명과 예제를 곁들여 진행하고 있습니다.  
또한 예제 진행은 [IntelliJ](https://www.jetbrains.com/idea/)를 통해 진행했습니다.  
[WebStorm](https://www.jetbrains.com/webstorm/)으로 진행해도 상관 없고, [VS Code](https://code.visualstudio.com/)와 진행하면 더 짱짱맨일지도 모르겠습니다.  

각 단계 별 깃헙 저장소 브랜치를 제공하고 있고, 이 포스트의 최종 결과물은 [rollup-umd 브랜치](https://github.com/perfectacle/front-test-setting/tree/rollup-umd)에서 확인 가능합니다.  

## 모듈 번들러
typescript 컴파일러나, ES2015+ to ES5 트랜스파일러인 바벨의 경우에는 모듈 간의 의존관계를 알지 못한다.  
따라서 [Webpack](https://webpack.js.org/)이나 [Rollup](https://rollupjs.org/), [parcel](https://parceljs.org/)과 같은 모듈 번들러로 번들링해야한다.  

기존에 익숙했던 Webpack과 같은 모듈 번들러 대신에 Rollup을 사용한 이유는 [Webpack and Rollup: the same but different](https://medium.com/webpack/webpack-and-rollup-the-same-but-different-a41ad427058c)
이 글에서 `Use webpack for apps, and Rollup for libraries`이란 구문과 페이스북의 리액트가 rollup을 쓰고 있기 때문에 호기심이 생겨서  
예제로 만들어 볼 라이브러리를 말아보기 위해서 롤업을 선택해봤다.  

## 라이브러리 완성하기
전에는 util.ts 파일 하나만 있으니 의존 관계를 누가 봐도 알기 쉬웠다.  
따라서 이번에는 모듈 간의 의존 관계를 조금 복잡하게 해보자.  

src 폴더 안에 util2.ts 파일을 만들고 아래와 같이 만들어주자.  
```bash
touch src/util2.ts
```

```typescript
export const removedDigits = (numberContainsNotDigits: string): string => {
    return numberContainsNotDigits.replace(/[\d]/g, '');
};
```

해당 함수의 유닛테스트를 test/util2.spec.ts에 만들어주자.  
```bash
touch test/util2.spec.ts
```
```typescript
import {expect} from 'chai';
import {removedDigits} from '../src/util2';

describe('util2', () => {
    it('test removedDigits', () => {
        expect(removedDigits('010-123-3333')).to.be.equal('--');
        expect(removedDigits('93/05/30')).to.be.equal('//');
    });
});
```

그리고 해당 모듈들을 하나로 뭉친 진입점(entry point)로 src 폴더에 index.ts를 만들자.  
```bash
touch src/index.ts
```
```typescript
import {removedDigits} from './util2';
import {removedNotDigits} from './util';

export {
  removedDigits, removedNotDigits
};
```

그리고 index.ts는 테스트 커버리지에 포함시키지 않게 .nycrc 설정에 해당 내용을 추가해주자.  
```json
{
  "exclude": [
    "src/index.ts"
  ]
}
```

`npm test`를 때려서 테스트가 정상적으로 수행되는지 확인하자.

### Rollup
우선 설치부터 해보자.  
```bash
npm i -S rollup rollup-plugin-typescript2 rollup-plugin-tslint rollup-plugin-uglify
```

우리 라이브러리는 타입스크립트로 만들 거고, tslint도 쓸 거고, 코드의 양을 줄이기 위해 minify 및 변수 난독화 진행을 위해서 uglify까지 설치했다.  

#### package.json 세팅하기
package.json의 main과 name을 아래와 같이 바꾸고 빌드 스크립트를 추가하자.  
main은 require 혹은 import 했을 때 직접적으로 import 되는 파일이니 엔트리 포인트를 잘 정해놔야한다.  
또한 name은 npm에 올릴 생각이라면 npm repository에 올라간 라이브러리와 중복되면 안 된다.  
그냥 github repository에다가 올려놓고 설치하거나 로컬에 올려놓고 설치하려면 적당한 이름을 지으면 된다.  
```json
{
  "name": "utils",
  "main": "dist/index.js",
  "scripts": {
    "build": "npm test && rollup -c"
  }
}
```

테스트가 실패하면 빌드를 실행하지 않는다.  
만약 테스트를 돌리긴 하지만 테스트가 실패해도 빌드를 수행하고 싶은 경우에는 아래와 같이 빌드 스크립트를 구성하면 된다.
```json
{
  "scripts": {
    "build": "npm test; rollup -c"
  }
}
```

#### index.d.ts 만들기
우리의 라이브러리에 대한 타입 정의 파일을 만들어야한다.  
```bash
touch index.d.ts
```

```typescript
declare module 'utils' {
    /**
     * 숫자를 포함한 문자열에서 숫자를 제외한 문자를 제거하는 함수
     * @param numberContainsNotDigits 숫자 이외의 문자를 포함한 문자열
     * @return 숫자만 포함한 문자열
     */
    export function removedNotDigits(numberContainsNotDigits: string): string;

    /**
     * 숫자를 포함한 문자열에서 숫자만 제거하는 함수
     * @param numberContainsDigits 숫자를 포함한 문자열
     * @return 숫자만 제외한 문자열
     */
    export function removedDigits(numberContainsDigits: string): string;
}
```

만약 index.d.ts를 만들어두지 않는다면 아래와 같은 현상이 발생한다.  
![모듈에 대한 타입 정의를 찾을 수 없다.](/images/bundle-with-rollup/d-ts-01.png)

![모듈을 로드하고 . 찍었을 때 제대로 자동완성이 되지 않는다.](/images/bundle-with-rollup/d-ts-02.png)  

index.d.ts를 만들어두면 위 현상이 발생하지 않는다.
![모듈에 대한 타입 정의를 잘 찾을 수 있다.](/images/bundle-with-rollup/d-ts-03.png)  

![. 찍어도 자동완성이 잘 된다.](/images/bundle-with-rollup/d-ts-04.png)

하지만 index.d.ts를 추가하고 테스트해보면 `TypeError: Unable to require .d.ts file.` 오류가 발생하니 .nycrc를 아래와 같이 수정해줘야한다.  
```json
{
  "exclude": [
    "src/index.ts",
    "**/*.d.ts"
  ]
}
```

#### rollup.config.js 세팅하기
* CommonJS 스펙을 준수한 모듈로 번들링하는 경우  
대부분 Node.js에서만 쓸 용도의 라이브러리를 만들 때 이 경우에 해당한다.  
rollup.config.js 파일을 아래와 같이 적어주자.  
```javascript
import typescript from 'rollup-plugin-typescript2';
import tslint from 'rollup-plugin-tslint';
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  plugins: [
    typescript(),
    tslint()
  ]
}
```
`npm build` 때리면 빌드된 commonjs 모듈 파일이 dist/index.js에 나오게 된다.  

설치는 아래와 같이 하면 된다. (자신의 상황에 맞게 설치하면 된다.)  
```bash
npm i -S git://github.com/perfectacle/front-test-setting.git#rollup-cjs
```

사용은 아래와 같이 하면 된다.
```javascript
const {removedDigits, removedNotDigits} = require('utils');
console.log(removedDigits('93-05')); // -
```

* ES Module 스펙을 준수한 모듈로 번들링하는 경우  
import/export 모듈로 사용하기 위해서 사용하는데 대부분 웹팩과 같은 번들러를 사용할 때 많이 사용한다.  
rollup.config.js 파일을 아래와 같이 적어주자.
```javascript
import typescript from 'rollup-plugin-typescript2';
import tslint from 'rollup-plugin-tslint';
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: {
    file: pkg.main,
    format: 'es'
  },
  plugins: [
    typescript(),
    tslint()
  ]
}
```
`npm build` 때리면 빌드된 ES 모듈 파일이 dist/index.js에 나오게 된다.  

설치는 아래와 같이 하면 된다. (자신의 상황에 맞게 설치하면 된다.)  
```bash
npm i -S git://github.com/perfectacle/front-test-setting.git#rollup-esm
```

사용은 아래와 같이 하면 된다.
```javascript
import {removedDigits, removedNotDigits} from 'utils'
console.log(removedDigits('93-05')); // -
```

* 브라우저 전용으로 모듈을 번들링하는 경우
브라우저는 모든 리소스가 받아져있는 상태가 아니라서 좀 특수성을 가지기 때문에 CommonJS 스펙 모듈의 사용이 불가능하고,  
ES 모듈을 구현한 브라우저는 크롬 62+ 말고는 없는 것으로 알고 있다.  
따라서 브라우저를 지원하기 위해서는 아래와 같이 설정해야한다.  

우선 package.json에 main 프로퍼티를 수정해주자.  
```json
{
  "main": "dist/util.min.js"
}
```

롤업 설정은 아래와 같이 바꿔주자.
```javascript
import typescript from 'rollup-plugin-typescript2';
import tslint from 'rollup-plugin-tslint';
import uglify from 'rollup-plugin-uglify';
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: {
    file: pkg.main,
    format: 'iife'
  },
  // name으로 만든 이름이 전역에 생길 객체의 이름이니 필수이다.
  name: 'utils',
  plugins: [
    typescript(),
    tslint(),
    uglify()
  ]
}
```

설치는 아래와 같이 하면 된다. (자신의 상황에 맞게 설치하면 된다.)  
```bash
npm i -S git://github.com/perfectacle/front-test-setting.git#rollup-browser
```

그리고 html 파일에서 사용할 때는 아래와 같이 사용하면 된다.  
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
</head>
<body>
<!-- 요렇게 쓰면 번거로우니 대부분 CDN을 지원한다. -->
<script src="node_modules/utils/dist/util.min.js"></script>
<script>
  const {removedDigits, removedNotDigits} = utils;
  console.log(removedDigits('93-05')); // -
</script>
</body>
</html>
```

* 복합적인 상황
우리가 만드려는 라이브러리가 범용적으로 사용됐으면 하는 바람이라면 아래와 같이 설정을 하면 된다.  
우선 package.json에 browser 프로퍼티를 추가해주자.  
```json
{
  "main": "dist/index.js",
  "browser": "dist/util.min.js"
}
```

롤업 설정은 아래와 같이 해주자.  
```javascript
import typescript from 'rollup-plugin-typescript2';
import tslint from 'rollup-plugin-tslint';
import uglify from 'rollup-plugin-uglify';
import pkg from './package.json';

export default [
    // Node and other module bulder for UMD build
    {
        input: 'src/index.ts',
        output: {
            file: pkg.main,
            format: 'umd'
        },
        name: 'utils',
        plugins: [
            typescript(),
            tslint()
        ]
    },

    // browser-friendly IIFE build
    {
        input: 'src/index.ts',
        output: {
            file: pkg.browser,
            format: 'iife'
        },
        name: 'utils',
        plugins: [
            typescript(),
            tslint(),
            uglify()
        ]
    },
]
```
umd는 es 모듈, commonjs, amd, iife 등등 모든 모듈 방식을 커버하는 모듈 방식이다.  
하지만 umd는 기본적으로 iife 모듈보다 용량이 크기 때문에 iife를 uglify 한 것을 브라우저에서 쓰고,  
나머지 환경에서는 umd 모듈 파일을 사용하는 게 좋다.

설치는 아래와 같이 하면 된다. (자신의 상황에 맞게 설치하면 된다.)  
```bash
npm i -S git://github.com/perfectacle/front-test-setting.git#rollup-umd
```

우선 node에서 사용할 때는 아래와 같이 하면 된다.  
```javascript
const {removedDigits, removedNotDigits} = require('utils');
console.log(removedDigits('93-05')); // -
```

다른 모듈 번들러에서 사용할 때는 아래와 같이 사용하면 된다.  
```javascript
import {removedDigits, removedNotDigits} from 'utils'
console.log(removedDigits('93-05')); // -
```

브라우저에서 사용할 때는 아래와 같이 사용하면 된다.  
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
</head>
<body>
<!-- 요렇게 쓰면 번거로우니 대부분 CDN을 지원한다. -->
<script src="node_modules/utils/dist/util.min.js"></script>
<script>
  const {removedDigits, removedNotDigits} = utils;
  console.log(removedDigits('93-05')); // -
</script>
</body>
</html>
```

## 마치며...
저는 리액트를 써볼 때 웹팩을 써서 웹팩이 익숙했었는데 rollup을 써보고 나니 앱이 아닌 라이브러리의 경우에는 롤업이 더 적합한 것 같다는 느낌도 많이 들었네요.  
이 다음 번 시리즈에는 마지막 포스트인 [travis-ci와 coveralls를 이용하여 좀 더 안전하게 협업하기](/2017/12/10/travis-ci-coveralls)을 보시면 됩니다.  
오픈소스, 남들과 협업할 때 어떻게 내 코드의 안전성을 쉽고 빠르게 보장할 수 있을지에 대해 정리해놓았습니다.