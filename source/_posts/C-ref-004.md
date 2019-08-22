---
title: (C/C++) 참고용 정리 - 메모리 영역(Code, Data, Stack, Heap)
date: 2017-02-09 14:31:26
category: [Programming, C/C++]
tag: [C, C++, Variable, Static]
---
![](/images/C-ref-004/thumb.png)

프로그램을 실행하게 되면 OS는 메모리(RAM)에 공간을 할당해준다.  
할당해주는 메모리 공간은 4가지(Code, Data, Stack, Heap)으로 나눌 수 있다.  

![메모리의 구조](/images/C-ref-004/memory.png)  
이미지 출처: [C언어의 메모리 구조](http://dsnight.tistory.com/50)

## Code  
우리가 작성한 소스 코드가 들어간다.  
또한 상수도 여기에 들어간다고 한다.  
물론 컴파일 된 기계어가 들어갈 것이다.  
프로그램이 끝날 때까지 메모리에 계속 적재돼있는 놈들이다.  

## Data  
전역 변수, static 변수 등등이 저장된다.  
프로그램이 끝날 때까지 메모리에 계속 적재돼있는 놈들이다.  

## Stack  
지역 변수, 매개 변수, 리턴 값 등등이 저장된다.  
함수 호출 시 생성되고, 함수가 종료되면 시스템에 반환된다.  
프로그램이 자동으로 사용하는 임시 메모리 영역이다.  
또한 이름에서 보듯이 Stack 자료구조를 이용해 구현한 것 같다.  
컴파일 시에 크기가 결정된다.

## Heap
프로그래머가 할당/해제하는 메모리 공간이다.  
malloc() 또는 new 연산자를 통해 할당하고,  
free() 또는 delete 연산자를 통해서만 해제가 가능하다.  
Java에서는 가비지 컬렉터가 자동으로 해제하는 것 같기도 하다.  
이 공간에 메모리 할당하는 것을 동적 할당(Dynamic Memory Allocation)이라고도 부른다.  
런타임 시에 크기가 결정된다.

Stack 영역이 크면 클 수록 Heap 영역이 작아지고, Heap 영역이 크면 클 수록 Stack 영역이 작아진다.  

### 그럼 Heap 영역, 동적 할당은 왜 필요한 것일까?  
* 메모리를 효율적으로 관리할 수 있기 때문이지 않을까?  
임베디드 시스템을 개발하다보면 하드웨어 크기가 매우 작은 경우가 많다.  
하드웨어 크기가 작다는 것은 메모리의 용량도 작음을 의미한다.  
뭐 메모리 용량이 클 수도 있지만, 가격이 매우 비싸질 것이다.  
여튼 그러한 작은 메모리 공간에 프로그래머가 메모리 관리의 달인이라면...  
컴파일러가 자동으로 할당해주는 것보다 더 효율적인 관리가 가능하지 않을까?  

* 배열의 길이를 사용자가 직접 정하고 싶을 경우  
이는 매우 단적인 예이고, 실용성이 있는지는 잘 모르겠지만...  
Heap 영역의 존재 이유를 설명하는 좋은 예가 될 것 같아서 가져와봤다.  
소스 코드 출처: [C언어의 메모리 구조](http://dsnight.tistory.com/50)  
```C
#include <stdio.h>
int main() {
    // 정상적인 배열 선언
    int arr[10];
    
    // 비정상적인 배열 선언
    int i = 0;
    scanf("%d", &i);
    int arr2[i];
    
    printf("\nsizeof(i): %d", sizeof(i)); // 4
    printf("sizeof(arr): %d", sizeof(arr)); // 40
    printf("\nsizeof(arr2): %d", sizeof(arr2)); // 뭐라 꼬집어 말할 수 있을까?
    return 0;
}
```
main `함수` 내부에 있는 변수 i와 arr, arr2는 스택 영역에 올라간다.  
함수 내부에서 쓰인 `지역 변수`이기 때문이다.  
이는 컴파일 시에 그 크기가 결정된다.  
i의 크기는 int이기 때문에 4byte,  
arr의 크기는 int형 변수 10개가 들어간 것이기 때문에  
sizeof(int) * 10 = 40byte.
arr2의 크기는...?  
stack 영역에 올라가는 arr2의 크기가 사용자의 입력에 따라서 유동적으로 바뀌게 된다.  
이는 정상적인 메모리 할당이라고 볼 수 없다.  
컴파일 시에 메모리의 크기가 결정되는 stack 영역에 올라갔음에도 불구하고,  
런타임 시에 메모리의 크기가 결정되기 때문에 이는 힙 영역에 올리는 게 맞다고 본다.  
아직 동적 할당을 제대로 배우지 않았기 때문에 이 이상의 설명과 이해는 힘들 것 같다.

## 참고 링크
* [C언어의 메모리 구조](http://dsnight.tistory.com/50)  
* [메모리 영역(code, data, stack, heap)](http://sfixer.tistory.com/entry/%EB%A9%94%EB%AA%A8%EB%A6%AC-%EC%98%81%EC%97%ADcode-data-stack-heap)  
* [동적할당과 정적할당](http://ghgus0702.tistory.com/11)  
* [[C/C++] 데이터, 스택(Stack), 힙(Heap) 영역](http://pacs.tistory.com/entry/CC-Programming-%EC%8A%A4%ED%83%9DStack-%ED%9E%99Heap-%EC%98%81%EC%97%AD)  
* [메모리 영역 (Code, Data, BSS, HEAP, Stack), Little Endian, Stack의 이해](http://donghwada.tistory.com/entry/%EB%A9%94%EB%AA%A8%EB%A6%AC-%EC%98%81%EC%97%AD-Code-Data-BSS-HEAP-Stack-Little-Endian-Stack%EC%9D%98-%EC%9D%B4%ED%95%B4)