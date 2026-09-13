# SHUAMONE 耍门 · 品牌视觉规范 Brand Visual Guidelines

> **一句话**：奶油白底上的雾蓝与淡紫，星光点缀，拱门与圆窗，零直角——一个梦幻、空灵、治愈的「未来童话」学习世界。
>
> 本规范是全站视觉的唯一正典（single source of truth）。改动视觉先读这里，再动 `shared/theme.css`。

*Last updated: 2026-09-13 · 落地版本：shuamone-v9（对比度 AA 重校）*

---

## 一 · 风格定位 / Positioning

| 关键词 | 反面（我们不是） |
|---|---|
| 梦幻 Dreamy | 赛博朋克霓虹 |
| 空灵 Ethereal | 重口渐变玻璃拟态滥用 |
| 治愈 Healing | 深色终端 / 高对比科技风 |
| 轻盈 Light | 厚重阴影、实心色块 |
| 未来童话 Future Fairytale | 企业 SaaS 中性风 |

**情绪基准**：清晨薄雾中的天文台 ☁️🔭——安静、有光、有小星星，但不吵。

---

## 二 · 色彩令牌 / Color Tokens

全部定义在 `shared/theme.css`，页面禁止自建 `:root` 色令牌。

### 背景层级

| 令牌 | 值 | 用途 |
|---|---|---|
| `--bg` | `#F7F6F2` | 页面底 · 奶油白 |
| `--bg-soft` / `--bg-deep` | `#F5F3EE` / `#F1F4F0` | 顶部/底部渐变端点 |
| `--panel` | `#FFFFFF` | 实心面板 |
| `--panel-glass` | `rgba(255,255,255,.68)` | 玻璃面板（配 backdrop-blur 14px） |
| `--panel2` | `#FDFCFA` | 输入框 / 次级面板 |
| `--track` | `#EAF2F7` | 进度条轨道 |

页面 body 统一渐变：`linear-gradient(180deg,#F5F3EE 0%,#F7F6F2 35%,#F1F4F0 100%)`，
并配右上雾蓝、左下淡紫两个 blur(56px) 径向光斑（各页 `body::before/after`）。

### 品牌色

| 令牌 | 值 | 用途 |
|---|---|---|
| `--cyan` | `#3A729B` | **主色** · 雾蓝深（链接/强调/文字级强调）⚠️ 沿用旧名勿改 |
| `--blue` | `#7CB8D4` | 雾蓝亮（渐变浅端、图形填色） |
| `--blue-deep` | `#32648C` | 雾蓝暗（渐变深端、hover） |
| `--violet` | `#7663AA` | 辅色 · 淡雾紫 |
| `--gold` / `--gold-text` | `#E0B33C` / `#C9962E` | 星光金（图形用 / 文字用） |
| `--coral` | `#DE8A74` | 珊瑚点缀 |
| `--mint` | `#6FC0A4` | 薄荷点缀 |

### 功能色（浅底可读版）

| 令牌 | 值 |
|---|---|
| `--green` 成功 | `#2E7D62` |
| `--red` 失败 | `#B35050` |
| `--amber` 警告 | `#8F6A1E` |

### 文字层级（蓝灰墨系，非纯黑）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--ink` | `#5A6B8C` | 标题 |
| `--dim` | `#5C6B86` | 正文 |
| `--faint` | `#76869F` | 次要/占位 |

**禁用**：纯黑 `#000`、旧暖墨 `#3D3A34` 系、任何深色底面板（弹窗遮罩用 `rgba(90,107,140,.32)` 雾纱）。

---

## 三 · 形状语言 / Shape Language

**零直角原则**：任何可见矩形至少 8px 圆角；CTA 一律胶囊。

| 半径令牌 | 值 | 用途 |
|---|---|---|
| `--r-xl` | `22px` | 大卡片（OPC 面板、hub 主卡） |
| `--r-lg` | `16px` | 常规卡片 |
| `--r-md` | `12px` | 小块/内嵌元素 |
| `--r-pill` | `999px` | 按钮、chip、进度条、头像 |

---

## 四 · 视觉母题库 / Motifs

参考图提炼的四个可复用母题（CSS/SVG 级实现都在 `shared/theme.css`）：

### 1. 星光 ✦ Starlight
`.sh-star.s1~.s4` 四个预设位（右上角落区域），金/紫/薄荷/蓝四色交替，`sh-twinkle` 3.4s 缓慢闪烁。移动端 s3/s4 自动隐藏。
**分布原则**：只出现在页面右上象限，最多 4 颗，纯装饰 `pointer-events:none`。

### 2. 拱门 🏛 Arch（最强形状 DNA）
`border-radius: 999px 999px 12px 12px`（罗马拱：顶半圆+两侧直边）。
**用于**：hub 游戏卡的图标窗（`.g-arch`）、插画框。像一扇通往游戏世界的小门。

### 3. 圆形画框 ⬤ Orb
圆形容器 + 白描边 + 内侧底光，像一颗小行星。
**用于**：hub 周卡图标（`.tcard .ic`）、角色图鉴头像（`.ccard .cav svg`）。

### 4. 虚线轨道 🪐 Orbit
`border-left: 2px dashed rgba(124,184,212,.55)` 穿过圆点节点，像行星串在轨道上。
**用于**：journey 里程碑时间线（`.tl::before`）。

### 5. 氛围光斑 ☁️ Glow Blobs（背景级）
右上雾蓝 `rgba(184,216,232,.32)` + 左下淡紫 `rgba(201,190,224,.26)`，各 ~500px，blur 56px。
**云朵插画**：暂缓（需要成套插图，勿用 CSS 硬凑）。

---

## 五 · 组件规范 / Components

### 胶囊按钮 `.sh-btn` / `.sh-btn--primary`
- 默认：白底 + `--line` 1.5px 边 + 胶囊；hover 上浮 1px + 边变雾蓝
- 主按钮：`linear-gradient(135deg, --blue, --cyan)` 白字 + 雾蓝柔光投影
- **渐变按钮上永远用白字**（旧版深字 `#05070c` 已废弃）

### 玻璃卡片 `.sh-card`
`--panel-glass` + `backdrop-filter: blur(14px)` + `--line` 边 + `--shadow`。
游戏内高密度面板（RPG 消息流、塔结算）用实心 `--panel` 即可，玻璃留给页面级卡片。

### 眉题 `.sh-kicker`
等宽字体 11px / letter-spacing 4px / `--cyan`。全站中英双语小标沿用此式。

---

## 六 · 页面落地清单 / Where It Lives

| 页面 | 主题化要点 |
|---|---|
| 门户 `index.html` | 渐变底+光斑+星光；游戏卡拱门窗；周卡/头像圆形画框；chip+CTA 胶囊 |
| RPG `rpg/index.html` | 顶栏白玻璃、消息流浅底、终稿雾蓝 |
| 试炼塔 `tower/index.html` | 顶栏白玻璃、计时/进度雾蓝轨道、弹窗雾纱 |
| 技能图谱 `skillmap/` | 令牌直连，技能条雾蓝渐变 |
| 旅程 `journey/` | 虚线轨道时间线 + 行星珠节点 |
| OPC `opc/` | **风格基准页**：五色指标条（金/蓝/珊瑚/薄荷/紫）、NPC 加深彩名、玻璃卡+胶囊全套 |

---

## 七 · 对比度纪律 / Contrast Discipline（v9 重校）

2026-09-13 用户反馈「有的反转」后全站重校。令牌新值全部按 WCAG 计算过：

| 层级 | 令牌 | 值 | 对 #F7F6F2 底 | 用途边界 |
|---|---|---|---|---|
| 正文 | `--dim` | `#5C6B86` | 5.0:1 ✅ AA | 句子、说明、标签 |
| 微标 | `--faint` | `#76869F` | 3.4:1 | **仅限**大写等宽 microcopy（kicker/footnote ≥11px），禁止整句 |
| 强调 | `--cyan` | `#3A729B` | 4.8:1 ✅ AA | 链接、强调、小型文字 |
| 图形 | `--blue` | `#7CB8D4` | 2.2:1 | 只做渐变端/边框/图形，**不做文字色** |

白字渐变按钮规则：渐变两端都必须 ≥4.5:1（白字）。
蓝系按钮用 `(var(--cyan) → var(--blue-deep))`；金系用 `(#8F6A1E → #7A5A18)`；
金珊瑚用 `(var(--amber) → var(--coral-deep) #B85A45)`。
NPC 名字色以 `opc/js/content.js` NPCS 表为准（全部 ≥4.5:1）。

审计工具：浏览器内 WCAG 审计脚本（走 DOM 算有效背景含渐变端点），改版后必跑。

---

## 八 · 改动纪律 / Change Discipline

1. 加颜色先看令牌表；没有合适的令牌 → 先加进 `shared/theme.css` 再用，**禁止页面内硬编码 hex**。
2. 改 `shared/theme.css` 必须同步：引用处 `?v=` 递增 + `sw.js` 的 `CACHE` 版本递增。
3. 新组件遵循零直角 + 胶囊 CTA + 蓝灰墨文字三原则。
4. 图片上的题注纱用 `rgba(58,72,98,.85)` + 白字（深蓝灰纱，不用纯黑）。
5. NPC / 人物色：使用 OPC 加深版彩名（`opc/js/content.js` NPCS 表为基准），保证奶油白底上 4.5:1 对比度。

---

*本文档与 `shared/theme.css` 同步维护；视觉改版走 Builder/Reviewer 工作流（见 `docs/WORKFLOW.md`）。*
