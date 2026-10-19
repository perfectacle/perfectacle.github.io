---
title: (Hexo) NexT 테마에서 '더 읽어보기'를 설정하는 방법
tags: [Hexo, Theme, NexT]
categories: [기타, 잡동사니]
date: 2020-05-31 12:15:21
---

`themes/next/_config.yml`을 보면 아래와 같이 기본적으로 '더 읽어보기'가 세팅돼있다.

```yaml
# Automatically excerpt (Not recommend).
# Use <!-- more --> in the post to control excerpt accurately.
auto_excerpt:
  enable: true
  length: 150

# Read more button
# If true, the read more button would be displayed in excerpt section.
read_more_btn: true
```

하지만 NexT Theme 7.6.0 이상의 버전에서는 위와 같이 설정이 돼있어도 '더 읽어보기'가 나오지 않는다.
이럴 때는 [hexo-excerpt](https://github.com/chekun/hexo-excerpt) 플러그인을 설치해주면 해결된다. :tada:
[https://github.com/theme-next/hexo-theme-next/issues/1245#issuecomment-558486354](https://github.com/theme-next/hexo-theme-next/issues/1245#issuecomment-558486354)
> If you are using NexT 7.6.0 and later, please install the plugin: https://github.com/chekun/hexo-excerpt
