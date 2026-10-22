"""Regenerate the checked-in patch website fonts; never runs during a build."""

import argparse
import hashlib
from importlib.metadata import version
from io import BytesIO
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "scripts/patch-fonts.json"
OUTPUT = ROOT / "public/games/kr-patches/fonts"


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font-dir", required=True, type=Path)
    args = parser.parse_args()
    config = json.loads(CONFIG.read_text())
    for package, expected in config["tools"].items():
        if version(package) != expected:
            raise SystemExit(f"Use {package}=={expected}")

    paths = {ROOT / path for path in config["files"]}
    for directory in config["directories"]:
        paths.update(path for path in (ROOT / directory).rglob("*")
                     if path.is_file() and path.suffix in config["extensions"])
    text = "".join(path.read_text() for path in sorted(paths))
    required = {ord(char) for char in text if 0xAC00 <= ord(char) <= 0xD7A3}
    required.update(range(32, 127))
    required.update(map(ord, config["requiredCharacters"]))

    fonts = []
    for spec in config["fonts"]:
        source = args.font_dir / spec["source"]
        if sha256(source.read_bytes()) != spec["sourceSha256"]:
            raise SystemExit(f"Unexpected source font: {source}")
        fonts.append(TTFont(source, recalcTimestamp=False))
    supported = set.intersection(*(set(font.getBestCmap()) for font in fonts))
    missing = required - supported
    if missing:
        raise SystemExit("Source fonts lack required characters: " + "".join(map(chr, sorted(missing))))
    # Both weights cover the same characters, including optional source punctuation.
    characters = required | ({ord(char) for char in text} & supported)
    manifest = {"tools": config["tools"], "fonts": []}
    results = []
    for spec, font in zip(config["fonts"], fonts):
        bold = spec["weight"] == 700
        font["head"].macStyle = (font["head"].macStyle & ~1) | int(bold)
        font["OS/2"].fsSelection = (font["OS/2"].fsSelection & ~0x60) | (0x20 if bold else 0x40)
        font["OS/2"].usWeightClass = spec["weight"]
        worker = subset.Subsetter()
        worker.populate(unicodes=characters)
        worker.subset(font)
        font.flavor = "woff2"
        buffer = BytesIO()
        font.save(buffer)
        data = buffer.getvalue()
        actual = TTFont(BytesIO(data)).getBestCmap()
        manifest["fonts"].append({**spec, "sha256": sha256(data), "bytes": len(data),
                                  "characters": "".join(map(chr, sorted(actual)))})
        results.append((spec["output"], data))
    if sum(len(data) for _, data in results) > 50 * 1024:
        raise SystemExit("Patch web fonts exceed the 50 KiB budget")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, data in results:
        (OUTPUT / name).write_bytes(data)
        print(f"{name}: {len(data)} bytes")
    (OUTPUT / "LICENSE.txt").write_bytes((args.font_dir / "LICENSE.txt").read_bytes())
    (ROOT / "scripts/patch-fonts.manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
