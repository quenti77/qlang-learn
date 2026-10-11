#!/usr/bin/env python3
"""Turns a course file of qlang-algo (cours/NN_name.q) into a lesson in Markdown.

    scripts/convert-course.py ~/Projects/learning/qlang-algo/cours content/fr/cours

In the .q files, the explanations are comments written above the code they explain.
This tool turns them into prose and keeps the code in ```qlang blocks. Every block must run
on its own, so a block that does not compile alone (it uses what an earlier block defined) is
merged with the earlier block(s) it needs, the explanations of the merged part staying in the
code as comments. Needs the `qlang` program in the PATH.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

RULER = re.compile(r"^--\s*[-=]{5,}\s*$")


INPUT = ["Ada", "36", "x"] * 20
_cache = {}


def run(code: str, cwd: Path):
    """(compiles, output) of a program, with the other .q files of the course available for imports."""
    key = (code, str(cwd))
    if key not in _cache:
        request = {"entry": "main.q", "files": {"main.q": code}, "input": INPUT}
        for f in cwd.rglob("*.q"):
            rel = f.relative_to(cwd).as_posix()
            if not rel.startswith(".."):
                request["files"].setdefault(rel, f.read_text())
        out = subprocess.run(["qlang", "run", "--json"], input=json.dumps(request), capture_output=True, text=True).stdout
        r = json.loads(out)
        _cache[key] = (r.get("phase") != "compile" and r.get("ok", False), r.get("output", ""))
    return _cache[key]


def compiles(code: str, cwd: Path) -> bool:
    return run(code, cwd)[0]


def parse(text: str):
    """Header, then a list of items: ('heading', str) ('prose', [lines]) ('code', [lines]) ('box', [lines])."""
    lines = text.split("\n")
    header = []
    i = 0
    if lines and lines[0].startswith("--("):
        i = 1
        while i < len(lines) and not lines[i].startswith("--)"):
            header.append(lines[i])
            i += 1
        i += 1
    items = []
    prose, code = [], []
    blank_before = True

    def flush_prose():
        nonlocal prose
        if prose:
            items.append(("prose", prose))
            prose = []

    def flush_code():
        nonlocal code
        while code and code[-1].strip() == "":
            code.pop()
        if code:
            items.append(("code", code))
        code = []

    while i < len(lines):
        line = lines[i]
        if line.startswith("--("):
            flush_prose()
            flush_code()
            box = []
            i += 1
            while i < len(lines) and not lines[i].startswith("--)"):
                box.append(lines[i])
                i += 1
            items.append(("box", box))
            i += 1
            blank_before = True
            continue
        if RULER.match(line):
            # a banner: ruler, title, ruler
            if i + 2 < len(lines) and lines[i + 1].startswith("--") and RULER.match(lines[i + 2]):
                flush_prose()
                flush_code()
                items.append(("heading", re.sub(r"^--\s*", "", lines[i + 1]).strip()))
                i += 3
                blank_before = True
                continue
            i += 1
            continue
        is_comment = line.startswith("--")
        if line.strip() == "":
            if code:
                code.append(line)
            elif prose and prose[-1] != "":
                prose.append("")
            blank_before = True
            i += 1
            continue
        if is_comment:
            text_line = re.sub(r"^--\s?", "", line)
            if code and not blank_before:
                code.append(line)  # a comment inside code (right after a code line)
            else:
                if code:
                    flush_code()
                prose.append(text_line)
            blank_before = False
        else:
            flush_prose()
            code.append(line)
            blank_before = False
        i += 1
    flush_prose()
    flush_code()
    return header, [(k, tidy_prose(b) if k == "prose" else b) for k, b in items]


CODE_LINE = re.compile(r"^[A-Za-z_][\w.]*(\(|\[| = | \+= | -= | \*= )")


def tidy_prose(lines):
    """A commented-out line of code inside an explanation becomes inline code, on its own line."""
    out = []
    for n, l in enumerate(lines):
        if n > 0 and CODE_LINE.match(l):
            if out and out[-1] != "":
                out.append("")
            out.append("`" + l.strip() + "`")
            out.append("")
        else:
            out.append(l)
    while out and out[-1] == "":
        out.pop()
    return out


def as_comments(lines):
    return ["-- " + l if l.strip() else "--" for l in lines]


UNIT_START = re.compile(r"^(fun|struct|impl|trait|enum)\b")
SINGLE = re.compile(r"^(const|import)\s")
LET = re.compile(r"^let\s")


def balanced(line):
    return all(line.count(a) == line.count(b) for a, b in ("()", "[]", "{}")) and not re.search(r"\b(then|do)\s*(--.*)?$", line)


def units(lines):
    """The top-level declarations of a block (functions, types, impls, constants, imports)."""
    out = []
    i = 0
    while i < len(lines):
        l = lines[i]
        if UNIT_START.match(l):
            j = i
            while j < len(lines) and not re.match(r"^end\b", lines[j]):
                j += 1
            out.append(lines[i : j + 1])
            i = j + 1
        elif SINGLE.match(l) or (LET.match(l) and balanced(l) and not re.search(r"fun\(.*\)( -> \S+)?\s*$", l)):
            out.append([l])
            i += 1
        elif LET.match(l):
            # a variable defined over several lines: an array literal, or a function value
            j = i
            if re.search(r"fun\(", l):
                while j < len(lines) and not re.match(r"^end\b", lines[j]):
                    j += 1
            else:
                depth = 0
                while j < len(lines):
                    depth += sum(lines[j].count(c) for c in "([{") - sum(lines[j].count(c) for c in ")]}")
                    if depth <= 0:
                        break
                    j += 1
            out.append(lines[i : j + 1])
            i = j + 1
        else:
            i += 1
    return out


def unit_key(unit):
    """What a declaration defines: a redefinition replaces it (`impl` blocks are told apart by their first line)."""
    m = re.match(r"^(fun|struct|trait|enum|const|let)\s+(\w+)", unit[0])
    return (m.group(1) if m.group(1) in ("fun", "const", "let") else "type", m.group(2)) if m else unit[0]


def recall(group, known, cwd, expected):
    """Lines to put before `group` so that it behaves as in the course: the fewest earlier declarations."""
    chosen = list(known)
    body = "\n".join(group)

    def ok(units_):
        text = "\n\n".join("\n".join(u) for u in units_) + ("\n\n" if units_ else "") + body
        good, output = run(text, cwd)
        return good and (expected is None or output == expected)

    if not chosen or not ok(chosen):
        return None
    for u in reversed(list(chosen)):
        trial = [x for x in chosen if x is not u]
        if ok(trial):
            chosen = trial
    return chosen


def group_outputs(items, cwd):
    """What each code group prints in the course (cumulative runs: each is a prefix of the next)."""
    outputs, previous, text = [], "", []
    for kind, body in items:
        if kind != "code":
            continue
        text += body + [""]
        good, out = run("\n".join(text), cwd)
        outputs.append(out[len(previous):] if good and out.startswith(previous) else None)
        previous = out if good else previous
    return outputs


def merge_blocks(items, cwd: Path, interactive: bool):
    """Make every code block run on its own, printing what it printed in the course.

    A block that does not do that gets the earlier declarations it needs put in front of it.
    If that is not enough, it is merged with the earlier block.
    """
    outputs = [None] * len(items)
    if not interactive:
        deltas = iter(group_outputs(items, cwd))
        outputs = [next(deltas) if k == "code" else None for k, _ in items]
    out = []  # items; code items also carry the output they must print
    known = []
    for item, expected in zip(items, outputs):
        if item[0] != "code":
            out.append((item[0], item[1], None, None))
            continue
        code = item[1]

        def good(lines, exp):
            ok_, o = run("\n".join(lines), cwd)
            return ok_ and (exp is None or o == exp)

        if not good(code, expected):
            needed = recall(code, known, cwd, expected)
            if needed is not None:
                lines = ["-- (défini plus haut dans ce chapitre)"]
                for u in needed:
                    lines += u + [""]
                code = lines + code
        for u in units(item[1]):
            key = unit_key(u)
            known[:] = [k for k in known if unit_key(k) != key] + [u]  # a later definition replaces the earlier one
        out.append(("code", code, expected, item[1]))
        while not good(out[-1][1], out[-1][2]):
            idx = len(out) - 1
            prev = next((j for j in range(idx - 1, -1, -1) if out[j][0] == "code"), None)
            if prev is None:
                break
            extra = []
            for kind, body, _, _ in out[prev + 1 : idx]:
                if kind == "heading":
                    extra += ["", "-- ---- " + body + " ----"]
                elif kind in ("prose", "box"):
                    extra += [""] + as_comments(body)
            # the earlier block, then this one's own code (without the recall, which is in it already)
            merged_expected = None if out[prev][2] is None or out[idx][2] is None else out[prev][2] + out[idx][2]
            own = out[prev][3] + extra + out[idx][3]
            out = out[:prev] + [("code", out[prev][1] + extra + out[idx][3], merged_expected, own)]
    return [(k, b) for k, b, _, _ in out]


def title_of(header):
    for l in header:
        m = re.match(r"\s*COURS\s+\d+\s*:\s*(.+?)\s*$", l)
        if m:
            t = m.group(1).lower()
            return t[0].upper() + t[1:]
    return "Sans titre"


def intro_of(header):
    body = []
    skip = True
    for l in header:
        if skip:
            if re.match(r"\s*=+\s*$", l):
                skip = False
            continue
        if re.search(r"qlang run|printf .*\| qlang|Lance-le dans un terminal|Ou donne les réponses|Lancer ce fichier", l):
            continue
        body.append(l.strip() if not l.startswith("      ") else l)
    text = "\n".join(body).strip()
    return text


def box_to_markdown(box):
    out = []
    for l in box:
        s = l[2:] if l.startswith("  ") else l
        if s.strip() and s.strip().isupper() and not s.startswith("-"):
            heading = s.strip().lower()
            out.append("")
            out.append("## " + heading[0].upper() + heading[1:])
            out.append("")
        else:
            out.append(s)
    return "\n".join(out).strip("\n")


IMPORT_PATH = re.compile(r'^\s*import\b[^\n]*?"([^"\n]+)"', re.M)


def add_modules(items, cwd: Path):
    """Imported files are shown as `qlang-module` blocks, before the first block that imports them."""
    seen = set()
    out = []
    for kind, body in items:
        if kind == "code":
            for rel in IMPORT_PATH.findall("\n".join(body)):
                f = cwd / rel
                if rel not in seen and f.exists():
                    seen.add(rel)
                    out.append(("module", [f"-- file: {rel}"] + f.read_text().rstrip("\n").split("\n")))
        out.append((kind, body))
    return out


def convert(path: Path, cwd: Path) -> str:
    header, items = parse(path.read_text())
    items = add_modules(merge_blocks(items, cwd, "read(" in path.read_text()), cwd)
    title = title_of(header)
    md = ["---", f'title: "{title}"', "---", "", f"# {title}", ""]
    intro = intro_of(header)
    if intro:
        md += [intro, ""]
    for kind, body in items:
        if kind == "heading":
            md += ["", f"## {body}", ""]
        elif kind == "prose":
            md += ["\n".join(body), ""]
        elif kind == "code":
            md += ["```qlang", "\n".join(body), "```", ""]
        elif kind == "module":
            md += ["```qlang-module", "\n".join(body), "```", ""]
        elif kind == "box":
            md += [box_to_markdown(body), ""]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(md)).rstrip() + "\n"


def run_output(files, entry, cwd: Path):
    request = {"entry": entry, "files": files, "input": ["Ada", "36", "x"] * 20}
    out = subprocess.run(["qlang", "run", "--json"], input=json.dumps(request), capture_output=True, text=True).stdout
    r = json.loads(out)
    return r.get("output", ""), r.get("ok", False)


def verify(path: Path, md: str, cwd: Path):
    """The outputs of the blocks, one after the other, must be the output of the original file."""
    extra = {f.relative_to(cwd).as_posix(): f.read_text() for f in cwd.rglob("*.q") if f != path}
    expected, ok = run_output({"main.q": path.read_text(), **extra}, "main.q", cwd)
    blocks = re.findall(r"```qlang\n(.*?)```", md, re.S)
    got = ""
    failed = 0
    for b in blocks:
        o, ok_b = run_output({"main.q": b, **extra}, "main.q", cwd)
        got += o
        failed += 0 if ok_b else 1
    return expected == got, failed


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    dst.mkdir(parents=True, exist_ok=True)
    for f in sorted(src.glob("[0-9][0-9]_*.q")):
        slug = f.stem.replace("_", "-")
        md = convert(f, src)
        (dst / f"{slug}.md").write_text(md)
        blocks = md.count("```qlang")
        same, failed = verify(f, md, src)
        note = "" if same and not failed else f"   <-- output differs: {not same}, blocks with errors: {failed}"
        print(f"{slug}: {blocks} block(s){note}")


if __name__ == "__main__":
    main()
