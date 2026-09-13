/* ============================================================
   AI PRODUCT RPG — 内容数据库 (Season 1)
   Learn AI by running an AI company.
   ============================================================ */
window.CONTENT = (function () {

  /* ---------- SIM 配置（V0.6 票1：引擎与内容分离的第一块基石）----------
     以前散落在 engine.js 的四处硬编码——指标表/初始值/衰减/结局公式——现在收进这里。
     未来新 Simulation（如 OPC）按同一 schema 提供自己的 SIM 块即可复用引擎。
     schema 见 shared/types.js 的 SimConfig 契约。 */
  const SIM = {
    role: 'AI Product Manager',
    startRole: 'Product Associate',
    metrics: [
      { id: 'revenue', label: 'Revenue 营收' },
      { id: 'users', label: 'Users 用户' },
      { id: 'trust', label: 'Trust 信任' },
      { id: 'quality', label: 'Model Quality 质量' },
      { id: 'cost', label: 'Cost 成本', reversed: true },
      { id: 'morale', label: 'Morale 士气' }
    ],
    init: { revenue: 58, users: 52, trust: 68, quality: 72, cost: 45, morale: 64 },
    drift: { quality: [-4, -2], trust: [-3, -1], cost: [1, 3] },   // [min, max] 含端点；每周不进则退
    final: {
      // 结局权重：cost 反向计。companyAvg = Σ(value × weight) / Σweight，cost 取 (100 - v)
      weights: { revenue: 1, users: 1, trust: 1, quality: 1, cost: 1, morale: 1 },
      invert: ['cost'],
      tiers: [
        { grade: 'S', name: '天选之人', cls: 'tier-legend', kicker: 'SEASON 1 COMPLETE · PERFECT',
          title: '👑 天选之人 · The Chosen One',
          headline: '十周，每一道题都首答命中。这不是运气，是产品直觉。',
          victor: '“我改一下招聘流程——以后这个岗位的 JD 里会写：要求达到 ta 的一半。”',
          lin: '“数据不会说谎。你是我带过的新人里，最接近『产品直觉』这个词的一个。”',
          min: 100, minTrust: null },   // acc>=100 直达；或 acc>=95 且 trust>=85
        { grade: 'S', name: '传奇产品人', cls: 'tier-star', kicker: 'SEASON 1 COMPLETE · EXCELLENT',
          title: '🌟 传奇产品人 · The Rising Star',
          headline: '错误很少，且每一次都被你变成了经验。',
          victor: '“下季度的产品评审会，第一场由你来主持。”',
          lin: '“你的判断链已经成形——接下来只是让它在更多场景里被验证。”',
          min: 85, minTrust: null },
        { grade: 'A', name: '稳健派', cls: 'tier-steady', kicker: 'SEASON 1 COMPLETE · SOLID',
          title: '🌿 稳健派 · The Steady Hand',
          headline: '没有惊才绝艳，但每一步都踩得住。',
          victor: '“稳，比快值钱。”',
          lin: '“这是能在这行走十年的人的样子。补齐薄弱模块，你会更快。”',
          min: 70, minTrust: null },
        { grade: 'B', name: '潜力股', cls: 'tier-potential', kicker: 'SEASON 1 COMPLETE · KEEP GOING',
          title: '🌱 潜力股 · The Dark Horse',
          headline: '你犯的每个错都被记进了错题本——而错题会回来，你也会赢回来。',
          victor: '“我们投资潜力。”',
          lin: '“再战一局，Boss 战前那些题还会考你。赢回来，就是真正掌握了。”',
          min: 0, minTrust: null }
      ],
      legendGate: { min: 95, minTrust: 85 }   // 天选之人双门：acc 与 trust 同时达标
    },
    skillFeed: { chapter: { judgment: 2 }, finished: { judgment: 6 } }   // Learner Model 喂养表
  };

  /* ---------- NPC ---------- */
  const NPCS = {
    you:   { name: '你', color: '#7CB8D4' },
    victor:{ name: 'Victor · CEO', color: '#C9962E', role: 'CEO' },
    lin:   { name: '林博士 · CTO', color: '#AC9CC8', role: 'CTO' },
    kai:   { name: 'Kai · ML 工程师', color: '#6FC0A4', role: 'ML' },
    maya:  { name: 'Maya · Growth', color: '#C96A9E', role: 'Growth' },
    raj:   { name: 'Raj · 客服负责人', color: '#CC7440', role: 'Support' },
    dana:  { name: 'Dana · 企业销售', color: '#4A7EC0', role: 'Sales' },
    sys:   { name: 'NOVA 终端', color: '#8A94A8', role: 'SYSTEM' }
  };

  /* ---------- 技能树（Season 1 节点） ---------- */
  const SKILL_CATS = ['AI 指标', 'ML 基础', '评估与发布', 'RAG 与知识', '推理与成本', '数据', '产品决策'];
  const SKILLS = {
    s_activation: { cat: 'AI 指标', name: 'Activation 与 Aha 时刻', desc: '激活=第一次成功完成任务，不是注册或打开' },
    s_northstar:  { cat: 'AI 指标', name: 'AI 产品北极星', desc: '每周成功任务数 > DAU 这类虚荣指标' },
    s_imbalance:  { cat: 'ML 基础', name: '类别不均衡', desc: '1:99 时 accuracy 是伪指标，用 F1 / PR-AUC' },
    s_precall:    { cat: 'ML 基础', name: 'Precision / Recall 取舍', desc: '漏掉贵→Recall；误伤贵→Precision' },
    s_offonline:  { cat: '评估与发布', name: '离线≠在线', desc: '灰度 + AB 实验 + 一键回滚，发布三件套' },
    s_regression: { cat: '评估与发布', name: '回归评测集', desc: '每次上线的质量门禁，防能力退化' },
    s_judge:      { cat: '评估与发布', name: 'LLM-as-Judge', desc: '人评定标 + judge 放量，注意位置/冗长偏差' },
    s_freshness:  { cat: 'RAG 与知识', name: 'Knowledge Freshness', desc: '知识更新要同步到检索索引，否则答旧知识' },
    s_ladder:     { cat: 'RAG 与知识', name: 'Prompt→RAG→FT 阶梯', desc: '知识用 RAG，风格与格式用 FT，能 Prompt 就 Prompt' },
    s_ttft:       { cat: '推理与成本', name: 'TTFT 与感知延迟', desc: '首字延迟决定用户体感，不是总生成时间' },
    s_stream:     { cat: '推理与成本', name: '流式输出', desc: '总时间不变，感知体验质变' },
    s_tradeoff:   { cat: '推理与成本', name: '能力-成本-延迟三角', desc: '三者互相牵制，没有免费午餐' },
    s_infercost:  { cat: '推理与成本', name: '推理降本三板斧', desc: '量化 / 缓存 / 路由（小模型干简单活）' },
    s_drift:      { cat: '数据', name: '分布漂移', desc: '模型没变≠世界没变，要监控输入分布' },
    s_incident:   { cat: '产品决策', name: '事故响应：回滚优先', desc: '先止血回滚，再定位，再修复' },
    s_structured: { cat: '产品决策', name: '结构化输出约束', desc: 'JSON 稳定性靠解码层约束，不靠祈祷' },
    s_metricstory:{ cat: '产品决策', name: '用数据证明价值', desc: '拦截的坏发布数、事故率、MTTR' }
  };

  /* ---------- 知识卡（与技能一一对应） ---------- */
  const KNOWLEDGE = {
    s_activation: { title: 'Activation 与 Aha 时刻', body: '激活不是注册、不是打开 App，而是用户第一次完成"成功任务"。对 AI 产品，激活 = 第一次拿到可用的 AI 结果（写完第一份周报、修好第一段代码）。激活与 D7 留存强相关，是增长杠杆里最便宜的一环。', exam: '笔试映射：DAU 涨但留存平 → 选"首次成功任务引导"而非买量或加功能' },
    s_northstar:  { title: 'AI 产品北极星', body: 'AI 工具型产品的价值 = 帮用户完成任务。北极星常用"每周成功任务数"（可拆为 周活 × 人均成功任务）。DAU / 注册数 / 调用量都可以虚高而不产生价值——例如好奇心流量、脚本刷量。', exam: '笔试映射：判断哪个是虚荣指标、哪个是价值指标' },
    s_imbalance:  { title: '类别不均衡', body: '正负样本 1:99 时，模型全预测多数类也有 99% 准确率。此时 accuracy 失真，应看 F1 / PR-AUC，并用 Focal Loss、重采样、阈值调优来处理。这是欺诈检测、故障识别类场景的第一陷阱。', exam: '笔试映射："准确率 99% 却抓不到目标" → 类别不均衡，选 Focal Loss + PR-AUC' },
    s_precall:    { title: 'Precision / Recall 取舍', body: 'Precision=报出来的有多少是真的；Recall=真的有多少被抓到。漏掉代价高（疾病筛查、投诉升级）→ 保 Recall；误伤代价高（拦截正常用户）→ 保 Precision。先问"哪种错误更贵"，再调阈值。', exam: '笔试映射：给业务后果，选优先保 P 还是保 R' },
    s_offonline:  { title: '离线评估 ≠ 在线效果', body: '离线指标好但线上拉胯，常见原因：测试集与训练集泄漏（如随机切分让同一会话跨集）、分布差异（离线数据≠真实流量）、指标与业务目标错位。发布纪律：5% 灰度 → AB 实验 → 观察核心指标 → 全量，且必须有回滚预案。', exam: '笔试映射：离线 AUC 涨线上不动 → 先查特征穿越/数据泄漏' },
    s_regression: { title: '回归评测集（Regression Set）', body: '一组固定的"必须继续答对"的业务用例，每次模型/Prompt/配置变更都先跑一遍，任何用例退化即阻断发布。它防的是"改 A 坏 B"——AI 系统最常见的隐性事故。', exam: '笔试映射：升级后老功能变差 → 缺回归评测，选"建金标准回归集+门禁"' },
    s_judge:      { title: 'LLM-as-Judge 与人评', body: '人工评估准但贵、量小；LLM 评审便宜可放量，但有已知偏差：偏爱更长回答（冗长偏差）、偏爱第一个选项（位置偏差）、偏爱同家族模型。标准做法：人评小样本定标准 → judge 批量跑 → 定期抽样校准。', exam: '笔试映射："哪项不是 judge 的偏差" / 评估规模化方案' },
    s_freshness:  { title: 'Knowledge Freshness（RAG 数据新鲜度）', body: '模型参数化知识是静态的，RAG 靠检索外挂知识库。若知识库内容更新了但索引没同步，模型会忠实地检索到旧文档并自信作答——错在管线不在模型。企业知识频繁更新 → RAG + 增量索引 + 变更触发同步。', exam: '笔试映射：政策更新后 AI 还答旧的 → 更新索引/RAG，不是微调模型' },
    s_ladder:     { title: 'Prompt → RAG → Fine-tune 成本阶梯', body: '能 Prompt 解决（格式约束、角色、示例）就不要 RAG；知识频繁变化、要溯源 → RAG；要固化风格/行为/格式至骨子里 → SFT。三者可叠加。成本与见效周期：Prompt（小时级）< RAG（周级）< FT（月级+算力）。', exam: '笔试映射：三选一场景题（固定格式/每日更新知识/品牌语气）' },
    s_ttft:       { title: 'TTFT（Time To First Token）', body: '首字延迟是交互式 AI 产品的体感命门。等待超过 3-5 秒，放弃率显著上升。优化方向：Prefix Cache 复用固定前缀、PD 分离、更快的 prefill。注意：用户感知的是"开始出字"，不是"全部出完"。', exam: '笔试映射：客服机器人响应慢且 system prompt 固定长 → 选 Prefix Cache / PD 分离' },
    s_stream:     { title: '流式输出（Streaming）', body: '逐 token 返回，边生成边显示。总生成时间没变，但感知延迟从"20 秒白屏"变成"1 秒开始出字"。对完成率、留存有直接正向。这是最便宜体验优化之一——不动模型，动交付方式。', exam: '笔试映射："感知延迟"类题：流式输出改善的是体验不是真实速度' },
    s_tradeoff:   { title: '能力-成本-延迟三角', body: 'Capability × Cost × Latency 构成不可能三角：参数翻倍→能力↑但成本↑80%、延迟↑60%，收入未必跟上。产品决策是找约束下的最优，不是无脑上最强。问自己：这个场景需要的能力上限是多少？用户能容忍的延迟是多少？预算是多少？', exam: '笔试映射："为了更强直接扩参数"是经典错误选项（烧钱事故）' },
    s_infercost:  { title: '推理降本三板斧', body: '① 量化（INT8 几乎无损，INT4 更省但要验证）② 缓存（Prefix Cache 复用 system prompt；高频问答缓存）③ 路由/蒸馏（简单 query 给小模型，复杂留给大模型；或蒸馏出专用小模型）。三板斧组合常可在质量几乎不降的前提下砍掉一半成本。', exam: '笔试映射：GPU 成本高 → 量化/缓存/路由三件套，而非"换小模型一刀切"' },
    s_drift:      { title: '分布漂移（Distribution Shift）', body: '模型没变，但世界变了：新渠道带来新人群、新热点带来新 query、季节变化带来新场景。表现：模型"无变更却变差"。治理：输入分布监控（人群/意图占比）+ 定期重训 + 把新场景样本补进评测集。"模型没有版本变更"恰恰是排查线索而不是排除嫌疑的理由。', exam: '笔试映射：无模型变更但指标下滑 → 先查数据分布变化' },
    s_incident:   { title: '事故响应：回滚优先', body: '生产事故第一动作是止血（回滚最近变更），不是"再改一版试试"。每次再修改都是在未知基础上叠加新变量。流程：回滚 → 保留现场（日志/样本）→ 定位根因 → 修复 → 补测试与监控防复发。变更与故障的时间相关性是第一线索。', exam: '笔试映射：hotfix 后出事故 → 第一动作选"回滚+补回归用例"' },
    s_structured: { title: '结构化输出约束', body: '让大模型稳定输出 JSON：Prompt 里"请输出 JSON"是软引导，会漂（加代码块、改字段名）；解码层约束（JSON mode / grammar 约束）是硬保证。对外 API 产品尤其要硬保证 + 输出格式成功率监控。', exam: '笔试映射：JSON 解析失败 → 选解码级约束，不是温度调零或事后正则' },
    s_metricstory:{ title: '用数据证明价值', body: '汇报不是"做了多少事"，而是"改变了什么结果"。好的证据链：门禁拦截的坏发布数、线上事故率下降、平均恢复时长 MTTR 缩短、由事故造成的赔付/流失减少。先想清楚"成功长什么样"再立项，事后才证明得出来。', exam: '笔试映射：Boss 题"如何证明这三个月没白花" → 过程+结果双指标' }
  };

  /* ---------- 顶部行情条 ---------- */
  const TICKER = [
    'NOVA·AI 内部终端 // 保密等级：L3',
    'Nova Chat 周活突破 50 万，Growth 团队开香槟（第三次）',
    '分析师：AI 应用层估值逻辑从"讲故事"转向"毛利与留存"',
    '竞对 Titan AI 发布新一代模型，benchmark 声称第一',
    'GPU 供应商通知：下季度算力合约价 +12%',
    '企业客户开始要求"AI 幻觉率"写进 SLA',
    '开发者社区热议 MCP 工具生态标准',
    'Reminder：下次全员会 CEO 将复盘上季度 North Star 指标'
  ];

  /* ---------- Season 1 Cases ---------- */
  const CASES = [

    /* ============ CASE 1 ============ */
    {
      id: 'c1',
      title: 'DAU 涨了，CEO 却皱眉',
      brief: '入职第一周。DAU +20%，周活却原地踏步。搞清楚用户到底有没有获得价值。',
      tags: ['AI Metrics', 'Activation', 'P0 考点'],
      intro: [
        { sys: 'SEASON 1 · 入职 // WEEK 1 // 产品部 · 你（Product Associate）' },
        { npc: 'victor', text: '全员会刚结束。Nova Chat DAU 破 50 万，环比 +20%。我讲了三分钟增长。但我讲完看了眼周活跃——原地踏步。' },
        { npc: 'victor', text: '这两件事放在一起，只有一个解释：来的人没留下。我不想庆祝一个假繁荣。' },
        { npc: 'maya', text: '（私聊）别慌，这是你的第一个任务。我只给你一个线索：次周留存从 14% 掉到 9%，跌的这批人 DAU 贡献最大。' },
        { npc: 'lin', text: '新人，别急着提方案。先去把数据看明白。记住：你的第一个问题是——用户到底有没有从产品"得到价值"？怎么衡量？' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'funnel', label: '查行为漏斗', layer: 'Product', title: '数据面板 · 行为漏斗', clue: '曝光 → 点击进入对话 → 发起首个任务 → 完成首个任务 → 7 日内回访\n\n发起对话率 71%（健康）\n完成首个任务率 38%（异常）\n完成者 7 日回访 41% / 未完成者 6%' },
          { id: 'session', label: '抽样看会话内容', layer: 'Eval', title: '数据面板 · 会话抽样（n=500）', clue: '高频任务 Top3：写周报、翻译、改邮件。\n"写周报"会话完成率仅 41%，大量会话在第 2-3 轮后放弃。\n放弃原因聚类："不是我想要的形式""越改越乱"。' },
          { id: 'channel', label: '查流量渠道构成', layer: 'Growth', title: '数据面板 · 渠道', clue: '新增 DAU 主要来自一条病毒短视频（"用 AI 一秒写周报"）。\n该渠道用户 7 日留存 4%，自然流量用户 7 日留存 22%。好奇心流量占新增 6 成。' },
          { id: 'support', label: '调客服工单', layer: 'Product', title: '数据面板 · 用户之声', clue: '新用户差评关键词：\n"不知道能问什么"（34%）\n"答非所问就走了"（21%）\n"要自己想怎么问"（15%）' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION 01',
          q: '数据看完了。作为你入职后的第一个改进提案，你会把资源投给谁？',
          options: [
            { t: '趁热打铁投放大：DAU 势头正好，买量把规模做大', ok: false, mark: 'c1_buy', fx: { cost: 6, trust: -4 }, fb: 'Victor：好奇心流量本来就不留，买量等于花钱请人来看一眼再走。', why: '虚荣指标陷阱：DAU 可以被好奇心流量和买量虚高，不产生留存价值。' },
            { t: '首次任务引导：场景模板 + 示例问题，让新用户 5 分钟内完成第一个成功任务', ok: true, mark: 'c1_act', fx: { users: 4, trust: 3, morale: 2 }, fb: 'Maya：漂亮。完成首个任务的用户 7 日回访 41%，是未完成者的 7 倍——这才是杠杆点。', why: '激活的定义就是第一次成功任务。提升"完成率"直接放大留存基本盘。' },
            { t: '快速上线 5 个新功能，用新鲜感把用户留下来', ok: false, mark: 'c1_feat', fx: { cost: 6, quality: -2 }, fb: 'Lin：连一个任务都没完成的用户，不会因为多了 5 个入口而留下。', why: '未激活用户的问题不是选择不够多，而是第一次成功还没发生。' },
            { t: '全面改版 UI，提升第一印象', ok: false, mark: 'c1_ui', fx: { morale: -2 }, fb: 'Raj：用户不是嫌丑，是不知道拿它干什么。改版解决不了引导缺失。', why: '把体验问题误诊为审美问题——线索"不知道能问什么"指向引导而非界面。' }
          ],
          hints: [
            'DAU 涨、留存跌，说明新增用户完成"成功任务"了吗？查一下完成率。',
            '想想 Activation 的定义：不是注册，不是打开，而是第一次___？'
          ],
          skill: 's_activation', kp: 'Activation 与 Aha 时刻'
        },
        {
          qLabel: 'DECISION 02',
          q: 'Maya 顺势问你：那我们跟 CEO 汇报增长时，应该把哪个指标立为北极星？',
          options: [
            { t: 'DAU——投资人最认这个数', ok: false, fx: { trust: -2, morale: 1 }, fb: 'Victor：我今天刚被这个数骗过一次，你想让我再被骗一次？……行，你坚持的话，我去管投资人预期，团队先松口气。', why: 'DAU 能讨好外部，但可被好奇心流量虚高——内部会慢慢没人看这个数。' },
            { t: '累计注册用户数', ok: false, fx: { trust: -3 }, fb: 'Maya：累计数只增不减，讲的是历史不是价值。董事会上好看，团队里没人信。', why: '典型虚荣指标：永远上涨，永远说明不了现在做得好不好。' },
            { t: '每周成功任务数（周活 × 人均成功任务）', ok: true, mark: 'c1_north_task', fx: { trust: 4 }, fb: 'Lin：对。AI 产品的价值就是"帮人完成任务"。这个数涨，公司才真的在前进。', why: 'AI 工具产品的价值锚点是任务完成，北极星应能拆解到杠杆动作。' },
            { t: 'API 调用总量', ok: false, fx: { trust: -1, cost: 1 }, fb: 'Kai：调用量会被重试和脚本刷高，而且调用了不等于成功了——定这个，我们只会为了刷调用量做更多无用功。', why: '过程量当北极星，团队会优化过程而不是结果。' },
          ],
          hints: ['哪个指标既反映"真实用了"，又反映"用成了"？', '想想 AI 产品交付的到底是什么——token？点击？还是完成的任务？'],
          skill: 's_northstar', kp: 'AI 产品北极星'
        }
      ],
      outro: [
        { npc: 'lin', text: '第一周就摸到了门道：先看价值指标，再谈增长动作。记住今天这个感觉——"数据涨了但哪里不对"的直觉，是产品经理最值钱的东西之一。' },
        { sys: 'CHAPTER LOG // 你建立了 Nova Chat 的价值坐标系：Activation 与北极星。' }
      ]
    },

    /* ============ CASE 2 ============ */
    {
      id: 'c2',
      title: '99% 准确率的陷阱',
      brief: '意图分类器 99% 准确率，客服的投诉却天天漏。数字会撒谎。',
      tags: ['ML 基础', '类别不均衡', 'P0 考点'],
      intro: [
        { sys: 'SEASON 1 // WEEK 2 // 智能客服项目组' },
        { npc: 'kai', text: '兄弟们，意图分类器 v2 训完了，accuracy 99.2%！准备上线，自动把"投诉"类优先转人工。' },
        { npc: 'raj', text: '等等。上线三天了，投诉还是天天漏。昨天一条"再不解决我发微博"的工单被当成普通咨询，差点出舆情。你确定这模型没问题？' },
        { npc: 'kai', text: '不可能，99.2% 啊……要不你来看看？你是产品，你来判断该信什么数。' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'cm', label: '看混淆矩阵', layer: 'Eval', title: '数据面板 · 混淆矩阵', clue: '整体 accuracy 99.2%。\n但拆开看："投诉"类 Recall 仅 12% —— 每一百条真投诉，88 条被分成普通咨询。\n"普通咨询"类样本占 99%。' },
          { id: 'dist', label: '看样本分布', layer: 'Data', title: '数据面板 · 训练样本分布', clue: '普通咨询 98,700 条 / 投诉 1,000 条（约 1:99）。\n损失函数对两类一视同仁 → 模型学会的最优解：几乎全预测多数类。' },
          { id: 'cost', label: '算两类错误的代价', layer: 'Product', title: '数据面板 · 错误代价表', clue: '漏判投诉（False Negative）：舆情风险、客诉升级，代价极高。\n误判普通为投诉（False Positive）：多转一次人工，客服多花 2 分钟，代价低。' },
          { id: 'metric', label: '看团队汇报口径', layer: 'Eval', title: '数据面板 · 历次评审记录', clue: '项目组汇报只出现一个指标：accuracy。\n没有 Precision / Recall / F1，没有分场景拆解。' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION',
          q: '99.2% 的准确率为什么救不了 Raj 的投诉？你会怎么修这个模型项目？',
          options: [
            { t: '继续加数据再训练，样本够多就好了', ok: false, fx: { cost: 4 }, fb: 'Kai：加多少？比例还是 1:99，模型还是会学"全预测多数类"。', why: '不均衡的比例没变，堆数据不解决问题。' },
            { t: '把"投诉"判定阈值降到极低，宁可错杀不可放过', ok: false, fx: { morale: -2 }, fb: 'Raj：那我的客服团队每天要多接三倍假警报，真正的问题反而被淹没了。', why: '从一个极端走到另一个极端：只保 Recall，牺牲了可用性。正确做法是按代价调优平衡点。' },
            { t: 'Focal Loss / 重采样处理不均衡，评估改用 F1 与 PR-AUC，再按"漏投诉代价高"调阈值', ok: true, fx: { quality: 5, trust: 4 }, fb: 'Lin：对。不均衡问题先换指标再看模型。accuracy 在 1:99 下本来就是伪指标。', why: '标准解法组合拳：不均衡处理（Focal Loss/重采样）+ 正确指标（F1/PR-AUC）+ 按错误代价定阈值。' },
            { t: '换个更大的模型重训', ok: false, fx: { cost: 6 }, fb: 'Lin：更大的模型在同一个不均衡目标下，学到的还是同一套偏科。', why: '数据/目标问题不靠容量解决——经典干扰项"用更大模型"。' }
          ],
          hints: [
            '99.2% accuracy 里，分母 99% 是多数类。把"投诉类 Recall"单独拉出来看看？',
            '两类错误的代价一样吗？哪种错误更贵，就应该优先保 Precision 还是 Recall？'
          ],
          skill: 's_imbalance', kp: '类别不均衡'
        }
      ],
      outro: [
        { npc: 'raj', text: '修完这版，投诉类 Recall 上到 87%，误报可控。这单我记你头上了。' },
        { sys: 'CHAPTER LOG // 你学会了对"漂亮的汇总指标"保持怀疑——先拆分布，再看分项。' }
      ]
    },

    /* ============ CASE 3 ============ */
    {
      id: 'c3',
      title: '离线第一，线上翻车？',
      brief: '新模型离线评测全面领先，Kai 想直接全量。你来把关发布。',
      tags: ['评估', '灰度发布', 'P0 考点'],
      intro: [
        { sys: 'SEASON 1 // WEEK 3 // Nova Chat 模型周会' },
        { npc: 'kai', text: '新版本 Nova-2.3 离线评测全面领先：回答质量 +6 分，指令遵循 +9 分。我建议今天全量，抢在竞对发布会前面。' },
        { npc: 'lin', text: '全量之前，让产品把把关。上个版本也是离线赢 3 分，上线后满意度纹丝不动。这次别再"离线自嗨"。' },
        { npc: 'victor', text: '我只看结果：用户满意度、留存、成本。你们说的"分"我不关心。' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'split', label: '审查评测切分方式', layer: 'Eval', title: '数据面板 · 评测集构建', clue: '测试集与训练集按"随机切分"产生。\n同一会话的多轮样本同时出现在两边 → 模型可能"背过答案"，离线分数虚高（数据泄漏嫌疑）。' },
          { id: 'hist', label: '查上个版本上线数据', layer: 'Product', title: '数据面板 · 上版对照', clue: 'Nova-2.2：离线 +3 分 → 线上满意度 +0.2%（噪声级）。\n离线分布（标注数据）与真实流量差异显著：真实 query 更口语、更多错别字、更多多轮。' },
          { id: 'ab', label: '查发布基建', layer: 'Infra', title: '数据面板 · 发布能力', clue: '已具备 5% 灰度通道与 AB 实验平台。\n核心指标看板：任务成功率、满意度、人均会话数、单次成本。\n上一版本镜像保留，可一键回滚。' },
          { id: 'risk', label: '评估全量风险', layer: 'Business', title: '数据面板 · 风险清单', clue: '若线上翻车：50 万 DAU 全部受影响，品牌刚因"变笨"上过一次热榜。\n若灰度：损失 3 天时间窗口，但爆炸半径缩小 95%。' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION',
          q: '你的发布决策是：',
          options: [
            { t: '全量上线——离线分高这么多，不会有事', ok: false, fx: { trust: -6, quality: -3 }, fb: '（全量后满意度 -1.1%，热搜"Nova 变笨了"）Victor：这就是你说的全面领先？', why: '离线虚高（泄漏+分布差）没有排除，全量 = 把 50 万用户当小白鼠。' },
            { t: '5% 灰度 + AB 实验，观察任务成功率/满意度/成本，异常即一键回滚', ok: true, fx: { trust: 5, quality: 3 }, fb: 'Lin：这才是工程纪律。三天后 AB 数据出来了：满意度 +2.8%，成本持平——安全全量。', why: '发布三件套：灰度控制爆炸半径、AB 验证真实因果、回滚兜底。' },
            { t: '先不上线，离线再跑一轮评测', ok: false, fx: { trust: -2, users: -1 }, fb: 'Kai：同样的数据再跑十遍还是这个分，问题根本不在"跑几遍"。', why: '重复评测不改变泄漏与分布差——离线验证不了在线问题。' },
            { t: '拒绝上线，要求模型组无限期优化', ok: false, fx: { morale: -3 }, fb: 'Victor：不冒任何风险的团队也不会有任何进展。我们要的是受控的风险。', why: '因噎废食。正确姿势是控制风险地前进，不是停止前进。' }
          ],
          hints: ['随机切分 + 同会话跨集，这评测分数可信吗？', '如果线上出问题，现在的基建里有什么东西能救你？'],
          skill: 's_offonline', kp: '离线≠在线'
        }
      ],
      outro: [
        { npc: 'kai', text: '行，以后"全量直上"这个选项从我的字典里删了。' },
        { sys: 'CHAPTER LOG // 灰度 → AB → 回滚，发布纪律刻进了肌肉记忆。' }
      ]
    },

    /* ============ CASE 4 ============ */
    {
      id: 'c4',
      title: 'AI 在胡说八道',
      brief: '企业试点客户炸了：AI 引用了不存在的退款政策。信任危机 48 小时。',
      echoes: [
        { mark: 'c1_buy', npc: 'raj', text: '（回响）最近幻觉投诉有点怪——买量进来的用户问得特别泛，" Nova 能干嘛"这种问题占了两成。人来了，认知没来。', fx: { cost: 2 } }
      ],
      tags: ['RAG', '知识新鲜度', 'P0 考点'],
      intro: [
        { sys: 'SEASON 1 // WEEK 4 // Enterprise 试点 · 火星零售', urgent: true },
        { npc: 'dana', text: '紧急。火星零售的员工正在被我们的 AI 客服误导——AI 说"7 天无理由退款"，但他们上周三刚改成"30 天无理由"。客户 CIO 的原话：你们 AI 在胡说八道。' },
        { npc: 'dana', text: '客户给了 48 小时。搞不定，续约就没了。这单 200 万。' },
        { npc: 'lin', text: '模型两周没动过。问题不在模型……大概率。你去把链路查一遍。' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'model', label: '查模型版本记录', layer: 'Model', title: '数据面板 · 模型变更', clue: '当前模型 v2.3，14 天未变更。\n出问题的会话全部由该版本服务——模型不是变量。' },
          { id: 'kb', label: '查知识库与索引', layer: 'Retrieval', title: '数据面板 · 知识管线', clue: '知识库文档：周三 10:00 更新《退款政策 v3》（30 天）。\n检索索引：最后同步时间周一 22:00 —— 仍在检索《退款政策 v2》（7 天）。\nAI 检索到旧文档，并"忠实"地按旧政策回答。' },
          { id: 'log', label: '看出错会话的生成日志', layer: 'Retrieval', title: '数据面板 · 生成日志', clue: '出错回答 100% 引用了检索到的 v2 文档原文。\n模型没有编造——它只是引用了一个过时的真相。' },
          { id: 'scope', label: '查还有多少知识是旧的', layer: 'Business', title: '数据面板 · 影响面', clue: '抽查 50 个高频知识点：11 个存在"文档已更新、索引未同步"。\n同步靠人工周任务，无变更触发机制。这是系统性问题，不是单点事故。' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION',
          q: '根因已经清楚。48 小时内，你的修复方案是：',
          options: [
            { t: '立刻微调模型，把新退款政策"教"进去', ok: false, fx: { cost: 8, trust: -4 }, fb: 'Lin：等微调完、评测完、发布完，客户的续约已经凉了。而且下周政策再改呢？', why: '知识频繁变化用 FT 是反模式：贵、慢、每次更新都要重来。这是 RAG 的主场。' },
            { t: '先手动全量重建索引止血，再上线"知识变更→自动同步索引"的触发机制', ok: true, fx: { trust: 8, quality: 4 }, fb: 'Dana：客户 CIO 确认回答已恢复正确。触发机制上线后，这类事故根除。续约保住了。', why: '短期止血（重建索引）+ 长期机制（变更触发同步），治标又治本。' },
            { t: '让客服先人工回答所有政策类问题', ok: false, fx: { morale: -2 }, fb: 'Raj：可以救急，但你的产品卖点就是自动化。退回人工等于承认产品不行。', why: '兜底可以，但没解决根因——索引滞后还在，下一次更新还会翻车。' },
            { t: '在 Prompt 里加一句"请以最新政策为准"', ok: false, fx: { trust: -2 }, fb: 'Kai：模型检索到的就是旧文档，它怎么知道什么是"最新"？它没有别的新鲜知识来源。', why: 'Prompt 无法修复检索源过期——信息不在上下文里，说什么都没用。' }
          ],
          hints: [
            '模型没变、回答忠实于检索内容——那"错的真相"是从哪来的？',
            '知识每周都在变。把知识"焊死"在参数里（微调）vs 放在外部可更新的库（检索），哪个跟得上变化？'
          ],
          skill: 's_freshness', kp: 'Knowledge Freshness'
        }
      ],
      outro: [
        { npc: 'dana', text: '客户把这次事故写进了案例库——标题是"48 小时修复"。意外地成了加分项。' },
        { sys: 'CHAPTER LOG // 你第一次触摸到 RAG 的命门：答案的上限由检索源的新鲜度决定。' }
      ]
    },

    /* ============ CASE 5 ============ */
    {
      id: 'c5',
      title: '慢',
      brief: '用户说"转圈 8 秒"。工程师说"生成本来就慢"。谁对？',
      echoes: [
        { mark: 'c1_ui', npc: 'kai', text: '（回响）还记得你第一个月想全面改版 UI 吗？现在性能问题摆在眼前——好消息是，幸好当时没把工程资源烧在改版上。' }
      ],
      tags: ['推理', 'TTFT', '感知延迟'],
      intro: [
        { sys: 'SEASON 1 // WEEK 5 // Nova Chat 体验专项' },
        { npc: 'maya', text: '应用商店评分一周掉了 0.4 星，差评第一关键词：慢。"转圈 8 秒""等得心慌"。' },
        { npc: 'kai', text: '冤枉啊，模型生成本来就是这个速度，这是物理规律。要不我们优化优化动画？' },
        { npc: 'lin', text: '先搞清楚：用户说的"慢"，和我们说的"慢"，是同一个慢吗？' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'ttft', label: '拆解延迟指标', layer: 'Infra', title: '数据面板 · 延迟分位', clue: 'TTFT（首字延迟）P75 = 7.8s\n完整生成（最后一个字）平均 20s\n用户"体感等待"≈ TTFT，不是总时长——用户看到第一个字就开始读了。' },
          { id: 'fe', label: '查前端交付方式', layer: 'Product', title: '数据面板 · 前端逻辑', clue: '当前实现：等待完整生成 → 一次性渲染。\n竞品实现：逐 token 流式上屏，约 1 秒出首字。\n后端其实早已支持 streaming 接口——只是前端没用。' },
          { id: 'behavior', label: '查等待与放弃率关系', layer: 'Product', title: '数据面板 · 行为分析', clue: '首字等待 >5s 的会话，中途放弃率是 <2s 会话的 3.1 倍。\n放弃用户中 62% 不再回来——慢直接杀死留存。' },
          { id: 'cost', label: '评估各提速方案成本', layer: 'Infra', title: '数据面板 · 方案成本表', clue: '流式改造：前端 3 人日，模型零改动。\n换小模型：质量 -7%，省 40% 成本。\n推理优化（缓存/PD 分离）：3 周，风险中。' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION',
          q: '怎么治这个"慢"？',
          options: [
            { t: '上线流式输出：逐字上屏，首字 1 秒内出现', ok: true, fx: { users: 5, trust: 4 }, fb: 'Maya：评分一周回升 0.5 星，差评关键词"慢"占比腰斩。总生成时间没变，但没人觉得慢了。', why: '感知延迟由 TTFT 决定。流式不改变真实速度，改变感知——3 人日换留存，性价比之王。' },
            { t: '换小模型，生成速度翻倍', ok: false, fx: { quality: -6 }, fb: 'Raj：快是快了，但"变笨了"的差评顶上来了。用质量换速度，按下葫芦浮起瓢。', why: '在未区分 TTFT 与总时长的前提下砍模型，误伤能力——先动感知层再动模型层。' },
            { t: '优化 loading 动画，加"AI 正在深度思考"文案', ok: false, fx: { trust: -2 }, fb: '用户：我不是要看更漂亮的转圈。', why: '美化等待不缩短等待。文案可以辅助，不能替代。' },
            { t: '加个等待时间倒计时', ok: false, fx: { users: -2 }, fb: 'Kai：倒计时 8 秒？那是在提醒用户有多慢。', why: '同上——感知优化要做的是"更早给出价值"，不是"更精确地预告痛苦"。' }
          ],
          hints: ['用户体感的"慢"是首字时间还是总时间？哪个数字大？', '后端已经支持 streaming——最便宜的杠杆在哪里？'],
          skill: 's_ttft', kp: 'TTFT 与感知延迟'
        }
      ],
      outro: [
        { npc: 'kai', text: '学到了：性能优化第一问不是"怎么变快"，是"用户觉得什么慢"。' },
        { sys: 'CHAPTER LOG // TTFT、流式输出、感知延迟——体验的物理学。' }
      ]
    },

    /* ============ CASE 6 ============ */
    {
      id: 'c6',
      title: '更强 = 更大？',
      brief: 'CEO 要求"下个版本必须更强"。Kai 的方案：参数翻倍。你在评审会上。',
      echoes: [
        { mark: 'c1_act', npc: 'maya', text: '（回响）说个数据：你第一个月立的"首任务引导模板"，到现在还是回访引擎的第一功臣。老树还在结果。', fx: { users: 1, morale: 1 } }
      ],
      tags: ['Trade-off', '推理成本', '经典事故'],
      intro: [
        { sys: 'SEASON 1 // WEEK 6 // Nova-3.0 评审会' },
        { npc: 'victor', text: '竞对发布会看了吗？他们声称能力领先我们一代。下个版本，必须更强。预算好说。' },
        { npc: 'kai', text: '简单。参数翻倍，能力肯定涨。就是 GPU 预算要 +80%，推理延迟 +60%。' },
        { npc: 'lin', text: '（看向你）你是产品负责人。你觉得这个"更强"，用户买账吗？公司买得起吗？先去算笔账。' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'usage', label: '分析流量构成', layer: 'Infra', title: '数据面板 · 任务复杂度分布', clue: '当前流量：简单任务（改写/翻译/常规问答）占 68%，复杂任务（长文写作/代码/多步推理）占 32%。\n简单任务上大模型 = 高射炮打蚊子。' },
          { id: 'quant', label: '查推理优化空间', layer: 'Infra', title: '数据面板 · 推理现状', clue: '当前 FP16 部署 → INT8 量化：质量损失 <0.5%，吞吐 ×2.2。\nsystem prompt 平均 1.2 万 token 且高度重复 → 未启用 Prefix Cache。\n估算：量化+缓存可省 45% 推理成本。' },
          { id: 'distill', label: '查蒸馏与路由可行性', layer: 'Model', title: '数据面板 · 路由实验', clue: '内部实验：小模型处理简单任务，任务成功率 96%（大模型 98%）。\n按流量加权，整体质量几乎持平，综合成本 -38%。' },
          { id: 'biz', label: '算单位经济账', layer: 'Business', title: '数据面板 · 单位经济', clue: '参数翻倍：成本 +80%，延迟 +60%（TTFT 回到 5s+），预估收入 +5%（多数用户感知不到差距）。\n组合优化方案：省下的算力可用于复杂任务更长思考时间 → 复杂任务质量 +11%。' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION',
          q: '评审会表决。你的一票投给：',
          options: [
            { t: '参数翻倍——CEO 要更强，就用最直接的方式更强', ok: false, fx: { cost: 15, trust: -5, quality: 3 }, fb: '（上线后）Victor：季度账单出来了，推理成本 +82%，收入 +4%。你刚刚烧掉了公司一大笔钱。这就是 Capability–Cost–Latency 的三角，你忽略了后两个角。', why: '经典烧钱事故：用成本和延迟换用户感知不到的能力提升。' },
            { t: '组合拳：INT8 量化 + Prefix Cache + 简单任务路由小模型，省下的算力投给复杂任务（更长推理/更大上下文）', ok: true, fx: { quality: 6, cost: -8, trust: 4 }, fb: 'Lin：成本 -38%，复杂任务质量 +11%，TTFT 还降了。这才叫工程审美。Victor 满意地关上了账单。', why: '降本三板斧（量化/缓存/路由）+ 把资源重分配到用户可感知的能力上。' },
            { t: '维持现状，等竞对犯错', ok: false, fx: { morale: -3 }, fb: 'Victor：保守不会输得快，但会输得确定。', why: '放弃进步；正确答案不是"不变"而是"聪明地变"。' },
            { t: '全线换小模型，先把成本打下来', ok: false, fx: { quality: -8 }, fb: 'Raj：差评新增关键词"变笨"。成本是降了，用户也在降。', why: '一刀切降配，牺牲核心场景质量——和参数翻倍是镜像错误。' }
          ],
          hints: [
            '提示（林博士递来纸条）：想想——你到底是在减少计算量，还是增加计算量？在哪类任务上减，哪类任务上加？',
            '先看流量构成：68% 的简单任务需要"最强模型"吗？'
          ],
          skill: 's_tradeoff', kp: '能力-成本-延迟三角'
        },
        {
          qLabel: 'FOLLOW-UP',
          q: 'Lin 追问：这套组合拳里，"Prefix Cache" 为什么有效？',
          options: [
            { t: '它压缩了模型权重，所以更快', ok: false, fx: { trust: -1 }, fb: 'Lin：压缩权重的是量化。Prefix Cache 是另一回事。', why: '混淆两个概念：量化压权重，缓存复用计算。' },
            { t: '所有会话的 system prompt 高度重复，其注意力计算结果可以复用，不必每次重算', ok: true, fx: { trust: 2 }, fb: 'Lin：对。重复前缀算一次，后面全部命中缓存。', why: 'Prefix Cache 复用固定前缀的 KV 计算，是 TTFT 与成本优化标准手段。' },
            { t: '它把用户的旧对话记住了', ok: false, fx: { trust: -1 }, fb: 'Lin：那是 Memory，和推理缓存是两码事。', why: '缓存（性能）≠ 记忆（能力）。' },
            { t: '它让模型变得更聪明', ok: false, fx: { trust: -1, morale: -1 }, fb: 'Lin：它不改变任何能力，只改变效率。', why: '缓存是性能优化，不动模型能力。' }
          ],
          hints: ['想想哪部分输入在每个请求里都一样？'],
          skill: 's_infercost', kp: '推理降本三板斧'
        }
      ],
      outro: [
        { sys: 'CHAPTER LOG // 你保住了公司的毛利，也第一次听懂了"单位经济"。' },
        { npc: 'victor', text: '从今天起，所有"更强"的提案，必须附带成本与延迟影响评估。这是你教会我的。' }
      ]
    },

    /* ============ CASE 7 ============ */
    {
      id: 'c7',
      title: '数据里的幽灵',
      brief: '模型满意度连降三周，但模型一行代码都没改。',
      tags: ['数据', '分布漂移', 'P0 考点'],
      intro: [
        { sys: 'SEASON 1 // WEEK 7 // 周度质量会' },
        { npc: 'kai', text: '诡异了。任务满意度连降三周：91% → 84% → 76%。但我们这三周模型零变更。见鬼了？' },
        { npc: 'maya', text: '（弱弱地）这三周……好像是我们暑期活动的投放周期？' },
        { npc: 'lin', text: '模型没变——那变的就只能是世界。去查。' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'change', label: '确认变更记录', layer: 'Model', title: '数据面板 · 变更审计', clue: '模型：v2.3，21 天未变更。\nPrompt：无变更。配置：无变更。\n排除一切"我们改坏了"的可能。' },
          { id: 'users', label: '对比新旧用户构成', layer: 'Data', title: '数据面板 · 用户结构', clue: '暑期投放带来大量学生用户（占比 9% → 34%）。\n其高频任务：作业辅导、论文润色、考试总结。\n存量用户满意度：90%（稳定）；新用户满意度：61%（拉低大盘）。' },
          { id: 'query', label: '分析 query 分布变化', layer: 'Data', title: '数据面板 · 意图分布', clue: '意图占比变化 Top3：\n"长文写作辅导" +210%\n"数学解题步骤" +160%\n"闲聊" -40%\n新场景在旧评测集里覆盖率 <5%。' },
          { id: 'train', label: '查训练数据构成', layer: 'Data', title: '数据面板 · 训练分布', clue: '训练语料中"作业辅导/解题步骤"类样本占比不足 2%。\n模型从来没为这批任务优化过——不是退步了，是考卷换了。' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION',
          q: '幽灵找到了。你的治理方案：',
          options: [
            { t: '回滚到三周前的模型版本', ok: false, fx: { cost: 3 }, fb: 'Kai：滚回哪？模型就是三周前那个。问题根本不在版本。', why: '模型无变更，回滚无意义——病灶在数据分布，不在模型。' },
            { t: '建立输入分布监控（人群/意图占比告警），把新场景样本补进评测集与训练迭代，形成常态机制', ok: true, fx: { quality: 6, trust: 3 }, fb: 'Lin：对。分布漂移不是事故，是常态。没有监控，你永远在被动救火。', why: '分布漂移的标准治理：监控（发现）+ 评测集扩充（度量）+ 迭代重训（修复）。' },
            { t: '给新用户弹窗教育，教他们怎么正确提问', ok: false, fx: { morale: -2 }, fb: 'Maya：让用户迁就产品的短板？投放费白花了。', why: '把供给问题转嫁需求侧——模型能力覆盖不足不该让用户买单。' },
            { t: '等活动结束，用户结构自然恢复', ok: false, fx: { users: -3 }, fb: 'Victor：等？学生用户是未来基本盘，你让我把新用户晾着？', why: '消极等待 = 放弃增长人群，且下次活动/热点还会复发。' }
          ],
          hints: [
            '三周里什么变了？模型没变，那什么一定变了？',
            '满意度降的是"同一批任务"还是"新出现的任务"？把新旧用户拆开看。'
          ],
          skill: 's_drift', kp: '分布漂移'
        }
      ],
      outro: [
        { sys: 'CHAPTER LOG // "模型没变 ≠ 世界没变。" 你把这句话写进了团队的周报模板。' }
      ]
    },

    /* ============ CASE 8 ============ */
    {
      id: 'c8',
      title: '技术擂台：Prompt vs RAG vs Fine-tune',
      brief: '三封需求单同时到，资源只够快速响应。给每单配最对症的工具。',
      tags: ['架构选型', '成本阶梯', '高频擂台'],
      intro: [
        { sys: 'SEASON 1 // WEEK 8 // 需求分诊台' },
        { npc: 'lin', text: '今天考考你的架构直觉。三封需求单，都催得急。你的武器库：Prompt、RAG、Fine-tune——也可以组合。答错不要紧，答错的会变成你的错题，Boss 战前我还会再考你。' }
      ],
      investigate: {
        budget: 2,
        options: [
          { id: 'ladder', label: '调出成本阶梯备忘', layer: 'Product', title: '知识面板 · 方案成本阶梯', clue: 'Prompt：小时级上线，零训练成本。适合格式、角色、few-shot 引导。\nRAG：周级。适合频繁变化的知识、需溯源的问答。质量上限=检索质量。\nFine-tune：月级+算力。适合固化风格/行为/格式到"骨子里"。\n三者不互斥，可叠加。' },
          { id: 'queue', label: '阅读三封需求单原件', layer: 'Product', title: '需求单 · 本周队列', clue: '需求 A（商户组）：合同抽取必须输出严格 JSON 字段，解析失败率要 <0.1%。\n需求 B（运营组）：门店活动知识每天更新，AI 问答必须跟最新一致且要给出处。\n需求 C（品牌组）：所有文案输出统一"简洁、专业、带一点幽默"的 Nova 语气。' }
        ]
      },
      rounds: [
        {
          qLabel: 'ROUND 1 / 3 · 需求 A（严格 JSON）',
          q: '合同抽取，输出必须稳定为合法 JSON，解析失败率 <0.1%。你选：',
          options: [
            { t: 'Prompt：写清字段 schema + 输出示例，并启用解码层结构化约束（JSON mode）', ok: true, fx: { quality: 3 }, fb: 'Lin：对。格式问题用最便宜的工具，且"软引导+硬约束"双保险。', why: '格式稳定性：Prompt 约束 + 解码层 JSON mode，小时级解决，不动训练。' },
            { t: 'Fine-tune：训练模型永远输出这个 schema', ok: false, fx: { cost: 5 }, fb: 'Lin：能做，但换个 schema 你就得重训。杀鸡用牛刀。', why: '格式是浅层行为，Prompt 层可解，不该动用训练资源。' },
            { t: 'RAG：检索 JSON 示例给模型看', ok: false, fx: { trust: -1 }, fb: 'Lin：检索解决"知识从哪来"，不解决"输出稳不稳"。', why: '工具错位：RAG 管知识供给，不管输出格式纪律。' },
            { t: '人工写正则兜底为主', ok: false, fx: { morale: -2 }, fb: 'Lin：正则修不好千变万化的自然语言输出。主防线必须是生成侧约束。', why: '事后修补作为主方案不可靠，且不降低失败率本质。' }
          ],
          hints: ['输出"格式"问题，动模型的参数值得吗？有没有小时级方案？'],
          skill: 's_structured', kp: '结构化输出约束'
        },
        {
          qLabel: 'ROUND 2 / 3 · 需求 B（每日更新的知识）',
          q: '门店活动知识每天更新，答案要最新且可溯源。你选：',
          options: [
            { t: 'RAG：知识库 + 每日增量索引 + 回答附来源引用', ok: true, fx: { quality: 3, trust: 2 }, fb: 'Lin：知识天天变 = RAG 的教科书场景。还记得上周的退款政策事故吗？', why: '频繁更新+可溯源 → 检索外挂知识，参数不动。' },
            { t: 'Fine-tune：每天用新活动数据微调一次', ok: false, fx: { cost: 8 }, fb: 'Lin：每天微调一次？算力团队会连夜跑路。而且 FT 无法给出处。', why: '高频更新下 FT 成本与周期完全不匹配，且不可溯源。' },
            { t: 'Prompt：把当天活动全部塞进 system prompt', ok: false, fx: { cost: 4 }, fb: 'Kai：活动一多就超上下文了，而且每 token 都计费——这是最贵的数据库。', why: 'Long prompt 成本高、上限低；知识管理该走检索管线。' },
            { t: '让运营在后台手动维护 FAQ 匹配规则', ok: false, fx: { morale: -1, cost: 1 }, fb: '运营：你在让我人肉做搜索引擎？', why: '规则维护不可扩展，语义匹配能力差。' }
          ],
          hints: ['"每天更新"这四个字就是答案的一半。另一半是"要出处"。'],
          skill: 's_freshness', kp: 'Knowledge Freshness'
        },
        {
          qLabel: 'ROUND 3 / 3 · 需求 C（品牌语气）',
          q: '所有文案统一 Nova 语气："简洁、专业、带一点幽默"。你选：',
          options: [
            { t: 'Fine-tune：用品牌语料做风格 SFT，把语气刻进模型', ok: true, fx: { quality: 3 }, fb: 'Lin：对。"风格/行为固化到骨子里"是 SFT 的定义场景。当然，上线前先用 Prompt 试一版也完全合理。', why: '风格固化是能力/行为改变 → SFT 主场（Prompt 可先行验证）。' },
            { t: 'RAG：检索品牌文案示例供参考', ok: false, fx: { trust: -1 }, fb: 'Lin：检索到示例只是"参考"，模型未必照做——语气不是知识，是行为。', why: 'RAG 供给知识，不保证行为一致。' },
            { t: 'Prompt：详细描述语气要求', ok: false, fx: { quality: -1 }, fb: 'Lin：能缓解，但长 Prompt 下风格漂移明显，且占 token。作为第一步可以，作为最终方案不稳。（本题要的是"根治"）', why: 'Prompt 是软约束，一致性有限——但注意：它是成本最低的第一步，实践中先 Prompt 验证再 SFT。' },
            { t: '买竞对的语气模型', ok: false, fx: { cost: 6 }, fb: 'Lin：那我们品牌的语气归别人管了？', why: '外包核心体验，不可控。' }
          ],
          hints: ['知识会过期所以要外挂；那"语气"会过期吗？它更像知识还是更像"肌肉记忆"？'],
          skill: 's_ladder', kp: 'Prompt→RAG→FT 阶梯'
        }
      ],
      outro: [
        { npc: 'lin', text: '记住今天的分诊逻辑：格式 → Prompt；知识 → RAG；行为与风格 → SFT。成本从小到大，能不动训练就不动训练。' },
        { sys: 'CHAPTER LOG // 技术擂台首胜。架构选型直觉 +1。' }
      ]
    },

    /* ============ CASE 9 ============ */
    {
      id: 'c9',
      title: '谁为质量把关',
      brief: '发布节奏越来越快，Lin 要你建一套"上线门禁"。你第一次从做事的人变成定规则的人。',
      tags: ['评估', '金标准集', 'P0 考点'],
      intro: [
        { sys: 'SEASON 1 // WEEK 9 // 质量体系立项' },
        { npc: 'lin', text: '这季度我们发了 27 次版本，两次线上事故。靠工程师"感觉"把关的时代该结束了。你来建上线门禁：什么情况下允许发布，什么情况下必须拦下。' },
        { npc: 'kai', text: '要不直接用公开 benchmark？MMLU、HumanEval 一跑，分数高就放行，多简单。' },
        { npc: 'lin', text: '让他想想。提示：上次 JSON 事故，benchmark 能拦住吗？' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'bench', label: '调研公开 benchmark', layer: 'Eval', title: '知识面板 · Benchmark 评估', clue: '公开 benchmark：横向可比、开箱即用。\n但：与我们的业务任务（周报/合同/门店问答）相关度低；部分题目疑似已混入训练语料（污染风险）——分数高≠产品好。' },
          { id: 'assets', label: '盘点手里的数据资产', layer: 'Data', title: '数据面板 · 现有资产', clue: '三个月积累：客服/写作/代码三场景真实标注样本 3000 条。\n上次 JSON 事故的 217 个 badcase 已归档。\n用户 thumbs-up/down 反馈日均 4000 条（未利用）。' },
          { id: 'scale', label: '评估人力量化', layer: 'Eval', title: '数据面板 · 评估吞吐', clue: '纯人工全量：每次发布需评估 3000 条 × 3 分钟 = 150 人时，发布节奏撑不住。\n抽样 50 条：快，但上次 JSON 事故恰好漏检——长尾拦截不住。' },
          { id: 'hist', label: '复盘历次事故', layer: 'Product', title: '数据面板 · 事故根因分类', clue: '两次线上事故根因：\n① JSON 输出退化（格式回归）\n② 新版把"拒绝回答"率翻倍（安全过度）\n两种都是"业务行为退化"，benchmark 完全测不到。' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION',
          q: '你的门禁方案核心是：',
          options: [
            { t: '公开 benchmark 分数作为唯一门禁，过线即放行', ok: false, fx: { trust: -4 }, fb: 'Lin：benchmark 测的是考卷，我们的事故全在业务行为上。门禁必须用自己业务的尺子。', why: 'benchmark 与业务质量错位 + 污染风险，拦不住"改 A 坏 B"。' },
            { t: '自建业务金标准集：核心场景必测用例 + 历史事故 badcase 回归集 + LLM 辅助评估放量 + 人工抽样校准，任何用例退化即阻断', ok: true, fx: { quality: 7, trust: 5, morale: 3 }, fb: 'Lin：这才叫体系。人评定标、机器放量、回归兜底——三层防线。两个月后拦截了 3 次会出事故的发布。', why: '金标准集+回归集+LLM-as-Judge+人评校准 = 评估体系标准答案。' },
            { t: '每次发布前人工全量测试', ok: false, fx: { morale: -4, cost: 5 }, fb: 'Kai：150 人时一次，发布节奏直接瘫痪。', why: '不可扩展——好体系要在速度与严谨间取得平衡。' },
            { t: '不设门禁，靠线上监控出问题再修', ok: false, fx: { trust: -6 }, fb: 'Victor：让用户当测试员？我们的信任经不起第三次热搜。', why: '事后补救的成本（舆情/流失）远高于事前拦截。' }
          ],
          hints: [
            '上两次事故的根因（格式退化、拒答率），MMLU 能测出来吗？',
            '人工太慢、抽样会漏、benchmark 错位——把三个方案各自的优点组合起来呢？'
          ],
          skill: 's_regression', kp: '回归评测集'
        },
        {
          qLabel: 'FOLLOW-UP',
          q: 'Lin：LLM-as-Judge 上量之后，你要防它的什么问题？',
          options: [
            { t: '它运行太慢', ok: false, fx: { trust: -1 }, fb: 'Lin：速度不是主要矛盾，偏差才是。', why: 'judge 的问题不在速度在可信度。' },
            { t: '位置偏差、冗长偏差（偏爱更长的回答）、自我偏好——所以要用人工抽样定期校准', ok: true, fx: { trust: 3 }, fb: 'Lin：完美。工具的偏差要靠制度对冲。', why: 'LLM-as-Judge 三大已知偏差 + 人评校准对冲，是评估体系的关键护栏。' },
            { t: '它需要太多 GPU', ok: false, fx: { trust: -1 }, fb: 'Lin：成本是有的，但和正确性比，这是小钱。', why: '次要矛盾。' },
            { t: '它完全客观可信，无需校准', ok: false, fx: { trust: -3 }, fb: 'Lin：把未经校准的裁判奉为绝对权威，是评估体系里最危险的迷信。', why: 'judge 有系统性偏差，必须校准。' }
          ],
          hints: ['想想裁判也是模型——模型会偏爱什么样的答案？位置靠前的？更长的？'],
          skill: 's_judge', kp: 'LLM-as-Judge'
        }
      ],
      outro: [
        { sys: 'CHAPTER LOG // 你建立了 NOVA 的第一道质量门禁。Lin 在周会上说："这季度最好的产品决策，是一个防御性的。" // 技能 +：回归评测、LLM-as-Judge' }
      ]
    },

    /* ============ CASE 10 ============ */
    {
      id: 'c10',
      title: '凌晨两点的电话',
      brief: 'API 大客户全线解析失败。两小时前刚上过一个 prompt hotfix。你的第一次生产事故。',
      tags: ['事故响应', '回滚优先', 'P0 考点'],
      intro: [
        { sys: 'SEASON 1 // WEEK 10 // 02:14 AM // 生产事故 P0', urgent: true },
        { npc: 'kai', text: '（电话）出事了。物流客户"迅达"的调度系统报警：他们解析我们的 JSON 输出，失败率从 0.2% 飙到 71%，已经影响他们分拣。' },
        { npc: 'kai', text: '他们技术负责人在群里@了我们十几次。合同里有 SLA，事故每多一小时，赔付风险都在涨。' },
        { npc: 'lin', text: '（电话，很冷静）醒醒，产品负责人。你的事故，你指挥。第一句话先告诉我：两小时前我们变更过什么？' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'timeline', label: '拉变更时间线', layer: 'Infra', title: '数据面板 · 变更时间线', clue: '01:05 上线 prompt hotfix（调整运输场景回答风格）。\n01:40 起 JSON 解析失败率陡升。\n时间完全吻合——第一嫌疑人锁定。' },
          { id: 'output', label: '对比故障输出样本', layer: 'Model', title: '数据面板 · 输出 diff', clue: '变更前：{"eta":"09:30","priority":"high"}\n变更后：\`\`\`json\n{"eta":"09:30",...}\n\`\`\`\nhotfix 的风格指令让模型爱上了 markdown 代码块包裹——客户的严格解析器直接炸了。' },
          { id: 'test', label: '查这次发布的测试记录', layer: 'Eval', title: '数据面板 · 发布检查单', clue: 'hotfix 走了"紧急免测"通道。\n你的回归评测集上周刚建好——但只覆盖了客服/写作场景，API 结构化输出场景没有用例。门禁没拦住它。' },
          { id: 'monitor', label: '查监控覆盖', layer: 'Infra', title: '数据面板 · 可观测性', clue: '现有告警：延迟、错误率、成本。\n缺失：输出格式成功率——71% 的故障持续了 70 分钟才被客户（而不是我们的监控）发现。' }
        ]
      },
      rounds: [
        {
          qLabel: 'DECISION 01 · 止血',
          q: '02:20 AM。客户的分拣线在停。你的第一道命令：',
          options: [
            { t: '立即回滚 prompt hotfix，恢复已验证的上一版本，同步客户验证恢复', ok: true, fx: { trust: 5 }, fb: '02:26 回滚完成，02:31 客户解析成功率恢复 99.8%。Lin：先止血，再查病。教科书。', why: '事故响应第一原则：回滚最近变更止血，不要在着火的房子里搞研发。' },
            { t: '继续改 prompt，再发一版试试修掉代码块问题', ok: false, fx: { trust: -6, cost: 3 }, fb: '（新版本引入了新问题，故障延长 2 小时，客户升级投诉）Lin：在未知根因上叠加变更，是用客户的生产环境做实验。', why: '"再试试"式修复扩大爆炸半径——每次变更都是新变量。' },
            { t: '让客户技术自己兼容代码块包裹', ok: false, fx: { trust: -8 }, fb: '客户技术负责人：我们的合同写的是标准 JSON 接口。现在要我们改生产代码来适配你们的 bug？', why: '把供应商的故障转嫁给客户——信任崩塌最快路径。' },
            { t: '等白天团队到齐再处理', ok: false, fx: { trust: -10 }, fb: 'Lin：每一分钟都在产生 SLA 赔付。作为负责人，你就是白天。', why: 'P0 事故没有"等一等"。' }
          ],
          hints: ['故障和变更时间完全吻合时，第一动作是什么——修复它，还是撤掉它？'],
          skill: 's_incident', kp: '事故响应：回滚优先'
        },
        {
          qLabel: 'DECISION 02 · 防复发',
          q: '03:00 AM，止血完成。事故复盘会上，你提出"根治"方案：',
          options: [
            { t: '给 prompt 加一条"永远不要用代码块包裹 JSON"——立了规矩就不会再犯', ok: false, fx: { trust: -1 }, fb: 'Kai：上次的教训还不够吗——Prompt 是软约束，风格漂移随时可能再触发。', why: '软约束不构成根治；同类故障仍会以新形态复发。' },
            { t: 'API 通道启用解码层 JSON 约束（硬保证）+ 回归集补结构化输出用例 + 上线输出格式成功率告警', ok: true, fx: { quality: 6, trust: 4 }, fb: 'Lin：硬约束根治格式、回归用例拦住复发、监控缩短发现时间。三板斧下去，这类事故的"物种"就被消灭了。', why: '根治 = 技术硬约束（结构化输出）+ 流程门禁（回归用例）+ 可观测性（格式成功率告警）。' },
            { t: '取消紧急免测通道，所有变更一律全量测试', ok: false, fx: { morale: -3 }, fb: 'Kai：紧急修安全漏洞时怎么办？一刀切会把小风险拖成大事故。', why: '矫枉过正：应为紧急通道设"最小回归集"而非取消通道。' },
            { t: '给客户发赔偿和道歉邮件，翻篇', ok: false, fx: { trust: -2 }, fb: 'Victor：道歉解决的是情绪，不是问题。下次呢？', why: '善后≠根治。' }
          ],
          hints: ['想想三层防线：模型输出层（硬约束）、发布流程层（回归用例）、监控层（告警）。缺一不可。'],
          skill: 's_structured', kp: '结构化输出约束'
        }
      ],
      outro: [
        { npc: 'lin', text: '凌晨的处置没有完美，只有优先级正确。你今晚的优先级是对的。回去睡觉，明早九点复盘会——你来主持。' },
        { sys: 'CHAPTER LOG // 你的第一次 P0：02:14 接警，02:26 止血，03:00 根治方案。// 你长大了。' }
      ]
    },

    /* ============ BOSS ============ */
    {
      id: 'boss',
      kind: 'boss',
      title: 'BOSS · 季度复盘会',
      brief: 'CEO、CTO、全员在场。你需要证明：这十周，产品部不只是"很忙"。',
      tags: ['综合', 'Trade-off', '汇报'],
      intro: [
        { sys: 'SEASON 1 // FINALE // 季度复盘会 · 会议室 A（全员出席）', urgent: true },
        { npc: 'victor', text: '十周了。今天不看苦劳，看结果。三个问题：事故根因、下季度投入、以及你怎么向我证明价值。开始吧。' },
        { npc: 'lin', text: '（小声）稳住。你手里的十周，比你想的厚。' }
      ],
      rounds: [
        {
          qLabel: 'BOSS Q1 · 根因',
          q: 'Victor：先说凌晨那次事故。一句话，根因是什么？',
          options: [
            { t: '模型能力不足，需要更强的模型', ok: false, fx: { trust: -3 }, fb: 'Victor：模型连题都没看懂就背锅了？重说。', why: '事故根因是流程缺陷（免测通道+门禁覆盖缺口），与模型能力无关——归因错误会导致错误投入。' },
            { t: '工程手滑改错了 prompt', ok: false, fx: { morale: -1 }, fb: 'Victor：个人的手滑是表象。如果制度能让一次手滑放行到生产，那就是制度的问题。', why: '把系统性问题归因于个人，无法防复发。' },
            { t: '发布流程缺陷：紧急变更绕过了门禁，且门禁未覆盖结构化输出场景，监控缺失延误发现', ok: true, fx: { trust: 6 }, fb: 'Victor：说到点上了。人都会犯错，体系的职责是让一次犯错到不了用户面前。', why: '完整根因链：流程（免测）× 门禁覆盖（场景缺口）× 可观测性（发现延迟）。' },
            { t: '客户解析器太脆弱', ok: false, fx: { trust: -4 }, fb: '客户：？Victor：供应商的事故甩锅给客户，这是最差的答案。', why: '外部归因，且不合契约。' }
          ],
          hints: ['一层层问为什么：为什么能上线？为什么没拦住？为什么发现晚了？'],
          skill: 's_incident', kp: '事故响应：回滚优先'
        },
        {
          qLabel: 'BOSS Q2 · 投入',
          q: 'Victor：下季度只有 3 个工程月，四选一，只能投一个。你投给谁？',
          options: [
            { t: '评测与发布门禁基建：扩大金标准集覆盖、紧急通道最小回归集、格式成功率监控全覆盖', ok: true, fx: { quality: 8, trust: 6, morale: 2 }, fb: 'Victor：不性感，但这季度两次事故一次都没碰过你的门禁之后的发布。防御性投入换来的都是净利润。批了。', why: '质量基建的复利最高：拦截的每次事故都是纯利，且解锁更快的发布节奏。' },
            { t: '新功能"AI PPT 一键生成"，抢占市场声量', ok: false, fx: { revenue: 6, quality: -4, trust: -3 }, fb: 'Victor：声量有了，但质量地基还在漏水。用新功能盖在事故风险上，是把楼越盖越歪。', why: '增长优先于质量，短期收入但积累系统性风险——好答案但非最优。' },
            { t: '把模型再做大一号，全面领先竞对', ok: false, fx: { cost: 12 }, fb: 'CFO 当场翻开了账本。Victor：我们上季度刚算过这笔账，你没在吗？', why: '重蹈 Case 6 覆辙：能力-成本-延迟三角被无视。' },
            { t: '市场投放，把 DAU 再拉一波', ok: false, fx: { users: 5, cost: 5, trust: -2 }, fb: 'Maya：投放拉来的人，还卡在第一次成功任务上。漏桶不补，加水没用。', why: '未激活的增长=买流量漏掉，Case 1 的教训。' }
          ],
          hints: ['想想这十周里，哪类投入"每次都在省钱/防损"？哪类投入是"先花钱后祈祷"？'],
          skill: 's_regression', kp: '回归评测集'
        },
        {
          qLabel: 'BOSS Q3 · 证明',
          q: 'Victor：最后一问。三个月后，你怎么向我证明这 3 个工程月没有白花？',
          options: [
            { t: '汇报做了多少事：建了多少用例、开了多少会', ok: false, fx: { trust: -2 }, fb: 'Victor：苦劳我不付钱。我要看变化。', why: '过程汇报≠价值证明。' },
            { t: '用结果说话：门禁拦截的问题发布数、线上事故率同比、平均恢复时长 MTTR、因事故造成的赔付与流失金额变化', ok: true, fx: { trust: 8 }, fb: 'Victor：这四个数，以后每个季度直接进董事会材料。（合上笔记本）散会之后，来我办公室一趟。', why: '价值证明=结果指标链：拦截数（预防）→ 事故率（频率）→ MTTR（响应）→ 赔付/流失（钱）。' },
            { t: '展示 87 页 PPT 和精彩的架构图', ok: false, fx: { morale: -2 }, fb: 'Victor：我时间很贵。', why: '形式代替内容。' },
            { t: '说团队这三个月非常努力', ok: false, fx: { trust: -2 }, fb: 'Victor：我知道他们努力。我問的是效果。', why: '情绪叙事不是商业论证。' }
          ],
          hints: ['反过来想：如果这笔钱白花了，会发生哪些坏事？没发生的坏事，就是你省下的钱。'],
          skill: 's_metricstory', kp: '用数据证明价值'
        }
      ],
      outro: [
        { npc: 'victor', text: '（办公室）十周前我以为招了个写文档的。现在看来，我招了个能替我守门的人。从下季度起，你管 Nova Chat 产品线——title：AI Product Manager。' },
        { npc: 'lin', text: '恭喜。不过别高兴太早——下季度，公司要发下一代模型。Benchmark 我们拿了第一，然后用户开始流失。那个局，比这十周难十倍。' },
        { sys: 'SEASON 1 COMPLETE // 晋升：Product Associate → AI Product Manager' }
      ]
    }
  ];

  /* ---------- 错题变体（Boss 战前回炉） ---------- */
  const VARIANTS = [
    { kp: 'Activation 与 Aha 时刻', text: '【回炉】某 AI 工具注册量涨 10 倍，次周留存纹丝不动。最能解释的判断是：', options: ['用户被新功能吸引，只是需要时间消化', '新增用户未完成首次成功任务，激活环节失效', '服务器扛不住导致体验差', '品牌宣传不到位'], ans: 1, explain: '注册≠激活。激活=第一次成功任务，未激活的增量用户自然不留存。' },
    { kp: 'AI 产品北极星', text: '【回炉】以下哪个最适合作为 AI 助手产品的北极星指标？', options: ['累计注册用户数', 'DAU', '每周成功任务数', 'GPU 使用率'], ans: 2, explain: '价值锚点是任务完成；DAU/注册可虚高，GPU 是成本侧过程量。' },
    { kp: '类别不均衡', text: '【回炉】欺诈检测正负样本 1:99，模型准确率 99%。正确判断：', options: ['模型表现优秀，可上线', 'accuracy 在极度不均衡下失真，应看 F1/PR-AUC 并处理不均衡', '应该提高判定阈值', '应该换更大的模型'], ans: 1, explain: '全预测多数类也有 99% 准确率——经典不均衡陷阱。' },
    { kp: '离线≠在线', text: '【回炉】离线 AUC 大涨，线上 AB 无效果。首先排查：', options: ['模型容量不足', '特征穿越/数据泄漏与线上线下特征不一致', '学习率设置不当', '应该延长实验周期'], ans: 1, explain: '离线虚高的第一嫌疑是泄漏（如时间穿越），第二是训练/服务特征不一致。' },
    { kp: 'Knowledge Freshness', text: '【回炉】企业知识每小时更新（库存/价格），AI 问答要跟最新。最佳方案：', options: ['每小时微调一次模型', 'RAG + 增量索引同步', '把全部知识写进 system prompt', '限制用户只能问静态问题'], ans: 1, explain: '高频更新知识=RAG 主场；FT 周期完全不匹配。' },
    { kp: 'TTFT 与感知延迟', text: '【回炉】客服机器人平均生成 18 秒，用户大量流失在等待。最优先的优化：', options: ['换小模型提速，接受质量下降', '上线流式输出，让首字 1 秒内出现', '优化 loading 动画', '提高并发数'], ans: 1, explain: '感知延迟由 TTFT 决定；流式不动质量不动总时长，先拿最大感知收益。' },
    { kp: '能力-成本-延迟三角', text: '【回炉】"把参数翻倍换能力提升"最可能引发的连锁反应是：', options: ['成本与延迟同步大增，而用户可感知的提升有限', '一切都会更好', '成本不变能力翻倍', '延迟下降'], ans: 0, explain: '三角互相牵制：能力↑通常带来成本↑延迟↑，且感知增益可能远小于账面分数。' },
    { kp: '推理降本三板斧', text: '【回炉】推理成本过高，以下哪组是标准的降本组合？', options: ['换更大的模型+涨价', '量化 + 缓存 + 按任务复杂度路由小模型', '削减客服人员+降低温度', '减少用户'], ans: 1, explain: '三板斧：量化（压计算）、缓存（复用计算）、路由（不浪费算力）。' },
    { kp: '分布漂移', text: '【回炉】冬季来临，电动车续航预测误差大增，模型与夏季完全相同。最对症的修复：', options: ['回滚到夏季版本', '补充温度-电池性能相关特征并监控输入分布', '提高模型温度参数', '限制冬季使用'], ans: 1, explain: '季节=分布漂移。补物理相关特征+分布监控是治本；"回滚"没有意义因为模型本来就没变。' },
    { kp: 'Prompt→RAG→FT 阶梯', text: '【回炉】需求：让模型稳定输出固定表格字段。最低成本的正确路径是：', options: ['立即全参微调', 'RAG 检索表格示例', 'Prompt 约束 + 解码层结构化输出', '人工后处理为主'], ans: 2, explain: '格式问题走 Prompt+硬约束，小时级、零训练成本。' },
    { kp: '回归评测集', text: '【回炉】模型升级后老功能退化。防复发的机制是：', options: ['上线后观察用户反馈', '建立覆盖老功能的回归评测集作为发布门禁', '每次升级写更详细的文档', '安排更多人工抽查'], ans: 1, explain: '"改 A 坏 B"靠回归集拦截，人工抽查会漏、用户反馈滞后。' },
    { kp: 'LLM-as-Judge', text: '【回炉】LLM 评审员系统性地偏爱更长的回答。这属于：', options: ['正常的评分分布', '冗长偏差，需要人工抽样校准', '位置偏差', '随机噪声，无需处理'], ans: 1, explain: '冗长偏差（verbosity bias）是 LLM-as-Judge 已知系统性偏差，靠人评校准对冲。' },
    { kp: '事故响应：回滚优先', text: '【回炉】一次配置变更后线上故障。第一动作是：', options: ['再改一版配置尝试修复', '回滚到上一个已验证版本止血', '通知用户忍耐', '开会讨论根因'], ans: 1, explain: '止血优先：先恢复服务（回滚），保留现场，再谈根因与修复。' },
    { kp: '结构化输出约束', text: '【回炉】JSON 输出偶发夹带 markdown 代码块导致解析失败。根治手段：', options: ['在 prompt 里强调"不要加代码块"', '解码层 JSON/grammar 约束（硬保证）', '温度调到 0 就万无一失', '事后正则清洗为主'], ans: 1, explain: '软引导会漂移；解码级约束是硬保证。温度为 0 不解决格式漂移。' },
    { kp: '用数据证明价值', text: '【回炉】向管理层证明质量基建的价值，最有力的一组证据是：', options: ['加班时长与会议纪要', '拦截的问题发布数、线上事故率、MTTR、赔付/流失金额变化', 'PPT 页数与架构图复杂度', '团队满意度调研'], ans: 1, explain: '预防量（拦截数）+ 频率（事故率）+ 响应（MTTR）+ 金钱（赔付/流失）构成完整价值链。' }
  ];

  return { NPCS, SKILL_CATS, SKILLS, KNOWLEDGE, CASES, VARIANTS, TICKER , SIM: SIM};
})();
