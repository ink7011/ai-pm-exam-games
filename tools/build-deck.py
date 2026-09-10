#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-deck.py — 从 Markdown 题库解析出概念题 deck，生成 deck-data.js
（供《NOVA 概念试炼塔》使用）。

支持的题库格式（两种 id 风格）：
  A. **1.** 题干 / 两行选项 A.B. + C.D. / **答案：X**【考点】【★★】【P0】解析
     （需配合 `## 模块 N：模块名（x-y）` 标题划分模块）
  B. **A1.** 题干 / 同上选项与答案行（全部归入"美团 AI 实战"模块）

用法：
  python3 tools/build-deck.py 综合题库.md [美团题库.md ...] -o tower/js/deck-data.js

输出: window.DECK = { items: [...], meta: {...} }
"""
import re, json, sys, os, argparse

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
DEFAULT_OUT = os.path.join(ROOT, "tower", "js", "deck-data.js")

# 综合题库模块 → 塔 key
MODULE_MAP = [
    ("ML 基础", "ml"), ("DL 基础", "dl"), ("NLP", "nlp"), ("CV", "cv"),
    ("推荐/搜索/广告", "rec"), ("LLM 基础与训练", "llm"), ("LLM 推理", "infer"),
    ("RAG", "rag"), ("Agent", "agent"), ("多模态", "mm"), ("AI 评估", "eval"),
    ("AI Infra", "infra"), ("AI 产品", "prod"), ("AI 运营/Growth", "ops"),
    ("AI 商业", "biz"), ("综合诊断场景", "boss"),
]

Q_RE = re.compile(r"^\*\*(\d+)\.\*\*\s*(.+)$")
QA_RE = re.compile(r"^\*\*A(\d+)\.\*\*\s*(.+)$")
OPT_AB = re.compile(r"^A\. (.*)　B\. (.*)$")
OPT_CD = re.compile(r"^C\. (.*)　D\. (.*)$")
ANS_RE = re.compile(r"^\*\*答案：([A-D])\*\*(.*)$")


def opts_if_needed(opts, idx):
    """兜底解析里引用正确选项文本（截断防爆屏）"""
    t = opts[idx] if 0 <= idx < len(opts) else ""
    return t[:60] + ("…" if len(t) > 60 else "")


def module_key(header_title):
    for name, key in MODULE_MAP:
        if name in header_title:
            return key
    return "misc"


def parse_rest(rest):
    """解析答案行剩余部分：【考点】【★★】【P0】解析 → (考点, 难度, 优先级, 解析)"""
    tags = []
    m = re.match(r"^((?:【[^】]*】)+)(.*)$", rest.strip())
    if m:
        tags = re.findall(r"【([^】]*)】", m.group(1))
        expl = m.group(2).strip()
    else:
        expl = rest.strip()
    kaodian = tags[0] if tags else "综合"
    diff, pri = 2, 0
    for t in tags[1:]:
        if set(t) <= {"★"}:
            diff = len(t)
        elif re.fullmatch(r"P\d", t):
            pri = int(t[1])
    expl = expl.lstrip("。：: ").strip()
    return kaodian, diff, pri, expl


def parse_file(path, kind):
    items = []
    cur_mod = "misc"
    cur_mod_name = "综合"
    i = 0
    lines = open(path, encoding="utf-8").read().split("\n")
    n = len(lines)
    while i < n:
        line = lines[i]
        # 模块头（仅综合题库）
        hm = re.match(r"^## 模块 \d+：(.+?)（", line)
        if hm:
            cur_mod_name = hm.group(1)
            cur_mod = module_key(cur_mod_name)
            i += 1
            continue
        qm = Q_RE.match(line) if kind == "full" else None
        qam = QA_RE.match(line) if kind == "meituan" else None
        if qm or qam:
            qid = (qm or qam).group(1)
            qtext = (qm or qam).group(2).strip()
            # 向下找选项两行 + 答案行（容错最多 6 行）
            opts, ans_line, j = None, None, i + 1
            ab = cd = None
            while j < n and j <= i + 6:
                m1 = OPT_AB.match(lines[j])
                if m1 and ab is None:
                    ab = (m1.group(1), m1.group(2)); j += 1; continue
                m2 = OPT_CD.match(lines[j])
                if m2 and cd is None:
                    cd = (m2.group(1), m2.group(2)); j += 1; continue
                m3 = ANS_RE.match(lines[j])
                if m3:
                    ans_line = m3; break
                j += 1
            if ab and cd and ans_line:
                opts = [ab[0].strip(), ab[1].strip(), cd[0].strip(), cd[1].strip()]
                letter = ans_line.group(1)
                ans_idx = "ABCD".index(letter)
                kaodian, diff, pri, expl = parse_rest(ans_line.group(2))
                if not expl:
                    # 原库中简单题（题干自解释）无解析：用 考点+正确选项 重述兜底
                    expl = "考点【" + kaodian + "】。定义/判断类题：记住正确选项的表述——" + opts_if_needed(opts, "ABCD".index(letter))
                items.append({
                    "id": ("f" if kind == "full" else "m") + qid,
                    "mod": cur_mod if kind == "full" else "meituan",
                    "modName": cur_mod_name if kind == "full" else "美团 AI 实战",
                    "q": qtext,
                    "opts": opts,
                    "ans": ans_idx,
                    "k": kaodian,
                    "diff": diff,
                    "pri": pri,
                    "expl": expl,
                    "boss": ("真题" in kaodian) or (kind == "full" and cur_mod == "boss"),
                })
                i = j + 1
                continue
        i += 1
    return items


def main():
    ap = argparse.ArgumentParser(description="Markdown 题库 → deck-data.js")
    ap.add_argument("inputs", nargs="+", help="题库 Markdown 文件（第 1 个为综合格式，其余为美团格式；也可全部用 -f/--full 或 -m/--meituan 指定风格）")
    ap.add_argument("-o", "--out", default=DEFAULT_OUT, help="输出路径（默认 tower/js/deck-data.js）")
    args = ap.parse_args()

    items = []
    for idx, path in enumerate(args.inputs):
        kind = "full" if idx == 0 else "meituan"
        items += parse_file(path, kind)
    # 校验
    problems = []
    seen = set()
    for it in items:
        if it["id"] in seen:
            problems.append("重复 id: " + it["id"])
        seen.add(it["id"])
        if len(it["opts"]) != 4 or len(set(it["opts"])) < 3:
            problems.append(it["id"] + " 选项异常")
        if not (0 <= it["ans"] <= 3):
            problems.append(it["id"] + " 答案越界")
        if not it["expl"]:
            problems.append(it["id"] + " 缺解析")
    # 答案分布
    dist = {}
    for it in items:
        L = "ABCD"[it["ans"]]
        dist[L] = dist.get(L, 0) + 1
    mods = {}
    for it in items:
        mods[it["mod"]] = mods.get(it["mod"], 0) + 1
    boss_n = sum(1 for it in items if it["boss"])

    print("总题数:", len(items), "| 模块分布:", mods, "| Boss池:", boss_n, "| 答案分布:", dist)
    if problems:
        print("发现问题:")
        for p in problems:
            print(" -", p)
        sys.exit(1)

    meta = {"count": len(items), "generatedFrom": [os.path.basename(p) for p in args.inputs]}
    data = {"items": items, "meta": meta}
    out = args.out
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write("window.DECK = " + json.dumps(data, ensure_ascii=False, indent=0) + ";")
    print("已生成:", out, "(%.1f KB)" % (os.path.getsize(out) / 1024))


if __name__ == "__main__":
    main()
