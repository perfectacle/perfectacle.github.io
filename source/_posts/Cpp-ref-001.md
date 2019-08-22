---
title: (C++) 참고용 정리 - 변수의 주소
date: 2017-01-02 09:59:21
category: [Programming, C/C++]
tag: [C, C++, Pointer, Address]
---
![](/images/Cpp-ref-001/thumb.png)  

```c
#include <iostream>
using namespace std;

int main() {
    int num2 = 11;
    int num = 11;
    int num3 = num;
    // 같은 값이던 변수를 참조하던 다른 메모리 공간을 차지함.
    cout << &num2 << endl; // 0x7FFF5322DAD8
    cout << &num << endl; // 0x7FFF5322DAD4
    cout << &num3 << endl; // 0x7FFF5322DAD0
    return 0;
}
```