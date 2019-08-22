---
title: (JS) 문자, 단어, 동음이의어 갯수 세기
date: 2017-07-18 23:14:51
tag:
category:
---
![](/images/js-count-char-word/thumb.png)  
~~웰 컴 투 정규표현식~~

문자 & 단어 세기
```javascript
const str =
`반응형웹, 반응형 웹, Responsive, responsive web 웹표준
웹표준, 웹 표준, Web Standard, web Standard`;

const countChar = (char, str) => {
  const matchedChars = str.match(new RegExp(char, 'gmi'));
  return matchedChars ? matchedChars.length : 0;
};

console.log(countChar('웹', str)); // 5
console.log(countChar('웹표준', str)); // 2
```

동음이의어 세기
```javascript
let str =
`반응형웹, 반응형 웹, Responsive, responsive web 웹표준
웹표준, 웹 표준, Web Standard, web Standard`;

const homonym  = ['웹 표준', '웹표준', 'Web Standard'];

const countHomonym = (homonym, str) => {
  let cnt = 0;
  for(const word of homonym) {
    const regExp = new RegExp(word, 'gmi');
    const matchedWords = str.match(regExp);
    if(matchedWords) cnt += matchedWords.length;
  }
  
  return cnt;
};

console.log(countHomonym(homonym, str));
```