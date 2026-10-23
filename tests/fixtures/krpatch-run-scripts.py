"""Writes krpatch-run-scripts.json: input scripts and what kr-patch-toolkit's own parser makes of them.

The guide's script reader (src/lib/run-script.ts) must accept and reject exactly what `krpatch snes run` does, so the
expected values come from kr_patch.snes.script.parse itself, not from a copy of its rules:

    python3 -I tests/fixtures/krpatch-run-scripts.py <kr-patch-toolkit checkout>/src > tests/fixtures/krpatch-run-scripts.json

The first cases are the toolkit's own tests (tests/test_harness.py, test_lua.py, test_cli.py); the rest cover the
corners the widget has to agree on.
"""
import io
import json
import sys

sys.path.insert(0, sys.argv[1])
from kr_patch.snes import script  # noqa: E402

TOOLKIT_SCRIPT = """\
# boot
500 start 4
800 A+b 2
900 tap a 40 1000
1000 shot
1000 dump
1100 poke 0010 1234
1100 poke 7E0020 FFFF
2000 end
"""

CASES = [
    ("toolkit: every command", TOOLKIT_SCRIPT),
    ("toolkit: unknown button", "10 z 4\n20 end\n"),
    ("toolkit: frame only", "\n10\n20 end\n"),
    ("toolkit: tap without period", "10 tap a\n20 end\n"),
    ("toolkit: poke below WRAM", "10 poke 7D0000 1\n20 end\n"),
    ("toolkit: poke crossing the end of WRAM", "10 poke 1FFFF 1\n20 end\n"),
    ("toolkit: poke at the last byte of $7F", "10 poke 7FFFFF 1\n20 end\n"),
    ("toolkit: no end", "10 shot\n"),
    ("toolkit: shot after end", "10 end\n20 shot\n"),
    ("toolkit: dump after end", "10 end\n11 dump\n"),
    ("toolkit: poke after end", "10 end\n11 poke 10 1\n"),
    ("toolkit: tap after end", "10 end\n11 tap a 4 20\n"),
    ("toolkit: press after end", "10 end\n11 a 4\n"),
    ("toolkit: poke at the last word", "10 poke 7FFFFE 1\n10 end\n"),
    ("toolkit: load from file", "10 shot\n20 end\n"),
    ("toolkit: lua runs a script", "2 A 2\n3 shot\n4 poke 7E0010 1234\n5 dump\n6 end\n"),
    ("toolkit: cli rejects an unknown command", "10 jump 4\n20 end\n"),
    ("toolkit: README example",
     "500 start 4\n800 a+b 2\n900 tap a 40 2000\n1000 shot\n1000 dump\n1100 poke 0010 1234\n3000 end\n"),
    ("guide demo",
     "# test ROM\n60 shot\n100 a 30\n110 shot\n200 poke 0012 001F\n202 shot\n240 dump\n300 end\n"),
    ("otogirisou s_cont.txt",
     "1000 start 4\n1300 a 4\n1500 a 4\n1600 tap a 40 5000\n"
     + "".join(f"{f} shot\n" for f in range(500, 5001, 250)) + "5000 end\n"),
    ("comment and blank lines", "  # note\n\n\t\n10 shot\n   20   END   \n"),
    ("hash inside a line is not a comment", "10 shot # first\n20 end\n"),
    ("comment token later in the line", "10 # shot\n20 end\n"),
    ("CRLF line ends", "10 shot\r\n20 end\r\n"),
    ("case of buttons and commands", "10 SELECT+Start 3\n12 TAP L+r 5 30\n15 Shot\n40 End\n"),
    ("unknown second button", "10 a+q 3\n20 end\n"),
    ("empty button name", "10 a+ 3\n20 end\n"),
    ("press without length", "10 a\n20 end\n"),
    ("press length not a number", "10 a x\n20 end\n"),
    ("press length checked before the button", "10 jump x\n20 end\n"),
    ("press of zero frames", "10 a 0\n20 end\n"),
    ("negative press length", "10 a -3\n20 end\n"),
    ("extra words are ignored", "10 a 2 and more\n11 shot now\n20 end please\n"),
    ("frame not a number", "ten shot\n20 end\n"),
    ("hex frame is not decimal", "0x10 shot\n20 end\n"),
    ("frame with underscore", "1_000 shot\n2_000 end\n"),
    ("frame with plus sign", "+10 shot\n20 end\n"),
    ("frame zero and negative frames", "0 shot\n-5 dump\n20 end\n"),
    ("frame with leading zeros", "007 shot\n20 end\n"),
    ("bad underscore", "1__0 shot\n20 end\n"),
    ("trailing underscore", "10_ shot\n20 end\n"),
    ("tap until missing", "10 tap a 4\n20 end\n"),
    ("tap period zero", "10 tap a 0 20\n30 end\n"),
    ("tap until is read before the period", "10 tap a x\n30 end\n"),
    ("tap bad period", "10 tap a x 20\n30 end\n"),
    ("tap bad until", "10 tap a 4 y\n30 end\n"),
    ("tap button checked first", "10 tap q x y\n30 end\n"),
    ("tap that never fires", "10 tap a 4 10\n30 end\n"),
    ("tap negative period", "10 tap a -4 30\n30 end\n"),
    ("tap until past end is fine", "10 tap a 40 500\n100 end\n"),
    ("poke without value", "10 poke 10\n20 end\n"),
    ("poke without address", "10 poke\n20 end\n"),
    ("poke bad address", "10 poke zz 1\n20 end\n"),
    ("poke bad value", "10 poke 10 zz\n20 end\n"),
    ("poke 0x prefix and underscores", "10 poke 0x7e_0010 0X_12_34\n20 end\n"),
    ("poke value wraps to 16 bits", "10 poke 10 12345\n20 end\n"),
    ("poke negative value", "10 poke 10 -1\n20 end\n"),
    ("poke $ prefix is not hex", "10 poke $7E0010 1\n20 end\n"),
    ("poke into $7F", "10 poke 7F0000 ABCD\n10 poke 1FFFE 1\n20 end\n"),
    ("poke into a mirror bank is outside", "10 poke 000010 1\n10 poke 800010 1\n20 end\n"),
    ("two pokes in one frame keep their order", "10 poke 20 1\n10 poke 10 2\n20 end\n"),
    ("last end wins", "10 shot\n50 end\n30 end\n"),
    ("late command reported by file order", "40 shot\n10 end\n30 dump\n"),
    ("end before earlier lines", "20 end\n10 shot\n"),
    ("end with a bad frame", "10 shot\nx end\n"),
    ("end without frame", "end\n"),
    ("error before missing end", "10 q 3\n"),
    ("only comments", "# nothing\n"),
    ("empty script", ""),
    ("duplicate shots", "10 shot\n10 shot\n10 dump\n20 end\n"),
    ("long unknown word", "10 " + "x" * 30 + " 3\n20 end\n"),
    ("quote in a button name", "10 a'b 3\n20 end\n"),
    ("both quotes in a button name", "10 a'b\"c 3\n20 end\n"),
    ("unicode button name", "10 에이 3\n20 end\n"),
    ("fullwidth digits are decimal", "１０ shot\n20 end\n"),
    ("zero width space is not whitespace", "10​ shot\n20 end\n"),
    ("ideographic space is whitespace", "10　shot\n20 end\n"),
    ("unit separator is whitespace", "10\x1fshot\n20 end\n"),
    ("frame only on the last line", "10 shot\n20\n"),
    ("long invalid frame", "9" * 10 + "z" * 300 + " shot\n20 end\n"),
]


def describe(sc):
    return {
        "end": sc.end,
        "presses": [[a, b, sorted(btn)] for a, b, btn in sc.presses],
        "shots": sorted(sc.shots),
        "dumps": sorted(sc.dumps),
        "pokes": [[f, [[a, v] for a, v in sc.pokes[f]]] for f in sorted(sc.pokes)],
    }


out = []
for name, text in CASES:
    try:
        # A StringIO with universal newlines yields the same lines as script.load reading a file.
        sc = script.parse(io.StringIO(text, newline=None))
        out.append({"name": name, "text": text, "script": describe(sc)})
    except ValueError as e:
        out.append({"name": name, "text": text, "error": str(e)})
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
sys.stdout.write("\n")
