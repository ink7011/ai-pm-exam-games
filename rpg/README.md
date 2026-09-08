# AI PRODUCT RPG

> **Build. Break. Fix. Ship. — Learn AI by running an AI company.**

一款可以玩完整流程的 AI 产品经理校招训练游戏。你扮演 NOVA·AI 的新人 Product Associate，在真实的职业剧情里做产品决策、处理事故、分析数据、选择技术方案——不知不觉掌握 AI 产品 & 运营校招需要的技术、产品、数据和商业知识。

## 🎮 怎么玩

**双击打开 `index.html` 即可**（纯前端、零依赖、离线可玩，推荐 Chrome/Edge/Safari）。

进度自动保存在浏览器本地（localStorage），关掉页面下次接着玩；「系统 → 重置全部进度」可重开。

## 📖 当前版本内容（Season 1 · 入职）

| # | 事件 | 核心知识点 |
|---|------|-----------|
| 01 | DAU 涨了，CEO 却皱眉 | Activation / 北极星 / 虚荣指标 |
| 02 | 99% 准确率的陷阱 | 类别不均衡 / Precision-Recall |
| 03 | 离线第一，线上翻车？ | 离线≠在线 / 灰度+AB+回滚 |
| 04 | AI 在胡说八道 | RAG / Knowledge Freshness |
| 05 | 慢 | TTFT / 感知延迟 / 流式输出 |
| 06 | 更强 = 更大？ | 能力-成本-延迟三角 / 推理降本三板斧 |
| 07 | 数据里的幽灵 | 分布漂移 / 数据监控 |
| 08 | 技术擂台 | Prompt vs RAG vs Fine-tune 成本阶梯 |
| 09 | 谁为质量把关 | 回归评测集 / LLM-as-Judge |
| 10 | 凌晨两点的电话 | 事故响应（回滚优先）/ 结构化输出 |
| ⚔ | BOSS · 季度复盘会 | 根因汇报 / Trade-off / 用数据证明价值 |

## 🧩 核心机制

- **决策而非答题**：剧情 → 调查（有限次数，路线即画像）→ 假设 → 决策 → 真实后果 → 复盘学习
- **术语悬浮词典**：94 个技术术语带虚线标记，悬停/点按即看「一句人话 + 小例子」，新手不被黑话卡住；顶栏「术语表」可搜索全部术语并跳转试炼塔专项练习
- **轻柔慢板 BGM**：76 BPM、无鼓组、暖垫+慢琶音+稀疏钟琴（零音频文件），系统菜单可开关
- **文竹伴学**：左下角一盆小文竹，随累计游戏时长长出新枝（最多 8 枝），悬停看它陪你多久
- **存档码**：系统菜单导出/导入——两个游戏的进度和文竹时长打包成一串码，换设备/换浏览器粘贴即续
- **真实失败**：选错会让公司指标真的掉、CEO 真的会骂，错两次林博士才会揭晓答案
- **技能树**：17 个技能全部通过解决剧情问题解锁，每个都附「校招笔试映射」
- **错题记忆**：错误知识点会换一张皮（变体题）在 Boss 战前回炉重考，直到掌握
- **公司经营面板**：Revenue / Users / Trust / Quality / Cost / Morale 六项指标随决策实时变动
- **季终报告**：AI Product Thinking Profile（诊断路径画像）+ 绩效评级 + 能力报告导出

## 🗂 项目结构

```
rpg/
├── index.html      # 三栏 RPG 布局 + 终端风样式
└── js/
    ├── content.js  # 剧情数据库：NPC / 技能树 / 知识卡 / 11 个 Case / 错题变体
    └── engine.js   # 游戏引擎：状态机 / 调查-决策循环 / 存档 / Boss / 报告
```

## ➕ 如何扩展 Season 2+

在 `js/content.js` 的 `CASES` 数组里追加 case 对象即可，无需改引擎：

```js
{
  id: 's2c1',
  title: 'Benchmark 第一，用户流失',
  brief: '……',
  tags: ['LLM', '对齐'],
  intro: [ { npc: 'lin', text: '……' } ],
  investigate: { budget: 3, options: [ { id, label, layer: 'Model', title, clue } ] },
  rounds: [ { qLabel, q, options: [{t, ok, fx, fb, why}], hints: [..], skill: 's_xxx', kp: '知识点名' } ],
  outro: [ { npc: 'lin', text: '……' } ]
}
```

- `skill` 对应 `SKILLS`/`KNOWLEDGE` 里的 id（新增知识点时同步登记）
- `layer` 影响季终「诊断路径画像」
- 新增错题变体：往 `VARIANTS` 里加 `{kp, text, options, ans, explain}`，kp 与 round 的 kp 一致才会被回炉系统抽中

规划中的赛季：S2 模型战争（Benchmark/SFT/RLHF/DPO/Reasoning）· S3 RAG 危机 · S4 Agent 时代 · S5 增长危机 · S6 模型失速 · S7 推荐战争 · S8 Infra 战争 · S9 多模态 · S10 终局。
