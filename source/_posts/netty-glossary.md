---
title: Netty 용어사전
tags:
  - TCP
  - Netty
category:
  - Note
  - Java
date: 2021-02-28 00:32:51
---


Netty의 개념이 하도 익숙하지 않아 [자바 네트워크 소녀 네티](https://www.hanbit.co.kr/media/books/book_view.html?p_code=B2683487348)를 보고 용어를 정리해봄.

## [Netty](https://netty.io/)
> Netty is an asynchronous event-driven network application framework 
for rapid development of maintainable high performance protocol servers & clients.

네티는 비동기 이벤트 기반 네트워크 어플리케이션 프레임워크로써 유지보수를 고려한 고성능 프로토콜 서버와 클라이언트를 빠르게 개발할 수 있다.
즉, TCP 통신을 위해 무조건 Netty를 써야하는 건 아니지만 유지보수하기도 쉽고, 비동기 이벤트 기반이기 때문에 고성능도 보장하게 된다.  
[Spring Integration](https://docs.spring.io/spring-integration/reference/html/ip.html) 또한 TCP 통신을 지원한다.
> Spring Integration provides channel adapters for receiving and sending messages over internet protocols. 
  Both UDP (User Datagram Protocol) and TCP (Transmission Control Protocol) adapters are provided.

## Bootstrap
네티로 작성한 네트워크 어플리케이션의 동작 방식과 환경을 설정하는 도우미 클래스, 주로 클라이언트 어플리케이션에 사용된다.  
추상화가 잘 돼있어서 블로킹 모드에서 논블로킹 모드로 바꾸는 등의 설정이 매우 쉬우며 아래 설정이 가능하다.    
* 전송 계층 (소켓 모드 및 I/O 종류)
* 이벤트 루프 (단일 스레드, 다중 스레드)
* 채널 파이프라인 설정
* 소켓 주소와 포트
* 소켓 옵션

```kotlin
fun main() {
    // BootStrap
    val bootstrap = Bootstrap()

    // 이벤트 루프 (단일 스레드, 다중 스레드)
    val group: EventLoopGroup = NioEventLoopGroup()

    bootstrap
        .group(group) // 이벤트 루프
        .channel(NioServerSocketChannel::class.java) // 전송 계층 (소켓 모드 및 I/O 종류)
        .option(ChannelOption.SO_BACKLOG, 100) // 채널 옵션
        .handler(object : ChannelInitializer<Channel>() { // 채널 데이터 가공 핸들러
            override fun initChannel(ch: Channel) { // 소켓 채널이 생성될 때(서버와 연결을 맺을 때) 실행됨
                // 채널 파이프라인 설정
                ch.pipeline().addLast(ReadTimeoutHandler(60, TimeUnit.SECONDS))
            }
        })

    // 서버의 주소와 포트
    val f: ChannelFuture = bootstrap.connect("localhost", 8080)
}
```

## ServerBootstrap
Bootstrap 중에 서버의 설정을 돕기 위한 클래스, 주로 서버 어플리케이션에 사용된다.
아래 설정이 가능하다.  
* 전송 계층 (소켓 모드 및 I/O 종류)
* 이벤트 루프 (단일 스레드, 다중 스레드)
  * 서버 소켓 채널 이벤트 루프
  * 소켓 채널 이벤트 루프
* 채널 파이프라인 설정
  * 서버 소켓 채널 파이프라인 설정
  * 소켓 채널 파이프라인 설정
* 소켓 주소와 포트
* 소켓 옵션

서버 소켓 채널은 특정 포트를 listen하고 있다가 해당 포트로 커넥션 요청이 들어오면 해당 커넥션을 요청한 클라이언트와 통신하기 위해 소켓 채널을 만든다.  
실질적인 통신은 소켓 채널에서 이루어진다.  

```kotlin
fun main() {
    // ServerBootStrap
    val bootstrap = ServerBootstrap()
    
    // 이벤트 루프 (단일 스레드, 다중 스레드)
    val bossGroup: EventLoopGroup = NioEventLoopGroup()
    val workerGroup: EventLoopGroup = NioEventLoopGroup()

    bootstrap
        .group(
            bossGroup, // 서버 소켓 채널 이벤트 루프
            workerGroup // 소켓 채널 이벤트 루프
        )
        .channel(NioServerSocketChannel::class.java) // 전송 계층 (소켓 모드 및 I/O 종류)
        .option(ChannelOption.SO_BACKLOG, 100) // 서버 소켓 채널 옵션
        .childOption(ChannelOption.TCP_NODELAY, false) // 소켓 채널 옵션
        .handler(object : ChannelInitializer<Channel>() { // 서버 소켓 채널
            override fun initChannel(ch: Channel) { // 서버 소켓 채널 데이터 가공 핸들러 (서버 소켓 채널이 생성될 때(서버 소켓에 포트가 바인딩될 때) 실행됨)
                // 서버 소켓 채널 파이프라인 설정
                ch.pipeline().addLast(ReadTimeoutHandler(60, TimeUnit.SECONDS))
            }
        })
        .childHandler(object : ChannelInitializer<Channel>() { // 소켓 채널
            override fun initChannel(ch: Channel) { // 소켓 채널 데이터 가공 핸들러 (소켓 채널이 생성될 때(클라이언트와 연결을 맺을 때) 실행됨)
                // 소켓 채널 파이프라인 설정
                ch.pipeline().addLast(ReadTimeoutHandler(60, TimeUnit.SECONDS))
            }
        })

    // 서버 소켓 채널 주소와 포트
    val f: ChannelFuture = bootstrap.bind(123)
}
```

## EventLoopGroup
EventLoop를 그룹핑한 것이다.  
여러 EventLoop가 존재하는데 그 중에 나는 NioEventLoopGroup를 주로 사용한다.  

```java
public class NioEventLoopGroup extends MultithreadEventLoopGroup {
```
NioEventLoopGroup은 멀티쓰레드 환경의 이벤트 루프 그룹이다.  
또한 NioEventLoopGroup은 기본 생성자를 사용하면 `CPU 코어 수 * 2`개의 EventLoop가 생성된다.

```java
public class NioEventLoopGroup extends MultithreadEventLoopGroup {
    public NioEventLoopGroup() {
        this(0);
    }
    // ...
    public NioEventLoopGroup(int nThreads, Executor executor, final SelectorProvider selectorProvider,
                             final SelectStrategyFactory selectStrategyFactory) {
        super(nThreads, executor, selectorProvider, selectStrategyFactory, RejectedExecutionHandlers.reject());
    }
}

public abstract class MultithreadEventLoopGroup extends MultithreadEventExecutorGroup implements EventLoopGroup {
    private static final int DEFAULT_EVENT_LOOP_THREADS;

    static {
        DEFAULT_EVENT_LOOP_THREADS = Math.max(1, SystemPropertyUtil.getInt(
            "io.netty.eventLoopThreads", NettyRuntime.availableProcessors() * 2)); // <-- CPU 코어 갯수에 2를 곱하고  있다.
    }

    protected MultithreadEventLoopGroup(int nThreads, Executor executor, Object... args) { 
        super(nThreads == 0 ? DEFAULT_EVENT_LOOP_THREADS : nThreads, executor, args); // <-- 기본 생성자는 nThreads가 0이다.
    }
}

public final class NettyRuntime {
    public static int availableProcessors() {
        return holder.availableProcessors();
    }

    private static final AvailableProcessorsHolder holder = new AvailableProcessorsHolder();
    static class AvailableProcessorsHolder {
        private int availableProcessors;
        synchronized int availableProcessors() { 
            if (this.availableProcessors == 0) { 
                final int availableProcessors = 
                        SystemPropertyUtil.getInt(
                            "io.netty.availableProcessors", 
                            Runtime.getRuntime().availableProcessors() // <-- 여기에서 CPU 코어 갯수를 반환함.
                        );
                setAvailableProcessors(availableProcessors); 
            }
            return this.availableProcessors; 
        }

        synchronized void setAvailableProcessors(final int availableProcessors) { 
            ObjectUtil.checkPositive(availableProcessors, "availableProcessors");
            if (this.availableProcessors != 0) { 
                final String message = String.format(
                    Locale.ROOT, 
                    "availableProcessors is already set to [%d], rejecting [%d]", 
                    this.availableProcessors, 
                    availableProcessors
                );
                throw new IllegalStateException(message); 
            }
            this.availableProcessors = availableProcessors; 
        }
    }
}
```

이제 CPU 코어수 * 2개라는 건 알았으니까 정말로 그만큼의 NioEventLoop이 생성되는지 보자.

```java
public abstract class MultithreadEventLoopGroup extends MultithreadEventExecutorGroup implements EventLoopGroup {
    protected MultithreadEventLoopGroup(int nThreads, Executor executor, Object... args) { 
        super(nThreads == 0 ? DEFAULT_EVENT_LOOP_THREADS : nThreads, executor, args); // <-- 기본 생성자는 nThreads가 0이다.
    }
    
    protected MultithreadEventExecutorGroup(int nThreads, Executor executor, Object... args) {
        this(nThreads, executor, DefaultEventExecutorChooserFactory.INSTANCE, args); 
    }

    private final EventExecutor[] children;

    protected MultithreadEventExecutorGroup(int nThreads, Executor executor,
                                            EventExecutorChooserFactory chooserFactory, Object... args) { 
        if (nThreads <= 0) { 
            throw new IllegalArgumentException(String.format("nThreads: %d (expected: > 0)", nThreads)); 
        }
        
        if (executor == null) { 
            executor = new ThreadPerTaskExecutor(newDefaultThreadFactory());
        }

        children = new EventExecutor[nThreads]; // 코어 갯수 * 2개의 배열 생성

        for (int i = 0; i < nThreads; i ++) { // 코어 갯수 * 2개만큼 반복
            boolean success = false;
            try { 
                children[i] = newChild(executor, args);
                // ...
            }
        }
    }
}

public class NioEventLoopGroup extends MultithreadEventLoopGroup {
    @Override
    protected EventLoop newChild(Executor executor, Object... args) throws Exception {
        EventLoopTaskQueueFactory queueFactory = args.length == 4 ? (EventLoopTaskQueueFactory) args[3] : null;
        return new NioEventLoop(this, executor, (SelectorProvider) args[0], 
                ((SelectStrategyFactory) args[1]).newSelectStrategy(), (RejectedExecutionHandler) args[2], queueFactory); 
    }
}
```

## EventLoop
EventLoop는 이벤트가 올 때까지 무한 반복을 도는 쓰레드이다.   
EventLoopGroup에 따라 어떤 EventLoop가 생성될지 모르는데 나는 주로 NioEventLoopGroup을 사용하다보니 NioEventLoop를 파보았다.

```java
public final class NioEventLoop extends SingleThreadEventLoop {
    @Override
    protected void run() {
        int selectCnt = 0;
        for (; ; ) { // 무한 반복
            // ...
        }
    }
}
```
NioEventLoop는 단일 쓰레드 이벤트 루프이다. (하나의 이벤트 루프에 하나의 쓰레드 할당)  
그럼 이벤트가 올 때까지 해당 쓰레드가 block되는 건 아닐까? 하는 의문이 들었다.

```java
public final class NioEventLoop extends SingleThreadEventLoop {
    private final SelectorProvider provider;
  
    NioEventLoop(NioEventLoopGroup parent, Executor executor, SelectorProvider selectorProvider,
                 SelectStrategy strategy, RejectedExecutionHandler rejectedExecutionHandler, 
                 EventLoopTaskQueueFactory queueFactory) { 
        super(parent, executor, false, newTaskQueue(queueFactory), newTaskQueue(queueFactory), 
                rejectedExecutionHandler);
        this.provider = ObjectUtil.checkNotNull(selectorProvider, "selectorProvider");
        this.selectStrategy = ObjectUtil.checkNotNull(strategy, "selectStrategy");
        final SelectorTuple selectorTuple = openSelector();
        this.selector = selectorTuple.selector;
        this.unwrappedSelector = selectorTuple.unwrappedSelector; 
    }
    
    private final IntSupplier selectNowSupplier = new IntSupplier() {
        @Override 
        public int get() throws Exception { 
            return selectNow(); 
        }
    };
    
    int selectNow() throws IOException { 
        return selector.selectNow(); 
    }
}
```
![](/images/netty-glossary/nio-event-loop.png)
selector는 io.netty.channel.nio.SelectedSelectionKeySetSelector 클래스이다.  
그리고 그 안에 delegate는 KQueueSelectorImpl이다.
[JRE마다 SelectorImpl은 달라질 수 있다.](https://stackoverflow.com/questions/7916324/do-nio-selectors-use-event-notifications-by-default)  
````text
Windows 
sun.nio.ch.WindowsSelectorImpl

Mac OS 
sun.nio.ch.KQueueSelectorImpl

Linux 
sun.nio.ch.EPollSelectorImpl

Solaris
sun.nio.ch.PollSelectorImpl
````

```java
final class SelectedSelectionKeySetSelector extends Selector {
    private final SelectedSelectionKeySet selectionKeys;
    private final Selector delegate;

    @Override
    public int selectNow() throws IOException {
        selectionKeys.reset();
        return delegate.selectNow();
    }
}

public abstract class SelectorImpl
        extends AbstractSelector
{
  public int selectNow() throws IOException {
    return lockAndDoSelect(0);
  }
  
  private int lockAndDoSelect(long timeout) throws IOException {
    synchronized (this) {
      if (!isOpen())
        throw new ClosedSelectorException();
      synchronized (publicKeys) {
        synchronized (publicSelectedKeys) {
          return doSelect(timeout);
        }
      }
    }
  }
}

class KQueueSelectorImpl extends SelectorImpl {
    protected int doSelect(long var1) throws IOException { 
        boolean var3 = false;
        if (this.closed) { 
            throw new ClosedSelectorException(); 
        } else { 
            this.processDeregisterQueue();
            
            int var7;
            try { 
                this.begin();
                var7 = this.kqueueWrapper.poll(var1); 
            } finally { 
                this.end(); 
            }
            
            this.processDeregisterQueue();
            return this.updateSelectedKeys(var7); 
        } 
    }
}

class KQueueArrayWrapper { 
    int poll(long var1) { 
        this.updateRegistrations();
        // var1은 timeout에서 넘어온 0이므로 블락시키지 않고 바로 다음 구문으로 간다.
        int var3 = this.kevent0(this.kq, this.keventArrayAddress, 128, var1);
        return var3; 
    }
    
    private native int kevent0(int var1, long var2, int var4, long var5);
}
```

selectNow 메서드는 KQueue의 timeout에 0을 넘기기 때문에 기다리지 않는다.

## ByteBuf
자바의 바이트 버퍼 클래스(java.nio.ByteBuffer)와 유사하지만 더 나은 성능과 편의성을 가진 Netty의 버퍼 클래스

## Channel
일반적인 소켓 프로그래밍에서 말하는 소켓과 같다고 보면 된다고 함.

## Channel Pipeline
네티의 채널과 이벤트 핸들러 사이에서 연결 통로 역할을 수행.  
채널에서 발생한 이벤트가 채널 파이프라인을 타고 흘러가고, 이벤트 핸들러는 이벤트를 수신한 후에 본인이 처리해야하는 이벤트인지 판단하고 처리한다.

## Event
### Inbound Event
연결 상대방이 어떤 동작을 취했을 때 발생함
* channelRegistered - 채널이 이벤트 루프에 등록되었을 때 발생
  서버 소켓 채널의 channelRegistered 이벤트는 서버 소켓 채널이 생성됐을 때 발생하고, 클라이언트 소켓 채널의 channelRegistered 이벤트는 새로운 클라이언트가 서버에 접속하며 클라이언트 소켓 채널이 생성될 때 발생한다.  
* channelActive - channelRegistered 이후에 발생
  채널이 생성되고 이벤트 루프에 등록된 이후에 네티 API를 사용하여 입출력을 수행할 상태가 되었음을 알려주는 이벤트
* channelRead - 데이터가 수신될 때마다 발생하는 이벤트
* channelReadComplete - 데이터 수신이 완료됐을 때 발생하는 이벤트
  channelRead 이벤트는 채널에 데이터가 있을 때 발생하고, channelReadComplete는 채널의 데이터를 다 읽어서 더 이상 데이터가 없을 때 발생한다.
* channelInactive -  채널이 비활성화되었을 때 발생
* channelUnregistered -  채널이 이벤트 루프에 제거되었을 대 발생

### Outbound Event
프로그래머가 요청한 동작에 해당하는 이벤트
* bind - 서버 소켓 채널이 클라이언트의 연결을 대기하는 IP와 포트가 설정되었을 때 발생
* connect - 클라이언트 소켓 채널이 서버에 연결되었을 때 발생
* disconnect -  클라이언트 소켓 채널의 연결이 끊어졌을 때 발생
* close - 클라이언트 소켓 채널의 연결이 닫혔을 때 발생
* write - 소켓 채널에 데이터가 기록되었을 때 발생
* flush - 소켓 채널에 flush 메서드가 호출되었을 때 발생

## Event Handler
이벤트가 발생했을 때 이벤트를 처리하는 역할을 담당한다.  
크게 이벤트 유형에 따라 ChannelInboundHandler, ChannelOutboundHandler 인터페이스로 나눌 수 있다.

## ChannelHandlerContext
채널에 대한 입출력 처리 및 채널 파이프라인에 대한 상호작용을 도와주는 인터페이스    
ChannelHandlerContext의 writeAndFlush 메서드로 채널에 데이터를 기록하거나 close 메서드로 채널의 연결을 종료할 수 있다.  
또한 ChannelHandlerContext는 채널이 초기화될 때 설정된 채널 파이프라인을 가져오는 메서드를 제공하기 때문에 채널 파이프라인을 수정할 수 있다.  
```kotlin
bootstrap.handler(object : ChannelInitializer<Channel>() {
             override fun initChannel(ch: Channel) {
                 ch.pipeline().addLast(ReadTimeoutHandler(60, TimeUnit.SECONDS))
             }
         })
```

## Codec
보통 동영상 압축 알고리즘을 코덱이라 부름.  
* 원본 -> 인코딩(압축) -> 압축된 동영상 파일
* 압축된 동영상 파일 -> 디코딩 (압축 해제) -> 원본 파일

### Encoder (Outbound Event Handler)
송신 데이터 -> 인코더 (데이터 변환 알고리즘) -> 소켓 채널

### Decoder (Inbound Event Handler)
소켓 채널 -> 디코더 (데이터 변환 알고리즘) -> 수신 데이터