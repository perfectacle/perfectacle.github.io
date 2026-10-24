import { classifyNdsRom, createPatchedNdsRom, extractNdsFromZip, type NdsSpec } from './nds-patch';
import { fetchPatch, type PatchBoxUi } from './patch-box';
import { isOtherArchive, isZip } from './rom-patch';

// Lets the status text paint before a long synchronous step (hashing or patching a 128 MB card).
const paint = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));

async function make(
  box: PatchBoxUi,
  spec: NdsSpec,
  source: { bytes: Uint8Array; crc32: string },
  allowUnverified: boolean,
) {
  const { show, save } = box;
  show('한글패치 파일을 받는 중입니다.');
  const xdelta = await fetchPatch(box, () => void make(box, spec, source, allowUnverified));
  if (!xdelta) return;
  show('한글패치를 적용하는 중입니다. 파일이 커서 몇 초 걸립니다.');
  await paint();
  try {
    const rom = createPatchedNdsRom(spec, source, xdelta, { allowUnverified });
    const name = `${box.output}${allowUnverified ? '_Unverified' : ''}.nds`;
    save(rom, name);
    show(`${name} 파일을 저장했습니다. 에뮬레이터에서 이 롬파일을 열면 한글패치가 적용된 게임이 시작됩니다.`, [
      { label: '다시 저장', run: () => save(rom, name) },
    ]);
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
  const spec = JSON.parse(box.spec) as NdsSpec;
  if (isZip(bytes, name)) {
    const found = await extractNdsFromZip(spec, bytes);
    if (!found) {
      show('이 압축 파일은 열지 못했습니다. 압축을 풀어서 안에 있는 롬파일(.nds) 하나를 골라 주세요.');
      return;
    }
    ({ name, bytes } = found);
  } else if (isOtherArchive(bytes, name)) {
    show('.7z·.rar 압축 파일은 열지 못합니다. 압축을 풀어서 안에 있는 롬파일(.nds)을 골라 주세요.');
    return;
  }
  show('파일을 확인하는 중입니다. 파일이 커서 몇 초 걸립니다.');
  await paint();
  const verdict = classifyNdsRom(spec, bytes);
  switch (verdict.kind) {
    case 'too-small':
      show(`${name} 파일은 롬파일이라기엔 너무 작습니다. 사진이나 문서를 고르지 않았는지 확인해 주세요.`);
      return;
    case 'truncated':
      show('롬파일이 중간에 끊겼습니다. 덜 받아졌을 수 있으니 다시 받아서 골라 주세요.');
      return;
    case 'wrong-size':
      show(`크기가 맞지 않습니다. ${spec.name} 일본판 롬파일은 128MB 입니다. 다른 파일이 섞였을 수 있습니다.`);
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
      await make(box, spec, verdict, false);
      return;
    case 'different':
      show(
        `${spec.name} 일본판 롬파일은 맞지만 원본에서 조금 손댄 파일입니다. 다른 패치나 개조가 들어갔을 수 있어 이대로 만들면 게임이 멈추거나 깨질 수 있습니다. 다른 일본판 롬파일을 구해서 골라 주세요.`,
        [{ label: '그래도 만들기', run: () => void make(box, spec, verdict, true) }],
      );
  }
}
