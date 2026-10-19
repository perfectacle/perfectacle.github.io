---
title: (ES2015+) Async/Await는 배열 표준 메소드에서 작동하지 않는다.
tag:
  - ES2015+
  - promise
  - async
  - await
categories:
  - Programming
  - ECMAScript
date: 2017-07-17 20:00:04
---
![](es8-async-fact/thumb.png)  

```javascript
const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// 제대로 작동하질 않는다.
nums.forEach(async (num) => {
  await new Promise(res => {
    setTimeout(() => {
      console.log(num);
      res();
    }, 1000);
  });
});
```

```javascript
const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// 역시 마찬가지로 제대로 작동하지 않는다.
(async() => {
  nums.forEach(async (num) => {
    await new Promise(res => {
      setTimeout(() => {
        console.log(num);
        res();
      }, 1000);
    });
  });
})();
```

```javascript
const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// 이터레이터에서는 잘 작동한다.
(async() => {
  for(const num of nums) {
    await new Promise(res => {
      setTimeout(() => {
        console.log(num);
        res();
      }, 1000);
    });
  }
})();
```

```javascript
const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// 물론 일반 반복문에서도 잘 작동한다.
(async() => {
  for(let i=0, len=nums.length; i<len; i++) {
    await new Promise(res => {
      setTimeout(() => {
        console.log(nums[i]);
        res();
      }, 1000);
    });
  }
})();
```

아마 실행 주도권이 배열 표준 메소드 내부의 콜백 함수가 가지게 되어서 그런 게 아닐까?  
