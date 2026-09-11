# SHUAMONE 耍门

### Play the decisions. Learn the career.

> **A career simulation platform where you step into professional roles, make real decisions, and see what happens next.**
> 耍中找学，学中来耍。耍学结合，以耍为主。

[![Play Online](https://img.shields.io/badge/▶_在线玩_Play_Online-22d3ee?style=for-the-badge)](https://ink7011.github.io/ai-pm-exam-games/)
[![Questions](https://img.shields.io/badge/免费题库-245_题-fbbf24.svg)](tower/js/deck-data.js)
[![Status](https://img.shields.io/badge/status-early--stage_prototype-fbbf24.svg)](docs/CHANGELOG.md)
[![Tests](https://img.shields.io/badge/smoke-209_断言-34d399.svg)](tools/smoke.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399.svg)](LICENSE)

**如果这个仓库帮到了你，点一个 ⭐ 让更多人看到。**

---

## What is this?

**SHUAMONE 耍门** is an AI-native career sandbox — a collection of playable simulations that let you experience what a career actually feels like before committing to it.

Traditional learning platforms organize content around subjects. We organize it around **you**:

```
SHUAMONE 耍门 (Career Sandbox)
│
├── 🧭 Product World
│   ├── AI PRODUCT RPG — 十周试用期，练判断力
│   └── 概念试炼塔 — 335 题爬塔，练记忆力
│
├── 🚀 Founder World
│   └── OPC Simulation — 一个人，$0 到 $1K MRR（内测中）
│
└── [Future] Growth World · Builder World · ...
```

## The Idea

> People don't know what a career actually feels like until they enter it.

Each simulation puts you inside a professional role:

- **AI Product Manager**: Navigate ambiguity, build products, make high-stakes decisions
- **Solo Founder (OPC)**: Build something from zero with limited time, money, and energy

You don't memorize frameworks. You **make decisions, experience consequences, and develop judgment** — the learning is invisible.

```
Goal → Diagnose → Quest → Decision → Consequence → Memory → Level Up → New Quest
```

## Current Simulations

### 🧭 AI PRODUCT RPG · 判断力训练

入职 NOVA·AI，十周试用期。虚荣指标、99% 的谎言、胡说八道的 AI、凌晨两点的 P0——最终在季终复盘会证明自己。

- 10 个剧情 Case · 四档结局 · 94 词术语悬浮词典
- 你的选择有**回响**：第一周的决定会在后面的周回来找你
- 6 维公司指标随每次决策真实摆动 · 不进则退

### 🗼 概念试炼塔 · 记忆力训练

335 题 roguelite 爬塔（245 免费 + 6 座进阶实战塔）。答错的题化为**暗影**回塔复仇——连对两次才净化。

- 每题四选项逐一判词 · 间隔重复的游戏化
- 🎴 Adaptive Daily：围绕你的成长区与本周错题聚焦
- 🎵 WebAudio 实时合成 BGM · PWA 离线可玩

### 🚀 OPC Simulation · 创业模拟（内测中）

一个人 · 一台电脑 · 几个 AI Agent · $0 收入。6 个决策节点，从选市场到第一个 $1K MRR。

- 5 维属性：Revenue / Runway / Momentum / Product / **Energy**
- Energy 归零 = 过劳出局 · Runway 归零 = 没钱出局
- 选择回响：你在 N1 选的市场、N2 的构建策略、N4 的定价，都会在后面的节点回来找你

## Personal Career Layer

Every simulation feeds your **Learner Model** — a cross-game profile that evolves with you:

- **Onboarding（3 问）**: 想成为谁 → 现在在哪 → 想加强什么
- **Skill Map**: 7 项技能由真实作答计算（不是自评），强项/成长区/下一推荐任务
- **Today's Quest**: 规则引擎推荐最弱技能对应的任务 + "Why this, why now"
- **Career Journey**: 时间轴上的每一步都来自真实事件

```
RPG 每周复盘 → Judgment+2
塔每题答对 → 对应技能+2
OPC 每节点 → Business+2, Judgment+1
```

## Architecture

- **零依赖**: 纯原生 JS，无框架、无构建、无后端、零 npm install
- **配置驱动引擎**: 每个模拟是一份 `SIM` 配置（指标/初始值/衰减/结局/角色/技能喂养），引擎通用
- **类型契约**: `shared/types.js` 定义存档形状，`tsc --checkJs` 编译期检查字段匹配
- **PWA 离线**: Service Worker 版本化缓存，断网可玩
- **测试**: `node tools/smoke.js` — 209 条断言（语法/题库/引擎/安全边界/版本卫生）

```bash
# 本地运行
python3 -m http.server 8000

# 测试
node tools/smoke.js

# 类型检查
./tools/typecheck.sh
```

## Product Philosophy

- **We are exploring whether** organizing learning around the learner improves engagement — 不是"我们重新发明了教育"
- **Early-stage prototype**: 没有成千上万的 learners，没有已验证的留存数据
- **AI-native ≠ AI-generated everything**: 个性化全部由规则引擎驱动（无 LLM、无 API），先证明 Personalization → engagement
- **Play first. Learn along the way.** 耍中找学，学中来耍，以耍为主

## Screenshots

| 门户 + Career 面板 | RPG · 剧情决策 | 塔 · 暗影复仇 | Skill Map |
|---|---|---|---|
| ![hub](docs/images/hub.png) | ![gameplay](docs/images/rpg-gameplay.png) | ![battle](docs/images/tower-battle.png) | ![expl](docs/images/tower-expl.png) |

## Documentation

- **[docs/CHANGELOG.md](docs/CHANGELOG.md)** — 迭代记录 v0.1 → v0.5
- **[docs/DESIGN-DECISIONS.md](docs/DESIGN-DECISIONS.md)** — 10 条设计取舍（含被否掉的方案）
- **[docs/WORLDVIEW.md](docs/WORLDVIEW.md)** — 世界观正典 · 编年史 · 过场动画
- **[docs/WORKFLOW.md](docs/WORKFLOW.md)** — Builder/Reviewer 分离制 + Soul Review 宪章

## 🗺 Roadmap

- [ ] OPC 故事扩容：创业社区 / VC / 路演 / 融资 / 竞对 / 个人生活
- [ ] RPG Season 2：模型战争（Benchmark 迷思 / SFT / RLHF / Reasoning）
- [ ] 验证 Career Sandbox 三假设（真实留存数据）
- [ ] 更多题库接入（欢迎 PR 你的题库）

**更新题库**：`python3 tools/build-deck.py 你的题库.md -o tower/js/deck-data.js` · [MIT](LICENSE)

**迭代工作流**：Builder / Reviewer 分离制，见 [docs/WORKFLOW.md](docs/WORKFLOW.md)。
