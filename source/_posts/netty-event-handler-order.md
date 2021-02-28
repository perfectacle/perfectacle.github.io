---
title: Netty 이벤트 핸들러 실행 순서
tags:
  - TCP
  - Netty
category:
  - Note
  - Netty
date: 2021-02-28 15:53:46
---


Netty를 사용하다보면 채널 파이프라인에 여러 이벤트 핸들러를 추가하기 마련이다.  
그러다보니 순서가 중요할 때가 있다.  
1. 클라에서 보낸 데이터 중에 헤더를 파싱하고,  
1. 헤더에 따라 바디를 파싱하고,
1. 바디를 토대로 뭔가를 또 처리해야하고...

이런 식으로 N 개의 이벤트 핸들러를 붙여야하고, 순서가 중요하다보니 어떤 순서대로 실행되는지가 궁금해졌다.  

## Inbound Event Handler
```kotlin
class ExampleHandler1 : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        println("1")
        ctx.fireChannelRead(msg)
    }
}

class ExampleHandler2 : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        println("2")
        ctx.fireChannelRead(msg)
    }
}

class ExampleHandler3 : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        println("3")
        ctx.fireChannelRead(msg)
    }
}
```

그리고 채널 파이프라인에 순서대로 등록해주자.  
```kotlin
// ...
object : ChannelInitializer<Channel>() {
    override fun initChannel(ch: Channel) {
      ch.pipeline()
        .addLast(ExampleHandler1())
        .addLast(ExampleHandler2())
        .addLast(ExampleHandler3())
   }
}
// ...
```

![Bottom-Up 순서대로 실행되기 때문에 때문에 먼저 등록한 ExampleHandler1부터 순서대로 실행된다.](/images/netty-event-handler-order/inbound-event-handler-order.png)

## Outbound Event Handler
Outbound Event를 발생시키기 위해서는 Inbound Event Handler에서 Outbound Event를 한 번 발생시켜야하기 때문에 둘을 짬뽕시켜보았다.  
```kotlin
class InboundHandler1 : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        println("1")
        ctx.write(msg)
    }
}

class OutboundHandler2 : ChannelOutboundHandlerAdapter() {
    override fun write(ctx: ChannelHandlerContext, msg: Any, promise: ChannelPromise) {
        println("2")
        ctx.write(msg, promise)
    }
}

class OutboundHandler3 : ChannelOutboundHandlerAdapter() {
    override fun write(ctx: ChannelHandlerContext, msg: Any, promise: ChannelPromise) {
        println("3")
        ctx.write(msg, promise)
    }
}
```

그리고 채널 파이프라인에 순서대로 등록해보았다.  
```kotlin
object : ChannelInitializer<Channel>() {
    override fun initChannel(ch: Channel) {
      ch.pipeline()
        .addLast(InboundHandler1())
        .addLast(OutboundHandler2())
        .addLast(OutboundHandler3())
   }
}
```

하지만 1만 출력되고, 2와 3은 출력되지 않았다.  
답은 Outbound Event는 Top-down 순서로 실행되기 때문이다.
![Top-down 순서대로 실행되기 때문에 Outbound Event가 발생한 InboundHandler 아래에 OutboundHandler가 없어서 이벤트를 처리하지 못했다.](/images/netty-event-handler-order/outbound-event-handler-order.png)

```kotlin
object : ChannelInitializer<Channel>() {
    override fun initChannel(ch: Channel) {
      ch.pipeline()
        .addLast(OutboundHandler3())
        .addLast(OutboundHandler2())
        .addLast(InboundHandler1())
   }
}
```
![Top-down 순서대로 실행되기 때문에 Outbound Event가 발생한 InboundHandler 아래에 OutboundHandler들이 등록된 순서 역순으로 실행된다.](/images/netty-event-handler-order/outbound-event-handler-order-2.png)  
OutboundHandler2, OutboundHandler3 순서대로 실행돼서 1이 찍힌 후에 2와 3이 찍힌다.

## Duplex Event Handler
Inbound/Outbound Event를 모두 핸들링하는 Duplex Event Handler를 추가해서 실행 순서를 살펴보자.  
```kotlin
class InboundHandler1 : ChannelInboundHandlerAdapter() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        println("1")
        ctx.write(msg)
    }
}

class OutboundHandler2 : ChannelOutboundHandlerAdapter() {
    override fun write(ctx: ChannelHandlerContext, msg: Any, promise: ChannelPromise) {
        println("2")
        ctx.write(msg, promise)
    }
}

class DuplexHandler3 : ChannelDuplexHandler() {
    override fun channelRead(ctx: ChannelHandlerContext, msg: Any) {
        println("3 - read")
        ctx.fireChannelRead(msg)
    }

    override fun write(ctx: ChannelHandlerContext, msg: Any, promise: ChannelPromise) {
        println("3 - write")
        ctx.write(msg, promise)
    }
}

class OutboundHandler4 : ChannelOutboundHandlerAdapter() {
    override fun write(ctx: ChannelHandlerContext, msg: Any, promise: ChannelPromise) {
        println("4")
        ctx.write(msg, promise)
    }
}
```

채널 파이프라인에 추가해주자.  
```kotlin
object : ChannelInitializer<Channel>() {
    override fun initChannel(ch: Channel) {
      ch.pipeline()
        .addLast(OutboundHandler4())
        .addLast(DuplexHandler3())
        .addLast(OutboundHandler2())
        .addLast(InboundHandler1())
   }
}
```
![](/images/netty-event-handler-order/duplex-event-handler-order.png)  
Inbound Handler는 Bottom-up 순서대로 실행되기 때문에
1. 먼저 등록된 DuplexHandler3의 `3 - read` 출력
1. 그 후 등록된 InboundHandler1의 `1` 출력

Outbound Handler는 Top-down 순서대로 실행되기 때문에
1. OutboundHandler2의 `2` 출력
1. DuplexHandler3의 `3 - write` 출력
1. OutboundHandler4의 `4` 출력