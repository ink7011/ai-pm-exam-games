/* ============================================================
   SHUAMONE OPC — One-Person Company Simulation (V1 · $0→$1K)
   Build something from zero with limited time, money, and energy.
   ============================================================ */
window.CONTENT = (function () {

  const SIM = {
    role: 'Solo Founder',
    startRole: 'Wannabe Founder',
    metrics: [
      { id: 'revenue', label: 'Revenue MRR' },
      { id: 'runway', label: 'Runway 生存' },
      { id: 'momentum', label: 'Momentum 势能' },
      { id: 'product', label: 'Product 产品力' },
      { id: 'energy', label: 'Energy 精力' }
    ],
    init: { revenue: 0, runway: 10, momentum: 5, product: 30, energy: 80 },
    drift: { energy: [-6, -3], runway: [-1, -1], momentum: [-2, -1] },
    final: {
      weights: { revenue: 2, product: 1, energy: 1, momentum: 1 },
      invert: [],
      tiers: [
        { grade: 'S', name: 'Solo Founder', cls: 'tier-legend', kicker: 'OPC V1 COMPLETE · SOLO FOUNDER',
          title: '💰 Solo Founder · One Person, One Company',
          headline: '你一个人做到了 $1,000 MRR。没有融资，没有团队，没有老板。',
          victor: '"你证明了 AI 时代一个人可以是一家公司。"',
          lin: '"你的判断力是这家公司唯一的护城河。"',
          min: 55, minTrust: null },
        { grade: 'A', name: 'Lifestyle OPC', cls: 'tier-star', kicker: 'OPC V1 COMPLETE · LIFESTYLE',
          title: '🧘 Lifestyle OPC · Freedom First',
          headline: '收入在涨，精力还在。你没有成为独角兽，但你成了自己时间的主人。',
          victor: '"不是每家公司都需要规模。有些只需要自由。"',
          lin: '"你找到了自己的节奏。"',
          min: 35, minTrust: null },
        { grade: 'B', name: 'Side Project', cls: 'tier-potential', kicker: 'OPC V1 COMPLETE · KEEP BUILDING',
          title: '🌱 Side Project · Not Dead Yet',
          headline: '有一些用户，有一些收入，还有很多要学的。但你还活着。',
          victor: '"最差的情况是：你学到了什么不行。"',
          lin: '"再来一局，试试不同的市场。"',
          min: 0, minTrust: null }
      ],
      legendGate: { min: 70, minTrust: 0 },
      failStates: [
        { metric: 'energy', below: 10, name: '😵 Burnout', headline: '你把自己烧干了。产品还在，但你不在了。',
          victor: '"休息不是失败。你只是需要充电。"', lin: '"Energy 是 OPC 最重要的资产，不是代码。"' },
        { metric: 'runway', below: 1, name: '💀 Ran Out of Money', headline: 'Runway 归零。你不得不回去找一份工作。',
          victor: '"这不是结束。很多成功创始人都失败过。"', lin: '"下次：更早收费，更快验证。"' }
      ]
    },
    skillFeed: { chapter: { business: 2, judgment: 1 }, finished: { judgment: 4, business: 4 } }
  };

  const NPCS = {
    you:  { name: '你', color: '#22d3ee' },
    ai:   { name: 'AI Agent', color: '#a78bfa', role: 'AGENT' },
    user: { name: '第一位用户', color: '#f472b6', role: 'USER' },
    vc:   { name: 'VC 朋友', color: '#fbbf24', role: 'OBSERVER' },
    sys:  { name: 'OPC 终端', color: '#7c8ba1', role: 'SYSTEM' }
  };

  const CASES = [

    /* ============ N1 · Choose Your Market ============ */
    {
      id: 'opc1', title: '选你的战场',
      brief: '辞职第一天。存款 $20K，月耗 $2K。AI 浪潮就在眼前——你选哪个市场？',
      tags: ['Market', 'TAM vs Competition', 'Willingness to Pay'],
      echoes: [],
      intro: [
        { sys: 'OPC SIMULATION · DAY 1 · 你 · Wannabe Founder' },
        { npc: 'vc', text: '听说你辞职了？恭喜……还是节哀？反正你选的赛道决定你是哪种。' },
        { npc: 'vc', text: '我给你三个方向。别急着选——先想想：谁付钱？付多少？付得多急？' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'tam', label: '查市场规模', layer: 'Business', title: 'Market Size · TAM',
            clue: 'AI Resume Tool: $2B+，增速 300%\nAI SMB Tool: $800M，增速 150%\nNiche Tool (Legal AI): $50M，增速 80%' },
          { id: 'comp', label: '查竞对密度', layer: 'Business', title: 'Competition Heatmap',
            clue: 'AI Resume: 🔥🔥🔥🔥🔥（Teal, Rezi, Kickresume, plus ChatGPT 本身就能写）\nSMB Tool: 🔥🔥🔥（有不少但没垄断）\nNiche: 🔥（几乎没人做好）' },
          { id: 'pay', label: '查付费意愿', layer: 'Business', title: 'Willingness to Pay',
            clue: 'Resume 用户：$5-15/月（但流失快，找工作完就退）\nSMB：$50-200/月（只要真的省时间）\nNiche Legal：$200-500/月（律师一小时 $300，工具只要省 15 分钟就值）' },
          { id: 'speed', label: '评估你一个人能做多快', layer: 'Product', title: 'Solo Speed Check',
            clue: 'Resume Tool: 2 周可出 MVP（模板+AI 生成）\nSMB Tool: 6 周（涉及集成/数据安全）\nNiche Legal: 8 周（领域知识门槛高）' }
        ]
      },
      rounds: [
        {
          skill: 'opc_market',
          q: '你的第一个产品做给谁？',
          options: [
            { t: 'AI Resume Tool——市场最大，谁都要找工作', ok: false, mark: 'opc_n1_resume', fx: { momentum: 8, product: -3 },
              fb: 'VC 朋友：大市场=大竞争。你一个人跟 5 家融资公司抢用户，好玩。', why: '大 TAM 不等于大机会——竞争密度和你独自交付的速度才是。' },
            { t: 'AI Tool for Small Businesses——需求明确，付费意愿强', ok: true, mark: 'opc_n1_smb', fx: { product: 5, momentum: 3, energy: -5 },
              fb: 'VC 朋友：B2B 比较小，但每个用户付得多。慢工出细活。', why: 'SMB 的付费意愿×留存是 OPC 最佳组合——你不需要 100 万用户。' },
            { t: 'Niche Legal AI——冷门但痛点极深', ok: false, mark: 'opc_n1_niche', fx: { product: 8, momentum: -3, energy: -8 },
              fb: 'VC 朋友： Legal AI？你懂法律吗？……好吧，没竞对也是优势。', why: 'Niche 的护城河深，但获客慢、领域学习成本高——你一个人扛得住吗？' },
            { t: '先不选，看哪个 TikTok 上火就做哪个', ok: false, fx: { energy: -3, momentum: 2 },
              fb: 'VC 朋友：追热点是创业的死法之一。等你做出来，热点已经过去了。', why: '没有自己的判断，就没有自己的产品。' }
          ],
          hints: ['哪个市场"一个人"能赢？', '付费意愿 × 你的交付速度 = 生存概率']
        }
      ],
      outro: [{ npc: 'vc', text: '行，选了就别后悔。两周后我来看你的 MVP。' }]
    },

    /* ============ N2 · Build ============ */
    {
      id: 'opc2', title: '两周 · 一个产品',
      brief: '14 天。$500 预算。你要怎么把想法变成能用的东西？',
      tags: ['Build', 'MVP', 'Trade-offs'],
      echoes: [],
      intro: [
        { sys: 'WEEK 1-2 · BUILD PHASE' },
        { npc: 'ai', text: '我可以帮你写代码、设计界面、写文案。但你需要告诉我：什么算"做完了"？' }
      ],
      investigate: {
        budget: 2,
        options: [
          { id: 'time', label: '评估各路径耗时', layer: 'Product', title: 'Time Cost Analysis',
            clue: '完整产品：14 天（几乎不剩时间推广）\nNo-Code MVP：5 天（用 Cursor + Vercel + Stripe）\nLanding Page：2 天（先收集 Waitlist）\n直接找用户聊：0 天（但没产品可演示）' },
          { id: 'budget', label: '看预算怎么花', layer: 'Business', title: '$500 Budget',
            clue: '域名 + Vercel：$20/月\nOpenAI API：$50-100/月（初期）\n剩下 ~$400：可以买一次广告测试 / 请 5 个目标用户喝咖啡 / 什么都不花' }
        ]
      },
      rounds: [
        {
          skill: 'opc_build',
          q: '你怎么用这两周？',
          options: [
            { t: '花满 14 天做完整产品——上线就要惊艳', ok: false, fx: { product: 15, momentum: -8, energy: -15 },
              fb: 'AI Agent：产品确实好。但上线时你已经没力气推广了，而且市场窗口可能关了。', why: 'OPC 最大的陷阱：完美主义。Done > Perfect。' },
            { t: '5 天做 No-Code MVP，剩下 9 天找用户', ok: true, mark: 'opc_n2_mvp', fx: { product: 8, momentum: 8, energy: -8 },
              fb: 'AI Agent：产品不是最好的，但你有时间做最重要的事——找用户。', why: 'OPC 的杠杆在于分配精力：产品够用就好，剩余精力投给分发。' },
            { t: '2 天做 Landing Page，先收 Waitlist 验证需求', ok: false, mark: 'opc_n2_waitlist', fx: { product: 3, momentum: 5, energy: -3 },
              fb: 'AI Agent：聪明——先确认有人要再花力气做。但 Landing Page 不等于产品，收了 Waitlist 你还得交付。', why: '验证 ≠ 延迟。Waitlist 是手段不是终点。' },
            { t: '不做了，直接去 Reddit 找痛点，帮人手动解决', ok: false, mark: 'opc_n2_manual', fx: { product: -5, momentum: 10, energy: -5 },
              fb: 'AI Agent：最反直觉但最有效——先当人肉服务，再产品化。Paul Graham 说的 do things that don\'t scale。', why: '手动服务帮你理解真实需求，但不可持续——最终要变成产品。' }
          ],
          hints: ['两周后你需要的不只是产品，还有用户', 'Product 和 Momentum 你只能优先一个']
        }
      ],
      outro: [{ npc: 'ai', text: '构建完成。接下来是最难的部分：让有人知道它的存在。' }]
    },

    /* ============ N3 · Launch ============ */
    {
      id: 'opc3', title: '上线了。然后呢？',
      brief: '产品上线。Visitors: 3, Revenue: $0。那 3 个访问者是你自己用三个浏览器。',
      tags: ['Launch', 'Distribution', 'First Traffic'],
      echoes: [],
      intro: [
        { sys: 'LAUNCH DAY' },
        { npc: 'ai', text: '网站部署成功。但我检测到一个问题：地球上除了你，没有人知道它的存在。' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'channels', label: '评估各渠道', layer: 'Growth', title: 'Channel Analysis',
            clue: 'X/Twitter：快但噪音大。一条爆款推文可以带 1000+ 访客\nReddit：精准但反广告。r/SaaS, r/EntrepreneurRideAlong\nProduct Hunt：一次性脉冲。前 10 名=500+ 访客，否则 50\nCold Email：慢但精准。50 封 → 5 回复 → 1 付费\nCommunity (Discord/Slack)：长期信任。需要持续投入' },
          { id: 'first_user', label: '研究第一批用户画像', layer: 'Growth', title: 'Who Are They?',
            clue: '你的前 100 个用户不是"所有人"——他们是最痛的那群人。\n如果你做 SMB Tool：他们已经在搜"AI + [具体场景]"\n如果你做 Resume：他们在求职焦虑中刷 TikTok\n如果你做 Niche：他们在小众论坛里互相推荐' }
        ]
      },
      rounds: [
        {
          skill: 'opc_launch',
          q: '你把有限的精力投给哪个渠道？',
          options: [
            { t: 'Build in Public——在 X 上每天发构建日志', ok: true, mark: 'opc_n3_x', fx: { momentum: 12, energy: -8 },
              fb: '第一个 Follower：关注了！做多久了？用什么技术栈？——等等，这就是你要的对话。', why: 'Build in Public 让分发变成产品的一部分。你不是在"推广"，你在"记录"。' },
            { t: 'Product Hunt 大发售', ok: false, fx: { momentum: 8, energy: -10 },
              fb: 'PH 结束：排名第 14，带来了 87 个访客。然后——什么都没了。', why: 'PH 是一次性脉冲不是渠道。没有留存产品，脉冲毫无意义。' },
            { t: 'Cold Email——50 封手写邮件发给目标用户', ok: false, mark: 'opc_n3_email', fx: { momentum: 3, revenue: 5, energy: -12 },
              fb: '50 封发出。3 封回复。1 个说"听起来不错，能 Demo 吗？"——不是爆发，但每一步都是真的。', why: 'Cold Email 转化率低但精准。对 OPC 来说，1 个付费用户 > 1000 个访客。' },
            { t: '不发。让产品自己说话，好产品会自己传播', ok: false, fx: { momentum: -5 },
              fb: 'AI Agent：等待不是策略。世上没有"自己会传播"的产品——只有被设计成可传播的产品。', why: '"Build it and they will come" 是创业最大的幻觉。' }
          ],
          hints: ['分发不是产品的对立面，是产品的一部分', 'OPC 没有"渠道预算"，只有"精力预算"']
        }
      ],
      outro: [{ npc: 'ai', text: '你有了第一批访客。接下来是最关键的信号：有人愿意付钱吗？' }]
    },

    /* ============ N4 · First Signal ============ */
    {
      id: 'opc4', title: '第一个付费信号',
      brief: '一个用户在邮件里问："这个有 Pro 版吗？我愿意付费。"你心跳加速了。',
      tags: ['Pricing', 'First Revenue', 'Signal'],
      echoes: [
        { mark: 'opc_n2_waitlist', npc: 'user', text: '（回响）我从你两周前的 Waitlist 邮件过来的！当时 200 人报名，我是第 47 个。你终于做出来了。', fx: { momentum: 5 } }
      ],
      intro: [
        { sys: 'PRICING MOMENT' },
        { npc: 'user', text: '你的工具帮我省了 3 个小时。如果收费的话……多少钱？' }
      ],
      investigate: {
        budget: 2,
        options: [
          { id: 'market_price', label: '查同类产品定价', layer: 'Business', title: 'Competitor Pricing',
            clue: '免费+Pro $9/月：市场最常见，但需要 1000+ 用户才能月入 $1K\n$29/月：中端。需要 ~35 个付费用户\n$99/月：高端。只需要 10 个客户——但每个客户期待更高\n定制报价：可能一单 $500+，但不可规模化' },
          { id: 'user_value', label: '算用户得到的价值', layer: 'Business', title: 'Value-Based Pricing',
            clue: '如果给 SMB 用户每周省 5 小时 → 每月省 20 小时\n按 $50/小时计 → 每月价值 $1000\n收 $99/月 = 用户 ROI 10:1\n收 $9/月 = 你在贱卖自己的价值' }
        ]
      },
      rounds: [
        {
          skill: 'opc_pricing',
          q: '你的定价是？',
          options: [
            { t: '免费增值——先做大用户量，再想收费', ok: false, fx: { momentum: 5, revenue: -3 },
              fb: 'AI Agent：你获得了 100 个免费用户。收入：$0。快乐指数：暂时的。', why: '免费用户不是客户，是用户。OPC 没有vc兜底——你需要收入，不是虚荣指标。' },
            { t: '$15/月——便宜到不需要犹豫', ok: false, fx: { revenue: 8, momentum: 3 },
              fb: '3 人付费了。$45 MRR。不错……但你需要 22 个用户才能到 $1K。以现在的增速要 6 个月。', why: '低价 = 需要更多用户 = 更多精力在获客上。对 OPC 不友好。' },
            { t: '$49/月——中端，价值明确', ok: true, mark: 'opc_n4_mid', fx: { revenue: 15, energy: -5 },
              fb: '2 人立刻付费。$98 MRR。你发现：定价越高，用户质量越高，客服越少。', why: '对 OPC 最优：20 个客户×$50 = $1K。你只需要找到 20 个对的人。' },
            { t: '$199/月——直接瞄准企业/专业用户', ok: false, mark: 'opc_n4_premium', fx: { revenue: 20, momentum: -5, product: 5 },
              fb: '1 人付费。$199 MRR。你只需要 5 个这样的客户。但每一个都期待你随叫随到。', why: '高定价=高期待=高精力消耗。你要确定一个人扛得住。' }
          ],
          hints: ['你一个人能服务多少个客户？', '定价不只是收入问题，是"你想服务谁"的问题']
        }
      ],
      outro: [{ npc: 'user', text: '好，我付了。对了——你能不能加一个功能？' }]
    },

    /* ============ N5 · The First Customer's Ask ============ */
    {
      id: 'opc5', title: '第一个客户的要求',
      brief: '你的第一个付费客户说："如果能加上 X 功能就完美了。"你看了看日历。',
      tags: ['Feature Request', 'Scope Creep', 'Founder Judgment'],
      echoes: [
        { mark: 'opc_n1_resume', npc: 'user', text: '（回响）我是被你的 Resume AI 吸引来的。但我需要它能直接导出到 ATS 系统（招聘管理平台），不然 HR 看不到格式。', fx: { product: 3 } }
      ],
      intro: [
        { sys: 'FEATURE REQUEST' },
        { npc: 'user', text: '如果你能加 [具体功能]，我愿意多付 $20/月。而且我认识的其他人也需要。' }
      ],
      investigate: {
        budget: 2,
        options: [
          { id: 'cost', label: '评估开发成本', layer: 'Product', title: 'Dev Cost',
            clue: '如果用 AI Agent 辅助：2 天 + API 成本约 $10\n如果手写：5 天 + 你精力-20\n如果外包：$200 + 3 天等待 + 沟通成本' },
          { id: 'market', label: '查这个需求是普遍的还是个体的', layer: 'Growth', title: 'How Many Others?',
            clue: '在用户群/Reddit 搜了一圈：\n同一个需求：出现了 4 次\n类似但不完全一样：11 次\n"你的产品缺 X" complaints：大部分来自免费用户' }
        ]
      },
      rounds: [
        {
          skill: 'opc_judgment',
          q: '你怎么回应这个功能请求？',
          options: [
            { t: '立即做。第一个付费客户说什么就做什么', ok: false, fx: { product: 5, revenue: 3, energy: -12 },
              fb: 'AI Agent：功能上线了。客户很高兴。但你的 Product Roadmap 现在由一个客户决定了。', why: '客户不是产品经理。第一个付费用户的请求≠产品方向。' },
            { t: '拒绝。专注核心价值，不做定制', ok: false, fx: { product: 3, revenue: -3, energy: -2 },
              fb: '用户：好吧，理解。不过有点失望。……继续用了一个月，然后退了。', why: '过度专注也会失去客户。关键是判断哪些请求在核心路径上。' },
            { t: '收费做。$200 一次性定制开发，交付后变成通用功能', ok: true, mark: 'opc_n5_paid_custom', fx: { product: 8, revenue: 10, energy: -8 },
              fb: '用户：成交！你用 AI Agent 在 2 天内搞定了。$200 到账 + 功能进了主线。两全其美。', why: '把定制请求变成收入+产品力——这是 OPC 的杠杆。' },
            { t: '先收集更多用户反馈，确认是普遍需求再做', ok: false, fx: { momentum: 3, energy: -3 },
              fb: '一周后你问了 10 个用户。6 个说"有最好"，3 个说"无所谓"，1 个说"别加，太复杂了"。你更迷茫了。', why: '验证是必要的。但 OPC 的时间有限——过度验证 = 不做。' }
          ],
          hints: ['一个客户的要求，值多少精力？', '能不能把请求变成机会而不是消耗？']
        }
      ],
      outro: [{ npc: 'ai', text: '你活过了第一次 Feature Request。接下来是最难的关卡。' }]
    },

    /* ============ N6 · The $1K Question ============ */
    {
      id: 'opc6', title: '$1K MRR · 一个人够了？',
      brief: 'MRR 接近 $1K。但你的 Energy 只剩 25%。Support 占了你 40% 的时间。',
      tags: ['Scale', 'Burnout', 'The Trap'],
      echoes: [
        { mark: 'opc_n4_premium', npc: 'vc', text: '（回响）你的 $199 定价筛掉了所有白嫖用户——5 个客户 × $199 ≈ $995。几乎刚好 $1K。贵的客户少而精。', fx: { revenue: 5 } }
      ],
      intro: [
        { sys: 'THE $1K QUESTION' },
        { npc: 'vc', text: '恭喜，你快到 $1K 了。但说实话——你看起来像三个月没睡觉了。' }
      ],
      investigate: {
        budget: 3,
        options: [
          { id: 'time', label: '审计你的时间去哪了', layer: 'Product', title: 'Time Audit',
            clue: 'Customer Support: 2h/天\nContent/Twitter: 1.5h/天\nSales/Email: 1h/天\nProduct/Code: 2h/天\n吃饭睡觉生活: 3h/天\n总计：9.5h/天 × 7 天 = 66.5h/周' },
          { id: 'ai', label: '看 AI Agent 能接管什么', layer: 'Product', title: 'Agent Delegation',
            clue: 'Support FAQ Bot: 可以接管 60% 的重复问题（准确率 85%）\nContent 生成: AI 写草稿你改——省 1h/天\nSales Email 跟进: AI 初稿+你终审——省 0.5h/天\n产品开发: AI 辅助但核心决策还是你' },
          { id: 'burnout', label: '诚实评估你的状态', layer: 'Product', title: 'Burnout Check',
            clue: '过去两周：\n睡眠：平均 5.5h\n运动：0 次\n社交：1 次（跟这位 VC 朋友吃饭）\n"想放弃"的念头：每周 3 次\n结论：Energy 25% 不是夸张，是预警' }
        ]
      },
      rounds: [
        {
          skill: 'opc_scale',
          q: 'Do you hire? Do you automate? Do you stay small?',
          options: [
            { t: '招一个兼职客服。$500/月，但把 Support 全交出去', ok: false, mark: 'opc_n6_hire', fx: { energy: 15, revenue: -5 },
              fb: 'VC 朋友：你把时间买回来了，但 $500/月吃掉了一半利润。OPC 的意义不就是"不雇人"吗？', why: '雇人解决短期问题，但改变 OPC 的性质。' },
            { t: '全自动化。AI Agent 接管 Support + Content + Sales', ok: true, mark: 'opc_n6_agent', fx: { energy: 20, revenue: -3, product: 5 },
              fb: 'AI Agent：接管完成。你的日程从 9.5h/天变成了 6h/天。多出来的时间用来……你愣住了。你已经忘了不工作是什么感觉。', why: 'AI-Native OPC 的终极形态：人类做判断，Agent 做执行。' },
            { t: '不招不自动化。就这样。$1K 够了，自由比规模重要', ok: false, mark: 'opc_n6_stay', fx: { energy: 5, revenue: 0 },
              fb: 'VC 朋友：……你确定？Energy 25% 不是"稳定"，是在悬崖边。', why: '"Stay small"是选择不是逃避。但你得先解决 Energy 危机。' },
            { t: '融资。Scale up。招团队。做独角兽', ok: false, mark: 'opc_n6_raise', fx: { momentum: 15, energy: -10, revenue: 5 },
              fb: 'VC 朋友：终于说了。但你知道拿了钱就不再是 OPC 了吧？你会有 Board、有 KPI、有人跟你说"这个方向不对"。', why: '融资不是升级，是换一种活法。有些创始人适合，有些不适合。' }
          ],
          hints: ['Energy 归零 = 游戏结束，不管 MRR 多少', 'OPC 的核心问题不是"能做多大"而是"能活多久"']
        }
      ],
      outro: [{ npc: 'ai', text: '结算画面生成中……' }]
    }
  ];

  return { NPCS, CASES, SIM };
})();
