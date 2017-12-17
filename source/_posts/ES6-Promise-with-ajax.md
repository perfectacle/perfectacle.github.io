---
title: (ES6) ajax 위주의 promise 실습
date: 2017-01-21 09:09:50
category: [Programming, ECMAScript, ES2015+]
tag: [JS, ES, ES6, ES2015, ajax, promise]
---
![](thumb.png)

# 들어가기에 앞서
집중력을 위해 짧은 글을 지향하여 Promise 문법을 설명하지는 않았다.  
간단히 jQuery를 사용해본 사람이라면 쉽게 이해할 수 있을 것이다.  
내가 찾아본 대부분의 Promise 관련 예제가 setTimeout 위주여서  
ajax 위주의 예제를 한 번 정리해보았다.  

## 비동기 코드를 동기식으로 작성하면?
```javascript
const jsonURL = [
  "https://blog.perfectacle.com/mock/test.json",
  "https://blog.perfectacle.com/mock/test2.json"
];

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

// 콘솔창을 키고 새로고침을 10번 정도 해보자.
// 콘솔창에 계속해서 동일한 결과가 출력되는가??
// 비동기 작업이기 때문에 순서를 보장하기 힘들다.
// 원래는 아래와 같이 나와야한다.
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
getDataAjax(jsonURL[0]);
getDataAjax(jsonURL[1]);
getDataAjax(jsonURL[0]);
getDataAjax(jsonURL[0]);
getDataAjax(jsonURL[1]);
getDataAjax(jsonURL[1]);
getDataAjax(jsonURL[0]);
getDataAjax(jsonURL[1]);
getDataAjax(jsonURL[0]);
getDataAjax(jsonURL[1]);
```

## 비동기 코드를 비동기식(콜백 함수)으로 작성하면? (ES5)
```javascript
const jsonURL = [
  "https://blog.perfectacle.com/mock/test.json",
  "https://blog.perfectacle.com/mock/test2.json"
];

// 따라서 아래와 같이 콜백 함수를 이용하여야 한다...
const getDataAjaxCallback = (url, res, rej) => {
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
};

// 성공과 에러 콜백함수는 공통 함수로 빼버렸다.
const res = data => {
  for(let key in data) {
    if(data.hasOwnProperty(key))
      console.log(`${key}: ${data[key]}`);
  }
};
const rej = err => console.error(`http status code: ${err}`);

// 새로고침 10번을 해보고도 아래와 같은 순서로 나오는지 확인해보자.
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
// 함수 안에 매개변수로 콜백함수가 들어가있다.
getDataAjaxCallback(jsonURL[0], data => {
  res(data);
  // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
  getDataAjaxCallback(jsonURL[1], data => {
    res(data);
    // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
    getDataAjaxCallback(jsonURL[0], data => {
      res(data);
      // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
      getDataAjaxCallback(jsonURL[0], data => {
        res(data);
        // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
        getDataAjaxCallback(jsonURL[1], data => {
          res(data);
          // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
          getDataAjaxCallback(jsonURL[1], data => {
            res(data);
            // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
            getDataAjaxCallback(jsonURL[0], data => {
              res(data);
              // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
              getDataAjaxCallback(jsonURL[1], data => {
                res(data);
                // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
                getDataAjaxCallback(jsonURL[0], data => {
                  res(data);
                  // 순서를 보장하기 위해 콜백함수 안에 또 콜백함수가 들어가있다.
                  getDataAjaxCallback(jsonURL[1], data => {
                    res(data);
                  }, err => rej(err))
                }, err => rej(err))
              }, err => rej(err))
            }, err => rej(err))
          }, err => rej(err))
        }, err => rej(err))
      }, err => rej(err))
    }, err => rej(err))
  }, err => rej(err))
}, err => rej(err));
```

## 비동기식 코드의 순서를 아름답게 보장하려면...? (ES6)
```javascript
const jsonURL = [
  "https://blog.perfectacle.com/mock/test.json",
  "https://blog.perfectacle.com/mock/test2.json"
];

// 위 코드를 보면 가독성이 매우매우매우 안 좋다.
// 이를 위해 등장한 것이 promise.
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

// 코드가 한결 우아해지지 않았는가?
// 새로고침 10번을 해보고도 아래와 같은 순서로 나오는지 확인해보자.
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

## 마치며
콜백 함수를 Promise로 바꾸긴 했지만 그래도 좀 번거로운 건 어쩔 수 없을까...?  
그에 대한 해답이라고 하긴 뭐하지만  
[(ES6+) ajax를 위한 fetch와 async/await](/2017/01/25/ES6-ajax-with-fetch/)에서 해결방안을 보자.  