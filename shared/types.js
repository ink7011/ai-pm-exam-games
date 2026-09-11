/* NOVA 存档形状契约 · types-only
   本文件只承载 JSDoc 类型定义，供 `tsc --checkJs` 在 learner.js 等消费端校验跨文件字段契约——
   不被任何页面在运行时加载，零运行时依赖。
   背景：V0.5 审查抓到的三个 🔴 全是存档字段错配（st.seen vs st.right / endingRank vs finalGrade /
   wrong 缺 mod·t），本文件 + 类型检查就是那类 bug 的疫苗。
   检查命令：npx -p typescript tsc --noEmit --checkJs --target es2020 shared/learner.js shared/learner-ui.js */

/** @typedef {{ miss: number, streak: number, mod?: string, t?: number }} WrongEntry */

/** @typedef {{ right: number, wrong: number }} ModStat */

/**
 * conceptTower.v1 的生产形状（tower/js/game.js freshP/migrateTower 是唯一写入方）
 * @typedef {Object} TowerSave
 * @property {number} v
 * @property {number} lifetime
 * @property {Object<string, number>} best
 * @property {Object<string, boolean>} clear
 * @property {Object<string, boolean>} codex
 * @property {Object<string, Partial<WrongEntry>>} wrong   V0.5 起新写入含 mod·t；旧档可能缺
 * @property {Object<string, Partial<ModStat>>} modStats
 * @property {boolean} sound
 * @property {Object<string, number>} ach
 * @property {{ date?: string, best?: number, streak?: number, done?: boolean }} daily
 * @property {number} floors
 */

/**
 * aiProductRpg.v1 的生产形状（rpg/js/engine.js newState/migrateRpg 是唯一写入方）
 * @typedef {Object} RpgSave
 * @property {number} v
 * @property {boolean} started
 * @property {string} name
 * @property {string} finalGrade 通关评级（''=未通关）——注意：不是 endingRank
 * @property {boolean} finished
 * @property {boolean} learnerFini V0.5：通关 XP 是否已发放（幂等）
 * @property {{ firstTry: number, total: number, wrongTotal: number, investLeftoverXp: number }} stats
 * @property {number} potions
 * @property {number} cleanStreak
 * @property {Object<string, number>} ach
 */

/**
 * nova.learner.v1 的形状（shared/learner.js 是唯一写入方）
 * @typedef {Object} LearnerSave
 * @property {number} v
 * @property {string} name
 * @property {string} goal
 * @property {string} goalLabel
 * @property {string} stage
 * @property {Array<string>} focus
 * @property {Object<string, number>} skills
 * @property {{ id: string, started: number }|null} quest
 * @property {Array<{ id: string, t: number }>} questHistory
 * @property {Array<{ e: string, t: number, d: Object }>} events
 * @property {number} createdAt
 * @property {number} lastActive
 * @property {boolean} migrated
 * @property {boolean} onboarded
 * @property {number} firstVisit
 */

export {};
