#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把本地付费题库打包成前端可用的加密数据块。

输入（均为本地 gitignored 文件，不上仓库）：
  paid-deck/paid.json   付费题库源（items 数组，含 mod 字段）
  paid-deck/salt.txt    全局盐（生成一次，妥善保存——丢了所有已发码作废）
  codes/<tower>.txt     每塔已铸兑换码（一行一码）
  codes/_bundle.txt     全家桶共享码（存在则附加进每座塔的码表）

输出（提交到仓库，均为不可逆/密文）：
  tower/js/deck-paid.js            window.PAID_DECK = {...}
  miniprogram/data/deck-paid.js    module.exports = {...}

结构：每塔 { n, salt, h[], w[], d }
  h[i] = FNV-1a(第 i 个码)                —— 校验用（不可逆推码）
  w[i] = 塔钥匙 XOR keystream(sha256链, 种子=码+盐)  —— 正确的码才能解包
  d   = 题库JSON XOR keystream(sha256链, 种子=塔钥匙)
"""
import io, json, os, hashlib, struct, base64

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAID = os.path.join(ROOT, 'paid-deck')
TOWERS = ['meituan', 'didi', 'xiaohongshu', 'tencent', 'alibaba', 'bytedance']


def fnv1a(s):
    h = 2166136261
    for b in s.encode('utf-8'):
        h ^= b
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def keystream(seed_hex, length):
    """sha256 链式密钥流（与前端 paid-crypto.js 完全同构）"""
    out = b''
    block = bytes.fromhex(seed_hex)
    while len(out) < length:
        block = hashlib.sha256(block).digest()
        out += block
    return out[:length]


def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))


def main():
    items = json.loads(io.open(os.path.join(PAID, 'paid.json'), encoding='utf-8').read())['items']
    bundle_path = os.path.join(ROOT, 'codes', '_bundle.txt')
    bundle = [c.strip() for c in io.open(bundle_path, encoding='utf-8') if c.strip()] if os.path.exists(bundle_path) else []
    salt = io.open(os.path.join(PAID, 'salt.txt'), encoding='utf-8').read().strip()
    out = {}
    for t in TOWERS:
        t_items = [i for i in items if i['mod'] == t]
        codes = [c.strip() for c in io.open(os.path.join(ROOT, 'codes', t + '.txt'), encoding='utf-8') if c.strip()] + bundle
        tower_key = hashlib.sha256(('towerkey|' + t + '|' + salt).encode()).hexdigest()  # 塔钥匙=64 hex
        plain = json.dumps({'items': t_items}, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        blob = xor_bytes(plain, keystream(tower_key, len(plain)))
        hs, ws = [], []
        for c in codes:
            hs.append(fnv1a(c))
            ws.append(base64.b64encode(xor_bytes(bytes.fromhex(tower_key), keystream(
                hashlib.sha256((c + '|' + salt).encode()).hexdigest(), 32))).decode())
        out[t] = {'n': len(codes), 'q': len(t_items), 'salt': salt, 'h': hs, 'w': ws,
                  'd': base64.b64encode(blob).decode()}
        print(t, len(t_items), '题', len(codes), '码')
    js = ('/* NOVA 进阶内容数据块（加密）· 由 tools/pack-paid.py 生成，勿手改 */\n'
          'window.PAID_DECK = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    io.open(os.path.join(ROOT, 'tower/js/deck-paid.js'), 'w', encoding='utf-8').write(js)
    mini = ('/* NOVA 进阶内容数据块（加密）· 由 tools/pack-paid.py 生成，勿手改 */\n'
            'module.exports = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    io.open(os.path.join(ROOT, 'miniprogram/data/deck-paid.js'), 'w', encoding='utf-8').write(mini)
    print('deck-paid.js written (web + miniprogram)')


if __name__ == '__main__':
    main()
