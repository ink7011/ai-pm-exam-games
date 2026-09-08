#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 tower/js/deck-data.js 同步成 miniprogram/data/deck.js（CommonJS）"""
import io, json, re, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
src = io.open(os.path.join(ROOT, 'tower/js/deck-data.js'), encoding='utf-8').read()
m = re.search(r'"items": \[([\s\S]*)\]\s*,\s*"meta":\s*(\{[^}]*\})', src)
items = json.loads('[' + m.group(1) + ']')
out = '/* NOVA 概念试炼塔 · 小程序题库（由 tower/js/deck-data.js 同步生成，勿手改）\n   同步脚本：python3 tools/sync-mini-deck.py */\nmodule.exports = {\n"items": ' + json.dumps(items, ensure_ascii=False, indent=1) + ',\n"meta": ' + m.group(2) + '\n};\n'
io.open(os.path.join(ROOT, 'miniprogram/data/deck.js'), 'w', encoding='utf-8').write(out)
print('synced %d items' % len(items))
