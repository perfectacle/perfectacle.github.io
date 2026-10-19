---
title: spring.properties 파일을 읽어들이는 원리
tags: [Spring, Java]
categories: [Spring]
date: 2020-12-25 00:51:17
---
## [SpringProperties 클래스](https://github.com/spring-projects/spring-framework/blob/master/spring-core/src/main/java/org/springframework/core/SpringProperties.java#L46)
```java
// ...
import java.util.Properties;
// ...
public final class SpringProperties {

    private static final String PROPERTIES_RESOURCE_LOCATION = "spring.properties";
    
    private static final Properties localProperties = new Properties();


    static {
        try {
            ClassLoader cl = SpringProperties.class.getClassLoader();
            URL url = (cl != null ? cl.getResource(PROPERTIES_RESOURCE_LOCATION) :
                    ClassLoader.getSystemResource(PROPERTIES_RESOURCE_LOCATION));
            if (url != null) {
                try (InputStream is = url.openStream()) {
                    localProperties.load(is);
                }
            }
        }
        catch (IOException ex) {
            System.err.println("Could not load 'spring.properties' file from local classpath: " + ex);
        }
    }
    // ...
    @Nullable
    public static String getProperty(String key) {
        String value = localProperties.getProperty(key);
        if (value == null) {
            try {
                value = System.getProperty(key);
            }
            catch (Throwable ex) {
                System.err.println("Could not retrieve system property '" + key + "': " + ex);
            }
        }
        return value;
    }
    // ...
}
```

1. PROPERTIES_RESOURCE_LOCATION(`spring.properties`) 파일을 읽어서 InputStream에 넣고
1. localProperties.load(is)를 통해 Properties에 위에서 읽어들인 InputStream을 load 하고
1. 나중에 필요할 때 키 값을 통해 프로퍼티를 불러오고 있다. 

localProperties는 Properties라는 자바 표준 API를 사용하고 있기 때문에 저 spring.properties에는 어떻게 키와 프로퍼티를 구성하는지 알아보자.

### [Properties](https://docs.oracle.com/javase/8/docs/api/java/util/Properties.html)
> The Properties class represents a persistent set of properties.
> The Properties can be saved to a stream or loaded from a stream.
> Each key and its corresponding value in the property list is a string.

프로퍼티들을 모아놓은 타입이고, 키와 밸류의 쌍으로 이루어졌다고 보면 된다.  
그리고 stream으로부터 load 될 수 있다고 하니 InputStream에서 로드되는 API부터 봐보자.

#### [load(InputStream inStream)](https://docs.oracle.com/javase/8/docs/api/java/util/Properties.html#load-java.io.InputStream-)
> public void load(InputStream inStream) throws IOException
>
> Reads a property list (key and element pairs) from the input byte stream.
> The input stream is in a simple line-oriented format as specified in load(Reader) and is assumed to use the ISO 8859-1 character encoding;
> that is each byte is one Latin1 character. Characters not in Latin1, and certain special characters, are represented in keys and elements using Unicode escapes as defined in section 3.3 of The Java™ Language Specification.

일단 [ISO 8859-1](https://ko.wikipedia.org/wiki/ISO/IEC_8859-1)은 문자열 관련 인코딩 표준인데 영어/숫자나 기본적인 특수문자(공백, 느낌표 등등)들만 지원한다고 생각하면 편하다.
또한 line-oriented format이기 때문에 한 줄 마다 key and element pair가 구성이 된다.
한 줄이 어떤 식으로 구성되는지는 [load(Reader reader](#load-Reader-reader)) 메서드를 참고하면 된다.


#### [load(Reader reader)](https://docs.oracle.com/javase/8/docs/api/java/util/Properties.html#load-java.io.Reader-)
> public void load(Reader reader) throws IOException
> ...
> As an example, each of the following three lines specifies the key "Truth" and the associated element value "Beauty":
> Truth = Beauty
>  Truth:Beauty
>  Truth           :Beauty

`=`이나 `:`로 key/element를 구분짓고, 앞 뒤에 굳이 공백은 전부 생략해주는 것으로 보인다.  
일반적으로 보던 application.properties와 큰 차이 없는 것으로 보이므로 원래 사용하던 데로 쓰면 될 거 같다.
