---
title: (ES6+) ajax를 위한 fetch와 async/await
date: 2017-01-25 18:37:49
category: [Programming, ECMAScript, ES2015+]
tag: [JS, ES, ES6+, ES2015+, ajax]
---
![](thumb.png)  
이 글을 읽기 전에 [(ES6) ajax 위주의 promise 실습](/2017/01/21/ES6-Promise-with-ajax/)를 먼저 읽을 것을 권한다.  
ajax(XMLHttpRequest)와 promise에 대한 기본적인 이해가 있다면 상관없긴 하다.  
[조현영](https://www.facebook.com/zerohch0?fref=ufi) 님의 제보에 의하면 ie에서 fetch가 안 되고,  
async/await 크롬과 오페라에서만 된다고 한다.  
아래 사이트에서 확인 가능하다.  
[https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#Browser_compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#Browser_compatibility)  
[ECMAScript Next compatibility table](http://kangax.github.io/compat-table/es2016plus/#test-async_functions)

## fetch
다시 공부하다보니 XMLHttpRequest와 Fetch는 ECMAScript가 아니라고 한다.  
브라우저에서만 쓰이는 API이기 때문에 babel에서도 지원해주지 않기 때문에  
크로스 브라우징을 위해선 [window.fetch polyfill](https://github.com/github/fetch)을 쓰자.  
우선 기존에 우리가 ajax를 하기 위해서 어떻게 했는지 보자.  
```javascript
const jsonURL = "https://perfectacle.github.io/mock/test.json";

const getDataAjax = url => {
  const xhr = new XMLHttpRequest();
  xhr.open("get", url, true);
  xhr.responseType = "json";
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4) { // 4 means request is done.
      if(xhr.status === 200) { // 200 means status is successful
        for(let key in xhr.response) { // 받아온 json 데이터의 키와 값의 쌍을 모두 출력.
          if(xhr.response.hasOwnProperty(key))
            console.log(`${key}: ${xhr.response[key]}`);
        }
      } else { // 통신 상에 오류가 있었다면 오류 코드를 출력.
        console.error(`http status code: ${xhr.status}`);
      }
    }
  };
  xhr.send();
};

getDataAjax(jsonURL);
```

이 복잡한 getDataAjax 부분을 줄여보자.  
```javascript
const jsonURL = "https://perfectacle.github.io/mock/test.json";

const getDataAjaxFetch = url => (
  fetch(url).then(res => res.json())
);

getDataAjaxFetch(jsonURL).then(data => {
  for(let key in data) { // 받아온 json 데이터의 키와 값의 쌍을 모두 출력.
    if(data.hasOwnProperty(key))
      console.log(`${key}: ${data[key]}`);
  }
}).catch(err => console.error(err));
```

fetch API는 XMLHttpRequest를 대신하기 위한 방안 중 하나이다.  
아직 표준안은 아니고, 크롬에서 당장 사용이 가능하다.  
자세한 설정은 [fetch API](https://davidwalsh.name/fetch)을 확인하자.

그럼 대충 fetch를 뜯어보자.  
```javascript
console.dir(fetch("https://perfectacle.github.io/mock/test.json"));
```
![크롬 콘솔창에서 본 fetch의 반환값](01.png)  
Promise 인스턴스가 반환된다.  
Promise에서 실제로 쓰고 싶은 값은 [[PromiseValue]]에 들어있는데 이를 직접 접근하지 못한다.  
따라서 then() 메소드를 써야한다.  
```javascript
fetch("https://perfectacle.github.io/mock/test.json")
.then(res => console.dir(res));
```
![크롬 콘솔창에서 본 [[PromiseValue]]의 반환값](02.png)  
반환된 결과를 보니 Response의 인스턴스가 반환됐다.  
처음 보는 놈이다.  
뭐 쓰고 싶은 값을 찾아낼 수가 없다.  
여기서 또 하나의 메소드를 쓰면 된다.  
```javascript
fetch("https://perfectacle.github.io/mock/test.json")
.then(res => console.dir(res.json()));
```
![Response 인스턴스의 JSON화](03.png)  
Response 인스턴스는 문자열이 아니다.  
따라서 toJSON() 대신에 json() 메소드를 쓰면 json 형태로 바꿀 수 있다.  
바꿨더니 또 promise 인스턴스다.  
[[PromiseValue]]를 한 번 더 벗겨야한다.
```javascript
fetch("https://perfectacle.github.io/mock/test.json")
.then(res => res.json())
.then(data => console.dir(data));
```
![또 다시 벗겨낸 [[PromiseValue]]](04.png)  
드디어 우리가 원하는 값을 얻어냈다.  
기존의 XMLHttpRequest와 Promise를 사용했을 때보다 then을 한 번 더 타야한다는 단점이 있다.  
근데 뭐 간단해지니 장점이 더 많은 것 같다.  

그럼 기존 XMLHttpRequest와 Fetch를 비교해보자.  
```javascript
const jsonURL = [
  "https://perfectacle.github.io/mock/test.json",
  "https://perfectacle.github.io/mock/test2.json"
];

// promise에 파라미터를 넘겨주기 위해선 밖에서 함수로 한 번 래핑해줘야 함.
const getDataAjaxPromise = url => (
  // thenable하게 하기 위해 Promise 인스턴스를 리턴.
  new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open("get", url, true);
    xhr.responseType = "json";
    xhr.onreadystatechange = () => {
      if(xhr.readyState === 4) { // 4 means request is done.
        if(xhr.status === 200) { // 200 means status is successful
          res(xhr.response); // 성공했을 시 실행할 콜백 함수.
        } else {
          rej(xhr.status); // 실패했을 시 실행할 콜백 함수.
        }
      }
    };
    xhr.send();
  })
);

// 성공 콜백함수는 공통 함수로 빼버렸다.
const res = data => {
  for(let key in data) {
    console.log(`${key}: ${data[key]}`);
  }
};

// test: hi
// test2: hi
// test: hi
// test: hi
// test2: hi
// test2: hi
// test: hi
// test2: hi
// test: hi
// test2: hi
getDataAjaxPromise(jsonURL[0])
.then(data => {
  res(data);
  // promise 인스턴스에 파라미터를 넘기기 위해선 다시 함수를 호출해야하고,
  // thenable 하게 만들어야하기 때문에 함수의 반환값(프라미스 인스턴스)을 리턴해줘야함.
  return getDataAjaxPromise(jsonURL[1]);
})
.then(data => {
  res(data);
  return getDataAjaxPromise(jsonURL[0])
})
.then(data => {
  res(data);
  return getDataAjaxPromise(jsonURL[0]);
})
.then(data => {
  res(data);
  return getDataAjaxPromise(jsonURL[1])
})
.then(data => {
  res(data);
  return getDataAjaxPromise(jsonURL[1])
})
.then(data => {
  res(data);
  return getDataAjaxPromise(jsonURL[0])
})
.then(data => {
  res(data);
  return getDataAjaxPromise(jsonURL[1])
})
.then(data => {
  res(data);
  return getDataAjaxPromise(jsonURL[0])
})
.then(data => {
  res(data);
  return getDataAjaxPromise(jsonURL[1])
})
// 더 이상 비동기로 처리할 내용이 없으므로 return문은 필요 없어짐.
.then(data => res(data))
.catch(err => console.error(`http status code: ${err}`));
```

```javascript
const jsonURL = [
  "https://perfectacle.github.io/mock/test.json",
  "https://perfectacle.github.io/mock/test2.json"
];

// 성공 콜백함수는 공통 함수로 빼버렸다.
const res = data => {
  for(let key in data) {
    if(data.hasOwnProperty(key))
      console.log(`${key}: ${data[key]}`);
  }
};

const getDataFetch = url => (
  fetch(url).then(res => res.json())
);

// 이 부분은 promise와 크게 차이나진 않는다.
getDataFetch(jsonURL[0])
.then(data => {
  res(data);
  return getDataFetch(jsonURL[1]);
})
.then(data => {
  res(data);
  return getDataFetch(jsonURL[0]);
})
.then(data => {
  res(data);
  return getDataFetch(jsonURL[0]);
})
.then(data => {
  res(data);
  return getDataFetch(jsonURL[1]);
})
.then(data => {
  res(data);
  return getDataFetch(jsonURL[1]);
})
.then(data => {
  res(data);
  return getDataFetch(jsonURL[0]);
})
.then(data => {
  res(data);
  return getDataFetch(jsonURL[1]);
})
.then(data => {
  res(data);
  return getDataFetch(jsonURL[0]);
})
.then(data => res(data))
.catch(err => console.error(err));
```

## async & await (ES2017)
여기서 끝내기 아쉬우니 한번 코드를 Promise의 단점을 보완해보자.  
요놈은 아직 표준 확정은 아니다. (ES2017이 나온 게 아니니...)  
그래도 뭐 크롬에서 돌아가니 한 번 알아보자.  

```javascript
const jsonURL = [
  "https://perfectacle.github.io/mock/test.json",
  "https://perfectacle.github.io/mock/test2.json"
];

const getDataFetch = url => (
  fetch(url).then(res => res.json())
);

// 성공 콜백함수는 공통 함수로 빼버렸다.
const res = data => {
  for(let key in data) {
    if(data.hasOwnProperty(key))
      console.log(`${key}: ${data[key]}`);
  }
};

// async 함수 안에서 비동기 코드 앞에 await를 붙여주면 된다.
// 안타깝게도 async '함수'라서 호출을 위해 즉시 실행함수를 사용했다.
(async () => {
  // try-catch 문으로도 완벽하게 오류를 잡아낸다.
  // 하지만 에러코드가 제대로 출력되지 않는다.
  try {
    await getDataFetch(jsonURL[0]).then(data => res(data)); // test: hi
    await getDataFetch(jsonURL[1]).then(data => res(data)); // test2: hi
    await getDataFetch(jsonURL[0]).then(data => res(data)); // test: hi
    await getDataFetch(jsonURL[0]).then(data => res(data)); // test: hi
    await getDataFetch(jsonURL[1]).then(data => res(data)); // test2: hi
    await getDataFetch(jsonURL[1]).then(data => res(data)); // test2: hi
    await getDataFetch(jsonURL[0]).then(data => res(data)); // test: hi
    await getDataFetch(jsonURL[1]).then(data => res(data)); // test2: hi
    await getDataFetch(jsonURL[0]).then(data => res(data)); // test: hi
    await getDataFetch(jsonURL[1]).then(data => res(data)); // test2: hi
  } catch(err) { // 하나의 통신이라도 실패하면 뒤에 오는 통신은 씹어버린다.
    console.error(err); // 직접 URL을 틀리게 입력해서 오류를 뭐라고 뿜는지 보자.
  }
})();
```

## 마치며
Promise, Fetch, Async/Await 모두 수박 겉핥기 식으로 공부해서  
글에 부족한 부분이 매우 많을 것이니 무한 태클 환영합니다~
제가 들은 말로 정리를 해보자면...
* 콜백 함수  
ㄴ  
&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ㄴ  
* Promise(Fetch 또한 Promise를 쓰는 것)  
ㄴ  
&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;ㄴ  
&nbsp;&nbsp;ㄴ  
* Async/Await  
ㄴ  
ㄴ  
ㄴ  
ㄴ  
ㄴ  
ㄴ  
ㄴ  
ㄴ  
ㄴ  