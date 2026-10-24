import { fetchPatch, type PatchBoxUi } from './patch-box';
import {
  classifyRom,
  createPatchedRom,
  extractRomFromZip,
  isOtherArchive,
  isZip,
  megabytes,
  type RomSpec,
} from './rom-patch';

async function make(box: PatchBoxUi, spec: RomSpec, source: Uint8Array, allowUnverified: boolean) {
  const { show, save } = box;
  show('한글패치를 적용하는 중입니다. 잠시만 기다려 주세요.');
  const ipsBytes = await fetchPatch(box, () => void make(box, spec, source, allowUnverified));
  if (!ipsBytes) return;
  try {
    const rom = createPatchedRom(spec, source, ipsBytes, { allowUnverified });
    const name = `${box.output}${allowUnverified ? '_Unverified' : ''}.sfc`;
    save(rom, name);
    show(
      `${name} 파일을 저장했습니다. 에뮬레이터에서 이 롬파일을 열면 한글판으로 시작합니다.` +
        (allowUnverified
          ? ' 원본과 다른 롬파일로 만들었으니 게임이 이상하면 다른 일본판 롬파일로 다시 만들어 주세요.'
          : ''),
      [{ label: '다시 저장', run: () => save(rom, name) }],
    );
  } catch (error) {
    show(
      error instanceof Error
        ? error.message
        : '한글패치를 적용하지 못했습니다. 페이지를 새로 고친 뒤 다시 시도해 주세요.',
    );
  }
}

export async function handleFile(box: PatchBoxUi, name: string, bytes: Uint8Array) {
  const { show } = box;
  const spec = JSON.parse(box.spec) as RomSpec;
  if (isZip(bytes, name)) {
    const found = await extractRomFromZip(spec, bytes);
    if (!found) {
      show('이 압축 파일은 열지 못했습니다. 압축을 풀어서 안에 있는 롬파일(.sfc 또는 .smc) 하나를 골라 주세요.');
      return;
    }
    ({ name, bytes } = found);
  } else if (isOtherArchive(bytes, name)) {
    show('.7z·.rar 압축 파일은 열지 못합니다. 압축을 풀어서 안에 있는 롬파일(.sfc 또는 .smc)을 골라 주세요.');
    return;
  }
  const verdict = classifyRom(spec, bytes);
  switch (verdict.kind) {
    case 'too-small':
      show(`${name} 파일은 롬파일이라기엔 너무 작습니다. 사진이나 문서를 고르지 않았는지 확인해 주세요.`);
      return;
    case 'truncated':
      show('롬파일 크기가 조금 모자랍니다. 덜 받아졌을 수 있으니 다시 받아서 골라 주세요.');
      return;
    case 'wrong-size':
      show(
        `크기가 맞지 않습니다. ${spec.name} 일본판 롬파일은 ${megabytes(spec)}입니다. 다른 게임이거나 여러 게임이 묶인 파일일 수 있습니다.`,
      );
      return;
    case 'wrong-game':
      show(`다른 게임 롬파일 같습니다. ${spec.name} 일본판 롬파일을 골라 주세요.`);
      return;
    case 'other-region':
      show(
        `미국판 같은 해외판 롬파일입니다. 이 한글패치는 일본판에만 적용됩니다. ${spec.name} 일본판 롬파일을 구해서 다시 골라 주세요.`,
      );
      return;
    case 'old-korean':
      show(
        `${verdict.version ? `이전 버전(${verdict.version})` : '예전에 나온'} 한글패치 롬파일입니다. 새 버전은 패치하지 않은 일본판 롬파일에 적용해야 하니 일본판 롬파일을 골라 주세요.`,
      );
      return;
    case 'already-korean':
      show('이미 한글패치를 적용한 롬파일입니다. 그대로 즐기면 됩니다.');
      return;
    case 'original':
      await make(box, spec, bytes, false);
      return;
    case 'different':
      show(
        `${spec.name} 일본판 롬파일은 맞지만 원본에서 조금 손댄 파일입니다. 다른 패치나 개조가 들어갔을 수 있어 이대로 만들면 게임이 멈추거나 깨질 수 있습니다. 다른 일본판 롬파일을 구해서 골라 주세요.`,
        [{ label: '그래도 만들기', run: () => void make(box, spec, bytes, true) }],
      );
  }
}
