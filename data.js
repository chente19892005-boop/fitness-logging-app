/* ===========================================================
   Stronger — 健身参数记录 App
   Copyright (c) 2026 田英可 (Tian Yingke). All rights reserved.

   作者 / Author  : 田英可 (Tian Yingke)
   联系 / Contact : +86 173 3218 2657

   本软件为作者原创作品，未经许可不得用于商业用途或二次分发。
   Original work by the author. Unauthorized commercial use or
   redistribution is not permitted.
   =========================================================== */

/* ===========================================================
   动作库数据
   -----------------------------------------------------------
   参照乐刻运动门店的实际器械配置整理：
   门店能做的动作 = 自由重量 / 固定器械 / 绳索 / 自重 四类，
   用这四类覆盖 推、拉、蹲、髋屈伸 四种基础动作模式。
   （史密斯机是固定轨迹器械，归入「器械」一类。）
   -----------------------------------------------------------
   part  : 部位（胸 / 背 / 肩 / 手臂 / 腿 / 臀 / 核心）
   equip : 器械类型（自由重量 / 器械 / 绳索 / 自重）
   icon  : 图标 key，对应 ICONS 里的线条画
   =========================================================== */

/* ---------- 图标：24×24 线条画 ---------- */
const ICONS = {
  /* --- 胸 --- */
  'bench-press': '<line x1="12" y1="6" x2="12" y2="13"/><line x1="4" y1="6" x2="20" y2="6"/><rect x="1.5" y="3.5" width="3" height="5" rx="1"/><rect x="19.5" y="3.5" width="3" height="5" rx="1"/><line x1="5" y1="17" x2="19" y2="17"/><line x1="7" y1="17" x2="7" y2="20"/><line x1="17" y1="17" x2="17" y2="20"/>',
  'incline-press': '<path d="M3 20l11-10"/><line x1="9" y1="20" x2="21" y2="20"/><line x1="4" y1="8" x2="16" y2="8"/><rect x="1.5" y="5.5" width="3" height="5" rx="1"/><rect x="15.5" y="5.5" width="3" height="5" rx="1"/>',
  'decline-press': '<path d="M3 10l11 10"/><line x1="3" y1="19" x2="15" y2="19"/><line x1="4" y1="11" x2="16" y2="11"/><rect x="1.5" y="8.5" width="3" height="5" rx="1"/><rect x="15.5" y="8.5" width="3" height="5" rx="1"/>',
  'fly': '<circle cx="12" cy="12" r="1.8"/><line x1="4" y1="7" x2="10" y2="11"/><line x1="20" y1="7" x2="14" y2="11"/><rect x="1.5" y="4.5" width="3.5" height="3.5" rx="1"/><rect x="19" y="4.5" width="3.5" height="3.5" rx="1"/><line x1="9" y1="15" x2="15" y2="15"/>',
  'pullover': '<line x1="12" y1="19" x2="12" y2="10"/><path d="M12 10a5 5 0 0 1 5-5"/><rect x="16.5" y="2.5" width="3" height="3.5" rx="1"/><line x1="6" y1="19" x2="18" y2="19"/><line x1="8" y1="19" x2="8" y2="21"/>',
  'chest-press': '<rect x="4" y="4" width="16" height="6" rx="2"/><line x1="9" y1="10" x2="9" y2="16"/><line x1="15" y1="10" x2="15" y2="16"/><line x1="7" y1="16" x2="11" y2="16"/><line x1="13" y1="16" x2="17" y2="16"/><line x1="12" y1="16" x2="12" y2="21"/>',
  'fly-machine': '<line x1="12" y1="3" x2="12" y2="21"/><path d="M12 8L5 5M12 8l7-3"/><rect x="3" y="3" width="3" height="4" rx="1"/><rect x="18" y="3" width="3" height="4" rx="1"/>',
  'crossover': '<line x1="6" y1="3" x2="10" y2="12"/><line x1="18" y1="3" x2="14" y2="12"/><circle cx="10" cy="13" r="1.4"/><circle cx="14" cy="13" r="1.4"/><line x1="12" y1="13" x2="12" y2="21"/>',
  'dip': '<line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="6" x2="6" y2="20"/><line x1="18" y1="6" x2="18" y2="20"/><circle cx="12" cy="9" r="2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="12" y1="17" x2="9" y2="20"/><line x1="12" y1="17" x2="15" y2="20"/>',
  'pushup': '<circle cx="16" cy="9" r="2"/><path d="M16 11l-7 6"/><line x1="16" y1="11" x2="20" y2="17"/><line x1="4" y1="20" x2="20" y2="20"/><line x1="24" y1="20" x2="24" y2="20"/>',

  /* --- 背 --- */
  'pulldown': '<line x1="12" y1="3" x2="12" y2="8"/><line x1="5" y1="8" x2="19" y2="8"/><line x1="5" y1="8" x2="5" y2="12"/><line x1="19" y1="8" x2="19" y2="12"/><circle cx="12" cy="15" r="2"/><line x1="12" y1="17" x2="12" y2="21"/>',
  'pullup': '<line x1="2" y1="4" x2="22" y2="4"/><circle cx="12" cy="9" r="2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="12" y1="6" x2="7" y2="4"/><line x1="12" y1="6" x2="17" y2="4"/><line x1="12" y1="17" x2="9" y2="21"/><line x1="12" y1="17" x2="15" y2="21"/>',
  'row-bent': '<circle cx="5" cy="13" r="2"/><line x1="5" y1="15" x2="5" y2="21"/><line x1="7" y1="14" x2="19" y2="10"/><line x1="19" y1="7" x2="19" y2="13"/><rect x="17" y="7" width="4" height="3.5" rx="1"/>',
  'row-seated': '<rect x="3" y="14" width="10" height="6" rx="1.5"/><line x1="6" y1="8" x2="12" y2="12"/><line x1="3" y1="8" x2="9" y2="8"/><line x1="6" y1="8" x2="6" y2="14"/><line x1="14" y1="17" x2="18" y2="17"/>',
  'straight-arm': '<line x1="4" y1="4" x2="12" y2="4"/><line x1="12" y1="4" x2="20" y2="12"/><circle cx="20" cy="12" r="1.6"/><line x1="12" y1="21" x2="12" y2="4"/>',
  'back-extension': '<line x1="3" y1="18" x2="21" y2="14"/><circle cx="6" cy="12" r="2"/><line x1="8" y1="13" x2="17" y2="16"/><line x1="3" y1="18" x2="3" y2="21"/>',
  'deadlift': '<line x1="4" y1="16" x2="20" y2="16"/><rect x="2" y="13.5" width="3.5" height="5" rx="1"/><rect x="18.5" y="13.5" width="3.5" height="5" rx="1"/><circle cx="12" cy="6" r="2"/><path d="M12 8v4"/><path d="M12 12l-3 4M12 12l3 4"/>',
  'facepull': '<circle cx="9" cy="11" r="2.2"/><path d="M11.2 11h8"/><path d="M16.5 8.5l3 2.5-3 2.5"/>',

  /* --- 肩 --- */
  'shoulder-press': '<circle cx="12" cy="10" r="2.4"/><line x1="12" y1="12.4" x2="12" y2="19"/><line x1="4" y1="4.5" x2="20" y2="4.5"/><rect x="1.8" y="2.3" width="3" height="4.5" rx="1"/><rect x="19.2" y="2.3" width="3" height="4.5" rx="1"/>',
  'lateral-raise': '<circle cx="12" cy="8" r="2.2"/><line x1="12" y1="10.2" x2="12" y2="18"/><line x1="12" y1="12" x2="4" y2="11"/><line x1="12" y1="12" x2="20" y2="11"/><rect x="1.4" y="9.3" width="2.6" height="3.5" rx="1"/><rect x="20" y="9.3" width="2.6" height="3.5" rx="1"/>',
  'front-raise': '<circle cx="13" cy="8" r="2.2"/><line x1="13" y1="10.2" x2="10" y2="19"/><line x1="13" y1="12" x2="4" y2="9.5"/><rect x="1.6" y="8" width="2.6" height="3.5" rx="1"/>',
  'rear-fly': '<circle cx="12" cy="7" r="2.2"/><path d="M12 9.2l-3 5.5"/><line x1="12" y1="11" x2="4" y2="9"/><line x1="12" y1="11" x2="20" y2="9"/><rect x="1.4" y="7.3" width="2.6" height="3.5" rx="1"/><rect x="20" y="7.3" width="2.6" height="3.5" rx="1"/>',
  'shrug': '<circle cx="12" cy="5" r="2.2"/><line x1="12" y1="7.2" x2="12" y2="13"/><line x1="12" y1="9" x2="5" y2="11"/><line x1="12" y1="9" x2="19" y2="11"/><rect x="4" y="11" width="3.5" height="3" rx="1"/><rect x="16.5" y="11" width="3.5" height="3" rx="1"/><line x1="10.5" y1="13" x2="10.5" y2="21"/><line x1="13.5" y1="13" x2="13.5" y2="21"/>',
  'upright-row': '<circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="6" y1="9.5" x2="18" y2="9.5"/><line x1="6" y1="9.5" x2="6" y2="12"/><line x1="18" y1="9.5" x2="18" y2="12"/>',
  'handstand': '<line x1="2" y1="21" x2="22" y2="21"/><circle cx="12" cy="18" r="2.2"/><line x1="12" y1="15.8" x2="12" y2="7"/><line x1="12" y1="11" x2="8.5" y2="21"/><line x1="12" y1="11" x2="15.5" y2="21"/>',

  /* --- 腿 --- */
  'squat': '<circle cx="12" cy="5" r="2.2"/><line x1="12" y1="7.2" x2="12" y2="12"/><line x1="12" y1="9" x2="6.5" y2="11"/><line x1="12" y1="9" x2="17.5" y2="11"/><line x1="12" y1="12" x2="8" y2="16"/><line x1="12" y1="12" x2="16" y2="16"/><line x1="8" y1="16" x2="8" y2="21"/><line x1="16" y1="16" x2="16" y2="21"/>',
  'leg-press': '<rect x="13" y="3.5" width="8" height="8" rx="1.5"/><line x1="5" y1="20.5" x2="12" y2="9"/><line x1="5" y1="20.5" x2="15" y2="20.5"/><circle cx="9.5" cy="15" r="2"/>',
  'split-squat': '<circle cx="12" cy="5" r="2.2"/><line x1="12" y1="7.2" x2="12" y2="12"/><line x1="12" y1="12" x2="6" y2="16"/><line x1="6" y1="16" x2="5" y2="21"/><line x1="12" y1="12" x2="18" y2="19"/><line x1="14" y1="21" x2="22" y2="21"/><line x1="18" y1="19" x2="18" y2="21"/>',
  'lunge': '<circle cx="12" cy="5" r="2.2"/><line x1="12" y1="7.2" x2="12" y2="12"/><line x1="12" y1="12" x2="7" y2="16"/><line x1="7" y1="16" x2="4" y2="21"/><line x1="12" y1="12" x2="18" y2="15"/><line x1="18" y1="15" x2="18" y2="21"/>',
  'leg-ext': '<rect x="3" y="8" width="8" height="9" rx="1.5"/><line x1="11" y1="13" x2="17" y2="13"/><line x1="17" y1="13" x2="20" y2="9"/><line x1="3" y1="17" x2="3" y2="20"/><line x1="8" y1="17" x2="8" y2="20"/>',
  'leg-curl': '<line x1="3" y1="13" x2="13" y2="13"/><rect x="13" y="9.5" width="8" height="4" rx="1.5"/><circle cx="16.5" cy="16" r="2.2"/><line x1="3" y1="13" x2="3" y2="20"/><line x1="8" y1="13" x2="8" y2="18"/>',
  'hip-adduct': '<circle cx="12" cy="5" r="2.2"/><line x1="12" y1="7.2" x2="12" y2="13"/><line x1="12" y1="13" x2="9.5" y2="20"/><line x1="12" y1="13" x2="14.5" y2="20"/><path d="M5.5 17.5l4-1.5M18.5 17.5l-4-1.5"/>',
  'hip-abduct': '<circle cx="12" cy="5" r="2.2"/><line x1="12" y1="7.2" x2="12" y2="13"/><line x1="12" y1="13" x2="5" y2="19"/><line x1="12" y1="13" x2="19" y2="19"/><path d="M3 17l3 1M21 17l-3 1"/>',
  'calf-raise': '<circle cx="10" cy="4.5" r="2.2"/><line x1="10" y1="6.7" x2="10" y2="14"/><line x1="10" y1="14" x2="10" y2="18"/><path d="M6.5 21h7"/><path d="M13 18l3.5 3"/><line x1="12" y1="9" x2="16" y2="9"/>',
  'squat-jump': '<circle cx="12" cy="6" r="2.2"/><line x1="12" y1="8.2" x2="12" y2="13"/><line x1="12" y1="13" x2="8.5" y2="16"/><line x1="12" y1="13" x2="15.5" y2="16"/><path d="M8.5 16l-1 5M15.5 16l1 5"/><path d="M19 3v4M17 5l2-2 2 2"/>',
  'wall-sit': '<line x1="3" y1="3" x2="3" y2="21"/><circle cx="8" cy="6" r="2.2"/><line x1="8" y1="8.2" x2="8" y2="12"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="16" y1="12" x2="16" y2="18"/><line x1="16" y1="18" x2="16" y2="21"/>',

  /* --- 臀 --- */
  'hip-thrust': '<rect x="2" y="12" width="6" height="6" rx="1.5"/><circle cx="8" cy="9" r="2"/><path d="M10 10l6 3"/><line x1="16" y1="13" x2="16" y2="19"/><line x1="13" y1="19" x2="21" y2="19"/>',
  'glute-bridge': '<line x1="2" y1="18" x2="22" y2="18"/><circle cx="4" cy="13" r="2"/><path d="M6 14l6-4 6 5"/><line x1="18" y1="15" x2="18" y2="18"/>',
  'kickback': '<circle cx="8" cy="6" r="2.2"/><line x1="8" y1="8.2" x2="9" y2="14"/><line x1="9" y1="14" x2="9" y2="20"/><line x1="9" y1="10" x2="13" y2="9"/><line x1="9" y1="12.5" x2="18" y2="11"/><line x1="18" y1="11" x2="21.5" y2="13"/>',
  'side-walk': '<circle cx="12" cy="4.5" r="2.2"/><line x1="12" y1="6.7" x2="12" y2="13"/><line x1="12" y1="13" x2="9" y2="18"/><line x1="9" y1="18" x2="6" y2="21"/><line x1="12" y1="13" x2="15" y2="18"/><line x1="15" y1="18" x2="18" y2="21"/><path d="M5 10.5h14"/>',

  /* --- 手臂 --- */
  'curl': '<circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="12" y1="9" x2="8" y2="13"/><line x1="12" y1="9" x2="16" y2="13"/><line x1="6.5" y1="13" x2="9.5" y2="13"/><line x1="14.5" y1="13" x2="17.5" y2="13"/><line x1="9.5" y1="11" x2="9.5" y2="15"/><line x1="14.5" y1="11" x2="14.5" y2="15"/>',
  'hammer-curl': '<circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="12" y1="9" x2="8" y2="13"/><line x1="12" y1="9" x2="16" y2="13"/><rect x="6" y="10.5" width="3.5" height="5" rx="1"/><rect x="14.5" y="10.5" width="3.5" height="5" rx="1"/>',
  'preacher-curl': '<path d="M5 21v-7l7-5"/><line x1="12" y1="9" x2="18" y2="15"/><rect x="15" y="13" width="5" height="3" rx="1.2"/><line x1="5" y1="21" x2="10" y2="21"/>',
  'tricep-pushdown': '<line x1="12" y1="3" x2="12" y2="8"/><circle cx="12" cy="11" r="2.2"/><line x1="12" y1="13.2" x2="12" y2="18"/><line x1="12" y1="14" x2="15" y2="17"/><line x1="14" y1="17" x2="18" y2="17"/><line x1="10" y1="18" x2="10" y2="21"/>',
  'overhead-ext': '<circle cx="12" cy="16" r="2.2"/><line x1="12" y1="13.8" x2="12" y2="9"/><line x1="12" y1="10" x2="8" y2="8"/><line x1="8" y1="8" x2="8" y2="4.5"/><rect x="6" y="2" width="4" height="3" rx="1"/><line x1="10" y1="18" x2="10" y2="21"/>',
  'skullcrusher': '<line x1="3" y1="17" x2="21" y2="17"/><circle cx="6" cy="13" r="2"/><line x1="8" y1="14" x2="14" y2="12"/><line x1="14" y1="12" x2="17" y2="8"/><line x1="15" y1="6" x2="20" y2="6"/><line x1="17.5" y1="4" x2="17.5" y2="8"/>',
  'wrist-curl': '<circle cx="10" cy="5" r="2"/><line x1="10" y1="7" x2="10" y2="14"/><line x1="10" y1="10" x2="14" y2="14"/><line x1="13.5" y1="14" x2="20" y2="14"/><circle cx="12.6" cy="14" r="1.6"/>',
  'farmers-walk': '<circle cx="12" cy="4.5" r="2"/><line x1="12" y1="6.7" x2="12" y2="14"/><line x1="12" y1="9" x2="6" y2="16"/><line x1="12" y1="9" x2="18" y2="16"/><rect x="4.5" y="16" width="3" height="4" rx="1"/><rect x="16.5" y="16" width="3" height="4" rx="1"/><line x1="12" y1="14" x2="9" y2="21"/><line x1="12" y1="14" x2="15" y2="21"/>',

  /* --- 核心 --- */
  'crunch': '<line x1="3" y1="19" x2="21" y2="19"/><circle cx="8" cy="13" r="2"/><path d="M10 13l5-3"/><line x1="15" y1="10" x2="18" y2="7.5"/><line x1="15" y1="10" x2="18" y2="12"/><line x1="11" y1="19" x2="11" y2="16"/>',
  'leg-raise': '<line x1="4" y1="4" x2="20" y2="4"/><circle cx="12" cy="9" r="2"/><line x1="12" y1="6" x2="12" y2="4"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="16" x2="18" y2="17"/><line x1="18" y1="17" x2="22" y2="17"/>',
  'plank': '<circle cx="6" cy="10" r="2"/><line x1="8" y1="11" x2="20" y2="14"/><line x1="20" y1="14" x2="22" y2="19"/><line x1="8" y1="11" x2="6" y2="19"/><line x1="4" y1="19" x2="22" y2="19"/>',
  'russian-twist': '<circle cx="12" cy="8" r="2"/><line x1="12" y1="10" x2="12" y2="15"/><line x1="12" y1="12" x2="6" y2="14"/><line x1="12" y1="12" x2="18" y2="10"/><circle cx="18.5" cy="9.5" r="1.8"/><line x1="12" y1="15" x2="8" y2="19"/><line x1="12" y1="15" x2="17" y2="19"/><line x1="8" y1="19" x2="17" y2="19"/>',
  'woodchop': '<line x1="4" y1="4" x2="20" y2="4"/><line x1="19" y1="5" x2="12" y2="12"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="12" y1="20" x2="7" y2="21"/><line x1="12" y1="20" x2="17" y2="21"/>',
  'ab-wheel': '<circle cx="17" cy="15" r="4"/><circle cx="17" cy="15" r="1.2"/><path d="M13 15L6 8"/><circle cx="5" cy="7" r="2"/>',
  'mountain-climber': '<circle cx="7" cy="10" r="2"/><path d="M9 11l6 5"/><line x1="9" y1="11" x2="6" y2="19"/><line x1="15" y1="16" x2="13" y2="19"/><line x1="15" y1="16" x2="21" y2="19"/><line x1="4" y1="19" x2="22" y2="19"/>',
  'deadbug': '<line x1="3" y1="19" x2="21" y2="19"/><circle cx="6" cy="15" r="2"/><line x1="8" y1="14" x2="14" y2="16"/><line x1="8" y1="14" x2="5" y2="9"/><line x1="14" y1="16" x2="19" y2="13"/><line x1="14" y1="16" x2="16" y2="19"/>',
  'birddog': '<line x1="3" y1="19" x2="21" y2="19"/><circle cx="11" cy="13" r="2"/><line x1="11" y1="15" x2="11" y2="19"/><line x1="11" y1="14" x2="5" y2="12"/><line x1="11" y1="14" x2="17" y2="11"/><line x1="11" y1="19" x2="8" y2="19"/><line x1="11" y1="19" x2="14" y2="19"/>',

  /* --- 器械类别（动作库筛选行用，不指向单个动作） --- */
  /* 自由重量：哑铃 */
  'eq-free': '<line x1="7.6" y1="12" x2="16.4" y2="12"/><line x1="5.2" y1="9.4" x2="5.2" y2="14.6"/><rect x="2.2" y="8" width="3" height="8" rx="1.2"/><rect x="18.8" y="8" width="3" height="8" rx="1.2"/><line x1="18.8" y1="9.4" x2="18.8" y2="14.6"/>',
  /* 器械：插片配重机（配重堆 + 顶销 + 底座） */
  'eq-machine': '<rect x="8" y="3.6" width="8" height="13.6" rx="1.6"/><line x1="8" y1="7.6" x2="16" y2="7.6"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="14.2" x2="16" y2="14.2"/><path d="M12 3.6V1.8"/><line x1="12" y1="17.2" x2="12" y2="20.4"/><line x1="5.6" y1="20.4" x2="18.4" y2="20.4"/>',
  /* 绳索：滑轮 + 绳 + 横杆把手 */
  'eq-cable': '<circle cx="12" cy="4.2" r="2.6"/><circle cx="12" cy="4.2" r="0.6" fill="currentColor" stroke="none"/><line x1="12" y1="6.8" x2="12" y2="17.6"/><rect x="7.4" y="17.6" width="9.2" height="3.2" rx="1.4"/>',
  /* 自重：徒手小人 */
  'eq-body': '<circle cx="12" cy="4.4" r="2.4"/><line x1="12" y1="6.8" x2="12" y2="14.6"/><path d="M12 9.4l-4.4 3.2"/><path d="M12 9.4l4.4 3.2"/><path d="M12 14.6l-3 6.4"/><path d="M12 14.6l3 6.4"/>'
};

/* ---------- 部位 ---------- */
const PARTS = ['胸', '背', '肩', '手臂', '腿', '臀', '核心'];

/* ---------- 器械类型 ---------- */
const EQUIPS = ['自由重量', '器械', '绳索', '自重'];

/* 器械类型 -> 筛选行图标 */
const EQUIP_ICONS = {
  '自由重量': 'eq-free',
  '器械': 'eq-machine',
  '绳索': 'eq-cable',
  '自重': 'eq-body'
};

/* ---------- 动作库（156 个） ---------- */
const EXERCISES = [
  /* ===== 胸 24 ===== */
  { id: 'chest-01', name: '杠铃平板卧推', part: '胸', equip: '自由重量', icon: 'bench-press' },
  { id: 'chest-02', name: '杠铃上斜卧推', part: '胸', equip: '自由重量', icon: 'incline-press' },
  { id: 'chest-03', name: '杠铃下斜卧推', part: '胸', equip: '自由重量', icon: 'decline-press' },
  { id: 'chest-04', name: '哑铃平板卧推', part: '胸', equip: '自由重量', icon: 'bench-press' },
  { id: 'chest-05', name: '哑铃上斜卧推', part: '胸', equip: '自由重量', icon: 'incline-press' },
  { id: 'chest-06', name: '哑铃下斜卧推', part: '胸', equip: '自由重量', icon: 'decline-press' },
  { id: 'chest-07', name: '哑铃平板飞鸟', part: '胸', equip: '自由重量', icon: 'fly' },
  { id: 'chest-08', name: '哑铃上斜飞鸟', part: '胸', equip: '自由重量', icon: 'fly' },
  { id: 'chest-09', name: '哑铃仰卧上拉', part: '胸', equip: '自由重量', icon: 'pullover' },
  { id: 'chest-10', name: '史密斯平板卧推', part: '胸', equip: '器械', icon: 'bench-press' },
  { id: 'chest-11', name: '史密斯上斜卧推', part: '胸', equip: '器械', icon: 'incline-press' },
  { id: 'chest-12', name: '器械坐姿推胸', part: '胸', equip: '器械', icon: 'chest-press' },
  { id: 'chest-13', name: '器械上斜推胸', part: '胸', equip: '器械', icon: 'chest-press' },
  { id: 'chest-14', name: '蝴蝶机夹胸', part: '胸', equip: '器械', icon: 'fly-machine' },
  { id: 'chest-15', name: '器械夹胸（蝶式）', part: '胸', equip: '器械', icon: 'fly-machine' },
  { id: 'chest-16', name: '龙门架夹胸（高位）', part: '胸', equip: '绳索', icon: 'crossover' },
  { id: 'chest-17', name: '龙门架夹胸（中位）', part: '胸', equip: '绳索', icon: 'crossover' },
  { id: 'chest-18', name: '龙门架夹胸（低位）', part: '胸', equip: '绳索', icon: 'crossover' },
  { id: 'chest-19', name: '双杠臂屈伸（胸）', part: '胸', equip: '自重', icon: 'dip' },
  { id: 'chest-20', name: '标准俯卧撑', part: '胸', equip: '自重', icon: 'pushup' },
  { id: 'chest-21', name: '上斜俯卧撑', part: '胸', equip: '自重', icon: 'pushup' },
  { id: 'chest-22', name: '下斜俯卧撑', part: '胸', equip: '自重', icon: 'pushup' },
  { id: 'chest-23', name: '跪姿俯卧撑', part: '胸', equip: '自重', icon: 'pushup' },
  { id: 'chest-24', name: '弹力带夹胸', part: '胸', equip: '自重', icon: 'crossover' },

  /* ===== 背 26 ===== */
  { id: 'back-01', name: '高位下拉（宽握）', part: '背', equip: '器械', icon: 'pulldown' },
  { id: 'back-02', name: '高位下拉（窄握对握）', part: '背', equip: '器械', icon: 'pulldown' },
  { id: 'back-03', name: '高位下拉（反握）', part: '背', equip: '器械', icon: 'pulldown' },
  { id: 'back-04', name: '器械助力引体向上', part: '背', equip: '器械', icon: 'pullup' },
  { id: 'back-05', name: '引体向上（正握）', part: '背', equip: '自重', icon: 'pullup' },
  { id: 'back-06', name: '引体向上（反握）', part: '背', equip: '自重', icon: 'pullup' },
  { id: 'back-07', name: '引体向上（对握）', part: '背', equip: '自重', icon: 'pullup' },
  { id: 'back-08', name: '杠铃俯身划船', part: '背', equip: '自由重量', icon: 'row-bent' },
  { id: 'back-09', name: '杠铃反握划船', part: '背', equip: '自由重量', icon: 'row-bent' },
  { id: 'back-10', name: '哑铃单臂划船', part: '背', equip: '自由重量', icon: 'row-bent' },
  { id: 'back-11', name: '哑铃双臂俯身划船', part: '背', equip: '自由重量', icon: 'row-bent' },
  { id: 'back-12', name: 'T 杠划船', part: '背', equip: '自由重量', icon: 'row-bent' },
  { id: 'back-13', name: '史密斯俯身划船', part: '背', equip: '器械', icon: 'row-bent' },
  { id: 'back-14', name: '史密斯反向划船', part: '背', equip: '器械', icon: 'row-bent' },
  { id: 'back-15', name: '坐姿绳索划船', part: '背', equip: '绳索', icon: 'row-seated' },
  { id: 'back-16', name: '单臂绳索划船', part: '背', equip: '绳索', icon: 'row-seated' },
  { id: 'back-17', name: '器械坐姿划船', part: '背', equip: '器械', icon: 'row-seated' },
  { id: 'back-18', name: '器械高位划船', part: '背', equip: '器械', icon: 'row-seated' },
  { id: 'back-19', name: '直臂下压', part: '背', equip: '绳索', icon: 'straight-arm' },
  { id: 'back-20', name: '器械背部伸展', part: '背', equip: '器械', icon: 'back-extension' },
  { id: 'back-21', name: '杠铃硬拉', part: '背', equip: '自由重量', icon: 'deadlift' },
  { id: 'back-22', name: '罗马尼亚硬拉', part: '背', equip: '自由重量', icon: 'deadlift' },
  { id: 'back-23', name: '直腿硬拉', part: '背', equip: '自由重量', icon: 'deadlift' },
  { id: 'back-24', name: '山羊挺身', part: '背', equip: '自重', icon: 'back-extension' },
  { id: 'back-25', name: '绳索面拉', part: '背', equip: '绳索', icon: 'facepull' },
  { id: 'back-26', name: '弹力带划船', part: '背', equip: '自重', icon: 'row-bent' },

  /* ===== 肩 24 ===== */
  { id: 'shld-01', name: '杠铃站姿推举', part: '肩', equip: '自由重量', icon: 'shoulder-press' },
  { id: 'shld-02', name: '杠铃坐姿推举', part: '肩', equip: '自由重量', icon: 'shoulder-press' },
  { id: 'shld-03', name: '杠铃颈后推举', part: '肩', equip: '自由重量', icon: 'shoulder-press' },
  { id: 'shld-04', name: '哑铃坐姿推举', part: '肩', equip: '自由重量', icon: 'shoulder-press' },
  { id: 'shld-05', name: '哑铃站姿推举', part: '肩', equip: '自由重量', icon: 'shoulder-press' },
  { id: 'shld-06', name: '阿诺德推举', part: '肩', equip: '自由重量', icon: 'shoulder-press' },
  { id: 'shld-07', name: '器械肩推', part: '肩', equip: '器械', icon: 'shoulder-press' },
  { id: 'shld-08', name: '史密斯肩推', part: '肩', equip: '器械', icon: 'shoulder-press' },
  { id: 'shld-09', name: '哑铃侧平举', part: '肩', equip: '自由重量', icon: 'lateral-raise' },
  { id: 'shld-10', name: '绳索单臂侧平举', part: '肩', equip: '绳索', icon: 'lateral-raise' },
  { id: 'shld-11', name: '器械侧平举', part: '肩', equip: '器械', icon: 'lateral-raise' },
  { id: 'shld-12', name: '哑铃前平举', part: '肩', equip: '自由重量', icon: 'front-raise' },
  { id: 'shld-13', name: '杠铃前平举', part: '肩', equip: '自由重量', icon: 'front-raise' },
  { id: 'shld-14', name: '绳索前平举', part: '肩', equip: '绳索', icon: 'front-raise' },
  { id: 'shld-15', name: '哑铃俯身飞鸟', part: '肩', equip: '自由重量', icon: 'rear-fly' },
  { id: 'shld-16', name: '器械反向飞鸟', part: '肩', equip: '器械', icon: 'rear-fly' },
  { id: 'shld-17', name: '绳索面拉（肩后束）', part: '肩', equip: '绳索', icon: 'facepull' },
  { id: 'shld-18', name: '哑铃耸肩', part: '肩', equip: '自由重量', icon: 'shrug' },
  { id: 'shld-19', name: '杠铃耸肩', part: '肩', equip: '自由重量', icon: 'shrug' },
  { id: 'shld-20', name: '器械耸肩', part: '肩', equip: '器械', icon: 'shrug' },
  { id: 'shld-21', name: '杠铃直立划船', part: '肩', equip: '自由重量', icon: 'upright-row' },
  { id: 'shld-22', name: '绳索直立划船', part: '肩', equip: '绳索', icon: 'upright-row' },
  { id: 'shld-23', name: '靠墙倒立撑', part: '肩', equip: '自重', icon: 'handstand' },
  { id: 'shld-24', name: '倒立撑', part: '肩', equip: '自重', icon: 'handstand' },

  /* ===== 腿 26 ===== */
  { id: 'leg-01', name: '杠铃深蹲', part: '腿', equip: '自由重量', icon: 'squat' },
  { id: 'leg-02', name: '杠铃前蹲', part: '腿', equip: '自由重量', icon: 'squat' },
  { id: 'leg-03', name: '史密斯深蹲', part: '腿', equip: '器械', icon: 'squat' },
  { id: 'leg-04', name: '哈克深蹲', part: '腿', equip: '器械', icon: 'squat' },
  { id: 'leg-05', name: '器械腿举', part: '腿', equip: '器械', icon: 'leg-press' },
  { id: 'leg-06', name: '45° 倒蹬机', part: '腿', equip: '器械', icon: 'leg-press' },
  { id: 'leg-07', name: '哑铃高脚杯深蹲', part: '腿', equip: '自由重量', icon: 'squat' },
  { id: 'leg-08', name: '相扑深蹲', part: '腿', equip: '自由重量', icon: 'squat' },
  { id: 'leg-09', name: '徒手深蹲', part: '腿', equip: '自重', icon: 'squat' },
  { id: 'leg-10', name: '哑铃箭步蹲', part: '腿', equip: '自由重量', icon: 'lunge' },
  { id: 'leg-11', name: '哑铃行走箭步蹲', part: '腿', equip: '自由重量', icon: 'lunge' },
  { id: 'leg-12', name: '哑铃保加利亚分腿蹲', part: '腿', equip: '自由重量', icon: 'split-squat' },
  { id: 'leg-13', name: '史密斯分腿蹲', part: '腿', equip: '器械', icon: 'split-squat' },
  { id: 'leg-14', name: '器械腿屈伸', part: '腿', equip: '器械', icon: 'leg-ext' },
  { id: 'leg-15', name: '器械俯卧腿弯举', part: '腿', equip: '器械', icon: 'leg-curl' },
  { id: 'leg-16', name: '坐姿腿弯举', part: '腿', equip: '器械', icon: 'leg-curl' },
  { id: 'leg-17', name: '器械髋内收', part: '腿', equip: '器械', icon: 'hip-adduct' },
  { id: 'leg-18', name: '器械髋外展', part: '腿', equip: '器械', icon: 'hip-abduct' },
  { id: 'leg-19', name: '站姿提踵', part: '腿', equip: '器械', icon: 'calf-raise' },
  { id: 'leg-20', name: '坐姿提踵', part: '腿', equip: '器械', icon: 'calf-raise' },
  { id: 'leg-21', name: '腿举提踵', part: '腿', equip: '器械', icon: 'calf-raise' },
  { id: 'leg-22', name: '哑铃提踵', part: '腿', equip: '自由重量', icon: 'calf-raise' },
  { id: 'leg-23', name: '深蹲跳', part: '腿', equip: '自重', icon: 'squat-jump' },
  { id: 'leg-24', name: '跳箱', part: '腿', equip: '自重', icon: 'squat-jump' },
  { id: 'leg-25', name: '靠墙静蹲', part: '腿', equip: '自重', icon: 'wall-sit' },
  { id: 'leg-26', name: '器械大腿内外侧', part: '腿', equip: '器械', icon: 'hip-abduct' },

  /* ===== 臀 14 ===== */
  { id: 'glute-01', name: '杠铃臀推', part: '臀', equip: '自由重量', icon: 'hip-thrust' },
  { id: 'glute-02', name: '史密斯臀推', part: '臀', equip: '器械', icon: 'hip-thrust' },
  { id: 'glute-03', name: '器械臀推', part: '臀', equip: '器械', icon: 'hip-thrust' },
  { id: 'glute-04', name: '哑铃臀桥', part: '臀', equip: '自由重量', icon: 'glute-bridge' },
  { id: 'glute-05', name: '单腿臀桥', part: '臀', equip: '自重', icon: 'glute-bridge' },
  { id: 'glute-06', name: '蛙式臀桥', part: '臀', equip: '自重', icon: 'glute-bridge' },
  { id: 'glute-07', name: '器械髋外展（臀）', part: '臀', equip: '器械', icon: 'hip-abduct' },
  { id: 'glute-08', name: '绳索后踢腿', part: '臀', equip: '绳索', icon: 'kickback' },
  { id: 'glute-09', name: '器械后踢腿', part: '臀', equip: '器械', icon: 'kickback' },
  { id: 'glute-10', name: '跪姿后摆腿', part: '臀', equip: '自重', icon: 'kickback' },
  { id: 'glute-11', name: '弹力带侧向行走', part: '臀', equip: '自重', icon: 'side-walk' },
  { id: 'glute-12', name: '杠铃相扑硬拉', part: '臀', equip: '自由重量', icon: 'deadlift' },
  { id: 'glute-13', name: '直腿硬拉（臀）', part: '臀', equip: '自由重量', icon: 'deadlift' },
  { id: 'glute-14', name: '保加利亚分腿蹲（臀）', part: '臀', equip: '自由重量', icon: 'split-squat' },

  /* ===== 手臂 26 ===== */
  { id: 'arm-01', name: '杠铃弯举', part: '手臂', equip: '自由重量', icon: 'curl' },
  { id: 'arm-02', name: 'EZ 杠弯举', part: '手臂', equip: '自由重量', icon: 'curl' },
  { id: 'arm-03', name: '哑铃交替弯举', part: '手臂', equip: '自由重量', icon: 'curl' },
  { id: 'arm-04', name: '哑铃锤式弯举', part: '手臂', equip: '自由重量', icon: 'hammer-curl' },
  { id: 'arm-05', name: '哑铃集中弯举', part: '手臂', equip: '自由重量', icon: 'curl' },
  { id: 'arm-06', name: '上斜哑铃弯举', part: '手臂', equip: '自由重量', icon: 'curl' },
  { id: 'arm-07', name: '反握杠铃弯举', part: '手臂', equip: '自由重量', icon: 'curl' },
  { id: 'arm-08', name: '牧师凳弯举', part: '手臂', equip: '器械', icon: 'preacher-curl' },
  { id: 'arm-09', name: '器械二头弯举', part: '手臂', equip: '器械', icon: 'preacher-curl' },
  { id: 'arm-10', name: '绳索弯举', part: '手臂', equip: '绳索', icon: 'curl' },
  { id: 'arm-11', name: '绳索反向弯举', part: '手臂', equip: '绳索', icon: 'curl' },
  { id: 'arm-12', name: '绳索下压', part: '手臂', equip: '绳索', icon: 'tricep-pushdown' },
  { id: 'arm-13', name: '直杆下压', part: '手臂', equip: '绳索', icon: 'tricep-pushdown' },
  { id: 'arm-14', name: '绳索过顶臂屈伸', part: '手臂', equip: '绳索', icon: 'overhead-ext' },
  { id: 'arm-15', name: '哑铃颈后臂屈伸', part: '手臂', equip: '自由重量', icon: 'overhead-ext' },
  { id: 'arm-16', name: '仰卧臂屈伸（碎颅式）', part: '手臂', equip: '自由重量', icon: 'skullcrusher' },
  { id: 'arm-17', name: '窄距卧推', part: '手臂', equip: '自由重量', icon: 'bench-press' },
  { id: 'arm-18', name: '双杠臂屈伸（三头）', part: '手臂', equip: '自重', icon: 'dip' },
  { id: 'arm-19', name: '器械臂屈伸', part: '手臂', equip: '器械', icon: 'tricep-pushdown' },
  { id: 'arm-20', name: '俯身哑铃臂屈伸', part: '手臂', equip: '自由重量', icon: 'overhead-ext' },
  { id: 'arm-21', name: '凳上臂屈伸', part: '手臂', equip: '自重', icon: 'dip' },
  { id: 'arm-22', name: '钻石俯卧撑', part: '手臂', equip: '自重', icon: 'pushup' },
  { id: 'arm-23', name: '杠铃腕弯举', part: '手臂', equip: '自由重量', icon: 'wrist-curl' },
  { id: 'arm-24', name: '反握腕弯举', part: '手臂', equip: '自由重量', icon: 'wrist-curl' },
  { id: 'arm-25', name: '农夫行走', part: '手臂', equip: '自由重量', icon: 'farmers-walk' },
  { id: 'arm-26', name: '弹力带下压', part: '手臂', equip: '自重', icon: 'tricep-pushdown' },

  /* ===== 核心 16 ===== */
  { id: 'core-01', name: '卷腹', part: '核心', equip: '自重', icon: 'crunch' },
  { id: 'core-02', name: '器械卷腹', part: '核心', equip: '器械', icon: 'crunch' },
  { id: 'core-03', name: '绳索卷腹', part: '核心', equip: '绳索', icon: 'crunch' },
  { id: 'core-04', name: '悬垂举腿', part: '核心', equip: '自重', icon: 'leg-raise' },
  { id: 'core-05', name: '仰卧举腿', part: '核心', equip: '自重', icon: 'leg-raise' },
  { id: 'core-06', name: '反向卷腹', part: '核心', equip: '自重', icon: 'leg-raise' },
  { id: 'core-07', name: '平板支撑', part: '核心', equip: '自重', icon: 'plank' },
  { id: 'core-08', name: '侧平板支撑', part: '核心', equip: '自重', icon: 'plank' },
  { id: 'core-09', name: '俄罗斯转体', part: '核心', equip: '自重', icon: 'russian-twist' },
  { id: 'core-10', name: '器械转体', part: '核心', equip: '器械', icon: 'russian-twist' },
  { id: 'core-11', name: '绳索伐木', part: '核心', equip: '绳索', icon: 'woodchop' },
  { id: 'core-12', name: '健腹轮', part: '核心', equip: '自重', icon: 'ab-wheel' },
  { id: 'core-13', name: '登山跑', part: '核心', equip: '自重', icon: 'mountain-climber' },
  { id: 'core-14', name: '死虫式', part: '核心', equip: '自重', icon: 'deadbug' },
  { id: 'core-15', name: '鸟狗式', part: '核心', equip: '自重', icon: 'birddog' },
  { id: 'core-16', name: '仰卧交替触踝', part: '核心', equip: '自重', icon: 'crunch' }
];

/* ---------- 每个训练日的默认动作模板 ---------- */
const DEFAULT_PLANS = {
  1: { part: '胸', exIds: ['chest-01', 'chest-05', 'chest-07', 'chest-14'] },
  2: { part: '背', exIds: ['back-01', 'back-08', 'back-15', 'back-04'] },
  5: { part: '手臂', exIds: ['arm-01', 'arm-12', 'arm-04', 'arm-14'] },
  6: { part: '肩', exIds: ['shld-04', 'shld-09', 'shld-15', 'shld-18'] }
};
