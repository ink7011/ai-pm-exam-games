# 贡献指南 · Contributing

欢迎贡献题目、剧情、翻译和想法！/ Questions, stories, translations, and ideas are all welcome.

## 🙋 贡献题目（最需要）

题库格式（Markdown，两行选项 + 答案行）：

```
**1.** 题干文字……
A. 选项一　B. 选项二
C. 选项三　D. 选项四
**答案：B**【考点名】【★★】【P0】解析文字……
```

- 放到 `bank/` 目录（新建），或直接提 Issue 附上题目
- 合入后运行 `python3 tools/build-deck.py bank/你的题库.md -o tower/js/deck-data.js --mp` 重新生成两端题库
- 要求：**原创或改写**，不要直接粘贴任何公司的真实试卷（版权风险）

## 🧩 贡献剧情 / Season

RPG 新 Case 见 `rpg/README.md` 的扩展模板；欢迎贡献 Season 2（模型战争）及之后章节。

## 🌍 翻译

英文版（游戏 UI + README）筹备中，Issue 里认领。

## 流程

Fork → 分支 → PR（描述清楚加了什么）→ 48h 内回复。先开 Issue 讨论大改动。
