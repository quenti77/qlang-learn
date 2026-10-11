#!/usr/bin/env python3
"""Turns the exercise files of qlang-algo into exercise pages in Markdown.

    scripts/convert-exercises.py ~/Projects/learning/qlang-algo content/fr/exercices

Each `-- Exercice N : statement` section of exercices/NN_name.q has the code the student
completes (functions, types, `TODO`s) followed by tests (`assert`s). The solution of the same
exercise comes from solutions/NN_name.q. Needs the `qlang` program in the PATH.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

DECL = re.compile(r"^(fun|struct|impl|trait|enum)\b")


def run(code: str):
    out = subprocess.run(
        ["qlang", "run", "--json"], input=json.dumps({"files": {"main.q": code}, "input": []}), capture_output=True, text=True
    ).stdout
    r = json.loads(out)
    return r.get("ok", False), r.get("phase"), r.get("diagnostics", [])


def sections(path: Path):
    """(title, [(number, statement, code lines)])"""
    text = path.read_text()
    title = ""
    m = re.search(r"EXERCICES?\s+\d+\s*:\s*(.+)", text)
    if m:
        title = m.group(1).strip()
    body = re.sub(r"^--\(.*?^--\)\n", "", text, count=1, flags=re.S | re.M)
    parts = re.split(r"^-- Exercice (\d+)\s*:\s*(.*)$", body, flags=re.M)
    out = []
    for i in range(1, len(parts), 3):
        code = parts[i + 2].strip("\n").split("\n")
        while code and not code[-1].strip():
            code.pop()
        out.append((int(parts[i]), parts[i + 1].strip(), code))
    return title, out


def split(code):
    """The code the student completes (up to the last top-level declaration) and the tests after it."""
    last = -1
    i = 0
    while i < len(code):
        if DECL.match(code[i]):
            j = i
            while j < len(code) and not re.match(r"^end\b", code[j]):
                j += 1
            last = j
            i = j + 1
        else:
            i += 1
    starter = code[: last + 1]
    tests = code[last + 1 :]
    while tests and not tests[0].strip():
        tests.pop(0)
    return starter, tests


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    dst.mkdir(parents=True, exist_ok=True)
    problems = 0
    for ex_file in sorted((src / "exercices").glob("[0-9][0-9]_*.q")):
        sol_file = src / "solutions" / ex_file.name
        title, exercises = sections(ex_file)
        _, solutions = sections(sol_file)
        sol = {n: split(code)[0] for n, _, code in solutions}
        md = ["---", f'title: "{title}"', "---", "", f"# {title}", ""]
        for n, statement, code in exercises:
            starter, tests = split(code)
            solution = sol[n]
            t = "\n".join(tests)
            good, _, _ = run("\n".join(solution) + "\n" + t)
            bad, phase, _ = run("\n".join(starter) + "\n" + t)
            if not good:
                print(f"✗ {ex_file.stem} #{n}: the solution does not pass its tests")
                problems += 1
            if bad or phase == "compile":
                print(f"✗ {ex_file.stem} #{n}: the starter code {'passes' if bad else 'does not compile'}")
                problems += 1
            md += [f"## Exercice {n}", "", statement[0].upper() + statement[1:], ""]
            md += ["```qlang-exercise", "\n".join(starter), "```", ""]
            md += ["```qlang-tests", t, "```", ""]
            md += ["```qlang-solution", "\n".join(solution), "```", ""]
        (dst / (ex_file.stem.replace("_", "-") + ".md")).write_text("\n".join(md))
        print(f"{ex_file.stem}: {len(exercises)} exercise(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
