---
title: (Spring Boot) SimpleClientHttpRequestFactory와 Connection Pool
tags:
  - Spring
  - Spring Boot
  - RestTemplate
category:
  - Spring Boot
date: 2021-02-14 13:04:05
---

## N줄 요약
[SimpleClientHttpRequestFactory](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/client/SimpleClientHttpRequestFactory.html)(RestTemplate을 기본생성자로 만들었을 때 사용하는)를 사용하더라도 내부에서 [KeepAliveCache](https://github.com/frohoff/jdk8u-jdk/blob/master/src/share/classes/sun/net/www/http/KeepAliveCache.java)를 사용하여 커넥션 풀을 관리한다.    
기본적으로 [KeepAliveKey(protocol, host, port)](https://github.com/frohoff/jdk8u-jdk/blob/master/src/share/classes/sun/net/www/http/KeepAliveCache.java#L295) 당 5개의 풀을 가지며 시스템 프로퍼티 `http.maxConnections`를 할당해주면 늘릴 수 있다.  
커넥션 풀을 초과하면 커넥션은 바로 종료되며, 커넥션 풀 내의 커넥션은 매번 연결을 맺고 끊는 게 아니라 재사용 된다.  
당연하게도 서버에서 [Keep-Alive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive)를 사용하지 않으면 매번 커넥션이 종료된다.  
그럼에도 불구하고 SimpleClientHttpRequestFactory는 다음의 단점이 있기 때문에 토이 프로젝트가 아닌 이상 [HttpComponentsClientHttpRequestFactory](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/client/HttpComponentsClientHttpRequestFactory.html) 같은 다른 구현체를 사용해야할 것 같다.  
* http.maxConnections라는 시스템 프로퍼티를 설정해야하는데 설정을 위해 자주 사용하던 properties(yml)에는 설정할 수 없다보니 다른 방법으로 설정을 해줘야하고, 그러다 보면 설정을 파악하려면 한 군데(properties 또는 yml)만 집중해서는 파악할 수 없는 내용도 있다보니 실수할 여지가 발생할 수 있다.  
* KeepAliveCache가 static 변수이다보니 서로 다른 SimpleClientHttpRequestFactory여도 동일한 커넥션 풀을 참조한다.
* route(프로토콜, 호스트, 포트) 별 커넥션 풀은 설정할 수 있지만 토탈 커넥션 풀은 제한이 없다. 

## SimpleClientHttpRequestFactory가 뭐지??
RestTemplate의 기본 생성자를 사용하면 ClientHttpRequestFactory를 별도로 초기화하지 않으므로 기본값인 SimpleClientHttpRequestFactory를 사용한다.
```java
public class RestTemplate extends InterceptingHttpAccessor implements RestOperations {
```

```java
public abstract class InterceptingHttpAccessor extends HttpAccessor {
```

```java
public abstract class HttpAccessor {

	/** Logger available to subclasses. */
	protected final Log logger = HttpLogging.forLogName(getClass());

	private ClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
```

[ClientHttpRequest](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/client/ClientHttpRequest.html#:~:text=Interface%20ClientHttpRequest&text=Represents%20a%20client%2Dside%20HTTP,which%20can%20be%20read%20from.)의 javadoc을 보면 아래와 같이 나와있다.
> Represents a client-side HTTP request. Created via an implementation of the ClientHttpRequestFactory.
  A ClientHttpRequest can be executed, receiving a ClientHttpResponse which can be read from.

ClientHttpRequest는 클라이언트 측면의 [HttpRequest](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/HttpRequest.html)이며, [ClientHttpRequestFactory](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/client/ClientHttpRequestFactory.html) 구현체에 의해 생성된다.  
ClientHttpRequest는 실행될 수 있으머, ClientHttpResponse를 받아서 읽을 수 있다.  
대충 해석해보면 그냥 팩토리로 request 만들어서 서버로 전송하고 응답받을 수 있다는 내용 같다.

HTTP 통신을 사용할 때 사용하다보니 [SimpleClientHttpRequestFactory](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/client/SimpleClientHttpRequestFactory.html)에는 기본적인 타임아웃을 설정할 수 있다.
```java
public class SimpleClientHttpRequestFactory implements ClientHttpRequestFactory, AsyncClientHttpRequestFactory {

	private static final int DEFAULT_CHUNK_SIZE = 4096;


	@Nullable
	private Proxy proxy;

	private boolean bufferRequestBody = true;

	private int chunkSize = DEFAULT_CHUNK_SIZE;

	private int connectTimeout = -1;

	private int readTimeout = -1;
    // ...
}
``` 

그리고 ClientHttpRequestFactory는 RestTemplate을 이용하여 통신할 때 사용된다.  
```java
public class RestTemplate extends InterceptingHttpAccessor implements RestOperations {
    // ...
    @Override
    @Nullable
    public <T> T getForObject(String url, Class<T> responseType, Object... uriVariables) throws RestClientException {
        RequestCallback requestCallback = acceptHeaderRequestCallback(responseType);
        HttpMessageConverterExtractor<T> responseExtractor =
                new HttpMessageConverterExtractor<>(responseType, getMessageConverters(), logger);
        return execute(url, HttpMethod.GET, requestCallback, responseExtractor, uriVariables);
    }
    // ...
    @Override
    @Nullable
    public <T> T execute(String url, HttpMethod method, @Nullable RequestCallback requestCallback,
            @Nullable ResponseExtractor<T> responseExtractor, Object... uriVariables) throws RestClientException {
    
        URI expanded = getUriTemplateHandler().expand(url, uriVariables);
        return doExecute(expanded, method, requestCallback, responseExtractor);
    }
    // ...
    @Nullable
    protected <T> T doExecute(URI url, @Nullable HttpMethod method, @Nullable RequestCallback requestCallback,
            @Nullable ResponseExtractor<T> responseExtractor) throws RestClientException {
    
        Assert.notNull(url, "URI is required");
        Assert.notNull(method, "HttpMethod is required");
        ClientHttpResponse response = null;
        try {
            ClientHttpRequest request = createRequest(url, method);
            if (requestCallback != null) {
                requestCallback.doWithRequest(request);
            }
            response = request.execute();
        // ...
    }
    // ...
}
```

doExecute에서 호출하는 createRequest는 HttpAccessor에 있는 메서드이다.
```java
public abstract class HttpAccessor {
    // ...
    /**
     * Create a new {@link ClientHttpRequest} via this template's {@link ClientHttpRequestFactory}.
     * @param url the URL to connect to
     * @param method the HTTP method to execute (GET, POST, etc)
     * @return the created request
     * @throws IOException in case of I/O errors
     * @see #getRequestFactory()
     * @see ClientHttpRequestFactory#createRequest(URI, HttpMethod)
     */
    protected ClientHttpRequest createRequest(URI url, HttpMethod method) throws IOException {
        ClientHttpRequest request = getRequestFactory().createRequest(url, method);
        initialize(request);
        if (logger.isDebugEnabled()) {
            logger.debug("HTTP " + method.name() + " " + url);
        }
        return request;
    }
}
```

그리고 SimpleClientHttpRequestFactory의 createRequest 메서드를 보면 요청을 보내기 위해 [HttpURLConnection](https://docs.oracle.com/javase/8/docs/api/java/net/HttpURLConnection.html)을 사용한다는 사실을 알 수 있다.  
```java
/**
 * {@link ClientHttpRequestFactory} implementation that uses standard JDK facilities.
 *
 * @author Arjen Poutsma
 * @author Juergen Hoeller
 * @since 3.0
 * @see java.net.HttpURLConnection
 * @see HttpComponentsClientHttpRequestFactory
 */
@SuppressWarnings("deprecation")
public class SimpleClientHttpRequestFactory implements ClientHttpRequestFactory, AsyncClientHttpRequestFactory {
    // ...
    @Override
    public ClientHttpRequest createRequest(URI uri, HttpMethod httpMethod) throws IOException {
        HttpURLConnection connection = openConnection(uri.toURL(), this.proxy);
        prepareConnection(connection, httpMethod.name());
    
        if (this.bufferRequestBody) {
            return new SimpleBufferingClientHttpRequest(connection, this.outputStreaming);
        }
        else {
            return new SimpleStreamingClientHttpRequest(connection, this.chunkSize, this.outputStreaming);
        }
    }
    // ...

    /**
     * Opens and returns a connection to the given URL.
     * <p>The default implementation uses the given {@linkplain #setProxy(java.net.Proxy) proxy} -
     * if any - to open a connection.
     * @param url the URL to open a connection to
     * @param proxy the proxy to use, may be {@code null}
     * @return the opened connection
     * @throws IOException in case of I/O errors
     */
    protected HttpURLConnection openConnection(URL url, @Nullable Proxy proxy) throws IOException {
        URLConnection urlConnection = (proxy != null ? url.openConnection(proxy) : url.openConnection());
        if (!(urlConnection instanceof HttpURLConnection)) {
            throw new IllegalStateException(
                    "HttpURLConnection required for [" + url + "] but got: " + urlConnection);
        }
        return (HttpURLConnection) urlConnection;
    }
    // ...
}
```

## SimpleClientHttpRequestFactory는 정말로 커넥션 풀을 사용하지 않을까?
내 머릿 속 어딘가에서는 SimpleClientHttpRequestFactory는 커넥션 풀을 사용하지 않는다고 기억을 하고 있다.  
이 말 뜻은 매번 커넥션을 맺고 끊는다는 것인데 [Keep-Alive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive) 메커니즘을 전혀 따르지 않는 것으로 보였다.

정말 이 말이 사실일까 싶어서 테스트를 해보았다.  
우선 로컬에 간단한 서버를 띄워야하니 컨트롤러를 추가하자.  
```kotlin
@RestController
class Controller {
    @GetMapping
    fun a() {}
}
```

이제 SimpleClientHttpRequestFactory를 사용하는 테스트를 작성해보자.  
```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class RestTemplateConnectionPoolTest(
    @LocalServerPort
    private val port: Int
) {
        @Test
        fun `총 12개의 요청을 두 번에 끊어서 동시에 6개씩 전송`() {
        val threadCount = 6
        val threadPool = Executors.newFixedThreadPool(threadCount)
        val futures = mutableListOf<CompletableFuture<String?>>()

        val restTemplate = RestTemplate()
        val total = threadCount * 2
        for (i in 1..total) {
            futures.add(CompletableFuture.supplyAsync(
                // 와이어샤크의 패킷 캡쳐를 위해 일부러 private IP를 직접 박음
                { restTemplate.getForObject("http://192.168.0.144:${port}", String::class.java) },
                threadPool
            ))
        }

        futures.forEach { it.join() }

        // spring-boot-starter-web 모듈의 기본 내장 서버인 embedded tomcat의 
        // 기본 Keep-Alive 헤더의 timeout 파라미터 값인 60초 이후에 커넥션이 끊기는지 확인하기 위해 서버 종료를 딜레이 시킴.
        Thread.sleep(70_000)
    }
}
```
![](/images/simple-client-http-request-factory-connection-pool/default-connection-pool-packet-1.png)
와이어샤크를 통해 패킷 캡쳐를 해보니 6개의 커넥션이 동시에 맺혀지고 있다.  

![](/images/simple-client-http-request-factory-connection-pool/default-connection-pool-packet-2.png)
커넥션 풀을 사용하지 않는다면 모든 커넥션이 종료돼야하는데 하나의 커넥션만 종료되고 있다.  
가장 처음 응답을 받은 소켓(50322 포트)이 닫혔다.  
그리고 다음에 또 6개의 요청을 보내야하는데 커넥션이 하나 모자르므로 소켓(50324 포트)을 하나 더 열어서 커넥션을 맺었다.  

![](/images/simple-client-http-request-factory-connection-pool/default-connection-pool-packet-3.png)
위와 동일하게 50324 포트는 응답을 받자마자 바로 커넥션이 끊겼다.  
그리고 나머지 5개의 커넥션은 Keep-Alive의 timeout 파라미터인 60초 이후에 커넥션이 끊기기 시작했다.  

## SimpleClientHttpRequestFactory와 커넥션 풀
위 테스트를 토대로 SimpleClientHttpRequestFactory가 커넥션 풀을 사용은 하는 것 같은데 최대 5개가 아닐까 의심이 들었다.  

그래서 다시 한 번 RestTemplate의 getForObject 메서드에 브레이크 포인트를 걸고 쫓아가보았다.
```java
public class RestTemplate extends InterceptingHttpAccessor implements RestOperations {
    // ...
    @Override
    @Nullable
    public <T> T getForObject(String url, Class<T> responseType, Object... uriVariables) throws RestClientException {
        RequestCallback requestCallback = acceptHeaderRequestCallback(responseType);
        HttpMessageConverterExtractor<T> responseExtractor =
                new HttpMessageConverterExtractor<>(responseType, getMessageConverters(), logger);
        return execute(url, HttpMethod.GET, requestCallback, responseExtractor, uriVariables);
    }
    // ...
    @Override
    @Nullable
    public <T> T execute(String url, HttpMethod method, @Nullable RequestCallback requestCallback,
            @Nullable ResponseExtractor<T> responseExtractor, Object... uriVariables) throws RestClientException {
    
        URI expanded = getUriTemplateHandler().expand(url, uriVariables);
        return doExecute(expanded, method, requestCallback, responseExtractor);
    }
    // ...
    @Nullable
    protected <T> T doExecute(URI url, @Nullable HttpMethod method, @Nullable RequestCallback requestCallback,
            @Nullable ResponseExtractor<T> responseExtractor) throws RestClientException {
    
        Assert.notNull(url, "URI is required");
        Assert.notNull(method, "HttpMethod is required");
        ClientHttpResponse response = null;
        try {
            ClientHttpRequest request = createRequest(url, method);
            if (requestCallback != null) {
                requestCallback.doWithRequest(request);
            }
            response = request.execute();
        // ...
    }
}
```

request는 SimpleClientHttpRequestFactory에 의해 생성됐기 때문에 HttpURLConnection을 가지고 있다.  
그리고 request.execute()를 쭉 타고가보자.  
```java
public abstract class AbstractClientHttpRequest implements ClientHttpRequest {
    // ...
    @Override
    public final ClientHttpResponse execute() throws IOException {
        assertNotExecuted();
        ClientHttpResponse result = executeInternal(this.headers);
        this.executed = true;
        return result;
    }
    // ...
}
```

```java
abstract class AbstractBufferingClientHttpRequest extends AbstractClientHttpRequest {
    // ...
    @Override
    protected ClientHttpResponse executeInternal(HttpHeaders headers) throws IOException {
        byte[] bytes = this.bufferedOutput.toByteArray();
        if (headers.getContentLength() < 0) {
            headers.setContentLength(bytes.length);
        }
        ClientHttpResponse result = executeInternal(headers, bytes);
        this.bufferedOutput = new ByteArrayOutputStream(0);
        return result;
    }
    // ...
}
```

```java
final class SimpleBufferingClientHttpRequest extends AbstractBufferingClientHttpRequest {
    // ...
    @Override
    protected ClientHttpResponse executeInternal(HttpHeaders headers, byte[] bufferedOutput) throws IOException {
        addHeaders(this.connection, headers);
        // JDK <1.8 doesn't support getOutputStream with HTTP DELETE
        if (getMethod() == HttpMethod.DELETE && bufferedOutput.length == 0) {
            this.connection.setDoOutput(false);
        }
        if (this.connection.getDoOutput() && this.outputStreaming) {
            this.connection.setFixedLengthStreamingMode(bufferedOutput.length);
        }
        this.connection.connect();
        if (this.connection.getDoOutput()) {
            FileCopyUtils.copy(bufferedOutput, this.connection.getOutputStream());
        }
        else {
            // Immediately trigger the request in a no-output scenario as well
            this.connection.getResponseCode();
        }
        return new SimpleClientHttpResponse(this.connection);
    }
    // ...
}
```

this.connection.connect()에서 실제 커넥션을 맺는데 한번 들어가보자.  
```java
public class HttpURLConnection extends java.net.HttpURLConnection {
    // ...
    public void connect() throws IOException {
        synchronized (this) {
            connecting = true;
        }
        plainConnect();
    }
    // ...
    protected void plainConnect()  throws IOException {
       // ...
       plainConnect0();
       // ...
    }
    // ...
    protected void plainConnect0()  throws IOException {
        // ...
        http = getNewHttpClient(url, p, connectTimeout, false);
        // ...
    }
    // ...
    // subclass HttpsClient will overwrite & return an instance of HttpsClient
    protected HttpClient getNewHttpClient(URL url, Proxy p, int connectTimeout)
        throws IOException {
        return HttpClient.New(url, p, connectTimeout, this);
    }
    // ...
}
```
이제 HttpClient 클래스를 봐보자.  
```java
public class HttpClient extends NetworkClient {
    /* where we cache currently open, persistent connections */
    protected static KeepAliveCache kac = new KeepAliveCache();
    // ...
    public static HttpClient New(URL url, Proxy p, int to,
        HttpURLConnection httpuc) throws IOException
    {
        return New(url, p, to, true, httpuc);
    }
    // ...
    public static HttpClient New(URL url, Proxy p, int to, boolean useCache,
        HttpURLConnection httpuc) throws IOException
    {
        if (p == null) {
            p = Proxy.NO_PROXY;
        }
        HttpClient ret = null;
        /* see if one's already around */
        if (useCache) {
            ret = kac.get(url, null);
            // ...
        }
        if (ret == null) {
            ret = new HttpClient(url, p, to);
        } else {
            // ...
        }
        return ret;
    }
    // ...
}
```
`kac.get(url, null)` - KeepAliveCache에 이미 커넥션이 존재하는지 확인하고 없으면 새로운 커넥션을 맺고 있다.
`protected static KeepAliveCache kac = new KeepAliveCache();`에서 보다싶이 KeepAliveCache는 static 변수이다보니 어플리케이션 전역에서 공유되는 자원이다. (즉, 서로 다른 SimpleClientHttpRequestFactory를 가진 RestTemplate이라도 커넥션 풀을 공유한다는 소리다.)
캐시에 이미 맺어진 커넥션이 캐시에 존재한다면 그걸 사용하고, 아니면 다시 tcp 커넥션을 맺는다. 
이제 KeepAliveCache가 어떻게 생겨먹었는지 보자.
  
```java
public class KeepAliveCache
    extends HashMap<KeepAliveKey, ClientVector>
    implements Runnable {
    // ...
    public synchronized HttpClient get(URL url, Object obj) {

        KeepAliveKey key = new KeepAliveKey(url, obj);
        ClientVector v = super.get(key);
        if (v == null) { // nothing in cache yet
            return null;
        }
        return v.get();
    }
    // ...
}

class KeepAliveKey {
    private String      protocol = null;
    private String      host = null;
    private int         port = 0;
    private Object      obj = null; // additional key, such as socketfactory

    /**
     * Constructor
     *
     * @param url the URL containing the protocol, host and port information
     */
    public KeepAliveKey(URL url, Object obj) {
        this.protocol = url.getProtocol();
        this.host = url.getHost();
        this.port = url.getPort();
        this.obj = obj;
    }
    
    /**
     * Determine whether or not two objects of this type are equal
     */
    @Override
    public boolean equals(Object obj) {
        if ((obj instanceof KeepAliveKey) == false)
            return false;
        KeepAliveKey kae = (KeepAliveKey)obj;
        return host.equals(kae.host)
            && (port == kae.port)
            && protocol.equals(kae.protocol)
            && this.obj == kae.obj;
    }

    /**
     * The hashCode() for this object is the string hashCode() of
     * concatenation of the protocol, host name and port.
     */
    @Override
    public int hashCode() {
        String str = protocol+host+port;
        return this.obj == null? str.hashCode() :
            str.hashCode() + this.obj.hashCode();
    }
}

class ClientVector extends java.util.Stack<KeepAliveEntry> {
    // ...
    synchronized HttpClient get() {
        if (empty()) {
            return null;
        } else {
            // Loop until we find a connection that has not timed out
            HttpClient hc = null;
            long currentTime = System.currentTimeMillis();
            do {
                KeepAliveEntry e = pop();
                if ((currentTime - e.idleStartTime) > nap) {
                    e.hc.closeServer();
                } else {
                    hc = e.hc;
                }
            } while ((hc== null) && (!empty()));
            return hc;
        }
    }
    // ...
}

class KeepAliveEntry {
    HttpClient hc;
    long idleStartTime;

    KeepAliveEntry(HttpClient hc, long idleStartTime) {
        this.hc = hc;
        this.idleStartTime = idleStartTime;
    }
}
```
![](/images/simple-client-http-request-factory-connection-pool/keep-alive-cache.png)  
KeepAliveCache를 보면 KeepAliveKey(프로토콜, 호스트, 포트)를 키로 가지고 있고, ClientVector(Stack을 상속받음)에 실제 커넥션(KeepAliveEntry)들이 들어있다.
그리고 스택에서 하나씩 커넥션을 꺼내오고 있다.

그럼 언제 KeepAliveCache에 put 할까??
```java
final class SimpleBufferingClientHttpRequest extends AbstractBufferingClientHttpRequest {
    // ...
    @Override
    protected ClientHttpResponse executeInternal(HttpHeaders headers, byte[] bufferedOutput) throws IOException {
        addHeaders(this.connection, headers);
        // JDK <1.8 doesn't support getOutputStream with HTTP DELETE
        if (getMethod() == HttpMethod.DELETE && bufferedOutput.length == 0) {
            this.connection.setDoOutput(false);
        }
        if (this.connection.getDoOutput() && this.outputStreaming) {
            this.connection.setFixedLengthStreamingMode(bufferedOutput.length);
        }
        this.connection.connect();
        if (this.connection.getDoOutput()) {
            FileCopyUtils.copy(bufferedOutput, this.connection.getOutputStream());
        }
        else {
            // Immediately trigger the request in a no-output scenario as well
            this.connection.getResponseCode();
        }
        return new SimpleClientHttpResponse(this.connection);
    }
    // ...
}
```

커넥션을 모두 끝마치고 this.connection.getResponseCode() 쪽을 주목해보자.  
```java
abstract public class HttpURLConnection extends URLConnection {
    // ...
    public int getResponseCode() throws IOException {
        /*
         * We're got the response code already
         */
        if (responseCode != -1) {
            return responseCode;
        }

        /*
         * Ensure that we have connected to the server. Record
         * exception as we need to re-throw it if there isn't
         * a status line.
         */
        Exception exc = null;
        try {
            getInputStream();
        } catch (Exception e) {
            exc = e;
        }
        // ...
    }
    // ...
}
```

```java
public class HttpURLConnection extends java.net.HttpURLConnection {
    // ...
    protected HttpClient http;
    // ...
    @Override
    public synchronized InputStream getInputStream() throws IOException {
        // ...
        return getInputStream0();
        // ...
    }
    // ...
    private synchronized InputStream getInputStream0() throws IOException {
        // ...
        http.parseHTTP(responses, pi, this);
        // ...
        http.finished();
        // ...                
    }
    // ...
}
```
먼저 parseHTTP부터 봐보자 (응답의 헤더를 파싱한다)
```java
public class HttpClient extends NetworkClient {
    // ...
    volatile boolean keepingAlive = false;     /* this is a keep-alive connection */
    volatile boolean disableKeepAlive;/* keep-alive has been disabled for this
                                         connection - this will be used when
                                         recomputing the value of keepingAlive */
    int keepAliveConnections = -1;    /* number of keep-alives left */

    /**Idle timeout value, in milliseconds. Zero means infinity,
     * iff keepingAlive=true.
     * Unfortunately, we can't always believe this one.  If I'm connected
     * through a Netscape proxy to a server that sent me a keep-alive
     * time of 15 sec, the proxy unilaterally terminates my connection
     * after 5 sec.  So we have to hard code our effective timeout to
     * 4 sec for the case where we're using a proxy. *SIGH*
     */
    int keepAliveTimeout = 0;
    // ...

    /** Parse the first line of the HTTP request.  It usually looks
            something like: "HTTP/1.0 <number> comment\r\n". */
    
    public boolean parseHTTP(MessageHeader responses, ProgressSource pi, HttpURLConnection httpuc)
    throws IOException {
        /* If "HTTP/*" is found in the beginning, return true.  Let
         * HttpURLConnection parse the mime header itself.
         *
         * If this isn't valid HTTP, then we don't try to parse a header
         * out of the beginning of the response into the responses,
         * and instead just queue up the output stream to it's very beginning.
         * This seems most reasonable, and is what the NN browser does.
         */

        try {
            serverInput = serverSocket.getInputStream();
            if (capture != null) {
                serverInput = new HttpCaptureInputStream(serverInput, capture);
            }
            serverInput = new BufferedInputStream(serverInput);
            return (parseHTTPHeader(responses, pi, httpuc));
        }
        // ...
    }
    // ...
    private boolean parseHTTPHeader(MessageHeader responses, ProgressSource pi, HttpURLConnection httpuc)
    throws IOException {
        /* If "HTTP/*" is found in the beginning, return true.  Let
         * HttpURLConnection parse the mime header itself.
         *
         * If this isn't valid HTTP, then we don't try to parse a header
         * out of the beginning of the response into the responses,
         * and instead just queue up the output stream to it's very beginning.
         * This seems most reasonable, and is what the NN browser does.
         */

        keepAliveConnections = -1;
        keepAliveTimeout = 0;
        // ...
        HeaderParser p = new HeaderParser(responses.findValue("Keep-Alive"));
        /* default should be larger in case of proxy */
        keepAliveConnections = p.findInt("max", usingProxy?50:5);
        keepAliveTimeout = p.findInt("timeout", usingProxy?60:5);
        // ...
    }
    // ...
}
```
Keep-Alive 헤더를 파싱해서 max(커넥션 재활용 가능 횟수), timeout(응답 이후 커넥션 유지 기간) 파라미터의 값을 가져오고 있는데 proxy를 쓰지 않는다는 가정하에 둘 다 기본값이 5이다.   
그리고 이번에는 finished 메서드를 봐보자.

```java
public class HttpClient extends NetworkClient {
    // ...

    /* return it to the cache as still usable, if:
     * 1) It's keeping alive, AND
     * 2) It still has some connections left, AND
     * 3) It hasn't had a error (PrintStream.checkError())
     * 4) It hasn't timed out
     *
     * If this client is not keepingAlive, it should have been
     * removed from the cache in the parseHeaders() method.
     */
    
    public void finished() {
        if (reuse) /* will be reused */
            return;
        keepAliveConnections--;
        poster = null;
        if (keepAliveConnections > 0 && isKeepingAlive() &&
               !(serverOutput.checkError())) {
            /* This connection is keepingAlive && still valid.
             * Return it to the cache.
             */
            putInKeepAliveCache();
        } else {
            closeServer();
        }
    }
    // ...
    protected synchronized void putInKeepAliveCache() {
        if (inCache) {
            assert false : "Duplicate put to keep alive cache";
            return;
        }
        inCache = true;
        kac.put(url, null, this);
    }
    // ...
}
```
keepAliveConnections(max 파라미터)에서 하나 까고 커넥션 재사용 횟수가 아직 남아있다면 KeepAliveCache에 집어넣고 있다.  

```java
public class KeepAliveCache
    extends HashMap<KeepAliveKey, ClientVector>
    implements Runnable {
    // ...
    /**
     * Register this URL and HttpClient (that supports keep-alive) with the cache
     * @param url  The URL contains info about the host and port
     * @param http The HttpClient to be cached
     */
    public synchronized void put(final URL url, Object obj, HttpClient http) {
        // ...
        KeepAliveKey key = new KeepAliveKey(url, obj);
        ClientVector v = super.get(key);

        if (v == null) {
            int keepAliveTimeout = http.getKeepAliveTimeout();
            v = new ClientVector(keepAliveTimeout > 0?
                                 keepAliveTimeout*1000 : LIFETIME);
            v.put(http);
            super.put(key, v);
        } else {
            v.put(http);
        }
    }
}

class ClientVector extends java.util.Stack<KeepAliveEntry> {
    // ...
    /* return a still valid, unused HttpClient */
    synchronized void put(HttpClient h) {
        if (size() >= KeepAliveCache.getMaxConnections()) {
            h.closeServer(); // otherwise the connection remains in limbo
        } else {
            push(new KeepAliveEntry(h, System.currentTimeMillis()));
        }
    }
    // ...
}
```
ClientVector(커넥션 풀)의 사이즈가 KeepAliveCache의 maxConnections보다 작지 않으면 커넥션을 바로 끊고 있다.  
그게 아니면 커넥션 풀에 여유가 있다는 거니 밀어넣고 있다.  

```java
public class KeepAliveCache
    extends HashMap<KeepAliveKey, ClientVector>
    implements Runnable {
    private static final long serialVersionUID = -2937172892064557949L;

    /* maximum # keep-alive connections to maintain at once
     * This should be 2 by the HTTP spec, but because we don't support pipe-lining
     * a larger value is more appropriate. So we now set a default of 5, and the value
     * refers to the number of idle connections per destination (in the cache) only.
     * It can be reset by setting system property "http.maxConnections".
     */
    static final int MAX_CONNECTIONS = 5;
    static int result = -1;
    static int getMaxConnections() {
        if (result == -1) {
            result = java.security.AccessController.doPrivileged(
                new sun.security.action.GetIntegerAction("http.maxConnections",
                                                         MAX_CONNECTIONS))
                .intValue();
            if (result <= 0)
                result = MAX_CONNECTIONS;
        }
            return result;
    }
}
```
커넥션 풀의 최대 사이즈는 기본값이 5이고, http.maxConnections이라는 시스템 프로퍼티를 사용한다는 것을 알 수 있다.  

## 결론
사실 맨 상단에 있는 N줄 요약이 결론이나 다름없다.
다만 왜 커넥션이 5개가 넘어가면 커넥션을 바로 끊었는지, route(프로토콜, 호스트, 포트)가 다르다면 커넥션이 5개가 넘어가도 왜 커넥션이 유지되었는지 알게 되어 좋았다.  
하지만 SimpleClientHttpRequestFactory는 다양한 단점 때문에 실무에서 쓸만한 수준이 아닌데 괜히 깊게 판 것 같아서 시간이 좀 아깝다는 생각도 많이 들었다. (앞으로 좀 쓸 데 없어보이면 적당히만 파보고 더 가치있는 것을 딥하게 파야겠다.)  
