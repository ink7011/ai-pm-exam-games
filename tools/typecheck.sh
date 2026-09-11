#!/usr/bin/env bash
# 存档契约类型检查（types-only，无构建产物、零运行时依赖）
# shared/types.js 定义 TowerSave/RpgSave/LearnerSave；shared/learner.js @ts-check 消费；
# tsconfig 关闭 implicit-any/null 噪音，只对准跨文件字段契约（V0.5 审查三类字段错配的疫苗）
set -e
cd "$(dirname "$0")/.."
exec npx -y -p typescript tsc -p .
