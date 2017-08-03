---
title: (C/C++) 참고용 정리 - 포인터와 배열
date: 2017-01-23 11:00:21
category: [Note, C/C++]
tag: [C, C++, Pointer, Address, Array]
---
![](thumb.png)  
윤성우 님의 열혈 C 프로그래밍 동영상 강좌를 열심히 보고 있다.  
자바는 메모리 관리를 안 해도 된다지만 공부하면 할 수록 메모리에 자꾸만 관심이 갔다.  
그러한 갈증에 대한 해소를 C언어에서 할 수 있었다.  

## 포인터
`메모리 주소의 값`을 가지고 있는 `변수`이다.  
주된 용도는 `특정 변수`의 메모리 주소의 값을 가지고 있는 변수이지만,  
아래와 같은 것도 가능하다.  
```c
#include <stdio.h>

int main() {
    // 0x00000013이 어떤 영역인지 모른다.
    // 만약 OS영역이라면 치명적인 오류가 나고, 시스템이 뻗을 수도 있다.
    // 하지만 요즘 OS들은 다들 방어적으로들 행동한다고 한다.
    // 혹시 모르니 아래 코드는 권장하지 않는다.
    long* ptr = 0x00000013; // 에러를 뿜는 컴파일러도 있으니 권장하지 않음.
    *ptr = 13;
    
    return 0;
}
```

위와 같은 코드는 OS 영역을 건들지도 모르므로 매우 위험하다.  
따라서 아래와 같이 써야한다.  

```c
#include <stdio.h>

int main() {
    long num = 123;
    long* ptr = &num;
    *ptr = 13;
    // %p의 크기는 운영체제의 bit에 따라, 값은 실행할 때마다 달라질 수 있다.
    // 핵심은 ptr에 저장된 값과 num의 메모리 번지수가 동일하다는 것이다.
    // 0x7fff588a2ad8 0x7fff588a2ad8
    printf("%p %p", &num, ptr);
    
    return 0;
}
```

### 크기
위에서 보듯이 포인터는 실수가 아닌 정수이다.  
하지만 그 크기가 1byte인지 2byte인지 어떻게 알 수 있을까?  
그 크기는 OS에 의존적이다.  
OS를 깔 때 32bit 버전, 64bit 버전의 컴퓨터를 본 적이 있다.  
32bit는 OS에서 한 번에 처리할 수 있는 데이터의 양은 32bit, 즉 4byte이다.  
왜냐하면 CPU가 처리하는 데이터의 최소 단위인 Register의 크기가 몇 bit인지에서 나오기 때문이다.  
또한 한 번에 이동시킬 수 있는 데이터의 양 또한 32bit라고 한다.  
데이터 버스를 이용하는 건지 뭔지는 잘 모르겠다.  
이는 메인 메모리(RAM, Random Access Memory)의 인식과도 관련이 있다.    
참고로 메인 메모리의 주소 체계는 1byte 단위이다.  
2<sup>32</sup>Byte = 2<sup>22</sup>Kilobyte = 2<sup>12</sup>Megabyte = 2<sup>2</sup>Gigabyte = 4GB  
> 잠시 다른 이야기, 왜 32비트 컴퓨터를 x86이라고 부를까?  
통칭 x86계열의 CPU가 32비트까지 나와있고, 여기서 64비트를 지원하도록 확장된게 x86-64죠. 그래서 x86-64를 줄여서 간단히 x64...  
8080 - 8086 - 80186 - 80286 - 80386 - 80486 - 80586 등으로 나가는 인텔의 CPU를 통칭해서 x86이라고 부름  

그렇다면 64bit의 경우에는 어떨까?  
64bit를 지원하는 CPU에 64bit의 OS가 깔린 경우라는 가정하에...  
CPU의 Register의 크기가 64bit라서 한 번에 연산(처리)할 수 있는 데이터의 양은 64bit, 즉 8byte.  
한 번에 이동시킬 수 있는 데이터의 양 또한 64bit.  
이론 상으로 인식할 수 있는 메인 메모리의 크기는  
2<sup>64</sup>Byte = 2<sup>54</sup>Kilobyte = 2<sup>44</sup>Megabyte = 2<sup>34</sup>Gigabyte = 2<sup>24</sup>Terabyte
= 2<sup>14</sup>Petabyte = 2<sup>4</sup>Exabyte = 16EB  

참고로 말하자면 int의 크기 또한 OS의 bit에 의존적이지 않다!!  
같은 64bit지만 컴파일러에 따라서 int의 크기가 달라지기도 하는 것 같다.  
하지만 표준이나 요새 상황은 잘 모르겠다.
> 엄밀하게는 컴파일러에 따라 int 크기가 다르다…가 답일거 같군요.  
  http://stackoverflow.com/questions/10197242/what-should-be-the-sizeofint-on-a-64-bit-machine  
  Sang-Kyu Ahn님

> C99 표준에 따르면 sizeof(char)=1이란 것만 정해져 있고, char는 최소 8비트 라는 것이 정해져 있습니다(limits.h를 통해). 그 다음부터는 상대적인 크기로만 되어 있죠. 보통은 그래서 char가 8비트이지만, 16비트 char를 쓴다고 해서 표준 위반은 아니죠.  
  short는 마찬가지 방식으로 16비트 이상이면 되고, int는 기계가 다루는 가장 자연스러운(?) 크기(보통은 CPU레지스터나 데이터 버스 크기에 따르겠죠)면서 최소 16비트, long은 int보다 크거나 같은 크기이면서 32비트, long long은 long보다 크거나 같으면서 최소 64비트…  
  따라서 64비트 머신이라면 64비트 char, short, int, long, long long 도 표준 위반이 아닙니다.  
  Hyunsok Oh님

이미지와 소스 코드의 출처는 [32bit와 64bit의 C 자료형(Data Type) 크기 차이](http://blog.junsu.kim/entry/32bit%EC%99%80-64bit%EC%9D%98-C-%EC%9E%90%EB%A3%8C%ED%98%95Data-Type-%ED%81%AC%EA%B8%B0-%EC%B0%A8%EC%9D%B4)이다.  
```c
#include<stdio.h>

int main() {
    printf ("\n-- General Data Type Size --\n");
    printf ("char size : %d byte\n", (int)sizeof(char));
    printf ("short size : %d byte\n", (int)sizeof(short));
    printf ("int size : %d byte\n", (int)sizeof(int));
    printf ("long size : %d byte\n", (int)sizeof(long));
    printf ("double size : %d byte\n", (int)sizeof(double));
    printf ("long double size : %d byte\n", (int)sizeof(long double));
    printf ("\n-- Pointer Data Type Size -- \n");
    printf ("char* size : %d byte\n", (int)sizeof(char*));
    printf ("short* size : %d byte\n", (int)sizeof(short*));
    printf ("int* size : %d byte\n", (int)sizeof(int*));
    printf ("long* size : %d byte\n", (int)sizeof(long*));
    printf ("double* size : %d byte\n", (int)sizeof(double*));
    printf ("long double* size : %d byte\n", (int)sizeof(long double*));
    
    return 0;
} 
```
![32bit os에서 확인한 결과](32bit.png)  
![64bit os에서 확인한 결과](64bit.png)  

### 포인터 변수 타입에 대한 이해
32bit에서는 포인터 변수의 크기가 4byte, 64bit에서는 포인터 변수의 크기가 8byte다.  
포인터의 크기는 OS에 의존적인데 그럼 그 변수의 타입도 OS에 의존적인 타입만 써야하지 않을까...? NO!!  
32bit OS에서 놓고 포인터 변수의 크기도 4byte, long의 크기도 4byte이다.  
64bit OS에서 놓고 포인터 변수의 크기도 8byte, long의 크기도 8byte이다.  
따라서 포인터 변수의 타입은 무조건 long이면 될 것 같다.  
그런데 왜 char*, short*, int*, float*, double* 요런 놈이 존재하는 걸까...?  
그건 포인터를 쓰는 근본적인 목적인 메모리 주소에 대한 `접근` 때문이다.  
```c
#include <stdio.h>

int main() {
    double num = 123.2;
    // 컴파일 되지않는 컴파일러도 있지만, 메모리 주소인 정수값을 long에 담는 것이니 상관이 없다고 여긴다.
    long ptr = &num;
    // 해당 주소로 접근해서 그 주소에 있는 값을 바꾸려고 한다.
    // 하지만 ptr이란 놈은 num의 주소만 알고있을 뿐이지 어떤 타입인지 알지 못한다.
    // 메모리에는 0과 1의 값만 잔뜩 들어가있는데 그러한 정보를 알 수 없다.
    // 따라서 에러가 나거나 원하는 결과가 나오지 않을 것이다.
    *ptr = 13.4;
    
    return 0;
}
```
위의 예제에서 알 수 있듯이 메모리 주소만으로는 해당 메모리 주소가 가리키는 공간이 어떠한 타입인지  
즉 몇 byte를 조작해야 내가 원하는 결과가 나올지, 문자일지 숫자일지 등등을 판단하기 힘들다.  
즉 포인터의 타입은 `포인터가 가리키는 곳의 타입`을 알고 있는 것이지,  
포인터의 크기를 알고 있는 아이가 아니다.  
포인터의 크기는 신경쓸 필요도 없고 컴파일러가 알아서 처리하는 것 같다.  
포인터 변수의 데이터 타입이 달라도 컴파일이 되는 경우도 있지만 추천하지 않는다.  
```c
#include <stdio.h>

int main() {
    // int형 1은
    // 00000000 00000000 00000000 00000001
    int num = 1;
    // int*이 아니지만 컴파일 되는 컴파일러도 있다.
    // short*이라고 선언했기 때문에 2byte라고 인식한다.
    short* ptr = &num;
    // short형 2는
    // 00000000 00000010
    *ptr = 2;
    // 따라서 num은 아래와 같이 바뀌어있다.
    // 00000000 00000010 00000000 00000001
    // 정수로 131073
    // 컴파일이 되는 경우도 있지만 올바른 값이 나오지 않으므로 권장하지 않는다.
    
    return 0;
}
```

## 배열
배열은 연속된 메모리 공간에 할당하는 것을 뜻한다.  
연속해서 메모리 공간에 할당하는 이유는 두가지가 아닐까 싶다.  
1. 중간 중간 이빨이 나가지 않아 메모리 단편화가 안 일어나지 않을까?  
2. 반복문 측면에서 주소값+배열 타입만 하면 되기 때문이지 않을까?
또한 변수를 하나만 선언해도 된다는 장점이 존재한다.

그리고 배열의 이름도 포인터이다.  
하지만 포인터와의 차이점이라면 포인터 `상수`라는 점이다.  
```c
#include <stdio.h>

int main() {
    int num[] = {1, 2, 3};
    // 0x7fff58f16acc 0x7fff58f16acc
    // &연산자를 붙이지도 않았는데 변수의 이름이 주소값을 가리킨다.
    // 즉 배열의 이름은 배열의 첫번째 요소의 주소값(포인터)와 같다.
    printf("%p %p", num, &num[0]);
    // 포인터이기 때문에 메모리 주소로 접근이 가능하다.
    *num = 3;
    printf("%d %d %d", *num, *&num[0], num[0]);
    // 하지만 포인터 상수이기 때문에 컴파일 에러가 난다.
    num = &num[2];
    
    return 0;
}
```

C언어에서 배열의 이름은 포인터 상수라고 했기 때문에 아래와 같은 게 불가능하다.  
```c
#include <stdio.h>

int main() {
    int num[2];
    // 배열의 이름은 포인터 상수라서 컴파일 에러.
    num = {1, 3};
    // 따라서 아래와 같이 해줘야하는데 매우 귀찮아지므로 선언과 동시에 초기화해주는 것이 좋다.
    num[0] = 1;
    num[1] = 3;
    
    return 0;
}
```

### 포인터의 덧셈, 뺄셈, 증감 연산자(+, -, ++, --)
포인터에서 포인터 ± n은 다음과 같은 의미를 가진다.
주소값 ± n * sizeof(포인터 변수 타입)
```c
#include <stdio.h>

int main() {
    int num = 123;
    int* ptr = &num;
    // 0x7fff5fb37adc
    printf("%p\n", ptr);
    // 0x7fff5fb37adc + sizeof(int)
    // 0x7fff5fb37adc + 4
    // 즉, 0x7fff5fb37ae0
    ptr += 1;
    printf("%p\n", ptr);
    // 0x7fff5fb37ae0 + 4
    // 즉, 0x7fff5fb37ae4
    printf("%p\n", ++ptr);
    
    return 0;
}
```

배열의 이름 또한 상수이지만 일단은 포인터이기 때문에 덧셈, 뺄셈 연산자를 사용할 수 있다.  
```c
#include <stdio.h>

int main() {
    int num[] = {1, 3, 5};
    // c언어에서는 배열의 length를 구하는 api가 없다.
    int length = sizeof(num) / sizeof(int);
    // 배열의 이름이 포인터이기 때문에 &를 안 붙여도 됨.
    int* ptr = num;
    for(int i=0; i<length;) printf("%d ", num[i++]); // 1 3 5
    printf("\n");
    // 배열의 이름은 포인터이기 때문에 *를 붙여줘야 함.
    // 또한 덧셈 연산자나 증감 연산자 보다 * 연산자의 우선순위가 더 높아서 괄호로 우선순위를 명시해줘야 함.
    for(int i=0; i<length;) printf("%d ", *(num + (i++))); // 1 3 5
    printf("\n");
    for(int i=0; i<length;) printf("%d ", *(ptr + (i++))); // 1 3 5
    printf("\n");
    // 배열의 이름은 포인터 상수이기 때문에 아래와 같은 것이 불가능하다.
    for(int i=0; i++<length;) printf("%d ", *(num++));
    // ptr은 포인터 변수이기 때문에 아래와 같은 것이 가능하다.
    for(int i=0; i++<length;) printf("%d ", *(ptr++)); // 1 3 5
    printf("\n");
    num[0] = 5;
    *(num+1) = 3; // num[1]과 동일함, 괄호 빼면 안 된다.
    *(--ptr) = 1; // ptr++를 3번 해줘서 ptr+3이 되었으므로 배열의 범위를 벗어났으니 한 번 빼줘야 함.
    for(int i=0; i<length;) printf("%d ", *(num + (i++))); // 5 3 1
    
    return 0;
}
```

## 참조 링크
* [Windows 환경에서 32 bit 와 64 bit](http://bluese05.tistory.com/17)  
* [왜 32비트 환경을 x86이라고 하는걸까요?](https://kldp.org/node/102650)  
* [32bit와 64bit의 C 자료형(Data Type) 크기 차이](http://blog.junsu.kim/entry/32bit%EC%99%80-64bit%EC%9D%98-C-%EC%9E%90%EB%A3%8C%ED%98%95Data-Type-%ED%81%AC%EA%B8%B0-%EC%B0%A8%EC%9D%B4)  
* [32bit 자료형 / 64bit 자료형의 크기 정리](http://foxlime.tistory.com/115)  
* [64bit 머신에서 int형이 64bit가 아닌가요?](https://kldp.org/node/61089)  
* [long과 int는 크기가 같은데 왜 존재하나요?](http://dev.likejazz.com/post/69840022906/long%EA%B3%BC-int%EB%8A%94-%ED%81%AC%EA%B8%B0%EA%B0%80-%EA%B0%99%EC%9D%80%EB%8D%B0-%EC%99%9C-%EC%A1%B4%EC%9E%AC%ED%95%98%EB%82%98%EC%9A%94)  