# AI 产品经理笔试题库游戏 · AI PM Exam Prep Games

> **两款可以直接玩的网页游戏，把 AI 产品经理 / 产品运营求职笔试知识变成游戏——校招、社招、转行都适用。**
> **耍中找学，学中来耍。耍学结合，以耍为主。Play to learn, learn to play. Learn through play, with play first.**

[![Play Online](https://img.shields.io/badge/▶_在线玩_Play_Online-22d3ee?style=for-the-badge)](https://ink7011.github.io/ai-pm-exam-games/)
[![Questions](https://img.shields.io/badge/题库-245_题-fbbf24.svg)](tower/js/deck-data.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399.svg)](LICENSE)

**如果这个仓库帮到了你，点一个 ⭐ 让更多准备 AI 产品岗的同学看到它。**

---

## 🌌 两个世界 / The Two Worlds

🗼 **概念试炼塔 = 大世界观。** NOVA 学院矗立在「遗忘之潮」边缘——被忘记的知识沉入塔底，化为**暗影**。答错喂养暗影，连对两次将其净化为星光。

🔗 **两界之桥。** 术语表是桥，存档码是界间护照，错题本与暗影共享同一法则。

🧭 **AI PRODUCT RPG = 平行世界。** 学院的实战沙盘 S1：一家叫 NOVA·AI 的公司，十周试用期，真实的指标与后果——直到季终复盘会 **THE REVIEW**。

*The Tower is the greater world where shadows enforce spaced repetition; the RPG is its parallel sandbox where you live with the consequences. Two games, one lore.*

完整设定 · 编年史 · 五段过场动画正典 → **[docs/WORLDVIEW.md](docs/WORLDVIEW.md)**

| 🧭 RPG · 剧情决策 | 🗼 塔 · 暗影复仇 |
|---|---|
| ![RPG](docs/images/rpg-gameplay.png) | ![Tower](docs/images/tower-battle.png) |
| 👑 100% 解锁天选之人结局 | 📖 每题带一句话解析 |
| ![ending](docs/images/rpg-ending-legend.png) | ![expl](docs/images/tower-expl.png) |

---

## 🧭 免费开源游戏一 · AI PRODUCT RPG（`rpg/`）

入职 NOVA·AI，十周历劫：虚荣指标、99% 的谎言、胡说八道的 AI、凌晨两点的 P0——最终在 CEO 复盘会上证明自己。**≈50 分钟通关，进度本地保存。**

- 👑 四档季终结局：天选之人 / 传奇产品人 / 稳健派 / 潜力股
- 📉 不进则退：每周指标自然下滑，躺赢不存在
- 📖 94 词术语悬浮词典 · 一键跳「术语深化塔」
- 🌱 三盆伴学植物 · 🧪 零失误药剂 · ☕ 3 小时温柔休息提醒
- 💾 存档码跨设备 · 开场 / 每章 / 终章过场动画

## 🗼 免费开源游戏二 · 概念试炼塔（`tower/`）

245 题 roguelite 爬塔（另 6 座进阶实战塔 90 题，随秋招上新）：3 颗心、限时精英层、BOSS 层、道具商店——**每题带一句话解析**。选塔页上排**基础专项塔**，下排**六厂实战塔**（各带压轴 Boss 题）。**≈10 分钟/局。**

- 👁 **暗影复仇**：错题 3 层后回来重考，连对两次净化（跨局生效）
- 🎵 试炼 BGM（92 BPM 合成器，比 RPG 稍进击，可关）
- 🔥 贡献榜：本地贡献值点亮塔层（不给名次，只给鼓励），附示范塔友
- 🗼 17 座塔（11 基础 + 🏢 6 大厂实战）· `?mod=` 直达 · 弱点侦察 · 段位系统
- 🎴 **每日挑战**：全世界今天爬同一座塔（日期种子 · 1 心 10 层 · 连胜 streak）
- 🏆 **跨游戏成就墙**（18 枚，两游戏互通，存档码打包）
- 🏢 **进阶实战塔**：按各大厂测评考点原创编写（非官方真题），随秋招持续上新，游戏内按需解锁——其余全部免费
- 覆盖 16 模块：ML · LLM 训练/推理 · RAG · Agent · 评估 · Infra · 产品商业 · 业务场景

**组合玩法**：在 RPG 里理解 → 去塔里记牢 → 暗影替你对抗遗忘曲线。

两款游戏都支持键盘操作（A–D 答题 / Enter 继续），可安装为 PWA 离线游玩，进度本地保存、存档码跨设备。

---

## 🚀 运行 / Run

**在线玩**：https://ink7011.github.io/ai-pm-exam-games/ · **本地**：`python3 -m http.server 8000` · **测试**：`node tools/smoke.js` · **微信小程序**：`miniprogram/`（已同步 245 题 · 解析 · 大厂分区 · 兑换码与 Web 互通，导入微信开发者工具即可预览，发布指南见 `docs/WECHAT.md`）

## 🤖 附赠：终端刷题 Agent Skill

```bash
cp -r agent-skill ~/.claude/skills/ai-pm-quiz    # Claude Code；ZCode 用 .zcode/skills/
```

装好后对 Agent 说「来一道 AI 产品题」——同源题库，错题间隔重考。

## 🗺 路线图 / Roadmap

- [ ] 英文版 / English version
- [ ] RPG Season 2：模型战争（Benchmark 迷思 / SFT / RLHF / Reasoning）
- [ ] 微信小程序发布 / WeChat Mini Program release
- [ ] 更多题库接入（欢迎 PR 你的题库）

**更新题库**：`python3 tools/build-deck.py 你的题库.md -o tower/js/deck-data.js` · [MIT](LICENSE)

**迭代工作流**：本仓库用 Builder / Reviewer 分离制开发（grill → spec → tickets → implement → code-review），见 **[docs/WORKFLOW.md](docs/WORKFLOW.md)**。
