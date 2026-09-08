#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen-terms-tower.py — 从 rpg/js/glossary.js 术语表生成「术语深化塔」（模块 id: terms）
并追加进 tower/js/deck-data.js。

- 94 道正向题：「『术语X』在 AI 产品语境中最接近什么？」
  正确项 = 该术语 d 的精简版（SHORT）；干扰项 = 其他模块术语的 d 精简版
  （按 m 字段分组选语义距离远的，固定 seed 保证可复现）
- 18 道反向题：给解释（d 精简版）选术语名，按 m 分组轮转采样
- 每题 exp 写明出处术语 + 完整 d 的要点
- 全程校验（固定 seed、每题 4 选项唯一、唯一正确答案、exp 非空），失败不写文件
- 幂等：重跑会先移除旧 terms 模块再追加

用法：python3 tools/gen-terms-tower.py [--dry-run]
"""
import json, re, os, argparse, random

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
DECK = os.path.join(ROOT, 'tower', 'js', 'deck-data.js')
GLOSSARY = os.path.join(ROOT, 'rpg', 'js', 'glossary.js')

SEED = 20260905            # 固定种子，保证题目可复现
MOD = 'terms'
MOD_NAME = '术语深化'
REVERSE_N = 18             # 反向题数量（15-20 区间取 18）
EXP_MAX = 90

# 术语 d 的精简版（人工校对，作为选项文本），键 = glossary entry id
SHORT = {
    'ns':         '全团队唯一认定的最重要指标，像北极星一样指方向',
    'vanity':     '看起来漂亮但不反映真实价值的数字',
    'dau':        '每天有多少独立用户来用产品',
    'retention':  '用户过了一段时间还会不会回来',
    'activation': '用户第一次真正「用成」产品的时刻',
    'aha':        '用户第一次感受到产品价值的瞬间',
    'funnel':     '把用户路径拆成步骤，看每步流失多少',
    'conv':       '走到下一步的人占上一层的比例',
    'gmv':        '成交总额，但高不代表赚钱',
    'nps':        '问用户愿不愿推荐，推荐者减去贬损者',
    'unit-econ':  '算清每单生意到底是赚还是亏',
    'margin':     '收入减去直接成本后剩下的部分',
    'acc':        '模型判断对的比例，不均衡时会骗人',
    'cm':         '模型答对/答错 × 真实是/否的四格表',
    'recall':     '真的有问题的事件里，被你抓到了多少',
    'precision':  '你报出来的问题里，有多少是真的',
    'f1':         '精确率和召回率的调和平均，一个数照顾两者',
    'prauc':      '衡量模型排序能力，不依赖阈值',
    'imbalance':  '两类样本数量悬殊（如 1:99）',
    'focal':      '让模型少盯学得好的多数类、多盯少数类的损失',
    'resample':   '复制少数样本/削减多数样本，拉回比例',
    'threshold':  '判定「算不算命中」的分数线',
    'metric-cal': '指标的统计规则：算谁、不算谁、怎么算',
    'overfit':    '把训练题背下来了，遇到新题就露馅',
    'reg':        '给模型加约束惩罚，逼它学规律不死记',
    'aug':        '把现有样本变着花样扩充（旋转/改写/加噪）',
    'drift':      '世界变了，线上数据不再像训练数据',
    'leak':       '训练时用了「未来才知道的信息」，离线虚高',
    'benchmark':  '公开的统一考卷，横向比较不同模型',
    'pollute':    '考题混进训练材料，高分是「背过答案」',
    'offline':    '上线前在本地测试集上打分',
    'ab':         '用户随机分两组，新旧版本比真实数据',
    'gray':       '新版先放给 5% 用户试水再放大',
    'fullroll':   '把新版本放开给 100% 用户',
    'rollback':   '出问题时一键退回上一个正常版本',
    'regression': '每次更新都重跑「以前修好的问题」题库',
    'goldset':    '真实业务场景人工标注的标准答案集',
    'judge':      '让一个大模型当裁判给回答打分',
    'calibrate':  '让置信度和真实正确率对得上',
    'badcase':    '具体的失败案例，分类归因后优化',
    'sample':     '从全量数据里挑一部分来看',
    'llm':        '读遍互联网文本、学会接话的超级大脑',
    'hallu':      '模型编造不存在的事实',
    'rag':        '让 AI 先查资料再回答，开卷考试',
    'kb':         '存放企业文档/政策/FAQ 供检索的仓库',
    'index':      '把文档加工成能被快速检索的数据结构',
    'chunk':      '把长文档切成小段再检索',
    'embed':      '把文字变成向量，语义近则向量近',
    'rerank':     '粗排先捞回一批，再用精细模型重新排序',
    'bm25':       '经典关键词检索，精确匹配术语/错误码',
    'hybrid':     '关键词检索+语义向量检索一起上、结果合并',
    'qrewrite':   '把口语问题改写成更适合检索的查询',
    'ground':     '回答严格基于检索到的资料，不自由发挥',
    'trace':      '回答时标明「这句话来自哪份文档」',
    'fresh':      '检索源是否最新，索引是否跟上',
    'sft':        '拿「问题-标准回答」示范题继续训练模型',
    'pretrain':   '海量阅读学会语言和世界知识的阶段',
    'rlhf':       '人排序→训奖励模型→RL 让模型讨好裁判',
    'dpo':        '跳过奖励模型，直接从偏好对数据里学',
    'align':      '把模型调教得符合人类意图和价值观',
    'forget':     '模型学新把旧挤掉，专项微调后变笨',
    'lora':       '只训一小块外挂插件，不动模型本体',
    'distill':    '让大模型当老师带出小学生模型',
    'quant':      '把参数从高精度压成低精度，省显存更快',
    'route':      '简单问题给小模型、难题才上大模型',
    'ttft':       '按下回车到看见第一个字的时间',
    'stream':     '像打字机一样边生成边显示',
    'p75':        '把延迟排序看分位，而非看平均值',
    'token':      '模型处理文字的最小单位，计费按它算',
    'sysprompt':  '写在对话最前面的「岗位说明书」',
    'prefix':     '相同开头的 prompt 算一次存起来复用',
    'throughput': '服务器单位时间能处理多少请求',
    'gpu':        '训练和运行 AI 用的芯片，按卡计费',
    'inference':  '模型每次回答消耗的算力钱',
    'json':       '机器之间传数据的标准格式',
    'structout':  '技术上强制模型只能吐出合法格式',
    'parse':      '把收到的文本按格式拆成程序能用的数据',
    'hotfix':     '线上出问题时紧急打的小补丁',
    'agent':      '让模型自己决定步骤、调用工具完成任务',
    'workflow':   '把步骤写死的自动化流程',
    'loop':       'Agent 卡在反复调同一个工具里出不来',
    'reflect':    '让 Agent 中途停下来检查自己做得对不对',
    'schema':     '对数据格式的说明书（字段名、类型、示例）',
    'mcp':        '模型连接外部工具的通用插口标准',
    'memory':     '把重要信息存到外部库跨会话使用',
    'hitl':       '高危操作前强制暂停等真人确认',
    'p0':         '最高优先级线上故障：核心功能挂了',
    'root':       '连问几个为什么挖到的真正原因',
    'mttr':       '从故障发生到服务恢复的平均时长',
    'sla':        '白纸黑字承诺的服务标准，达不到要赔钱',
    'sop':        '把「怎么做对」写成人人可执行的步骤',
    'gate':       '上线前必须通过的检查（回归全绿等）',
    'monitor':    '盯着系统的体检仪，指标越界自动报警',
    'postmortem': '事故后的结构化总结：时间线、根因、改进项',
}


def load_deck(path):
    src = open(path, encoding='utf-8').read()
    prefix = 'window.DECK = '
    assert src.startswith(prefix) and src.rstrip().endswith(';')
    return json.loads(src[len(prefix):].rstrip()[:-1])


def load_glossary(path):
    """解析 rpg/js/glossary.js → [{id, t, en, m, d}]（保持文件顺序）"""
    src = open(path, encoding='utf-8').read()
    pat = re.compile(r"\{ id: '([^']+)', keys: \[.*?\], t: '([^']+)', en: '([^']*)', m: '([^']*)', d: '(.*?)' \},?$")
    out = []
    for ln in src.split('\n'):
        mm = pat.match(ln.strip())
        if mm:
            out.append({'id': mm.group(1), 't': mm.group(2), 'en': mm.group(3), 'm': mm.group(4), 'd': mm.group(5)})
    return out


def condense(d):
    """d 要点：整段太长时取首句，保证 exp 总长可控"""
    first = d.split('。')[0] + '。'
    return d if len(d) <= 62 else first


def exp_of(term):
    return '出自术语《%s》：%s' % (term['t'], condense(term['d']))


def main():
    ap = argparse.ArgumentParser(description='生成术语深化塔并追加进 deck-data.js')
    ap.add_argument('--dry-run', action='store_true', help='只校验统计，不写文件')
    args = ap.parse_args()

    data = load_deck(DECK)
    terms = load_glossary(GLOSSARY)
    rng = random.Random(SEED)

    # ---- 校验素材：SHORT 必须与术语表一一对应 ----
    tids = [t['id'] for t in terms]
    assert len(tids) == len(set(tids)), '术语 id 重复'
    miss = set(tids) - set(SHORT)
    extra = set(SHORT) - set(tids)
    assert not miss, 'SHORT 缺少术语: %s' % sorted(miss)
    assert not extra, 'SHORT 多出术语: %s' % sorted(extra)

    items_new = []

    # ---- 正向题：『术语X』最接近什么 ----
    for term in terms:
        cands = [t for t in terms if t['m'] != term['m']]
        rng.shuffle(cands)
        distract = [SHORT[t['id']] for t in cands[:3]]
        ans = rng.randrange(4)
        opts = distract[:ans] + [SHORT[term['id']]] + distract[ans:]
        items_new.append({
            'id': 't%d' % (len(items_new) + 1),
            'mod': MOD, 'modName': MOD_NAME,
            'q': '『%s』在 AI 产品语境中最接近什么？' % term['t'],
            'opts': opts,
            'ans': ans,
            'k': term['t'],
            'diff': 1, 'pri': 0,
            'expl': SHORT[term['id']],
            'exp': exp_of(term),
            'boss': False,
        })

    # ---- 反向题：给解释选术语（按 m 分组轮转采样，覆盖不同板块） ----
    groups = {}
    for t in terms:
        groups.setdefault(t['m'], []).append(t)
    for g in groups.values():
        rng.shuffle(g)
    picked, order = [], list(groups)
    rng.shuffle(order)
    while len(picked) < REVERSE_N:
        for g in order:
            if groups[g] and len(picked) < REVERSE_N:
                picked.append(groups[g].pop())
    for term in picked:
        cands = [t for t in terms if t['m'] != term['m'] and t is not term]
        rng.shuffle(cands)
        distract = [t['t'] for t in cands[:3]]
        ans = rng.randrange(4)
        opts = distract[:ans] + [term['t']] + distract[ans:]
        items_new.append({
            'id': 't%d' % (len(items_new) + 1),
            'mod': MOD, 'modName': MOD_NAME,
            'q': '【反向】某同事这样解释：「%s」。他说的术语是：' % SHORT[term['id']],
            'opts': opts,
            'ans': ans,
            'k': term['t'],
            'diff': 2, 'pri': 0,
            'expl': '反向题：由解释反推术语「%s」。' % term['t'],
            'exp': exp_of(term),
            'boss': False,
        })

    # ---- 校验 ----
    problems = []
    ids = set()
    for it in items_new:
        if it['id'] in ids:
            problems.append('重复 id: ' + it['id'])
        ids.add(it['id'])
        if len(it['opts']) != 4 or len(set(it['opts'])) != 4:
            problems.append(it['id'] + ' 选项数量/唯一性异常')
        if not (0 <= it['ans'] <= 3):
            problems.append(it['id'] + ' 答案越界')
        # 唯一正确：正确项文本在选项中只出现一次
        if it['opts'].count(it['opts'][it['ans']]) != 1:
            problems.append(it['id'] + ' 正确项不唯一')
        if not it.get('exp') or len(it['exp']) > EXP_MAX:
            problems.append(it['id'] + ' exp 缺失或超 %d 字（%s）' % (EXP_MAX, len(it.get('exp', ''))))
    assert not problems, problems
    fwd = sum(1 for i in items_new if not i['q'].startswith('【反向】'))
    assert fwd == len(terms) == 94, '正向题应为 94，实际 %d' % fwd
    assert len(items_new) - fwd == REVERSE_N

    # ---- 幂等追加：先移除旧 terms，再接在末尾 ----
    base = [it for it in data['items'] if it.get('mod') != MOD]
    data['items'] = base + items_new
    data['meta']['count'] = len(data['items'])
    if '术语深化塔(94词)' not in data['meta'].get('generatedFrom', []):
        data['meta'].setdefault('generatedFrom', []).append('术语深化塔(94词)')

    # 全库终检：每题 4 选项、唯一正确、exp 非空
    for it in data['items']:
        assert len(it['opts']) == 4 and len(set(it['opts'])) == 4, it['id'] + ' 选项异常'
        assert 0 <= it['ans'] <= 3 and it['opts'].count(it['opts'][it['ans']]) == 1, it['id'] + ' 答案异常'
        assert it.get('exp'), it['id'] + ' 缺 exp'

    print('术语深化塔：正向 %d + 反向 %d = %d 题 | 全库总题数 %d' % (fwd, len(items_new) - fwd, len(items_new), len(data['items'])))
    if args.dry_run:
        print('dry-run：未写文件')
        return

    out = 'window.DECK = ' + json.dumps(data, ensure_ascii=False, indent=0) + ';'
    open(DECK, 'w', encoding='utf-8').write(out)
    print('已写回:', DECK, '(%.1f KB)' % (os.path.getsize(DECK) / 1024))


if __name__ == '__main__':
    main()
