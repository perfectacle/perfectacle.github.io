import { describe, expect, test } from 'vitest';
import { bankShape, explain, regionLabel } from '../src/components/romhacking/bank-map.ts';
import { MAPPERS } from '../src/lib/snes-mapper.ts';

describe('explain', () => {
  test('ends with the same offset as toOffset for every mapper', () => {
    for (const mapper of Object.values(MAPPERS)) {
      for (let addr = 0; addr < 0x1000000; addr += 0x3f1d3) {
        const { steps, offset } = explain(mapper.name, addr);
        expect(offset).toBe(mapper.toOffset(addr));
        expect(steps.at(-1)).toContain(`0x${offset.toString(16).toUpperCase().padStart(6, '0')}`);
      }
    }
  });

  test('LoROM example from the Totsugeki note', () => {
    expect(explain('lorom', 0xa8800c).steps).toEqual([
      '뱅크 $A8에서 맨 위 비트를 뗍니다: $A8 & $7F = $28',
      '뱅크 하나는 롬 32KB($8000바이트)입니다: $28 × $8000 = $140000',
      '주소 $800C에서 위쪽 반 표시($8000)를 뗍니다: $800C & $7FFF = $000C',
      '둘을 더하면 파일 오프셋 0x14000C',
    ]);
  });
});

test('labels', () => {
  expect(regionLabel('lorom', 0x800a00)).toBe('WRAM 앞 8KB가 비쳐 보이는 자리($7E:0A00)');
  expect(regionLabel('sa1', 0xe2b400)).toBe('롬');
});

test('bank shapes', () => {
  expect(bankShape('lorom', 0x80)).toBe('upper');
  expect(bankShape('lorom', 0x7e)).toBe('wram');
  expect(bankShape('hirom', 0xc0)).toBe('full');
  expect(bankShape('hirom', 0x00)).toBe('upper');
  expect(bankShape('sa1', 0x40)).toBe('ram');
  expect(bankShape('sa1', 0x50)).toBe('none');
});

test('the SA-1 LoROM-style window reaches the same name table', () => {
  expect(explain('sa1', 0x85b400).offset).toBe(0x22b400);
  expect(explain('sa1', 0xe2b400).offset).toBe(0x22b400);
});
