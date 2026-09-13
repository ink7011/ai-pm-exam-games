/* ============================================================
   AI PRODUCT RPG — 角色美术库 CAST
   手绘 SVG 半身像：Victor/林博士/Kai/Maya/Raj/Dana/NOVA终端/你
   + Boss「季终复盘会 · THE REVIEW」
   风格：终端几何风 · 每人一个品牌色 · 门户与游戏共用
   ============================================================ */
window.CAST = (function () {
  'use strict';

  /* 头像生成：viewBox 96x96，bust 构图 */
  const A = {};

  /* ---------- Victor · CEO（琥珀金 · 墨镜西装 · 志在必得） ---------- */
  A.victor = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" class="cast-svg">
<defs><linearGradient id="cvBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8EED6"/><stop offset="1" stop-color="#F0E2BE"/></linearGradient></defs>
<rect width="96" height="96" rx="18" fill="url(#cvBg)"/>
<rect width="96" height="96" rx="18" fill="none" stroke="#8F6A1E" stroke-opacity=".5" stroke-width="1.5"/>
<path d="M8 96 C14 74 30 66 48 66 C66 66 82 74 88 96 Z" fill="#15120c" stroke="#8F6A1E" stroke-opacity=".45" stroke-width="1.2"/>
<path d="M40 66 L48 78 L56 66 L52 64 L48 70 L44 64 Z" fill="#C7CFE0"/>
<path d="M48 74 L44.5 79 L47 92 L49 92 L51.5 79 Z" fill="#8F6A1E"/>
<path d="M20 84 L34 76" stroke="#8F6A1E" stroke-opacity=".5" stroke-width="1.4"/>
<rect x="37" y="58" width="22" height="12" rx="4" fill="#e0aa7e"/>
<path d="M30 44 C30 30 36 22 48 22 C60 22 66 30 66 44 L66 50 C66 60 58 66 48 66 C38 66 30 60 30 50 Z" fill="#edbd8f"/>
<path d="M29 42 C28 28 37 18 48 18 C60 18 68 28 67 42 C64 36 62 33 58 31 C54 33 42 34 38 31 C34 33 31 37 29 42 Z" fill="#171310"/>
<rect x="34" y="39" width="12" height="8" rx="3" fill="#0d0b06" stroke="#8F6A1E" stroke-width="1.2"/>
<rect x="50" y="39" width="12" height="8" rx="3" fill="#0d0b06" stroke="#8F6A1E" stroke-width="1.2"/>
<path d="M46 42.5 H50" stroke="#8F6A1E" stroke-width="1.2"/>
<path d="M43 55 Q48 57.5 53 54.5" fill="none" stroke="#8a5a3a" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

  /* ---------- 林博士 · CTO（紫 · 圆镜片 · 平静） ---------- */
  A.lin = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" class="cast-svg">
<defs><linearGradient id="clBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2EFFA"/><stop offset="1" stop-color="#E7E1F4"/></linearGradient></defs>
<rect width="96" height="96" rx="18" fill="url(#clBg)"/>
<rect width="96" height="96" rx="18" fill="none" stroke="#7663AA" stroke-opacity=".5" stroke-width="1.5"/>
<path d="M10 96 C16 76 30 68 48 68 C66 68 80 76 86 96 Z" fill="#C3CBE6" stroke="#7663AA" stroke-opacity=".5" stroke-width="1.2"/>
<path d="M34 72 L48 84 L62 72" fill="none" stroke="#b9b4d4" stroke-width="1.6"/>
<rect x="37" y="58" width="22" height="13" rx="4" fill="#f2cba2"/>
<path d="M30 44 C30 30 36 22 48 22 C60 22 66 30 66 44 L66 52 C66 61 58 66 48 66 C38 66 30 61 30 52 Z" fill="#f5d4ae"/>
<path d="M27 46 C26 26 35 15 48 15 C61 15 70 26 69 46 L69 38 C69 30 62 26 60 30 C56 25 40 25 36 30 C34 26 27 30 27 38 Z" fill="#241f33"/>
<path d="M27 38 C27 26 35 20 48 20 C61 20 69 26 69 38 C69 33 62 29 48 29 C34 29 27 33 27 38 Z" fill="#2d2745"/>
<circle cx="40" cy="44" r="7.5" fill="none" stroke="#7663AA" stroke-width="1.8"/>
<circle cx="56" cy="44" r="7.5" fill="none" stroke="#7663AA" stroke-width="1.8"/>
<path d="M47.5 44 H48.5 M32.5 43 L28 41 M63.5 43 L68 41" stroke="#7663AA" stroke-width="1.6"/>
<circle cx="40" cy="44" r="2" fill="#241f33"/><circle cx="56" cy="44" r="2" fill="#241f33"/>
<path d="M44.5 56 Q48 58 51.5 56" fill="none" stroke="#b0805a" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

  /* ---------- Kai · ML 工程师（黑人女性 · 自然卷 + 耳机卫衣） ---------- */
  A.kai = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" class="cast-svg">
<defs><linearGradient id="ckBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ECF6F1"/><stop offset="1" stop-color="#DDEFE7"/></linearGradient></defs>
<rect width="96" height="96" rx="18" fill="url(#ckBg)"/>
<rect width="96" height="96" rx="18" fill="none" stroke="#2E7D62" stroke-opacity=".5" stroke-width="1.5"/>
<path d="M8 96 C14 74 30 66 48 66 C66 66 82 74 88 96 Z" fill="#123527" stroke="#2E7D62" stroke-opacity=".5" stroke-width="1.2"/>
<path d="M38 68 L48 78 L58 68" fill="none" stroke="#0b1f16" stroke-width="3"/>
<path d="M48 96 L44 84 L48 78 L52 84 Z" fill="#0b1f16"/>
<rect x="37" y="58" width="22" height="12" rx="4" fill="#6e4028"/>
<path d="M30 44 C30 30 36 23 48 23 C60 23 66 30 66 44 L66 51 C66 60 58 65 48 65 C38 65 30 60 30 51 Z" fill="#7a4a2e"/>
<path d="M35 34 Q40 30 48 30 Q56 30 61 34 L61 30 Q48 22 35 30 Z" fill="#8f5a3a"/>
<!-- 自然卷发 -->
<g fill="#15100b">
<circle cx="34" cy="30" r="7"/><circle cx="42" cy="25" r="7.5"/><circle cx="50" cy="23" r="7.5"/>
<circle cx="58" cy="26" r="7"/><circle cx="63" cy="32" r="6"/><circle cx="31" cy="38" r="5.5"/><circle cx="65" cy="38" r="5.5"/>
</g>
<circle cx="38" cy="22" r="2.5" fill="#241a12"/><circle cx="47" cy="20" r="2.5" fill="#241a12"/><circle cx="56" cy="22" r="2.5" fill="#241a12"/>
<!-- 耳机 -->
<path d="M28 38 C28 22 38 14 48 14 C58 14 68 22 68 38" fill="none" stroke="#2E7D62" stroke-width="2.6" stroke-linecap="round"/>
<rect x="24" y="36" width="8" height="13" rx="4" fill="#2E7D62"/>
<rect x="64" y="36" width="8" height="13" rx="4" fill="#2E7D62"/>
<!-- 耳环 -->
<circle cx="30" cy="52" r="1.8" fill="#2E7D62"/><circle cx="66" cy="52" r="1.8" fill="#2E7D62"/>
<circle cx="41" cy="44" r="2.2" fill="#15100b"/><circle cx="55" cy="44" r="2.2" fill="#15100b"/>
<path d="M40 45.5 q1.5 -1.5 3 0 M53 45.5 q1.5 -1.5 3 0" fill="none" stroke="#4a2f1c" stroke-width="1" stroke-linecap="round"/>
<path d="M42 54 Q48 59 54 54 Q48 56.5 42 54 Z" fill="#5a3020"/>
</svg>`;

  /* ---------- Maya · Growth（女性 · 专业范 · 马尾 + 耳麦） ---------- */
  A.maya = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" class="cast-svg">
<defs><linearGradient id="cmBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FAEFF4"/><stop offset="1" stop-color="#F3E2EB"/></linearGradient></defs>
<rect width="96" height="96" rx="18" fill="url(#cmBg)"/>
<rect width="96" height="96" rx="18" fill="none" stroke="#B04F84" stroke-opacity=".4" stroke-width="1.5"/>
<path d="M8 96 C14 74 30 66 48 66 C66 66 82 74 88 96 Z" fill="#3d1230" stroke="#B04F84" stroke-opacity=".5" stroke-width="1.2"/>
<path d="M36 66 L48 76 L60 66 L56 63 L48 68 L40 63 Z" fill="#D3C3DC"/>
<rect x="38" y="58" width="20" height="12" rx="4" fill="#f0c8a8"/>
<path d="M31 45 C31 31 37 24 48 24 C59 24 65 31 65 45 L65 51 C65 60 57 65 48 65 C39 65 31 60 31 51 Z" fill="#f5d2b3"/>
<path d="M29 42 C28 27 37 18 48 18 C59 18 68 27 67 42 C65 34 60 30 58 33 C55 27 41 27 38 33 C36 30 31 34 29 42 Z" fill="#3a1f14"/>
<circle cx="47" cy="16" r="8" fill="#3a1f14"/>
<path d="M50 13 C60 12 66 20 66 30 C66 40 62 48 58 52 C63 42 63 28 50 13 Z" fill="#482718"/>
<path d="M30 40 C28 26 38 17 48 17 C58 17 68 26 66 40" fill="none" stroke="#B04F84" stroke-width="2.4" stroke-linecap="round"/>
<rect x="26" y="38" width="7" height="11" rx="3.5" fill="#B04F84"/>
<rect x="63" y="38" width="7" height="11" rx="3.5" fill="#B04F84"/>
<path d="M63 44 C60 50 54 52 50 51" fill="none" stroke="#B04F84" stroke-width="1.8"/>
<circle cx="50" cy="51" r="2.2" fill="#B04F84"/>
<circle cx="41" cy="44" r="2" fill="#4a2a18"/><circle cx="55" cy="44" r="2" fill="#4a2a18"/>
<path d="M38.5 40.5 q2.5 -1.5 5 -.5 M52.5 40 q2.5 -1 5 .5" fill="none" stroke="#4a2a18" stroke-width="1.4" stroke-linecap="round"/>
<path d="M44 55.5 Q48 57.5 52 55.5" fill="none" stroke="#c0605a" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

  /* ---------- Raj · 客服负责人（资深长者 · 花白胡 · 温暖可靠） ---------- */
  A.raj = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" class="cast-svg">
<defs><linearGradient id="crBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FAF0E8"/><stop offset="1" stop-color="#F2E0D3"/></linearGradient></defs>
<rect width="96" height="96" rx="18" fill="url(#crBg)"/>
<rect width="96" height="96" rx="18" fill="none" stroke="#A8582C" stroke-opacity=".5" stroke-width="1.5"/>
<path d="M8 96 C14 74 30 66 48 66 C66 66 82 74 88 96 Z" fill="#331c0d" stroke="#A8582C" stroke-opacity=".5" stroke-width="1.2"/>
<rect x="26" y="82" width="14" height="7" rx="2" fill="#A8582C" fill-opacity=".85"/>
<rect x="37" y="58" width="22" height="12" rx="4" fill="#c98e5f"/>
<path d="M30 42 C30 29 36 22 48 22 C60 22 66 29 66 42 L66 48 C66 60 58 64 48 64 C38 64 30 60 30 48 Z" fill="#cf9463"/>
<path d="M29 40 C29 27 37 19 48 19 C59 19 67 27 67 40 L65 34 C63 27 57 23 48 23 C39 23 33 27 31 34 Z" fill="#3a2c1e"/>
<!-- 两鬓斑白 -->
<path d="M29 40 C29 33 31 28 35 25 L37 30 C33 33 31 37 31 41 Z" fill="#9aa4ae"/>
<path d="M67 40 C67 33 65 28 61 25 L59 30 C63 33 65 37 65 41 Z" fill="#9aa4ae"/>
<!-- 抬头纹 -->
<path d="M41 30 Q48 28 55 30 M43 34 Q48 32.5 53 34" fill="none" stroke="#a06a42" stroke-width="1" stroke-opacity=".7"/>
<!-- 花白络腮胡 -->
<path d="M32 48 C32 62 39 66 48 66 C57 66 64 62 64 48 L64 44 C60 52 56 54 48 54 C40 54 36 52 32 44 Z" fill="#54381e"/>
<path d="M40 52 L44 64 M52 52 L50 64 M35 50 L38 58 M61 50 L58 58 M46 55 L47 65" stroke="#b9c2cc" stroke-width="1.3" stroke-opacity=".8"/>
<path d="M36 60 C40 64 44 65 48 65 C52 65 56 64 60 60" fill="none" stroke="#3a2712" stroke-width="1.4"/>
<!-- 老花镜（垂在鼻尖） -->
<path d="M36 44 h24" stroke="#B8C2D4" stroke-width="1.4"/>
<path d="M38 44 C38 41 42 40 44 44 M52 44 C54 40 58 41 58 44" fill="none" stroke="#B8C2D4" stroke-width="1.3"/>
<!-- 慈祥眯眼 -->
<path d="M39 45 q3 -3 6 0 M51 45 q3 -3 6 0" fill="none" stroke="#3a2410" stroke-width="1.7" stroke-linecap="round"/>
<path d="M44 58 Q48 60.5 52 58" fill="none" stroke="#7c4a2a" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

  /* ---------- Dana · 企业销售（蓝 · 方框眼镜 · 干练） ---------- */
  A.dana = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" class="cast-svg">
<defs><linearGradient id="cdBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9F4F6"/><stop offset="1" stop-color="#DCEDEF"/></linearGradient></defs>
<rect width="96" height="96" rx="18" fill="url(#cdBg)"/>
<rect width="96" height="96" rx="18" fill="none" stroke="#3D6CAB" stroke-opacity=".4" stroke-width="1.5"/>
<path d="M8 96 C14 74 30 66 48 66 C66 66 82 74 88 96 Z" fill="#13233d" stroke="#3D6CAB" stroke-opacity=".5" stroke-width="1.2"/>
<path d="M40 66 L48 76 L56 66 L52 64 L48 69 L44 64 Z" fill="#C3D2E8"/>
<path d="M48 74 L45 80 L46.5 92 L49.5 92 L51 80 Z" fill="#3D6CAB"/>
<rect x="37" y="58" width="22" height="12" rx="4" fill="#e8b48c"/>
<path d="M30 43 C30 30 36 23 48 23 C60 23 66 30 66 43 L66 50 C66 59 58 64 48 64 C38 64 30 59 30 50 Z" fill="#eec096"/>
<path d="M29 40 C29 27 38 19 48 19 C58 19 67 27 67 40 L65 32 C62 26 56 23 48 23 C41 23 34 26 31 32 Z" fill="#20150c"/>
<path d="M31 30 C38 24 58 24 65 30 L64 26 C58 21 38 21 32 26 Z" fill="#2a1c10"/>
<rect x="34" y="41" width="11" height="8" rx="2" fill="none" stroke="#3D6CAB" stroke-width="1.7"/>
<rect x="51" y="41" width="11" height="8" rx="2" fill="none" stroke="#3D6CAB" stroke-width="1.7"/>
<path d="M45 44.5 H51" stroke="#3D6CAB" stroke-width="1.6"/>
<circle cx="39.5" cy="45" r="1.8" fill="#20150c"/><circle cx="56.5" cy="45" r="1.8" fill="#20150c"/>
<path d="M36 37.5 L42 36.5" stroke="#20150c" stroke-width="1.5" stroke-linecap="round"/>
<path d="M44 55.5 Q48 57.5 52 55.5" fill="none" stroke="#a06a42" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

  /* ---------- NOVA 终端 · SYSTEM（青 · 非人类） ---------- */
  A.sys = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" class="cast-svg">
<defs><linearGradient id="csBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF1F8"/><stop offset="1" stop-color="#DEE9F2"/></linearGradient>
<linearGradient id="csScr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e3a46"/><stop offset="1" stop-color="#07222b"/></linearGradient></defs>
<rect width="96" height="96" rx="18" fill="url(#csBg)"/>
<rect width="96" height="96" rx="18" fill="none" stroke="#4A85AE" stroke-opacity=".4" stroke-width="1.5"/>
<line x1="48" y1="10" x2="48" y2="22" stroke="#4A85AE" stroke-width="2"/>
<circle cx="48" cy="9" r="3" fill="#4A85AE"><animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite"/></circle>
<rect x="22" y="22" width="52" height="38" rx="8" fill="#0a141a" stroke="#4A85AE" stroke-width="2"/>
<rect x="27" y="27" width="42" height="28" rx="4" fill="url(#csScr)"/>
<g fill="#4A85AE">
<rect x="31" y="37" width="7" height="7" rx="1.5"><animate attributeName="opacity" values="1;.25;1" dur="2.1s" repeatCount="indefinite"/></rect>
<rect x="58" y="37" width="7" height="7" rx="1.5"><animate attributeName="opacity" values=".25;1;.25" dur="2.1s" repeatCount="indefinite"/></rect>
</g>
<g stroke="#4A85AE" stroke-opacity=".45" stroke-width="1.2">
<line x1="31" y1="31" x2="65" y2="31"/><line x1="31" y1="35" x2="65" y2="35"/>
<line x1="31" y1="46" x2="65" y2="46"/><line x1="31" y1="50" x2="55" y2="50"/>
</g>
<path d="M42 60 L54 60 L52 68 L44 68 Z" fill="#0e2a33"/>
<path d="M30 68 L66 68 L70 76 L26 76 Z" fill="#123a45" stroke="#4A85AE" stroke-opacity=".5" stroke-width="1.4"/>
<g class="nova-cursor"><rect x="62" y="50" width="4" height="4" fill="#7cf3ff"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect></g>
</svg>`;

  /* ---------- 你 · PRODUCT ASSOCIATE（兜帽 + 反光面罩 · 神秘主角） ---------- */
  A.you = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" class="cast-svg">
<defs><linearGradient id="cyBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF3F9"/><stop offset="1" stop-color="#DDEAF3"/></linearGradient>
<linearGradient id="cyVis" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A85AE" stop-opacity=".9"/><stop offset=".5" stop-color="#134e5a"/><stop offset="1" stop-color="#7663AA" stop-opacity=".8"/></linearGradient></defs>
<rect width="96" height="96" rx="18" fill="url(#cyBg)"/>
<rect width="96" height="96" rx="18" fill="none" stroke="#3A729B" stroke-opacity=".5" stroke-width="1.5"/>
<path d="M8 96 C14 74 30 66 48 66 C66 66 82 74 88 96 Z" fill="#0f1720" stroke="#3A729B" stroke-opacity=".4" stroke-width="1.2"/>
<path d="M28 48 C28 26 38 16 48 16 C58 16 68 26 68 48 L68 56 C68 66 59 70 48 70 C37 70 28 66 28 56 Z" fill="#16222e"/>
<path d="M32 50 C32 32 40 24 48 24 C56 24 64 32 64 50 L64 56 C64 64 57 67 48 67 C39 67 32 64 32 56 Z" fill="#0b1118"/>
<path d="M34 38 C36 32 41 29 48 29 C55 29 60 32 62 38 L62 50 C62 56 56 59 48 59 C40 59 34 56 34 50 Z" fill="url(#cyVis)"/>
<path d="M37 34 L44 33 L40 45 Z" fill="#C9E5F2" fill-opacity=".55"/>
<line x1="34" y1="52" x2="62" y2="52" stroke="#0b1118" stroke-opacity=".6" stroke-width="1"/>
<line x1="36" y1="56" x2="60" y2="56" stroke="#0b1118" stroke-opacity=".4" stroke-width="1"/>
</svg>`;

  /* ---------- BOSS：季终复盘会 · THE REVIEW（200x120 宽幅） ---------- */
  const BOSS = `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" class="cast-svg cast-boss">
<defs>
<linearGradient id="bBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9EFEF"/><stop offset="1" stop-color="#F2E2E2"/></linearGradient>
<radialGradient id="bGlow" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#B35050" stop-opacity=".22"/><stop offset="1" stop-color="#B35050" stop-opacity="0"/></radialGradient>
</defs>
<rect width="200" height="120" rx="14" fill="url(#bBg)"/>
<rect width="200" height="120" rx="14" fill="url(#bGlow)"/>
<rect x="6" y="6" width="188" height="108" rx="10" fill="none" stroke="#B35050" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="7 5"/>
<!-- 中央大法官 -->
<path d="M100 28 C86 28 78 44 78 66 L78 108 L122 108 L122 66 C122 44 114 28 100 28 Z" fill="#16090b"/>
<path d="M84 44 C84 32 90 24 100 24 C110 24 116 32 116 44 C116 40 109 36 100 36 C91 36 84 40 84 44 Z" fill="#0c0506"/>
<circle cx="100" cy="46" r="3" fill="#8F6A1E"><animate attributeName="opacity" values="1;.4;1" dur="2.4s" repeatCount="indefinite"/></circle>
<path d="M96 54 Q100 57 104 54" fill="none" stroke="#B35050" stroke-width="1.6"/>
<rect x="90" y="86" width="20" height="7" rx="2" fill="#B35050" fill-opacity=".8"/>
<!-- 左右判官 -->
<path d="M50 40 C39 40 33 54 33 72 L33 108 L67 108 L67 72 C67 54 61 40 50 40 Z" fill="#130709"/>
<path d="M150 40 C139 40 133 54 133 72 L133 108 L167 108 L167 72 C167 54 161 40 150 40 Z" fill="#130709"/>
<path d="M38 52 C38 43 43 37 50 37 C57 37 62 43 62 52 C62 49 56 46 50 46 C44 46 38 49 38 52 Z" fill="#0b0405"/>
<path d="M138 52 C138 43 143 37 150 37 C157 37 162 43 162 52 C162 49 156 46 150 46 C144 46 138 49 138 52 Z" fill="#0b0405"/>
<circle cx="50" cy="53" r="2.4" fill="#B35050"><animate attributeName="opacity" values=".3;1;.3" dur="3s" repeatCount="indefinite"/></circle>
<circle cx="150" cy="53" r="2.4" fill="#B35050"><animate attributeName="opacity" values="1;.3;1" dur="3s" repeatCount="indefinite"/></circle>
<!-- 法槌 -->
<rect x="126" y="78" width="22" height="8" rx="2.5" fill="#8a5a2a" transform="rotate(24 126 78)"/>
<rect x="121" y="94" width="26" height="4" rx="2" fill="#5a3a1a"/>
<g fill="#B35050" font-family="monospace" font-size="11" letter-spacing="3">
<text x="100" y="18" text-anchor="middle" fill="#B35050" opacity=".9">THE REVIEW</text>
</g>
</svg>`;

  /* ---------- 元数据（门户展示用） ---------- */
  const META = {
    victor: { name: 'Victor', role: 'CEO · 会议室里最锋利的人', color: '#8F6A1E', quote: '“我改一下招聘流程——以后 JD 里会写：要求达到 ta 的一半。”' },
    lin:    { name: '林博士', role: 'CTO · 数据的翻译官', color: '#7663AA', quote: '“数据不会说谎。你是我带过的新人里，最接近『产品直觉』的一个。”' },
    kai:    { name: 'Kai', role: 'ML 工程师 · 上线守门人', color: '#2E7D62', quote: '“先跑通，再跑快。灰度、实验、回滚——发布三件套。”' },
    maya:   { name: 'Maya', role: 'Growth · 增长的良心', color: '#B04F84', quote: '“增长要的是留存，不是烟花。”' },
    raj:    { name: 'Raj', role: '客服负责人 · 二十年工龄的定海神针', color: '#A8582C', quote: '“我见过七次大故障。别慌，先止血，再复盘。”' },
    dana:   { name: 'Dana', role: '企业销售 · 承诺的重量', color: '#3D6CAB', quote: '“客户买的不是模型，是不出事。”' },
    sys:    { name: 'NOVA 终端', role: 'SYSTEM · 你的工位本身', color: '#4A85AE', quote: '“SYSTEM ONLINE. 请开始你的试用期。”' },
    you:    { name: '你', role: 'Product Associate · Season 1', color: '#3A729B', quote: '“你的武器不是代码，是判断力。”' }
  };

  function avatar(key, cls) {
    return A[key] ? A[key].replace('class="cast-svg"', 'class="cast-svg ' + (cls || '') + '"') : '';
  }
  return { avatar, boss: BOSS, meta: META, raw: A };
})();
