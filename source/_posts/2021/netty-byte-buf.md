---
title: Netty ByteBuf
tags:
  - TCP
  - Netty
categories:
  - Note
  - Netty
date: 2021-02-28 14:34:23
---


Netty는 왜 자바 표준인 NIO의 [ByteBuffer](https://docs.oracle.com/javase/7/docs/api/java/nio/ByteBuffer.html)를 사용하지 않는 걸까 이유를 몰랐는데 [자바 네트워크 소녀 네티](https://www.hanbit.co.kr/media/books/book_view.html?p_code=B2683487348)를 보고 이유를 알게되어 정리해봄.  
ByteBuffer와 ByteBuf의 세부사항 보다는 ByteBuffer는 어떤 문제점을 가지고 있고, ByteBuf는 그 문제점을 어떻게 해결했는지에 초점을 맞추어 정리함.

## ByteBuffer의 문제점
Netty의 [ByteBuf](https://netty.io/4.1/api/io/netty/buffer/ByteBuf.html)는 자바의 ByteBuffer가 가진 문제점들을 해결하기 위해 나왔다.

### 데이터 쓰기/읽기 인덱스가 분리돼있지 않다
```kotlin
val byteBuffer = ByteBuffer.allocate(3) // 3바이트를 담을 수 있는 힙버퍼, 전부 0으로 초기화된다.
println(byteBuffer) // java.nio.HeapByteBuffer[pos=0 lim=3 cap=3]

byteBuffer.put(1)
println(byteBuffer) // java.nio.HeapByteBuffer[pos=1 lim=3 cap=3]

println(byteBuffer.get()) // 0
```

3byte를 담을 수 있는 버퍼를 만들고, 첫 번째 버퍼에 1이라는 바이트를 넣었다.  
그리고나서 읽으려고 하는데 0이 나왔다.  
이유는 쓰기 인덱스와 읽기 인덱스를 pos라는 하나의 변수로 관리하고 있기 때문이다.  

```kotlin
val byteBuffer = ByteBuffer.allocate(3)
println(byteBuffer) // java.nio.HeapByteBuffer[pos=0 lim=3 cap=3]

byteBuffer.put(1)
println(byteBuffer) // java.nio.HeapByteBuffer[pos=1 lim=3 cap=3]

byteBuffer.flip() // 읽기 모드로 변경
println(byteBuffer) // java.nio.HeapByteBuffer[pos=0 lim=1 cap=3]
println(byteBuffer.get()) // 1
```

데이터를 쓰다가 읽으려면 flip을 써서 읽기 모드로 변경해서 pos를 0으로 초기화하고 lim을 현재 포지션인 1로 바꾼다.  
왜냐하면 데이터를 1byte 밖에 안 썼기 때문에 1 byte 밖에 못 읽기 때문이다.  
그럼 정말 flip은 읽기/쓰기 모드 변환으로 생각해도 되는 걸까?

```kotlin
val byteBuffer = ByteBuffer.allocate(3)
println(byteBuffer) // java.nio.HeapByteBuffer[pos=0 lim=3 cap=3]

byteBuffer.put(1)
println(byteBuffer) // java.nio.HeapByteBuffer[pos=1 lim=3 cap=3]

byteBuffer.flip() // 읽기 모드로 변경
println(byteBuffer) // java.nio.HeapByteBuffer[pos=0 lim=1 cap=3]
println(byteBuffer.get()) // 1

byteBuffer.flip() // 쓰기 모드로 변경
println(byteBuffer) // java.nio.HeapByteBuffer[pos=0 lim=1 cap=3]
```
나는 읽기 모드에서 다시 flip을 하면 lim은 3으로 늘어나고 pos는 다시 1으로 원복될 줄 알았는데 그게 아니었다.  

```java
/**
 * Flips this buffer.  The limit is set to the current position and then
 * the position is set to zero.  If the mark is defined then it is
 * discarded.
 *
 * <p> After a sequence of channel-read or <i>put</i> operations, invoke
 * this method to prepare for a sequence of channel-write or relative
 * <i>get</i> operations.  For example:
 *
 * <blockquote><pre>
 * buf.put(magic);    // Prepend header
 * in.read(buf);      // Read data into rest of buffer
 * buf.flip();        // Flip buffer
 * out.write(buf);    // Write header + data to channel</pre></blockquote>
 *
 * <p> This method is often used in conjunction with the {@link
 * java.nio.ByteBuffer#compact compact} method when transferring data from
 * one place to another.  </p>
 *
 * @return  This buffer
 */
public final Buffer flip() {
    limit = position;
    position = 0;
    mark = -1;
    return this;
}
```
읽기/쓰기 모드가 아니라 그냥 버퍼를 flip하는 거라고 한다. (flip이 뒤집다라는 뜻인데 limit을 현재 포지션으로 뒤집는다는 뜻으로 쓰인 건지는 잘 모르겠다.)  
limit을 바꾸지 않고 position만 바꾸고 싶다면 [rewind() 메서드](https://docs.oracle.com/javase/7/docs/api/java/nio/Buffer.html#rewind())를 사용하거나 [position(int newPosition) 메서드](https://docs.oracle.com/javase/7/docs/api/java/nio/Buffer.html#position(int))를 사용해야한다.  

### 버퍼의 사이즈가 고정적이다
limit이나 capacity를 넘어서면 버퍼의 사이즈가 늘어나는 게 아니라 BufferOverflowException 예외를 던진다.  
```kotlin
val byteBuffer = ByteBuffer.allocate(3) // pos: 0, lim: 3, cap: 3
byteBuffer.put(1) // pos: 1, lim: 3, cap: 3
byteBuffer.put(1) // pos: 2, lim: 3, cap: 3
byteBuffer.put(1) // pos: 3, lim: 3, cap: 3
assertThrows<BufferOverflowException> { byteBuffer.put(1) }

val byteBuffer2 = ByteBuffer.allocate(3) // pos: 0, lim: 3, cap: 3
byteBuffer2.put(1) // pos: 1, lim: 3, cap: 3
byteBuffer2.flip() // pos: 0, lim: 1, cap: 3
byteBuffer2.put(1) // pos: 1, lim: 1, cap: 3
assertThrows<BufferOverflowException> { byteBuffer2.put(1) }
```

### 버퍼풀이 존재하지 않는다.
버퍼풀이 존재하지 않기 때문에 버퍼의 생성 및 메모리 해제 작업이 빈번하여 GC도 자주 유발하게 된다.  
이런 단점을 보완하려면 객체 풀링을 제공하는 써드파티 라이브러리를 사용하여야한다.

## 네티의 ByteBuf
네티의 ByteBuf는 위의 문제점들 외에 기타 장점들까지 가지고 있기 때문에 고성능에 유지보수하기 쉬운 코드를 지향한다.  
또한 네티를 쓰지 않더라도 [netty-buffer](https://mvnrepository.com/artifact/io.netty/netty-buffer)를 의존성에 추가하고 ByteBuf만 사용하는 것도 가능하다.

### 읽기/쓰기 인덱스의 분리
ByteBuffer에서는 pos라는 인덱스로 읽기/쓰기 인덱스를 공유하여 데이터를 쓰다가 읽으려면 flip, rewind, poistion 메서드를 통해 pos를 변경해주어야만 했다.  
그리고 flip은 개발자의 혼란을 초래하는 동작방식 때문에 버그를 유발하기도 쉽다. 

ByteBuf는 이런 단점을 보완하고자 읽기/쓰기 인덱스를 분리하였다.
```kotlin
val byteBuf = Unpooled.buffer(3)
println(byteBuf) // ridx: 0, widx: 0, cap: 3
byteBuf.readableBytes() shouldBe 0 // widx(0) - ridx(0) = 0
byteBuf.writableBytes() shouldBe 3 // cap(3) - widx(0) = 3

byteBuf.writeByte(1)
println(byteBuf) // ridx: 0, widx: 1, cap: 3
byteBuf.readableBytes() shouldBe 1 // widx(1) - ridx(0) = 1
byteBuf.writableBytes() shouldBe 2 // cap(3) - widx(1) = 2

byteBuf.readByte() shouldBe 1
println(byteBuf) // ridx: 1, widx: 1, cap: 3
byteBuf.readableBytes() shouldBe 0 // widx(1) - ridx(1) = 0
byteBuf.writableBytes() shouldBe 2 // cap(3) - widx(1) = 2
```

### 버퍼의 사이즈가 가변적이다.
```kotlin
val byteBuf = Unpooled.buffer(3)
println(byteBuf) // ridx: 0, widx: 0, cap: 3
byteBuf.readableBytes() shouldBe 0 // widx(0) - ridx(0) = 0
byteBuf.writableBytes() shouldBe 3 // cap(3) - widx(0) = 3

byteBuf.writeByte(1)
println(byteBuf) // ridx: 0, widx: 1, cap: 3
byteBuf.readableBytes() shouldBe 1 // widx(1) - ridx(0) = 1
byteBuf.writableBytes() shouldBe 2 // cap(3) - widx(1) = 2

byteBuf.writeByte(1)
println(byteBuf) // ridx: 0, widx: 2, cap: 3
byteBuf.readableBytes() shouldBe 2 // widx(2) - ridx(0) = 2
byteBuf.writableBytes() shouldBe 1 // cap(3) - widx(2) = 1

byteBuf.writeByte(1)
println(byteBuf) // ridx: 0, widx: 3, cap: 3
byteBuf.readableBytes() shouldBe 3 // widx(3) - ridx(0) = 3
byteBuf.writableBytes() shouldBe 0 // cap(3) - widx(3) = 0

byteBuf.writeByte(1)
println(byteBuf) // ridx: 0, widx: 4, cap: 64, 버퍼의 사이즈가 가변적으로 늘어났다.
byteBuf.readableBytes() shouldBe 4 // widx(4) - ridx(0) = 3
byteBuf.writableBytes() shouldBe 60 // cap(64) - widx(4) = 60
```
widx가 cap를 넘어가는 순간 버퍼의 사이즈가 늘어난다.  
또한 capacity 메서드를 사용하면 명시적인 버퍼의 사이즈를 지정할 수 있다. (기존 capcity보다 작아지면 기존 데이터는 잘릴 수 있다.)  
당연한 얘기지만 ridx가 widx를 벗어나면 예외를 던지는 건 똑같다.

```kotlin
val byteBuf = Unpooled.buffer(3)
println(byteBuf) // ridx: 0, widx: 0, cap: 3
byteBuf.readableBytes() shouldBe 0 // widx(0) - ridx(0) = 0
byteBuf.writableBytes() shouldBe 3 // cap(3) - widx(0) = 3

byteBuf.writeByte(1)
println(byteBuf) // ridx: 0, widx: 1, cap: 3
byteBuf.readableBytes() shouldBe 1 // widx(1) - ridx(0) = 1
byteBuf.writableBytes() shouldBe 2 // cap(3) - widx(1) = 2

byteBuf.readByte() shouldBe 1
println(byteBuf) // ridx: 1, widx: 1, cap: 3
byteBuf.readableBytes() shouldBe 0 // widx(1) - ridx(1) = 0
byteBuf.writableBytes() shouldBe 2 // cap(3) - widx(1) = 2

val indexOutOfBoundsException = assertThrows<IndexOutOfBoundsException> { byteBuf.readByte() }
indexOutOfBoundsException.printStackTrace()
// java.lang.IndexOutOfBoundsException: readerIndex(1) + length(1) exceeds writerIndex(1): UnpooledByteBufAllocator$InstrumentedUnpooledUnsafeHeapByteBuf(ridx: 1, widx: 1, cap: 3)
//     at io.netty.buffer.AbstractByteBuf.checkReadableBytes0(AbstractByteBuf.java:1478)
//     at io.netty.buffer.AbstractByteBuf.readByte(AbstractByteBuf.java:732)
//     ...
```

### 버퍼풀을 지원한다
풀을 사용하는 이유는 자원을 재활용하기 위함이다.  
그럼 버퍼를 왜 재사용할까? 바로 버퍼를 빈번히 메모리에 할당/해제 함으로써 발생하는 GC 횟수를 줄이기 위함이다.  
```kotlin
// 버퍼풀을 사용하지 않는다.
Unpooled.buffer()
Unpooled.directBuffer() // direct가 붙은 놈은 힙메모리가 아닌 OS의 커널 영역에 바이트 버퍼를 생성함, 생성 시간은 좀 더 걸리지만 읽기/쓰기 성능이 더 좋다.

// 버퍼풀을 사용한다.
ByteBufAllocator.DEFAULT.heapBuffer()
ByteBufAllocator.DEFAULT.directBuffer()
```

#### [Reference counted objects](https://netty.io/wiki/reference-counted-objects.html)
Netty 4 버전 이후로 객체(버퍼)의 라이프사이클은 레퍼런스 카운트에 의해 관리되고 있다.  
만약 어플리케이션에서 더이상 해당 버퍼를 참조하지 않아도, 풀에 반납하지 않는다면 GC가 돌아도 해당 버퍼는 계속 메모리 상에 남아 메모리 누수를 유발한다.   
  
버퍼를 풀에 반납하는 방법은 두 가지가 있다. 
(아래 나오는 예제는 예시일 뿐이지, channelRead 메서드에서만 반납해야한다거나 그런 규칙은 없다.)
##### 채널에 버퍼를 기록한다.  
```kotlin
class EchoHandler : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        ctx.write(msg)
    }
}
```

##### 명시적으로 반환한다.  
```kotlin
class ExampleHandler : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        if (msg !is ByteBuf) return
        println(msg.refCnt()) // 1

        ReferenceCountUtil.retain(msg)
        println(msg.refCnt()) // 2

        ReferenceCountUtil.release(msg)
        println(msg.refCnt()) // 1

        ReferenceCountUtil.release(msg) // 레퍼런스 카운트가 0이 되면서 풀에 반납됨.
        println(msg.refCnt()) // 0

        // 풀에 반납된 객체를 사용하려고 하면 IllegalReferenceCountException 예외를 던진다.
        ReferenceCountUtil.release(msg)
        // io.netty.util.IllegalReferenceCountException: refCnt: 0, decrement: 1
        //    at io.netty.util.internal.ReferenceCountUpdater.toLiveRealRefCnt(ReferenceCountUpdater.java:74)
        //    at io.netty.util.internal.ReferenceCountUpdater.release(ReferenceCountUpdater.java:138)
        //    at io.netty.buffer.AbstractReferenceCountedByteBuf.release(AbstractReferenceCountedByteBuf.java:100)
        //    at io.netty.util.ReferenceCountUtil.release(ReferenceCountUtil.java:88)
        //    ...
    }
}
```

##### 반납 의무를 다음 이벤트 핸들러에게 미루기
바이트버퍼를 다음 이벤트 핸들러에게 넘기지 않을 때는 해당 이벤트 핸들러에서 반납을 해야하지만, 만약 다음 이벤트 핸들러에게 넘긴다면 반납해서는 안 된다.
왜냐하면 IllegalReferenceCountException이 발생하기 때문이다.

```kotlin
class ExampleHandler : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        if (msg !is ByteBuf) return
        println(msg.refCnt()) // 1

        ReferenceCountUtil.retain(msg)
        println(msg.refCnt()) // 2

        ReferenceCountUtil.release(msg)
        println(msg.refCnt()) // 1

        ReferenceCountUtil.release(msg) // 레퍼런스 카운트가 0이 되면서 풀에 반납됨.
        println(msg.refCnt()) // 0

        ctx.fireChannelRead(msg)
    }
}
```
위 이벤트 핸들러 이후 바이트 버퍼를 사용하는 핸들러에서 io.netty.util.IllegalReferenceCountException 예외가 발생한다.

```kotlin
class ExampleHandler : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        ctx.write(msg)

        ctx.fireChannelRead(msg)
    }
}
```
마찬가지로 채널에 버퍼를 기록하는 경우도 풀에 반납하기 때문에 io.netty.util.IllegalReferenceCountException 예외가 발생한다.


따라서 반납하지 않고 바이트버퍼를 사용만 하고 그대로 넘겨주면 된다.
```kotlin
class ExampleHandler : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        // 바이트 버퍼 잘 사용하고 반납은 하지 않기

        ctx.fireChannelRead(msg)
    }
}
```

하지만 뒤에 이벤트 핸들러로 넘겨줄 때도 ridx, widx, capacity는 공유된다.  
동일한 채널에 동일한 이벤트 핸들러를 두 번 등록해보면 ridx가 바뀌는 걸 볼 수 있다.
```kotlin
class ExampleHandler : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        // 첫 번째 - ridx: 0, widx: 1000, cap: 2048
        // 두 번째 - ridx: 1, widx: 1000, cap: 2048
        println(msg)
        (msg as? ByteBuf)?.readByte()

        ctx.fireChannelRead(msg)
    }
}
```

따라서 뒤의 이벤트 핸들러에 영향을 주지 않으려면 ByteBuf를 카피한 후에 카피한 ByteBuf를 사용한 후에 원본 ByteBuf를 다음 이벤트로 넘겨줘야한다.
```kotlin
class ExampleHandler : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        println(msg) // 매번 고정적으로 ridx: 0, widx: 1000, cap: 2048
        if (msg is ByteBuf) {
            val copiedByteBuf = msg.copy()
            copiedByteBuf.readByte()
        }

        ctx.fireChannelRead(msg)
    }
}
```

##### 버퍼풀 반납하기
**후속 이벤트 핸들러에게 바이트 버퍼를 넘기지 않는한** 해당 이벤트 핸들러에서 버퍼풀에 반납하지 않으면 메모리 누수가 발생한다.  
따라서 채널에 기록하던, 반환하던 무조건 풀에 반납하지 않으면 안 된다. (트래픽이 적으면 서서히 메모리 누수가 발생하겠지만 트래픽이 많다면...)  
```kotlin
class ExampleHandler : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        try {
            // ...
        } finally {
            ReferenceCountUtil.safeRelease(msg)
        }
    }
}
```

try로 묶지 않으면 예외 발생 시 메모리 누수가 발생할 수 있으므로 꼭 try로 묶은 후 finally에서 처리하도록 하자.  
그리고 try에서 혹시나 반납을 이미 해버렸고, 반납된 이후에 예외가 터지거나 할 수 있기 때문에 safeRelease(이미 반납됐어도 예외를 던지지 않음) 메서드를 사용하자.
