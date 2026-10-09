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
   健身记录 App — 主逻辑
   核心机制：一次记录，双份写入
     ① 写进 logs（历史留档）
     ② 写进 last（动作自己的「上次参数」缓存）
   所以下次打开时，「上次练了多少」是零成本读取，不用翻历史。
   =========================================================== */

'use strict';

/* ================= 常量 ================= */
const STORE_KEY = 'fitlog_v1';
const WD_CN = ['日', '一', '二', '三', '四', '五', '六'];
const WD_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
/* 列表里按周一到周日排（跟主页那条周历一样）。
   注意：数组里存的是真实的 getDay() 序号，只用来定显示顺序。 */
const DOW_MON_FIRST = [1, 2, 3, 4, 5, 6, 0];
/* 哪天是训练日，一律问 getDayPart()（周模板 + 这天的临时改动），
   不要再用「星期几属于默认那四天」这种判断 —— 把某个周一改成休息日后会露馅。 */
const STEP_OPTS  = [0.5, 1];       // 重量微调步进可选项（kg）
const STEP_DEF   = 1;              // 默认步进

/* 面板里的小图标（内联 SVG 片段）。
   统一 1.9 的线宽，跟主页动作卡片左边的图标方块一个粗细。
   只在这里维护一处，改图标不用动别的地方。 */
const SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">';
const SET_ICONS = {
  /* 训练日：哑铃 */
  train: SVG_OPEN + '<line x1="7.8" y1="12" x2="16.2" y2="12"/>' +
    '<rect x="2.4" y="8.2" width="3.2" height="7.6" rx="1.3"/>' +
    '<rect x="18.4" y="8.2" width="3.2" height="7.6" rx="1.3"/>' +
    '<line x1="5.6" y1="9.7" x2="5.6" y2="14.3"/><line x1="18.4" y1="9.7" x2="18.4" y2="14.3"/></svg>',
  /* 休息日：月亮 */
  rest: SVG_OPEN + '<path d="M20.6 14.4A8.5 8.5 0 0 1 9.6 3.4a8.8 8.8 0 1 0 11 11z"/></svg>',
  /* 步进：刻度尺 */
  step: SVG_OPEN + '<rect x="2.8" y="8.4" width="18.4" height="7.2" rx="2"/>' +
    '<line x1="7.4" y1="8.4" x2="7.4" y2="12.2"/><line x1="11.4" y1="8.4" x2="11.4" y2="13.5"/>' +
    '<line x1="15.4" y1="8.4" x2="15.4" y2="12.2"/></svg>',
  /* 动作库：叠层 */
  db: SVG_OPEN + '<path d="M12 3.4l8.3 4.1-8.3 4.1-8.3-4.1z"/>' +
    '<path d="M3.7 12l8.3 4.1 8.3-4.1"/><path d="M3.7 16.4l8.3 4.1 8.3-4.1"/></svg>',
  /* 自建动作：加号方块 */
  custom: SVG_OPEN + '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"/>' +
    '<path d="M12 8.6v6.8M8.6 12h6.8"/></svg>',
  /* 已记录训练：带对勾的日历 */
  history: SVG_OPEN + '<rect x="3.4" y="5.2" width="17.2" height="15.4" rx="3.4"/>' +
    '<path d="M8 3.2v3.6M16 3.2v3.6M3.4 10.2h17.2"/><path d="M9 14.8l2.1 2.1 4-4"/></svg>',
  /* 导出：箭头向上出托盘 */
  exp: SVG_OPEN + '<path d="M4.6 14.8v3.4a2.3 2.3 0 0 0 2.3 2.3h10.2a2.3 2.3 0 0 0 2.3-2.3v-3.4"/>' +
    '<path d="M12 3.2v10.4"/><path d="M7.9 7.3L12 3.2l4.1 4.1"/></svg>',
  /* 导入：箭头向下进托盘 */
  imp: SVG_OPEN + '<path d="M4.6 14.8v3.4a2.3 2.3 0 0 0 2.3 2.3h10.2a2.3 2.3 0 0 0 2.3-2.3v-3.4"/>' +
    '<path d="M12 3.4v10.4"/><path d="M7.9 9.6L12 13.7l4.1-4.1"/></svg>',
  /* 危险操作：垃圾桶 */
  trash: SVG_OPEN + '<path d="M4.4 6.8h15.2"/>' +
    '<path d="M9.4 6.8V4.7a1.5 1.5 0 0 1 1.5-1.5h2.2a1.5 1.5 0 0 1 1.5 1.5v2.1"/>' +
    '<path d="M6.6 6.8l.9 12.2a1.8 1.8 0 0 0 1.8 1.7h5.4a1.8 1.8 0 0 0 1.8-1.7l.9-12.2"/>' +
    '<path d="M10.3 10.5v6.1M13.7 10.5v6.1"/></svg>'
};

/* ================= 数据层 ================= */
let DB = null;

function defaultDB() {
  const plan = {};
  for (const k in DEFAULT_PLANS) {
    plan[k] = { part: DEFAULT_PLANS[k].part, exIds: DEFAULT_PLANS[k].exIds.slice() };
  }
  return {
    version: 1,
    // 改动范围：按「日期」单独记 —— 每个日期自己决定「只改今天」还是「每个周X」。
    //   scope: { 'YYYY-MM-DD': 'day' }，缺省（没这个 key）= 每个周X。
    settings: { step: STEP_DEF },
    scope: {},     // 每个日期各自的改动范围：值只有 'day'，week 不落 key（省得膨胀）
    plan,          // 每周模板：{ 1:{part,exIds}, ... }  键是星期（1=周一）
    custom: [],    // 用户自建动作
    last: {},      // ★ 上次参数缓存 { exId:{weight,sets,reps,date} }
    logs: {},      // 训练日志 { 'YYYY-MM-DD': { part, items:[...] } }
    draft: {},     // 未保存的输入草稿
    dayPart: {},   // 某天临时改的部位
    dayRemove: {}, // 某天临时删掉的动作
    dayExtra: {},  // 某天临时加的动作
    dayOrder: {}   // 某天自己拖出来的动作顺序（只影响这一天，不动周模板）
  };
}

function loadDB() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { }
  if (raw) {
    try { DB = JSON.parse(raw); } catch (e) { DB = null; }
  }
  if (!DB || typeof DB !== 'object' || Array.isArray(DB)) DB = defaultDB();
  const d = defaultDB();
  for (const k in d) if (DB[k] === undefined || DB[k] === null) DB[k] = d[k];
  if (!DB.settings || typeof DB.settings !== 'object' || Array.isArray(DB.settings)) DB.settings = {};
  if (typeof DB.settings.step !== 'number') DB.settings.step = STEP_DEF;
  // 迁移：老版本存的 2.5 / 5 已不在可选项里，重置成默认值，
  // 否则设置页会出现「一个都没选中」的空状态。
  if (STEP_OPTS.indexOf(DB.settings.step) < 0) DB.settings.step = STEP_DEF;
  // 迁移：老版本把改动范围存成全局的 settings.planScope，现在改成按日期记（scope）。
  // 那是个临时 UI 开关，老值没法对应到具体日期，直接丢弃，让用户重新点一下即可。
  if (DB.scope === undefined || DB.scope === null ||
      typeof DB.scope !== 'object' || Array.isArray(DB.scope)) DB.scope = {};
  if (DB.settings && typeof DB.settings === 'object') delete DB.settings.planScope;
  return DB;
}

let saveTimer = null;
function saveDB(now) {
  if (now) {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }
    catch (e) { toast('存储空间不足，保存失败', 'err'); }
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }
    catch (e) { toast('存储空间不足，保存失败', 'err'); }
  }, 320);
}

/* ================= 日期工具 ================= */
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}
function parseYmd(s) {
  const p = String(s).split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}
function todayYmd() { return ymd(new Date()); }
function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const w = (x.getDay() + 6) % 7;          // 周一 = 0
  x.setDate(x.getDate() - w);
  return x;
}
function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}
function diffDays(a, b) {
  return Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
}
function fmtMD(d) { return (d.getMonth() + 1) + '月' + d.getDate() + '日'; }

/* ================= 动作查询 ================= */
function allExercises() { return EXERCISES.concat(DB.custom); }
function exById(id) {
  const arr = allExercises();
  for (let i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
  return null;
}
function iconSvg(key) {
  const p = ICONS[key] || ICONS['squat'];
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
}
/* 动作左边的小图：统一按「器械类别」出四种之一
   （自由重量 / 器械 / 绳索 / 自重），不再给每个动作单独画。 */
function exIconSvg(ex) {
  return iconSvg(EQUIP_ICONS[ex.equip] || 'eq-body');
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ================= 视图状态 ================= */
const VS = {
  anchor: new Date(),      // 当前显示的那一周（任意一天）
  selDate: todayYmd(),     // 选中日期
  sheet: null,             // 当前打开的面板
  pickPart: '全部',        // 动作库筛选部位
  pickEquip: '全部',       // 动作库筛选器械
  pickQ: '',               // 搜索词
  calMonth: null           // 月历弹窗正在看哪个月（Date，指向 1 号）
};

/* ================= 业务逻辑 ================= */

/** 取某天的训练部位（null = 休息日） */
function getDayPart(dateStr) {
  if (DB.dayPart[dateStr] !== undefined) return DB.dayPart[dateStr];
  const dow = parseYmd(dateStr).getDay();
  const p = DB.plan[dow];
  return p ? p.part : null;
}

/** 取某天要显示的动作 id 列表 */
function getDayExIds(dateStr) {
  const log = DB.logs[dateStr];
  if (log && Array.isArray(log.items)) return log.items.map(i => i.exId);
  const dow = parseYmd(dateStr).getDay();
  const p = DB.plan[dow];
  let ids = p ? p.exIds.slice() : [];
  const rm = DB.dayRemove[dateStr] || [];
  ids = ids.filter(id => rm.indexOf(id) < 0);
  const extra = DB.dayExtra[dateStr] || [];
  extra.forEach(id => { if (ids.indexOf(id) < 0) ids.push(id); });
  return applyDayOrder(dateStr, ids);
}

/** 按当天存下来的顺序重排。
 *  名单里没出现过的动作（后来新加的）排到最后，彼此保持原来的先后。
 *  用稳定排序，所以「没排过顺序」时结果和输入完全一致。 */
function applyDayOrder(dateStr, ids) {
  const ord = DB.dayOrder && DB.dayOrder[dateStr];
  if (!ord || !ord.length) return ids;
  const rank = {};
  ord.forEach((id, i) => { if (rank[id] === undefined) rank[id] = i; });
  const tail = ord.length + ids.length + 1;
  return ids
    .map((id, i) => ({ id, k: rank[id] === undefined ? tail + i : rank[id] }))
    .sort((a, b) => a.k - b.k)
    .map(o => o.id);
}

/* ---- 「上次参数」只朝过去看 ----
   以前这里读的是 DB.last —— 那是全局「最近一次」缓存，跟你在看哪一天无关。
   结果是：这周刚填完，翻到上周，上周的卡片也把这周的数码出来显示，
   看着就像「过去的周也有记录了」。而且它的 date 永远是最新的，
   连「3 天前」都标不出来。

   现在改成：只沿用它**之前**真正记过的值。
   - 这天之前没有任何记录 → 没东西可继承，界面留白，也不给「沿用」按钮；
   - 有更早的记录 → 正常显示「上次 …」，可一键沿用。
   于是「从哪一周开始记的」这条线自己就长出来了，不用额外存一个开始日期。 */
let _lastMapKey = null, _lastMap = null;
/** 预计算「dateStr 之前每个动作最近一次的值」。整天共用一份，卡片多也不重复扫。
 *  YYYY-MM-DD 字符串直接比大小就是比时间先后，不用转 Date。 */
function lastMapBefore(dateStr) {
  if (_lastMapKey === dateStr) return _lastMap;
  const map = {};
  for (const ds in DB.logs) {
    if (ds >= dateStr) continue;                 // 只要严格在它之前的
    const log = DB.logs[ds];
    if (!log || !Array.isArray(log.items)) continue;
    log.items.forEach(it => {
      if (it.weight === null && it.sets === null && !(it.reps && it.reps.length)) return;
      const cur = map[it.exId];
      if (!cur || ds > cur.date) {               // 取最近的一次
        map[it.exId] = { weight: it.weight, sets: it.sets, reps: it.reps, date: ds };
      }
    });
  }
  _lastMapKey = dateStr;
  _lastMap = map;
  return map;
}
/** 日志一变就得作废，否则会拿到改之前算出来的旧值 */
function invalidateLastMap() { _lastMapKey = null; _lastMap = null; }

function lastBefore(dateStr, exId) { return lastMapBefore(dateStr)[exId] || null; }

/** 这天之前有没有任何训练记录 —— 用来区分「还没开始记」和「这个动作没练过」 */
function hasLogBefore(dateStr) {
  for (const ds in DB.logs) {
    if (ds >= dateStr) continue;
    const log = DB.logs[ds];
    if (log && Array.isArray(log.items) && log.items.length) return true;
  }
  return false;
}

/** 某天某动作当前应显示的值：优先草稿 → 当天日志 → 空
 *
 *  ⚠️ 这里**不吃「上次」**（v2.11，用户明确要求「这周的数据保存以后下周的不要直接填充上，
 *  要空白，只能手动填写或者点击沿用」）。
 *  以前最后一段是 lastBefore —— 于是下周一打开，四个动作全是上周的数码，
 *  看着像「已经记过了」，其实一个数都没确认过，很容易直接点保存存下错值。
 *  「上次」现在只出现在卡片上那条信息条里，**要带过来必须点「沿用」**。 */
function getCurrentValues(dateStr, exId) {
  const dr = DB.draft[dateStr] && DB.draft[dateStr][exId];
  if (dr) return { w: dr.w || '', s: dr.s || '', r: dr.r || '', n: dr.n || '', src: 'draft' };

  const log = DB.logs[dateStr];
  if (log && Array.isArray(log.items)) {
    const it = log.items.find(i => i.exId === exId);
    /* 只有真正填过值的才算当天记录，空着的不算（否则会显示成「已记录」但没数）。
       备注也算「填过」—— 只写了备注没填参数的那天，回头打开得能看见当初写的话。 */
    if (it && (it.weight !== null || it.sets !== null ||
               (it.reps && it.reps.length) || (it.note && it.note !== ''))) {
      return { w: num2str(it.weight), s: num2str(it.sets), r: reps2str(it.reps),
               n: it.note || '', src: 'log' };
    }
  }
  return { w: '', s: '', r: '', n: '', src: 'none' };
}

function num2str(n) {
  if (n === null || n === undefined || n === '') return '';
  const x = Number(n);
  if (isNaN(x)) return '';
  return String(x);
}
function reps2str(reps) {
  if (!Array.isArray(reps) || !reps.length) return '';
  return reps.join('/');
}
function parseReps(txt, sets) {
  const parts = String(txt || '').split(/[\/\s,，、xX*]+/).filter(s => s !== '');
  let arr = parts.map(s => Number(s)).filter(n => !isNaN(n) && n >= 0);
  if (!arr.length) return [];
  const sc = Number(sets);
  if (arr.length === 1 && sc > 1) {
    const v = arr[0];
    arr = [];
    for (let i = 0; i < sc; i++) arr.push(v);
  }
  return arr;
}

/** 写入草稿 */
function setDraft(dateStr, exId, field, val) {
  if (!DB.draft[dateStr]) DB.draft[dateStr] = {};
  if (!DB.draft[dateStr][exId]) DB.draft[dateStr][exId] = { w: '', s: '', r: '', n: '' };
  DB.draft[dateStr][exId][field] = val;
  saveDB();
}

/* ---- 备注框（textarea）自动增高 ----
   备注默认就一行高，写多了要自己长高，不然第二行看不见（textarea 自己滚动很别扭）。
   量之前先把 height 归 auto，否则 scrollHeight 会被上一次设进去的高度顶住、只增不减。
   +3 补边框：CSS 是 border-box，scrollHeight 不含边框（1.5px × 2）。 */
function autoGrowNote(el) {
  if (!el || el.tagName !== 'TEXTAREA') return;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight + 3) + 'px';
}
/** 重绘后把所有备注框的高度按内容重新算一遍（回显多行备注时要靠这个）。 */
function autoGrowNotes() {
  document.querySelectorAll('#contentInner .note-inp').forEach(autoGrowNote);
}

/* ================= 渲染：周历 ================= */
function renderWeek() {
  const mon = mondayOf(VS.anchor);
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDays(mon, i));

  const last = addDays(mon, 6);
  const isCurWeek = ymd(mon) === ymd(mondayOf(new Date()));

  const rangeEl = document.getElementById('weekRange');
  rangeEl.innerHTML = fmtMD(mon) + ' – ' + fmtMD(last) +
    '<small>' + mon.getFullYear() + ' 年' + (isCurWeek ? ' · 本周' : ' · 点这里回到今天') + '</small>';
  rangeEl.classList.toggle('clickable', !isCurWeek);

  const today = todayYmd();
  let h = '';
  days.forEach(d => {
    const ds = ymd(d);
    const dow = d.getDay();
    // 哪天算训练日 = 这天真的有安排（周模板，或这天的临时改动）。
    // 以前是「星期几属于默认四天」—— 于是把某个周一改成休息日后，
    // 周历上那个点还亮着，跟当天内容对不上。月历那边一直用的是 getDayPart。
    const isTrain = !!getDayPart(ds);
    const cls = ['wd'];
    if (isTrain) cls.push('train');
    if (ds === VS.selDate) cls.push('active');
    h += '<div class="' + cls.join(' ') + '" data-date="' + ds + '">' +
      '<span class="d">' + WD_FULL[dow].slice(1) + '</span>' +
      '<span class="n">' + d.getDate() + '</span>' +
      '<span class="dot"></span>' +
      '</div>';
  });
  document.getElementById('weekStrip').innerHTML = h;
}

/* ---- 顶部栏是浮动毛玻璃（position:absolute），量出它的真实高度写进
   --topbar-h，主内容区靠这个值留上边距。高度跟状态栏安全区、字号都有关，
   量比写死稳；值没变就不写，免得键盘弹起 resize 时白抖一次样式。 ---- */
function syncTopbarPad() {
  const tb = document.querySelector('.topbar');
  if (!tb) return;
  const h = tb.offsetHeight + 'px';
  if (document.documentElement.style.getPropertyValue('--topbar-h') === h) return;
  document.documentElement.style.setProperty('--topbar-h', h);
}

/* ================= 渲染：当天内容 ================= */
function renderDay() {
  // 每次重绘都作废「上次参数」查询缓存：所有改日志的入口（保存 / 增删动作 /
  // 换部位 / 导入 / 清空）最后都会走到这里，放这一处就不会漏。
  invalidateLastMap();
  const dateStr = VS.selDate;
  const d = parseYmd(dateStr);
  const dow = d.getDay();
  const part = getDayPart(dateStr);
  const exIds = part ? getDayExIds(dateStr) : [];
  const isToday = dateStr === todayYmd();
  const log = DB.logs[dateStr];

  // 标题
  const dayDiff = diffDays(dateStr, todayYmd());
  const sub = WD_FULL[dow] + ' · ' + (d.getMonth() + 1) + '/' + d.getDate() +
    (isToday ? ' · 今天' : (dayDiff > 0 ? ' · ' + dayDiff + ' 天前' : ' · ' + (-dayDiff) + ' 天后'));

  document.getElementById('dayTitle').innerHTML = part
    ? WD_FULL[dow].slice(1) + ' · <em>' + esc(part) + '</em>'
    : WD_FULL[dow] + ' · 休息日';
  // 右上角：动作数量（非今天时补一句相对时间，方便回忆）
  const relTxt = isToday ? '' : (dayDiff > 0 ? dayDiff + ' 天前' : (-dayDiff) + ' 天后');
  document.getElementById('daySub').textContent =
    part ? (exIds.length + ' 个动作' + (relTxt ? ' · ' + relTxt : '')) : '';
  document.getElementById('btnChangePart').style.display = part ? 'flex' : 'none';
  renderScope(dateStr, part, exIds);

  // 内容
  const box = document.getElementById('contentInner');
  if (!part) {
    box.innerHTML = renderRestCard();
    updateSaveBar();
    return;
  }
  if (!exIds.length) {
    box.innerHTML = renderEmptyDay();
    updateSaveBar();
    return;
  }

  let h = '';
  exIds.forEach(exId => {
    const ex = exById(exId);
    if (!ex) return;
    h += renderCard(dateStr, ex);
  });
  h += '<div class="add-card" data-act="open-lib">+ 添加动作</div>';
  box.innerHTML = h;
  autoGrowNotes();          // 备注框按内容定高（多行备注回显时靠这一步）
  // 只有一个动作时没什么可换的，手柄先收起来，免得点了没反应像坏了
  box.classList.toggle('single', exIds.length < 2);
  updateSaveBar();
}

/* ---- 改动范围：标题右边的一颗小开关 ----
   灭（默认）= 这次改动固化进周模板 DB.plan[星期]，以后每个同一天都用这套；
   亮（主题色）= 只改这一天，模板一个字都不动。
   按钮是静态节点，只改文案 / 选中态，不重建 —— 重建会丢监听器。 */
/** 这个日期是不是「只改今天」。按日期记，切走再切回也不会丢。 */
function isScopeDay(ds) { return !!(DB.scope && DB.scope[ds] === 'day'); }

/** 设置某天是「只改今天」还是回到「每个周X」。week 不落 key，保持 DB 干净。 */
function setScopeDay(ds, val) {
  if (!DB.scope) DB.scope = {};
  if (val === 'day') DB.scope[ds] = 'day';
  else delete DB.scope[ds];
}

function renderScope(dateStr, part, exIds) {
  const btn = document.getElementById('btnScope');
  if (!btn) return;
  // 休息日 / 当天没动作时不显示，省地方
  if (!part || !exIds.length) { btn.style.display = 'none'; return; }
  const d = parseYmd(dateStr);
  const onlyDay = isScopeDay(dateStr);
  btn.style.display = 'inline-flex';
  btn.classList.toggle('on', onlyDay);
  btn.setAttribute('aria-pressed', onlyDay ? 'true' : 'false');
  btn.querySelector('.sb-txt').textContent = onlyDay ? '只改今天' : '每个' + WD_FULL[d.getDay()];
  btn.title = onlyDay
    ? ('只改 ' + (d.getMonth() + 1) + '/' + d.getDate() + ' 这一天，模板不动')
    : ('改动存进模板，以后每' + WD_FULL[d.getDay()] + '都这样');
}

function renderEmptyDay() {
  return '<div class="rest-card">' +
    '<div class="big">这天还没有动作</div>' +
    '<div class="sub">从动作库里挑几个加进来，练一次以后就记住参数了。</div>' +
    '<div class="ghost" data-act="open-lib">+ 添加动作</div>' +
    '</div>';
}

function renderRestCard() {
  return '<div class="rest-card">' +
    '<div class="big">今天休息</div>' +
    '<div class="sub">恢复也是训练的一部分。想加练的话，也可以直接开始。</div>' +
    '<div class="ghost" data-act="start-today">开始今天的训练</div>' +
    '</div>';
}

function renderCard(dateStr, ex) {
  const cur = getCurrentValues(dateStr, ex.id);
  const last = lastBefore(dateStr, ex.id);
  const isLogged = cur.src === 'log';

  // 「上次」信息条 —— 只认这天之前真正记过的值
  let lastHtml;
  if (last) {
    const ago = last.date ? diffDays(last.date, todayYmd()) : null;
    const agoTxt = ago === null ? '' : (ago === 0 ? '今天' : ago === 1 ? '昨天' : ago + ' 天前');
    lastHtml =
      '<div class="last-row">' +
      '<span class="last-txt">上次 <b>' + num2str(last.weight) + 'kg</b> × ' +
      (last.sets || '?') + '组 × ' + esc(reps2str(last.reps) || '?') +
      (agoTxt ? ' <span style="opacity:.6">(' + agoTxt + ')</span>' : '') +
      '</span>' +
      '<button class="use-btn' + ((cur.w || cur.s || cur.r) ? ' used' : '') +
      '" data-act="use-last" data-ex="' + ex.id + '">沿用</button>' +
      '</div>';
  } else {
    lastHtml = '<div class="last-row none"><span class="last-txt">' +
      (hasLogBefore(dateStr)
        ? '这个动作之前没练过，填一次以后就记住了'
        : '这天之前还没有记录，没有可以沿用的数据') +
      '</span></div>';
  }

  const exName = esc(ex.name);
  const exSub = esc(ex.part) + ' · ' + esc(ex.equip) + (isLogged ? ' · 已记录' : '');

  return '<div class="ex-card" data-ex="' + ex.id + '">' +
    '<div class="ex-head">' +
    '<div class="ex-ico">' + exIconSvg(ex) + '</div>' +
    '<div class="ex-meta">' +
    '<div class="ex-name">' + exName + '</div>' +
    '<div class="ex-sub">' + exSub + '</div>' +
    '</div>' +
    '<div class="ex-tools">' +
    '<button class="ex-drag" data-act="drag-handle" aria-label="长按拖动调整顺序">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 7h8M8 12h8M8 17h8"/></svg>' +
    '</button>' +
    '<button class="ex-del" data-act="del-ex" data-ex="' + ex.id + '" aria-label="移除">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
    '</button>' +
    '</div>' +
    '</div>' +
    lastHtml +
    '<div class="inputs">' +
    fieldHtml('w', '重量 kg', cur.w, true, ex.id) +
    fieldHtml('s', '组数', cur.s, false, ex.id) +
    fieldHtml('r', '每组次数', cur.r, false, ex.id) +
    '</div>' +
    noteHtml(ex.id, cur.n) +
    '</div>';
}

/* 动作卡片最下面的备注框 —— 自由文本，想写什么写什么。
   三栏参数表达不了的东西（力竭 / 递减组 / 今天状态）都往这儿写。
   用 textarea 而不是 input：写长了要能换行看见（高度靠 autoGrowNote 跟着内容走）。 */
function noteHtml(exId, val) {
  return '<div class="note-row">' +
    '<textarea class="note-inp" rows="1" data-ex="' + exId + '" data-f="n" ' +
    'placeholder="备注：力竭递减组 7.5 5 2.5">' + esc(val) + '</textarea>' +
    '</div>';
}

function fieldHtml(field, label, val, withStep, exId) {
  const ph = field === 'r' ? '10/10/8/8' : (field === 's' ? '4' : '0');
  const mode = field === 's' ? 'numeric' : (field === 'r' ? 'text' : 'decimal');
  const wide = field === 'r' ? ' wide' : '';
  const stepBtn = '<button class="step" data-act="%A%" data-ex="' + exId + '">%L%</button>';
  return '<div class="fld' + wide + '">' +
    '<span class="lb">' + label + '</span>' +
    '<div class="row">' +
    (withStep ? stepBtn.replace('%A%', 'minus').replace('%L%', '−') : '') +
    '<input type="text" inputmode="' + mode + '" placeholder="' + ph + '" value="' + esc(val) + '" ' +
    'data-ex="' + exId + '" data-f="' + field + '">' +
    (withStep ? stepBtn.replace('%A%', 'plus').replace('%L%', '+') : '') +
    '</div></div>';
}

function updateSaveBar() {
  const dateStr = VS.selDate;
  const part = getDayPart(dateStr);
  const bar = document.getElementById('saveBar');
  if (!part) { bar.style.display = 'none'; return; }
  bar.style.display = 'grid';
  const btn = document.getElementById('btnSave');
  const logged = !!DB.logs[dateStr];
  btn.textContent = logged ? '更新记录' : '保存今天的记录';
  btn.classList.remove('done');
}

/* ================= 保存 ================= */
function saveDay() {
  const dateStr = VS.selDate;
  const part = getDayPart(dateStr);
  if (!part) { toast('休息日不用记录', ''); return; }

  const ids = getDayExIds(dateStr);
  const items = [];
  let filled = 0;

  ids.forEach(exId => {
    const ex = exById(exId);
    if (!ex) return;
    const dr = (DB.draft[dateStr] && DB.draft[dateStr][exId]) || {};
    const cur = getCurrentValues(dateStr, exId);
    const wRaw = dr.w !== undefined ? dr.w : cur.w;
    const sRaw = dr.s !== undefined ? dr.s : cur.s;
    const rRaw = dr.r !== undefined ? dr.r : cur.r;
    const nRaw = dr.n !== undefined ? dr.n : cur.n;

    const wNum = (wRaw === '' || isNaN(Number(wRaw))) ? null : Number(wRaw);
    const sNum = (sRaw === '' || isNaN(Number(sRaw))) ? null : Number(sRaw);
    const reps = parseReps(rRaw, sRaw);
    const note = String(nRaw == null ? '' : nRaw).trim();

    if (wNum === null && sNum === null && !reps.length && !note) {
      // 没填的也留在清单里，这样保存后其他动作不会从界面上消失
      items.push({ exId, weight: null, sets: null, reps: [], note: '' });
      return;
    }
    /* 只写了备注、三个参数都没填的，也算「记过这一笔」——
       否则用户写的那句话会被「还没有填任何参数」拦下来，白写。 */
    filled++;
    items.push({ exId, weight: wNum, sets: sNum, reps, note });
  });

  if (!filled) { toast('还没有填任何参数', ''); return; }

  // ① 写日志
  DB.logs[dateStr] = { part, items, updatedAt: Date.now() };

  // ② 回写「上次参数」缓存 —— 核心。只回写真正填了值的动作
  items.forEach(it => {
    if (it.weight === null && it.sets === null && !it.reps.length) return;
    const prev = DB.last[it.exId];
    DB.last[it.exId] = {
      weight: it.weight !== null ? it.weight : (prev ? prev.weight : null),
      sets: it.sets !== null ? it.sets : (prev ? prev.sets : null),
      reps: it.reps.length ? it.reps : (prev ? prev.reps : []),
      date: dateStr
    };
  });

  // 清掉当天草稿
  delete DB.draft[dateStr];
  saveDB(true);

  renderWeek();
  renderDay();

  const btn = document.getElementById('btnSave');
  btn.classList.add('done');
  btn.textContent = '已保存 ✓';
  toast('已保存 ' + items.length + ' 个动作', 'ok');

  setTimeout(() => { updateSaveBar(); }, 1500);
}

/* ================= 面板系统 =================
   两层：#sheet 是主弹层，#sheet2 叠在它上面当二级菜单。
   设置里点某天改部位、导出 / 导入数据，都开在二级层 ——
   主弹层原样留在底下，关掉二级就回到它，不会被一起关掉。
   （以前这两件事是直接把主弹层的内容换掉，设置页就没了。） */
let sheetStack = null;   // 主弹层名字；null = 没开
let subStack = null;     // 二级弹层名字；null = 没开

const SHEET_PAGES = {
  library: { title: '动作库', html: () => renderLibrary() },
  part: { title: '练什么', html: () => renderPartPicker() },
  settings: { title: '设置', html: () => renderSettings() },
  export: { title: '导出数据', html: () => renderExport() },
  import: { title: '导入数据', html: () => renderImport() }
};

/** root 取 'sheet' | 'sheet2'，对应 #sheetTitle/#sheetBody 与 #sheet2Title/#sheet2Body */
function paintSheet(root, name) {
  const page = SHEET_PAGES[name];
  document.getElementById(root + 'Title').textContent = page.title;
  const body = document.getElementById(root + 'Body');
  body.innerHTML = page.html();
  // 设置是独立一整页（铺满全屏、不留白），动作库 / 二级还是底部的半截面板。
  // 放在这里而不是 openSheet：refreshSheet() 换页时也得跟着切。
  if (root === 'sheet') {
    document.getElementById('sheet').classList.toggle('full', name === 'settings');
  }
  // 滚的是整个面板（.sheet-top 要吸顶），换页时把它归位，
  // 免得从「动作库」滚到一半切到「设置」还停在半空
  document.getElementById(root).scrollTop = 0;
}

function openSheet(name) {          // 撑起主弹层
  sheetStack = name;
  paintSheet('sheet', name);
  document.getElementById('mask').classList.add('show');
  document.getElementById('sheet').classList.add('show');
  // 顶部栏浮在遮罩之上（不被压暗），所以面板开着时得让它点击穿透，
  // 否则点日期 / 齿轮会直接触发操作，而不是「点遮罩 = 关面板」
  document.querySelector('.app').classList.add('sheet-open');
}

function openSubSheet(name) {       // 二级：主弹层退半步留在底下，不清空也不重画
  subStack = name;
  paintSheet('sheet2', name);
  document.getElementById('sheet').classList.add('behind');
  document.getElementById('mask2').classList.add('show');
  document.getElementById('sheet2').classList.add('show');
  // 二级开着的这段，主遮罩的模糊要收窄一档（见 style.css 的 .app.sub-open）：
  // 两层玻璃叠着，主弹层先被 14px 糊一道、再被二级那层糊一道，字就彻底没了
  document.querySelector('.app').classList.add('sub-open');
}

function closeSubSheet() {          // 只收二级，主弹层还在
  // 从设置里点进来的部位面板，关掉时要把标记清掉，
  // 否则主页那个「换」按钮会误以为自己是设置入口，跑去改周模板
  if (subStack === 'part') VS.pendingDow = null;
  subStack = null;
  document.getElementById('mask2').classList.remove('show');
  document.getElementById('sheet2').classList.remove('show');
  document.getElementById('sheet').classList.remove('behind');
  document.querySelector('.app').classList.remove('sub-open');
}

function closeSheet() {             // 全收（含二级）
  if (subStack) closeSubSheet();
  sheetStack = null;
  document.getElementById('mask').classList.remove('show');
  document.getElementById('sheet').classList.remove('show');
  document.getElementById('sheet').classList.remove('behind');
  document.querySelector('.app').classList.remove('sheet-open');
}

/** 主弹层的内容变了（比如二级里改完部位回来了），就地重画一次 */
function refreshSheet() { if (sheetStack) paintSheet('sheet', sheetStack); }

/* ---- 键盘态：不再做任何视觉退化 ----
   历史上这里有两套「键盘动画期间摘掉毛玻璃」的保护（`.kb` / `.vv`），
   v2.7 用户要求「全程毛玻璃」，整套删掉，样式那一侧也一并清了
   （见 style.css 的「毛玻璃一律常开」）。真机若卡，回退方案在 REFERENCE.md。 */

/* ================= 应用内对话框 =================
   替代 window.prompt / window.confirm —— 那两个是安卓系统原生弹窗，
   方角 + 系统配色，和 App 这套圆角浅蓝完全不是一路。这里是自绘的。
   用法：openDialog(html字符串, 挂载回调) / closeDialog() / dialogOpen()

   每次打开都换一个全新的 .dlg 节点：onMount 里绑的监听器会跟着旧节点一起
   消失。不然连开两次同一个弹窗，点一下「确定」会触发两遍回调。 */
function openDialog(html, onMount) {
  const wrap = document.getElementById('dlgWrap');
  const old = document.getElementById('dlg');
  const dlg = old.cloneNode(false);      // 只留标签和属性，不带子节点和监听器
  old.replaceWith(dlg);
  dlg.innerHTML = html;
  wrap.classList.add('show');
  if (onMount) onMount(dlg);
}
function closeDialog() {
  document.getElementById('dlgWrap').classList.remove('show');
}
function dialogOpen() {
  return document.getElementById('dlgWrap').classList.contains('show');
}

/* 通用确认框（danger=true 时按钮变红） */
function askConfirm(opt) {
  openDialog(
    '<div class="dlg-title">' + esc(opt.title) + '</div>' +
    (opt.desc ? '<div class="dlg-desc">' + esc(opt.desc) + '</div>' : '') +
    '<div class="dlg-foot">' +
    '<button class="dlg-btn ghost" data-dact="cancel">取消</button>' +
    '<button class="dlg-btn ' + (opt.danger ? 'danger' : 'primary') + '" data-dact="ok">' +
    esc(opt.ok || '确定') + '</button>' +
    '</div>',
    function (dlg) {
      dlg.addEventListener('click', e => {
        const b = e.target.closest('[data-dact]');
        if (!b) return;
        const a = b.dataset.dact;
        if (a === 'cancel') { closeDialog(); return; }
        if (a === 'ok') { closeDialog(); opt.onOk(); }
      });
    }
  );
}

/* 新建自定义动作：应用内表单（名称 + 部位 + 器械） */
function askNewEx() {
  const pick = { name: '', part: '胸', equip: '器械' };

  function chipRow(list, cur, act, withIcon) {
    return list.map(v => {
      const ico = (withIcon && EQUIP_ICONS[v])
        ? '<span class="dc-ico">' + iconSvg(EQUIP_ICONS[v]) + '</span>' : '';
      return '<div class="dchip' + (v === cur ? ' on' : '') +
        '" data-dact="' + act + '" data-v="' + esc(v) + '">' + ico + esc(v) + '</div>';
    }).join('');
  }

  openDialog(
    '<div class="dlg-title">新建自定义动作</div>' +
    '<div class="dlg-label">动作名称</div>' +
    '<input class="dlg-input" id="dlgName" type="text" maxlength="24" ' +
    'placeholder="比如：器械臀桥" autocomplete="off" ' +
    'autocorrect="off" autocapitalize="off" spellcheck="false">' +
    '<div class="dlg-label">练哪个部位</div>' +
    '<div class="dlg-chips" id="dlgPart">' + chipRow(PARTS, pick.part, 'part', false) + '</div>' +
    '<div class="dlg-label">什么器械</div>' +
    '<div class="dlg-chips" id="dlgEquip">' + chipRow(EQUIPS, pick.equip, 'equip', true) + '</div>' +
    '<div class="dlg-foot">' +
    '<button class="dlg-btn ghost" data-dact="cancel">取消</button>' +
    '<button class="dlg-btn primary" id="dlgOk" disabled>创建</button>' +
    '</div>',
    function (dlg) {
      const input = dlg.querySelector('#dlgName');
      const okBtn = dlg.querySelector('#dlgOk');

      /* 只改 DOM 上的选中态，不整体重绘 —— 否则输入框会失焦、已打的名字会丢 */
      function mark(sel, btn) {
        dlg.querySelectorAll(sel + ' .dchip').forEach(c => c.classList.remove('on'));
        btn.classList.add('on');
      }

      input.addEventListener('input', () => {
        pick.name = input.value;
        okBtn.disabled = !input.value.trim();
      });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') create(); });

      dlg.addEventListener('click', e => {
        const b = e.target.closest('[data-dact]');
        if (!b) return;
        const a = b.dataset.dact;
        if (a === 'cancel') { closeDialog(); return; }
        if (a === 'part') { pick.part = b.dataset.v; mark('#dlgPart', b); return; }
        if (a === 'equip') { pick.equip = b.dataset.v; mark('#dlgEquip', b); return; }
      });

      okBtn.addEventListener('click', create);

      function create() {
        const name = (pick.name || '').trim();
        if (!name) { input.focus(); return; }
        const id = 'cust-' + Date.now().toString(36);
        DB.custom.push({ id, name, part: pick.part, equip: pick.equip, builtin: false });
        saveDB(true);
        addExToDay(VS.selDate, id);
        closeDialog();
        document.getElementById('sheetBody').innerHTML = renderLibrary();
        toast('已新建并加入今天', 'ok');
      }

      // 等弹窗卡片落位得差不多了再拉键盘。两个动画挤在同一帧里，
      // 加上键盘引起的那次重排，观感就是「点了没反应，然后顿一下」。
      setTimeout(() => {
        // 用户要是已经点到别处去了，就别把焦点抢回来
        const af = document.activeElement;
        if (af && af !== document.body && af !== document.documentElement) return;
        input.focus();
      }, 120);
    }
  );
}

/* ---- 动作库面板 ---- */
/** 当前筛选命中的动作 */
function libFiltered() {
  const q = VS.pickQ.trim().toLowerCase();
  return allExercises().filter(e => {
    if (VS.pickPart !== '全部' && e.part !== VS.pickPart) return false;
    if (VS.pickEquip !== '全部' && e.equip !== VS.pickEquip) return false;
    if (q && e.name.toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}

/** 只渲染结果列表。
 *  搜索和筛选都只换这一块 —— 上面的搜索框、筛选条原地不动。
 *  以前每敲一个字都要重建整个面板，搜索框被销毁重建 → 焦点丢掉、
 *  键盘跟着闪一下，156 个节点也白重建一遍。这就是输入时的卡顿来源。 */
function renderLibList() {
  const list = libFiltered();
  if (!list.length) {
    return '<div class="empty" style="padding:36px 20px"><p>没有找到匹配的动作</p>' +
      '<small>换个关键词试试，或者自己新建一个</small></div>';
  }
  const inDay = getDayExIds(VS.selDate);
  const lm = lastMapBefore(VS.selDate);      // 同样只认选中日之前的记录
  const groups = {};
  list.forEach(e => { (groups[e.part] = groups[e.part] || []).push(e); });
  let h = '';
  PARTS.forEach(p => {
    if (!groups[p]) return;
    h += '<div class="set-title" style="margin-top:14px">' + p + ' · ' + groups[p].length + '</div>';
    groups[p].forEach(e => {
      const added = inDay.indexOf(e.id) >= 0;
      h += '<div class="pick-item' + (added ? ' on' : '') + '" data-act="pick-ex" data-ex="' + e.id + '">' +
        '<div class="pick-ico">' + exIconSvg(e) + '</div>' +
        '<div class="pick-txt">' +
        '<div class="pick-name">' + esc(e.name) + '</div>' +
        '<div class="pick-sub">' + esc(e.equip) + (lm[e.id] ? ' · 上次 ' + num2str(lm[e.id].weight) + 'kg' : '') + '</div>' +
        '</div>' +
        (added ? '<span class="pick-flag added">已加</span>' : '<span class="pick-flag">+</span>') +
        '</div>';
    });
  });
  return h;
}

function renderLibrary() {
  const partF = VS.pickPart;
  const eqF = VS.pickEquip;

  // 部位筛选条
  let fh = '<div class="filters">';
  ['全部'].concat(PARTS).forEach(p => {
    fh += '<div class="fchip' + (p === partF ? ' on' : '') + '" data-act="f-part" data-v="' + p + '">' + p + '</div>';
  });
  fh += '</div>';

  // 器械筛选条
  let fe = '<div class="filters">';
  ['全部'].concat(EQUIPS).forEach(p => {
    const ico = EQUIP_ICONS[p] ? '<span class="fc-ico">' + iconSvg(EQUIP_ICONS[p]) + '</span>' : '';
    fe += '<div class="fchip' + (p === eqF ? ' on' : '') + '" data-act="f-equip" data-v="' + p + '">' + ico + p + '</div>';
  });
  fe += '</div>';

  return '<div class="search">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>' +
    '<input type="text" id="pickSearch" placeholder="搜索动作名，如「下拉」" value="' + esc(VS.pickQ) + '" ' +
    'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
    '</div>' +
    fh + fe +
    '<div id="libList">' + renderLibList() + '</div>' +
    '<div style="height:10px"></div>' +
    // 跟主页末尾那个「+ 添加动作」同一套虚线卡片，一眼认出是同一种东西
    '<div class="add-card" data-act="new-ex">+ 新建自定义动作</div>';
}

/* ---- 部位选择面板 ---- */
function renderPartPicker() {
  const dateStr = VS.selDate;
  const fromWeek = VS.pendingDow != null;        // 从设置里点星期几进来的
  const dow = fromWeek ? VS.pendingDow : parseYmd(dateStr).getDay();
  const cur = fromWeek ? (DB.plan[dow] ? DB.plan[dow].part : null) : getDayPart(dateStr);
  const dt = parseYmd(dateStr);

  let h = '<div class="set-note" style="padding:0 0 14px">' +
    (fromWeek ? '以后每个' + WD_FULL[dow] + ' 固定练什么？' : WD_FULL[dow] + ' 这天练什么？') +
    (fromWeek ? ' 选好之后，这个部位的动作模板会自动带出来。'
      : ' 选好之后，会从动作库里带几个这个部位的动作出来，随时可以增删。') +
    '</div>';

  h += '<div class="part-grid">';
  PARTS.forEach(p => {
    h += '<div class="part-cell' + (p === cur ? ' on' : '') + '" data-act="set-part" data-v="' + p + '">' + p + '</div>';
  });
  h += '<div class="part-cell none' + (!cur ? ' on' : '') + '" data-act="set-part" data-v="">休息日</div>';
  h += '</div>';

  if (fromWeek) {
    h += '<div class="set-note">选完立即生效，会自动回到设置页。</div>';
  } else {
    /* 这里刻意不再提供「以后每个周X都这样」的选项。
       之前默认就是它，导致「改今天」顺手把以后每一周都改了 —— 用户报过这个。
       改周模板只有一个地方：设置 · 每周训练安排。 */
    h += '<div class="set-note" style="margin-top:22px">只改 ' +
      (dt.getMonth() + 1) + ' 月 ' + dt.getDate() + ' 日这一天，以后每周都不受影响。<br>' +
      '要把某个星期几固定下来，去「设置 · 每周训练安排」。</div>';
  }

  return h;
}

/* ---- 设置面板 ----
   视觉跟主页对齐：每组一张圆角白卡，一行 = 浅蓝图标方块 + 标题/说明 + 右侧值。
   之前是裸的下划线列表（.opt-item），像系统设置，跟 App 不是一路。
   行工厂 setRow()：act 为空表示纯展示行（不可点、不出现按压反馈）。 */
function setRow(o) {
  return '<div class="set-row' + (o.on ? ' on' : '') + (o.act ? '' : ' static') + '"' +
    (o.act ? ' data-act="' + o.act + '" data-v="' + esc(o.v) + '"' : '') + '>' +
    '<div class="set-ico' + (o.mute ? ' mute' : '') + (o.danger ? ' danger' : '') + '">' +
    (SET_ICONS[o.ico] || '') + '</div>' +
    '<div class="set-txt">' +
    '<div class="set-name' + (o.danger ? ' danger' : '') + '">' + o.name + '</div>' +
    (o.sub ? '<div class="set-sub">' + o.sub + '</div>' : '') +
    '</div>' +
    (o.val ? '<span class="set-val">' + o.val + '</span>' : '') +
    (o.chev ? '<svg class="set-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>' : '') +
    '</div>';
}

function renderSettings() {
  let h = '';

  /* 每周训练安排：从周一开始排（跟上面那条周历一致），练的那天给部位和动作数，休息日灰着。
     注意 data-v 存的仍是真实星期序号，显示顺序和它是两回事。
     各类小字说明（.set-note / .set-sub）按用户要求全部删掉 —— 设置页只留标题 + 名字 + 值。 */
  h += '<div class="set-group"><div class="set-title">每周训练安排</div><div class="set-card">';
  for (const dow of DOW_MON_FIRST) {
    const p = DB.plan[dow];
    h += setRow({
      act: 'week-plan', v: String(dow), chev: true,
      ico: p ? 'train' : 'rest', mute: !p,
      name: WD_FULL[dow],
      val: p ? (esc(p.part) + ' · ' + p.exIds.length + ' 个动作') : '休息'
    });
  }
  h += '</div></div>';

  /* 重量微调步进 */
  h += '<div class="set-group"><div class="set-title">重量微调步进</div><div class="set-card">';
  STEP_OPTS.forEach(v => {
    const on = DB.settings.step === v;
    h += setRow({
      act: 'set-step', v: String(v), ico: 'step', on: on,
      name: '± ' + v + ' kg',
      val: on ? '已选' : ''
    });
  });
  h += '</div></div>';

  /* 动作库统计 */
  h += '<div class="set-group"><div class="set-title">动作库</div><div class="set-card">' +
    setRow({ ico: 'db', name: '内置动作', val: EXERCISES.length + ' 个' }) +
    setRow({ ico: 'custom', name: '自建动作', val: DB.custom.length + ' 个' }) +
    setRow({ ico: 'history', name: '已记录训练', val: Object.keys(DB.logs).length + ' 天' }) +
    '</div></div>';

  /* 数据备份 */
  h += '<div class="set-group"><div class="set-title">数据备份</div><div class="set-card">' +
    setRow({ act: 'export', ico: 'exp', chev: true, name: '导出数据' }) +
    setRow({ act: 'import', ico: 'imp', chev: true, name: '导入数据' }) +
    '</div></div>';

  /* 危险操作 */
  h += '<div class="set-group"><div class="set-title">危险操作</div><div class="set-card">' +
    setRow({
      act: 'clear-all', ico: 'trash', danger: true,
      name: '清空全部数据'
    }) +
    '</div></div>';

  /* 署名行：作者 + 联系方式，放在设置页最末尾。
     注意用的是独立的 .set-sign，**不是** .set-note / .set-sub ——
     那两个类是「说明小字」，用户明确要求设置页里不要；署名是另一回事（自检分开守着）。 */
  h += '<div class="set-sign">Designed by Tian Yingke' +
    '<span class="sign-sep"></span>+86 173 3218 2657</div>';

  return h;
}

/* ---- 导出入 ----
   两个都开在二级弹层里，关掉 / 还原完自动回到设置页。 */
function renderExport() {
  const data = JSON.stringify(DB);
  const b64 = btoa(unescape(encodeURIComponent(data)));
  return '<div class="set-note" style="padding:0 0 12px">下面这段文字就是你的全部数据。' +
    '复制走存到任何地方，换手机时粘贴回来即可还原。</div>' +
    '<textarea id="ioBox" class="io-box" style="height:230px" readonly>' + b64 + '</textarea>' +
    '<div style="display:flex;gap:10px;margin-top:12px">' +
    '<button class="btn-save" style="flex:1;height:auto;padding:13px" data-act="copy-export">复制全部</button>' +
    '<button class="ghost-btn" data-act="close-sheet">关闭</button>' +
    '</div>';
}

function renderImport() {
  return '<div class="set-note" style="padding:0 0 12px">把之前导出的那段文字粘进来，点还原。' +
    '会覆盖当前的全部数据。</div>' +
    '<textarea id="ioBox" class="io-box" style="height:200px" placeholder="在这里粘贴备份文本…"></textarea>' +
    '<div style="display:flex;gap:10px;margin-top:12px">' +
    '<button class="btn-save" style="flex:1;height:auto;padding:13px" data-act="do-import">还原数据</button>' +
    '<button class="ghost-btn" data-act="close-sheet">取消</button>' +
    '</div>';
}

/* ================= Toast ================= */
let toastTimer = null;
function toast(msg, kind) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (kind || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast ' + (kind || ''); }, 1900);
}

/* ================= 拖动：调整当天的动作顺序 =================
   只有按住卡片右侧的拖拽手柄（≡）才会浮起来拖动。
   拖动全程只改 transform，一张卡片都不重建；松手先做归位动画，
   落位之后才重排 DOM 并写数据 —— 所以中间没有任何一帧是「跳」的。 */
const DRAG = {
  on: false,
  card: null, cards: [], list: null, content: null,
  startY: 0, dy: 0, h: 0, step: 0, tops: [],
  from: 0, to: 0,
  blockClickUntil: 0,
  pending: null,   // 长按待触发：{ card, x, y }
  timer: null
};
/* 顶/底越界余量。换位判据是「被拖卡片中心越过目标槽位中心」，
   若位移被卡在「中心恰好重合」的位置，判据永远差一点点 —— 表现就是
   最下面那张怎么拖都换不到最上面。留一截余量让中心真的越过去。
   取值不超过 .content 的 padding-top(14px)，越界时不会被裁掉。 */
const DRAG_OVER = 14;
/* 长按多久才进入拖动（用户要求「长按以后再滑动」）；长按期间位移超过 DRAG_SLOP 就当滚动、取消长按 */
const DRAG_HOLD = 300;
const DRAG_SLOP = 10;

function beginDrag(card, clientY) {
  const list = document.getElementById('contentInner');
  const content = document.getElementById('content');
  const cards = Array.prototype.slice.call(list.querySelectorAll('.ex-card'));
  if (cards.length < 2) return false;

  const tops = cards.map(c => c.getBoundingClientRect().top);
  DRAG.on = true;
  DRAG.card = card;
  DRAG.cards = cards;
  DRAG.list = list;
  DRAG.content = content;
  DRAG.from = cards.indexOf(card);
  DRAG.to = DRAG.from;
  DRAG.startY = clientY;
  DRAG.dy = 0;
  DRAG.h = card.getBoundingClientRect().height;
  DRAG.tops = tops;
  // 取平均行距，比「第一对的间距」稳（卡片高度不一定完全一样）
  DRAG.step = (tops[tops.length - 1] - tops[0]) / (tops.length - 1);

  card.classList.add('dragging');
  content.classList.add('dragging');     // 顺手把滚动关掉
  card.style.transform = 'translateY(0px) scale(1.035)';

  if (!DB.settings.dragTip) {            // 头一回拖，提一句
    DB.settings.dragTip = 1;
    saveDB();
    toast('长按 ≡ 再上下拖，就能调整顺序', '');
  }
  return true;
}

function dragMove(clientY) {
  if (!DRAG.on) return;
  const n = DRAG.cards.length;
  // 上下各多给一点余量，否则最下面那张拖到最上面时中心刚好差一点点越不过去
  const min = -(DRAG.from) * DRAG.step - DRAG_OVER;
  const max = (n - 1 - DRAG.from) * DRAG.step + DRAG_OVER;
  const d = Math.max(min, Math.min(max, clientY - DRAG.startY));
  DRAG.dy = d;

  // 被拖卡片中心落在谁的槽位上，就换到第几位
  const center = DRAG.tops[DRAG.from] + DRAG.h / 2 + d;
  let to = DRAG.from;
  for (let i = 0; i < n; i++) {
    if (i === DRAG.from) continue;
    const c = DRAG.tops[i] + DRAG.h / 2;
    // 用非严格比较：d 取到边界值时中心与槽位中心可能正好相等，
    // 那一下也算「已经到达」，不该再漏掉
    if (i < DRAG.from && center <= c) to = Math.min(to, i);
    if (i > DRAG.from && center >= c) to = Math.max(to, i);
  }
  if (to !== DRAG.to) DRAG.to = to;

  DRAG.card.style.transform = 'translateY(' + d + 'px) scale(1.035)';
  DRAG.cards.forEach((c, i) => {
    if (i === DRAG.from) return;
    let sh = 0;
    if (i < DRAG.from && i >= to) sh = DRAG.step;        // 上方的往下让
    else if (i > DRAG.from && i <= to) sh = -DRAG.step;  // 下方的往上让
    c.style.transform = sh ? 'translateY(' + sh + 'px)' : '';
  });
}

const DRAG_EASE = 'transform .19s cubic-bezier(.32,.72,.36,1)';

function endDrag(commit) {
  if (!DRAG.on) return;
  DRAG.on = false;
  const card = DRAG.card, cards = DRAG.cards, list = DRAG.list;
  const from = DRAG.from, to = DRAG.to;
  DRAG.content.classList.remove('dragging');
  DRAG.blockClickUntil = Date.now() + 380;

  const settle = () => {
    cards.forEach(c => { c.style.transition = ''; c.style.transform = ''; });
    card.classList.remove('dragging');
  };

  if (!commit || to === from) {                  // 没挪动，弹回原位
    cards.forEach(c => { c.style.transition = DRAG_EASE; });
    card.style.transform = 'translateY(0px) scale(1)';
    setTimeout(settle, 200);
    return;
  }

  // 先让被拖的卡片滑到目标槽位，其它卡片此刻已经在让位位置上了
  const delta = (to - from) * DRAG.step;
  cards.forEach(c => { c.style.transition = DRAG_EASE; });
  card.style.transform = 'translateY(' + delta + 'px) scale(1)';

  setTimeout(() => {
    const ref = cards[to];
    if (to > from) list.insertBefore(card, ref.nextSibling);
    else list.insertBefore(card, ref);
    settle();
    // DOM 已经是新顺序了，把顺序存下来即可，不需要重绘
    const ids = Array.prototype.slice.call(list.querySelectorAll('.ex-card'))
      .map(c => c.getAttribute('data-ex'));
    reorderDay(VS.selDate, ids);
  }, 200);
}

/** 写入当天的动作顺序。
 *  有日志就改日志里的次序（日志是权威）；没日志就先存一份当天的顺序覆盖。
 *  最后再看「改动范围」：范围是「以后每周」的话，把这套顺序一并固化进周模板。 */
function reorderDay(dateStr, ids) {
  const log = DB.logs[dateStr];
  if (log && Array.isArray(log.items)) {
    const box = {};
    log.items.forEach(it => { box[it.exId] = it; });
    const next = [];
    ids.forEach(id => { if (box[id]) { next.push(box[id]); delete box[id]; } });
    log.items.forEach(it => { if (box[it.exId]) { next.push(it); delete box[it.exId]; } });
    log.items = next;
  } else {
    if (!DB.dayOrder) DB.dayOrder = {};
    DB.dayOrder[dateStr] = ids.slice();
  }
  const res = applyScope(dateStr);
  saveDB(true);
  if (res === 'week') toast('顺序已同步' + scopeTip(dateStr, res), 'ok');
}

/* ================= 事件 ================= */
function bindEvents() {

  /* --- 周历点击 --- */
  document.getElementById('weekStrip').addEventListener('click', e => {
    const cell = e.target.closest('.wd');
    if (!cell) return;
    VS.selDate = cell.dataset.date;
    renderWeek();
    renderDay();
  });

  /* --- 上一周 / 下一周 --- */
  document.getElementById('btnPrev').addEventListener('click', () => {
    VS.anchor = addDays(VS.anchor, -7);
    VS.selDate = ymd(mondayOf(VS.anchor));
    renderWeek(); renderDay();
  });
  document.getElementById('btnNext').addEventListener('click', () => {
    VS.anchor = addDays(VS.anchor, 7);
    VS.selDate = ymd(mondayOf(VS.anchor));
    renderWeek(); renderDay();
  });
  document.getElementById('btnTodayFallback') && document.getElementById('btnTodayFallback').addEventListener('click', goToday);

  const rangeEl = document.getElementById('weekRange');
  if (rangeEl) rangeEl.addEventListener('click', () => {
    if (rangeEl.classList.contains('clickable')) goToday();
  });

  /* --- 内容区：输入 + 按钮 --- */
  const content = document.getElementById('content');

  content.addEventListener('input', e => {
    const inp = e.target;
    if (inp.tagName !== 'INPUT' && inp.tagName !== 'TEXTAREA') return;
    const exId = inp.dataset.ex;
    const f = inp.dataset.f;
    if (!exId || !f) return;
    setDraft(VS.selDate, exId, f, inp.value.trim());
    // 备注框跟着内容长高（参数栏那种单行 input 不用管）
    if (inp.tagName === 'TEXTAREA') autoGrowNote(inp);
    // 高亮当前输入框
    document.querySelectorAll('.fld.focus').forEach(el => el.classList.remove('focus'));
    const fld = inp.closest('.fld');
    if (fld) fld.classList.add('focus');
  });

  content.addEventListener('focusout', e => {
    const fld = e.target.closest && e.target.closest('.fld');
    if (fld) fld.classList.remove('focus');
  });

  content.addEventListener('click', e => {
    if (Date.now() < DRAG.blockClickUntil) return;  // 刚拖完，别把抬手当成点击
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const exId = btn.dataset.ex;
    if (act === 'drag-handle') return;              // 手柄只管拖，不响应点击

    if (act === 'minus' || act === 'plus') {
      const dir = act === 'plus' ? 1 : -1;
      const step = DB.settings.step;
      const card = btn.closest('.ex-card');
      const inp = card.querySelector('input[data-f="w"]');
      /* 框里是什么就从什么开始算。空着（这天还没填、也没点「沿用」）就从 0 起跳 ——
         不再回退去读「上次」，那等于变相自动填充（见 getCurrentValues 上的说明）。 */
      let v = parseFloat(inp.value);
      if (isNaN(v)) v = 0;
      v = Math.round((v + dir * step) * 100) / 100;
      if (v < 0) v = 0;
      inp.value = v;
      setDraft(VS.selDate, exId, 'w', String(v));
      return;
    }

    if (act === 'use-last') {
      const last = lastBefore(VS.selDate, exId);
      if (!last) return;
      const card = btn.closest('.ex-card');
      card.querySelector('input[data-f="w"]').value = num2str(last.weight);
      card.querySelector('input[data-f="s"]').value = num2str(last.sets);
      card.querySelector('input[data-f="r"]').value = reps2str(last.reps);
      setDraft(VS.selDate, exId, 'w', num2str(last.weight));
      setDraft(VS.selDate, exId, 's', num2str(last.sets));
      setDraft(VS.selDate, exId, 'r', reps2str(last.reps));
      btn.classList.add('used');   // 数据已带过来，按钮退成次要的淡色
      toast('已填入上次的参数', 'ok');
      return;
    }

    if (act === 'del-ex') {
      /* 先确认再删：这个动作可能已经填了参数（草稿）或存过日志，
         一点错全没了，而且删完只能靠导出的备份找回来。
         选择器用 [data-f]（不是 input[data-f]）—— 备注是 textarea，写了备注也得算「填过」。 */
      const ex = exById(exId);
      const card = btn.closest('.ex-card');
      const touched = [].some.call(
        card.querySelectorAll('[data-f]'),
        i => i.value.trim() !== '');
      askConfirm({
        title: '删除动作',
        desc: '把「' + (ex ? ex.name : '这个动作') + '」从这天移除' +
          (touched ? '，已经填好的参数也一起删掉。' : '。'),
        ok: '删除',
        danger: true,
        onOk: () => removeExFromDay(VS.selDate, exId)
      });
      return;
    }

    if (act === 'scope') {
      // 一颗开关：亮 = 只改今天（只对这一天，会被记住），灭 = 改以后每个同一天
      const toDay = !isScopeDay(VS.selDate);
      if (!toDay) {
        // 切回「以后每周都这样」时立刻把当天这套固化，免得用户以为点了没反应
        if (!syncDayToPlan(VS.selDate)) {
          toast('这天跟周模板对不上，先去「设置 · 每周训练安排」把部位固定下来', '');
          return;
        }
      }
      setScopeDay(VS.selDate, toDay ? 'day' : 'week');
      saveDB(true);
      renderDay();
      toast(toDay
        ? '只改今天，模板不动'
        : ('存进模板，以后每' + WD_FULL[parseYmd(VS.selDate).getDay()] + '都这样'), 'ok');
      return;
    }

    if (act === 'start-today') {
      openSheet('part');
      return;
    }

    if (act === 'open-lib') {
      VS.pickQ = '';
      VS.pickPart = getDayPart(VS.selDate) || '全部';
      VS.pickEquip = '全部';
      openSheet('library');
      return;
    }
  });

  /* --- 拖拽排序：长按手柄（≡）300ms 才浮起，再上下拖 ---
     用 touch 事件而不是 pointer：touchmove 里能「动态」preventDefault ——
     长按之前不拦（从手柄处滑动，页面照常滚），长按成功之后才拦（锁住滚动专心拖卡片）。
     pointer 事件的滚动由 touch-action 在触摸一开始就锁死，做不到「先滚后锁」。
     （用户报过：从手柄处滑动划不动，就是被 touch-action:none + preventDefault 一起吃了。） */
  content.addEventListener('touchstart', e => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    const handle = e.target.closest('[data-act="drag-handle"]');
    if (!handle) return;
    const card = handle.closest('.ex-card');
    if (!card) return;
    if (document.getElementById('contentInner').querySelectorAll('.ex-card').length < 2) return;
    // 不 preventDefault：保留「滚动」的可能，滑动时页面照常滚
    DRAG.pending = { card: card, x: t.clientX, y: t.clientY };
    clearTimeout(DRAG.timer);
    DRAG.timer = setTimeout(() => {
      DRAG.timer = null;
      const p = DRAG.pending;
      if (!p) return;
      DRAG.pending = null;
      beginDrag(p.card, p.y);
    }, DRAG_HOLD);
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (DRAG.on) {
      e.preventDefault();                    // 长按已成功，锁住滚动，专心拖卡片
      dragMove(e.touches[0].clientY);
      return;
    }
    // 长按还没到点：滑走超过 slop 就取消，把这次交给页面滚动（不 preventDefault）
    if (DRAG.pending) {
      const t = e.touches[0];
      const dx = t.clientX - DRAG.pending.x, dy = t.clientY - DRAG.pending.y;
      if (dx * dx + dy * dy > DRAG_SLOP * DRAG_SLOP) {
        clearTimeout(DRAG.timer);
        DRAG.timer = null;
        DRAG.pending = null;
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (DRAG.timer) { clearTimeout(DRAG.timer); DRAG.timer = null; DRAG.pending = null; return; }
    if (DRAG.on) endDrag(true);
  });
  document.addEventListener('touchcancel', () => {
    if (DRAG.timer) { clearTimeout(DRAG.timer); DRAG.timer = null; DRAG.pending = null; }
    if (DRAG.on) endDrag(false);
  });

  /* --- 顶部「换」按钮 --- */
  document.getElementById('btnChangePart').addEventListener('click', () => {
    openSheet('part');
  });

  /* --- 保存 --- */
  document.getElementById('btnSave').addEventListener('click', saveDay);

  /* --- 顶部：展开整月日历 --- */
  document.getElementById('btnMonth').addEventListener('click', openMonthCal);

  /* --- 设置 --- */
  document.getElementById('btnSettings').addEventListener('click', () => {
    openSheet('settings');
  });

  /* --- 关闭面板 --- */
  document.getElementById('mask').addEventListener('click', closeSheet);
  document.getElementById('mask2').addEventListener('click', closeSubSheet);

  /* --- 对话框：点卡片外面关掉 --- */
  document.getElementById('dlgWrap').addEventListener('click', e => {
    if (e.target.id === 'dlgWrap') closeDialog();
  });
  document.getElementById('sheetClose').addEventListener('click', closeSheet);
  // 二级那层的 ✕ 只收自己，设置页原样留着
  document.getElementById('sheet2Close').addEventListener('click', closeSubSheet);

  /* --- 面板内交互（主弹层和二级共用一套处理） --- */
  function onSheetInput(e) {
    if (e.target.id === 'pickSearch') {
      VS.pickQ = e.target.value;
      // 只换结果列表。搜索框本身不重建，焦点就不会丢，键盘也不会闪。
      const box = document.getElementById('libList');
      if (box) box.innerHTML = renderLibList();
    }
  }

  function onSheetClick(e, root) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const v = btn.dataset.v;

    if (act === 'f-part' || act === 'f-equip') {
      if (act === 'f-part') VS.pickPart = v; else VS.pickEquip = v;
      // 只改选中态和结果列表，筛选条本身不重建（横向滚动位置也就不会弹回去）
      root.querySelectorAll('[data-act="' + act + '"]').forEach(c => {
        c.classList.toggle('on', c.dataset.v === v);
      });
      const box = document.getElementById('libList');
      if (box) box.innerHTML = renderLibList();
      return;
    }

    if (act === 'pick-ex') {
      const id = btn.dataset.ex;
      if (getDayExIds(VS.selDate).indexOf(id) >= 0) removeExFromDay(VS.selDate, id);
      else addExToDay(VS.selDate, id);
      // 就地改这一行的标记，不重建列表 —— 滚动位置和点击手感都保住
      const on = getDayExIds(VS.selDate).indexOf(id) >= 0;
      btn.classList.toggle('on', on);
      const flag = btn.querySelector('.pick-flag');
      if (flag) {
        flag.className = 'pick-flag' + (on ? ' added' : '');
        flag.textContent = on ? '已加' : '+';
      }
      return;
    }

    if (act === 'new-ex') { askNewEx(); return; }

    if (act === 'set-part') {
      const backToSettings = VS.pendingDow != null;
      applyPart(VS.selDate, v);
      // 从设置里点进来的：只收二级，设置页原样回来（顺便刷新，部位显示要跟着变）
      if (backToSettings) { closeSubSheet(); refreshSheet(); }
      else closeSheet();
      return;
    }

    if (act === 'set-step') {
      DB.settings.step = Number(v);
      saveDB(true);
      refreshSheet();
      return;
    }

    if (act === 'week-plan') {
      VS.pendingDow = Number(v);
      openSubSheet('part');           // 叠在设置上面，不动设置
      return;
    }

    if (act === 'export') { openSubSheet('export'); return; }
    if (act === 'import') { openSubSheet('import'); return; }

    if (act === 'copy-export') {
      const box = document.getElementById('ioBox');
      box.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { }
      if (navigator.clipboard) navigator.clipboard.writeText(box.value).catch(() => { });
      toast(ok ? '已复制到剪贴板' : '长按文本框手动复制', ok ? 'ok' : '');
      return;
    }

    // 导出/导入二级层里的「关闭 / 取消」：只收二级，别把设置一起关了
    if (act === 'close-sheet') {
      if (subStack) closeSubSheet(); else closeSheet();
      return;
    }

    if (act === 'do-import') {
      const box = document.getElementById('ioBox');
      const txt = (box.value || '').trim();
      if (!txt) { toast('先粘贴备份文本', 'err'); return; }
      try {
        const json = decodeURIComponent(escape(atob(txt)));
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== 'object') throw new Error('bad');
        DB = obj;
        const d = defaultDB();
        for (const k in d) if (DB[k] === undefined) DB[k] = d[k];
        saveDB(true);
        closeSubSheet();
        refreshSheet();
        renderWeek(); renderDay();
        toast('数据已还原', 'ok');
      } catch (err) { toast('这段文本识别不了', 'err'); }
      return;
    }

    if (act === 'clear-all') {
      askConfirm({
        title: '清空全部数据',
        desc: '训练记录、自建动作都会删掉，无法撤销。',
        ok: '清空', danger: true,
        onOk: function () {
          DB = defaultDB();
          saveDB(true);
          refreshSheet();
          renderWeek(); renderDay();
          toast('已清空', '');
        }
      });
      return;
    }
  }

  const sheetBody = document.getElementById('sheetBody');
  const sheet2Body = document.getElementById('sheet2Body');
  sheetBody.addEventListener('input', onSheetInput);
  sheetBody.addEventListener('click', e => onSheetClick(e, sheetBody));
  sheet2Body.addEventListener('input', onSheetInput);
  sheet2Body.addEventListener('click', e => onSheetClick(e, sheet2Body));

  /* --- 安卓返回键 --- */
  try {
    const Cap = window.Capacitor;
    if (Cap && Cap.Plugins && Cap.Plugins.App) {
      Cap.Plugins.App.addListener('backButton', () => {
        if (dialogOpen()) { closeDialog(); return; }
        if (subStack) { closeSubSheet(); return; }     // 先收二级，再收主弹层
        if (sheetStack) { closeSheet(); return; }
        Cap.Plugins.App.exitApp();
      });
    }
  } catch (err) { }
}

/* ---- 跳到某一天（连带把上面那条周历挪到那一周） ---- */
function gotoDate(ds) {
  VS.selDate = ds;
  VS.anchor = parseYmd(ds);
  renderWeek();
  renderDay();
}

/* ---- 回到今天 ---- */
function goToday() { gotoDate(todayYmd()); }

/* ================= 月历弹窗 =================
   点顶部的日历按钮展开整月：哪天有安排（小圆点）、哪天已经练过（浅蓝底）
   一眼看清，点任意一天直接跳过去。 */
function openMonthCal() {
  const d = parseYmd(VS.selDate);
  VS.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  openDialog(monthCalHtml(), mountMonthCal);
}

function monthCalHtml() {
  const y = VS.calMonth.getFullYear();
  const m = VS.calMonth.getMonth();
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;   // 周一起：本月 1 号前面要空几格
  const today = todayYmd();
  // 固定铺 6 行 42 格 —— 换月份时弹窗高度不跳
  const start = addDays(first, -lead);
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    const ds = ymd(d);
    const cls = ['cal-cell'];
    if (d.getMonth() !== m) cls.push('out');
    if (DB.logs[ds] && DB.logs[ds].items && DB.logs[ds].items.length) cls.push('done');
    if (ds === today) cls.push('today');
    if (ds === VS.selDate) cls.push('sel');
    cells += '<div class="' + cls.join(' ') + '" data-dact="cal-day" data-date="' + ds + '">' +
      '<span class="n">' + d.getDate() + '</span>' +
      (getDayPart(ds) ? '<span class="mk"></span>' : '') +
      '</div>';
  }
  return '<div class="cal-head">' +
    '<button class="cal-nav" data-dact="cal-prev" aria-label="上个月">‹</button>' +
    '<div class="cal-title">' + y + ' 年 ' + (m + 1) + ' 月</div>' +
    '<button class="cal-nav" data-dact="cal-next" aria-label="下个月">›</button>' +
    '</div>' +
    '<div class="cal-wd">' +
    ['一', '二', '三', '四', '五', '六', '日'].map(w => '<span>' + w + '</span>').join('') +
    '</div>' +
    '<div class="cal-grid">' + cells + '</div>' +
    '<div class="cal-legend">' +
    '<span><i class="lg-train"></i>训练日</span>' +
    '<span><i class="lg-done"></i>已记录</span>' +
    '</div>' +
    '<div class="dlg-foot">' +
    '<button class="dlg-btn ghost" data-dact="cal-today">回到今天</button>' +
    '<button class="dlg-btn primary" data-dact="cal-close">关闭</button>' +
    '</div>';
}

function mountMonthCal(dlg) {
  dlg.addEventListener('click', e => {
    const b = e.target.closest('[data-dact]');
    if (!b) return;
    const a = b.dataset.dact;
    if (a === 'cal-close') { closeDialog(); return; }
    if (a === 'cal-prev' || a === 'cal-next') {
      const step = a === 'cal-prev' ? -1 : 1;
      VS.calMonth = new Date(VS.calMonth.getFullYear(), VS.calMonth.getMonth() + step, 1);
      dlg.innerHTML = monthCalHtml();       // 只换弹窗内容，监听器挂在 dlg 上不受影响
      return;
    }
    if (a === 'cal-today') { closeDialog(); goToday(); return; }
    if (a === 'cal-day') { closeDialog(); gotoDate(b.dataset.date); return; }
  });
}

/* ================= 改动范围：这套动作算谁的 =================
   当天的动作增删 / 排序有两个去处：
     'week' —— 同时固化进周模板 DB.plan[星期]，以后每个同一天都用这套（默认）；
     'day'  —— 只落在这天，模板一个字都不动。
   为什么要固化：模板里那 4 个动作只是「初始的一套」，真正练什么得靠练的时候调。
   调完如果只留在当天，下礼拜同一部位又得重调一遍 —— 那是白干。 */
function syncDayToPlan(dateStr) {
  const dow = parseYmd(dateStr).getDay();
  const part = getDayPart(dateStr);
  if (!part) return true;
  const tpl = DB.plan[dow];
  // 两种情况不动模板，让用户先去设置里把部位固定下来：
  //   ① 模板里这天本来就是休息日（硬写进去会凭空多出一个训练日）；
  //   ② 这天临时换了部位 —— 动作清单已经是新部位的了，塞进旧部位的模板会自相矛盾。
  if (!tpl || tpl.part !== part) return false;
  DB.plan[dow] = { part: part, exIds: getDayExIds(dateStr).slice() };
  // 模板已经等于这天的结果了，当天的临时覆盖可以撤掉（日志和草稿保留）。
  // 撤掉是必要的：留着的话，以后在设置里改模板，这天还会被旧覆盖挡回去。
  delete DB.dayPart[dateStr];
  delete DB.dayRemove[dateStr];
  delete DB.dayExtra[dateStr];
  delete DB.dayOrder[dateStr];
  return true;
}

/** 改动落库之后按当前范围处理一下。返回值给 toast 用：
 *  'week' 已同步到模板 / 'day' 只改这天 / 'conflict' 部位对不上，模板没动 */
function applyScope(dateStr) {
  if (isScopeDay(dateStr)) return 'day';
  return syncDayToPlan(dateStr) ? 'week' : 'conflict';
}

/** 一句话说清这次改动落在哪 */
function scopeTip(dateStr, res) {
  const dow = parseYmd(dateStr).getDay();
  if (res === 'week') return ' · 以后每' + WD_FULL[dow] + '都这样';
  if (res === 'conflict') return ' · 模板没动（这天跟周模板对不上）';
  return ' · 只改了这一天';
}

/* ---- 当天动作增删 ---- */
function addExToDay(dateStr, exId) {
  if (getDayExIds(dateStr).indexOf(exId) >= 0) { toast('这个动作已经加过了', ''); return; }
  const log = DB.logs[dateStr];
  if (log && Array.isArray(log.items)) {
    log.items.push({ exId, weight: null, sets: null, reps: [], note: '' });
  } else {
    if (!DB.dayExtra[dateStr]) DB.dayExtra[dateStr] = [];
    if (DB.dayExtra[dateStr].indexOf(exId) < 0) DB.dayExtra[dateStr].push(exId);
    const rm = DB.dayRemove[dateStr] || [];
    const i = rm.indexOf(exId);
    if (i >= 0) rm.splice(i, 1);
  }
  const res = applyScope(dateStr);
  saveDB(true);
  renderDay();
  const ex = exById(exId);
  toast('已加入：' + (ex ? ex.name : '') + scopeTip(dateStr, res), 'ok');
}

function removeExFromDay(dateStr, exId) {
  const log = DB.logs[dateStr];
  if (log && Array.isArray(log.items)) {
    log.items = log.items.filter(i => i.exId !== exId);
  } else {
    if (!DB.dayRemove[dateStr]) DB.dayRemove[dateStr] = [];
    if (DB.dayRemove[dateStr].indexOf(exId) < 0) DB.dayRemove[dateStr].push(exId);
    const ex2 = DB.dayExtra[dateStr] || [];
    const j = ex2.indexOf(exId);
    if (j >= 0) ex2.splice(j, 1);
  }
  if (DB.draft[dateStr]) delete DB.draft[dateStr][exId];
  const res = applyScope(dateStr);
  saveDB(true);
  renderDay();
  toast('已移除' + scopeTip(dateStr, res), '');
}

/* ---- 换部位 ----
   两个入口，语义完全分开：
   - 设置 · 每周训练安排（VS.pendingDow 有值）→ 改「以后每个周X」的模板；
   - 主页的「换」按钮（在某一天上点）      → 只改这一天，绝不碰模板。
   以前主页这个入口默认也是改模板，于是「改今天」顺手把以后每一周都改了 ——
   用户报过：「这周这天调整的动作，以后每周都用这个动作」。 */
function applyPart(dateStr, part) {
  const dow = parseYmd(dateStr).getDay();
  const fromWeek = VS.pendingDow != null;
  const useDow = fromWeek ? VS.pendingDow : dow;
  VS.pendingDow = null;

  if (fromWeek) {
    // 改每周模板
    if (part) {
      if (!DB.plan[useDow]) DB.plan[useDow] = { part, exIds: [] };
      DB.plan[useDow].part = part;
      // 保留模板里本来就属于该部位的动作，否则从动作库带出前 4 个
      const keep = DB.plan[useDow].exIds.filter(id => { const e = exById(id); return e && e.part === part; });
      if (!keep.length) {
        const pool = allExercises().filter(e => e.part === part);
        DB.plan[useDow].exIds = pool.slice(0, 4).map(e => e.id);
      } else {
        DB.plan[useDow].exIds = keep;
      }
    } else {
      delete DB.plan[useDow];
    }
    if (useDow === dow) clearDayOverrides(dateStr);   // 模板变了，这天的临时改动作废
  } else {
    // 只改这一天
    if ((part || null) === (getDayPart(dateStr) || null)) { toast('没变哦', ''); return; }
    if (part) {
      DB.dayPart[dateStr] = part;
      // 动作清单要跟着换到新部位：先用 dayRemove 把模板那套顶掉，
      // 再把新部位的前 4 个放进 dayExtra。之后从动作库增删照旧走这两个表。
      const p = DB.plan[dow];
      DB.dayRemove[dateStr] = p ? p.exIds.slice() : [];
      const pool = allExercises().filter(e => e.part === part);
      DB.dayExtra[dateStr] = pool.slice(0, 4).map(e => e.id);
      delete DB.dayOrder[dateStr];
      delete DB.draft[dateStr];
      delete DB.logs[dateStr];        // 换部位相当于这天重新开始
    } else {
      clearDayOverrides(dateStr);
    }
  }
  saveDB(true);
  renderWeek();
  renderDay();
  toast(part ? ('改成练 ' + part + ' 了') : '这天改成休息日', 'ok');
}

/** 清掉某天所有临时改动（部位 / 增删 / 顺序 / 草稿 / 日志）。
 *  注意：只动这一天，绝不碰 DB.plan。 */
function clearDayOverrides(dateStr) {
  delete DB.dayPart[dateStr];
  delete DB.dayRemove[dateStr];
  delete DB.dayExtra[dateStr];
  delete DB.dayOrder[dateStr];
  delete DB.draft[dateStr];
  delete DB.logs[dateStr];
}

/* ================= 启动 ================= */
function boot() {
  loadDB();
  VS.anchor = new Date();
  VS.selDate = todayYmd();
  renderWeek();
  renderDay();
  syncTopbarPad();          // 量顶部栏高度，给主内容区留出上边距
  bindEvents();
  window.addEventListener('resize', syncTopbarPad);
  window.addEventListener('orientationchange', syncTopbarPad);
  // 字体加载完高度可能变一点，再补量一次
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncTopbarPad);
}

document.addEventListener('DOMContentLoaded', boot);
