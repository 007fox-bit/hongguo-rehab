/* ============================================================
   红果戒毒所 · 网页版核心逻辑
   零依赖 / 数据存 localStorage / 全部娱乐向
   ============================================================ */
(function () {
  'use strict'

  /* ---------- 常量库（对齐 miniprogram/utils/theme.js） ---------- */
  const MEMES = [
    '查房了。今天也有人在偷偷点开红果吗？我不说，我知道。',
    '刷剧一时爽，账本火葬场。你的人生不是别人的剧本。',
    '主治医生提醒：本所不能监控红果 App，但能监控你的良心。',
    '别人在剧里续命，你在现实里续命——选一个。',
    '你已经坚持到第 {{streak}} 天了，反派都没你耐力强。',
    '放心，出院那天没人拦你，拦你的是你自己的片子清单。',
    '恢复观看不叫失败，叫复健。主治医生不骂人，只记账。'
  ]
  const ALTERNATIVES = [
    { name: '做 20 个俯卧撑', icon: '💪', weight: 3, desc: '物理超度想刷剧的手' },
    { name: '喝一大杯温水', icon: '🥤', weight: 4, desc: '胃满了，脑子就不闹了' },
    { name: '下楼走两圈', icon: '🚶', weight: 3, desc: '换个地方发呆，也算康复' },
    { name: '4-7-8 呼吸法', icon: '🌬', weight: 3, desc: '给神经系统按个暂停键' },
    { name: '找戒友唠两句', icon: '📞', weight: 2, desc: '两个人上头，总比一个人强' },
    { name: '看个段子冷静下', icon: '😆', weight: 4, desc: '用笑替代多巴胺' },
    { name: '收拾桌面 5 分钟', icon: '🧹', weight: 2, desc: '手上有活，心里少事' },
    { name: '闭眼小憩一会儿', icon: '😴', weight: 2, desc: '睡眠是最便宜的续命' }
  ]
  const BADGES = [
    { code: 'first_checkin', name: '戴腕带', icon: '🩺', desc: '完成第一次治疗签到', test: d => d.totalCheckins >= 1 },
    { code: 'streak_7', name: '康复新星', icon: '🌟', desc: '连续康复 7 天', test: d => d.maxStreak >= 7 },
    { code: 'survive_10', name: '刹车大师', icon: '🛑', desc: '成功扛住 10 次剧瘾', test: d => d.calmCount >= 10 },
    { code: 'streak_21', name: '准出院', icon: '🎫', desc: '连续康复 21 天', test: d => d.maxStreak >= 21 },
    { code: 'discharge_1', name: '光荣出院', icon: '🏅', desc: '成功出院一次', test: d => d.discharged >= 1 }
  ]
  const QUIZ = [
    '一天刷红果超过 4 小时？', '半夜偷偷续剧到凌晨？', '明知道第二天要早起还是停不下来？',
    '刷剧时被喊吃饭会烦躁？', '不看剧就浑身难受、坐立不安？', '已经影响到工作/学习？',
    '为刷剧推掉过朋友的邀约？', '试过戒断但没撑过三天？', '刷完一部马上点开下一部？',
    '家人说过「你中毒太深了」？'
  ]
  const QUIZ_OPTIONS = [
    { label: '完全没有', score: 0 }, { label: '偶尔这样', score: 1 }, { label: '经常这样', score: 2 },
    { label: '几乎每天', score: 3 }, { label: '已经病危了', score: 4 }
  ]
  const MODES = [
    { key: 'quit', icon: '🚫', name: '完全戒断', desc: '一刀切，剧毒不沾身。' },
    { key: 'limit', icon: '⏱️', name: '每日限额', desc: '给自己留一点做人的快乐。' },
    { key: 'taper', icon: '📉', name: '渐进减量', desc: '每周 -20%，温水煮青蛙式康复。' }
  ]
  const PUNISHMENTS = ['失败给戒友发「我又没出息了」', '往基金罐投 20 元', '给家人写 500 字检讨', '承包一周家务', '把本所分享给三个朋友']
  const JOKES = [
    '红果的编剧：这集结尾必须留悬念。我：留你个头，我要睡觉！',
    '我妈问我为什么眼睛红肿，我说剧情太感人。其实是我熬夜刷了 30 集。',
    '短剧里男主一集逆袭三次，我一集都没逆袭，只逆袭了枕头。',
    '我以为我在看剧，其实剧在看我的多巴胺。',
    '评论区都说"这剧有毒"，我：不，是我有病，且病危。'
  ]
  const FACTS = [
    '连续刷短剧 30 分钟，大脑的即时满足回路会被反复点亮——和刷短视频是同一套机制。',
    '「再看一集」的诱惑来自"未完成效应"：大脑对没结束的剧情记得更牢。',
    '把手机放到另一个房间，能显著降低"无意识拿起"的概率——物理距离是最朴素的意志力。',
    '4-7-8 呼吸法（吸 4 秒、屏 7 秒、呼 8 秒）能激活副交感神经，让冲动水平下降。',
    '戒断不是靠忍，是靠替换：用一个低成本的爽感替代高成本的爽感。'
  ]
  const FAKE_PATIENTS = [
    { name: '戒友·小林', streak: 23 }, { name: '戒友·阿May', streak: 18 }, { name: '戒友·老张', streak: 15 },
    { name: '戒友·追剧终结者', streak: 11 }, { name: '戒友·小美', streak: 9 }, { name: '戒友·匿名', streak: 6 }
  ]
  const SENSITIVE = ['加微信', '二维码', '代刷', '毒品', '自杀']
  const BASELINE = 90 // 每日刷剧基准线（分钟）

  /* ---------- 存储层 ---------- */
  const P = 'hg_'
  function get(k, def) {
    try { const v = localStorage.getItem(P + k); return v === null ? def : JSON.parse(v) }
    catch (e) { return def }
  }
  function set(k, v) {
    try { localStorage.setItem(P + k, JSON.stringify(v)) } catch (e) { /* 隐私模式内存降级：忽略 */ }
    return v
  }
  function todayKey(d) {
    d = d || new Date()
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  }

  /* ---------- 通用 UI ---------- */
  let toastTimer = null
  function toast(msg) {
    const el = document.getElementById('toast')
    el.textContent = msg
    el.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200)
  }
  function modal(title, body, actions) {
    document.getElementById('modalTitle').textContent = title
    document.getElementById('modalBody').innerHTML = body
    const box = document.getElementById('modalActions')
    box.innerHTML = ''
    ;(actions || [{ text: '知道啦' }]).forEach(a => {
      const b = document.createElement('button')
      b.className = 'btn sm' + (a.ghost ? ' ghost' : '')
      b.textContent = a.text
      b.onclick = () => { closeModal(); if (a.onClick) a.onClick() }
      box.appendChild(b)
    })
    document.getElementById('modalMask').hidden = false
  }
  function closeModal() { document.getElementById('modalMask').hidden = true }
  document.getElementById('modalMask').addEventListener('click', e => { if (e.target.id === 'modalMask') closeModal() })

  /* ---------- 统计计算 ---------- */
  function profile() { return get('profile', {}) }
  function streak() { return get('streak', 0) }
  function maxStreak() { return get('maxStreak', 0) }
  function calmCount() { return get('calmCount', 0) }
  function level() { return get('quizResult', null) }
  function savedMinutes() { return (get('ledger', [])).reduce((s, r) => s + (Number(r.minutes) || 0), 0) }
  function badgeData() {
    return {
      totalCheckins: Object.keys(get('checkins', {})).length,
      maxStreak: maxStreak(), calmCount: calmCount(), discharged: get('discharged', false) ? 1 : 0
    }
  }

  function doctorText() {
    const t = MEMES[Math.floor(Math.random() * MEMES.length)]
    return t.replace('{{streak}}', streak())
  }

  function refreshHeader() {
    const p = profile()
    document.getElementById('bedChip').textContent = '病历号 ' + (p.bedNo || '未建档') + (p.nickname ? ' · ' + p.nickname : '')
    const lv = level()
    const chip = document.getElementById('levelChip')
    chip.textContent = lv ? lv.level + '·' + (p.diagnosis || '戒断中') : '未体检'
    chip.style.background = lv ? lv.color : 'rgba(255,255,255,.28)'
  }

  /* ---------- 导航 ---------- */
  const VIEWS = {}
  let current = 'ward'
  let cleanups = []
  function cleanup() { cleanups.forEach(fn => { try { fn() } catch (e) {} }); cleanups = [] }
  function go(view) {
    cleanup()
    current = view
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view))
    const main = document.getElementById('main')
    main.innerHTML = '<div class="view">' + (VIEWS[view] ? VIEWS[view]() : '') + '</div>'
    refreshHeader()
    document.getElementById('doctorSays').textContent = doctorText()
    window.scrollTo(0, 0)
    if (VIEWS['_after_' + view]) VIEWS['_after_' + view]()
  }
  document.getElementById('tabbar').addEventListener('click', e => {
    const t = e.target.closest('.tab')
    if (t) go(t.dataset.view)
  })

  /* ============================================================
     F1 入所体检（问答 + 判级）
     ============================================================ */
  const quizState = { idx: 0, answers: [] }
  VIEWS.checkup = function () {
    if (level()) return checkupReport()
    return `
      <div class="card">
        <span class="card-tag">F1 · 入所体检</span>
        <div class="card-title">入所体检 · 中毒程度自测</div>
        <div class="muted">10 道题，诚实作答。主治医生据此给你安排病房等级（纯娱乐，不作诊断依据）。</div>
      </div>
      <div class="card green">
        <div class="section-title">第 ${quizState.idx + 1} / ${QUIZ.length} 题</div>
        <div class="card-title" style="font-size:16px">${esc(QUIZ[quizState.idx])}</div>
        <div id="quizOpts">
          ${QUIZ_OPTIONS.map((o, i) => `<div class="quiz-opt" onclick="App.quizPick(${i})"><span class="quiz-dot">◯</span><span>${esc(o.label)}</span></div>`).join('')}
        </div>
      </div>`
  }
  function checkupReport() {
    const r = level()
    return `
      <div class="card" style="border-left-color:${r.color}">
        <span class="card-tag">体检报告</span>
        <div class="report">
          <div class="report-stamp">${esc(r.level)}</div>
          <div class="report-level" style="color:${r.color}">${esc(r.level)}</div>
          <div class="report-score">症状积分：${esc(get('quizScore', 0))} 分 · ${esc(r.desc)}</div>
        </div>
        <div class="card green" style="box-shadow:none;border:1px solid var(--line)">
          <div class="muted">🩺 主治医生批注：${esc(r.meme)}</div>
        </div>
        <div class="btn-row">
          <button class="btn ghost sm" onclick="App.retakeQuiz()">重新体检</button>
          <button class="btn green sm" onclick="App.go('contract')">去签康复契约 →</button>
        </div>
      </div>`
  }
  function quizPick(i) {
    quizState.answers[quizState.idx] = QUIZ_OPTIONS[i].score
    if (quizState.idx < QUIZ.length - 1) { quizState.idx++; go('checkup'); return }
    const total = quizState.answers.reduce((a, b) => a + b, 0)
    const r = judgeLevel(total)
    set('quizScore', total); set('quizResult', r)
    const p = profile(); p.diagnosis = r.level; p.levelColor = r.color; set('profile', p)
    quizState.idx = 0; quizState.answers = []
    go('checkup')
    modal('体检完成', `<div style="text-align:center"><div style="font-size:44px">${r.code === 'critical' ? '⚠️' : '🩺'}</div>
      <div style="font-size:22px;font-weight:900;color:${r.color}">${esc(r.level)}</div>
      <div class="muted" style="margin-top:8px">${esc(r.meme)}</div></div>`,
      [{ text: '查看报告' }, { text: '去签契约', onClick: () => go('contract') }])
  }
  function judgeLevel(score) {
    if (score <= 15) return { level: '轻度', code: 'mild', color: '#3FA37A', desc: '小场面，门诊观察即可', meme: '你只是轻微上头，问题不大。' }
    if (score <= 25) return { level: '中度', code: 'moderate', color: '#F0C419', desc: '需要住院观察，按时打卡', meme: '主治医生已盯上你，每日签到跑不掉。' }
    if (score <= 33) return { level: '重度', code: 'severe', color: '#E63946', desc: '建议立即进入戒断治疗', meme: '这剧把你拿捏得明明白白，该治了。' }
    return { level: '病危', code: 'critical', color: '#8E2F3A', desc: '紧急入院，先来个 5 分钟冷静', meme: '我病危了，来看看 👀' }
  }
  function retakeQuiz() {
    modal('重新体检？', '之前的体检结果会被覆盖，病房等级将重新评定。',
      [{ text: '取消', ghost: true }, { text: '重新体检', onClick: () => { set('quizResult', null); quizState.idx = 0; quizState.answers = []; go('checkup') } }])
  }

  /* ============================================================
     F2 戒断档案与契约
     ============================================================ */
  VIEWS.contract = function () {
    const p = profile()
    const mode = p.mode || ''
    return `
      <div class="card">
        <span class="card-tag">F2 · 戒断档案</span>
        <div class="card-title">康复契约书</div>
        <div class="muted">签下它，就是你和主治医生之间的「君子协定」。反悔无效（才怪），但很有仪式感。</div>
      </div>
      <div class="card green">
        <div class="field"><label>病友昵称</label><input id="cNick" maxlength="12" placeholder="如：追剧终结者" value="${esc(p.nickname || '')}"></div>
        <div class="field"><label>床位号</label><input id="cBed" maxlength="6" placeholder="随机分配，可自拟" value="${esc(p.bedNo || String(Math.floor(Math.random() * 900) + 100))}"></div>
        <div class="section-title">治疗模式</div>
        ${MODES.map(m => `<div class="quiz-opt ${mode === m.key ? 'on' : ''}" data-mode="${m.key}"><span class="quiz-dot">${m.icon}</span><span><b>${m.name}</b><br><span class="muted">${m.desc}</span></span></div>`).join('')}
        <div class="field"><label>每日限额（分钟，仅"每日限额"模式生效）</label><input id="cLimit" type="number" min="1" max="600" value="${esc(p.dailyLimit || 30)}"></div>
        <div class="field"><label>为什么戒？（签名必备）</label><textarea id="cWhy" maxlength="120" placeholder="写句狠话，比如「再刷我是狗」">${esc(p.whyQuit || '')}</textarea></div>
        <div class="field"><label>复吸理由补充（选填）</label><input id="cReason" maxlength="80" placeholder="触发你刷剧的场景" value="${esc(p.reason || '')}"></div>
        <div class="section-title">违约惩罚（纯娱乐）</div>
        ${PUNISHMENTS.map(x => `<div class="quiz-opt ${p.pledge === x ? 'on' : ''}" data-punish="${esc(x)}"><span class="quiz-dot">📌</span><span>${esc(x)}</span></div>`).join('')}
        <button class="btn block" onclick="App.saveContract()" style="margin-top:16px">📝 签署契约并存档</button>
      </div>`
  }
  VIEWS['_after_contract'] = function () {
    document.querySelectorAll('[data-mode]').forEach(el => el.onclick = () => {
      document.querySelectorAll('[data-mode]').forEach(x => x.classList.remove('on')); el.classList.add('on')
    })
    document.querySelectorAll('[data-punish]').forEach(el => el.onclick = () => {
      document.querySelectorAll('[data-punish]').forEach(x => x.classList.remove('on')); el.classList.add('on')
    })
  }
  function saveContract() {
    const mode = document.querySelector('[data-mode].on')
    const punish = document.querySelector('[data-punish].on')
    const why = document.getElementById('cWhy').value.trim()
    if (!mode) return toast('先选个治疗模式')
    if (!why) return toast('写下你为什么戒')
    const p = profile()
    Object.assign(p, {
      nickname: document.getElementById('cNick').value.trim() || '匿名病友',
      bedNo: document.getElementById('cBed').value.trim() || '000',
      mode: mode.dataset.mode,
      dailyLimit: Math.max(1, Number(document.getElementById('cLimit').value) || 30),
      whyQuit: why,
      reason: document.getElementById('cReason').value.trim(),
      pledge: punish ? punish.dataset.punish : '',
      contractAt: Date.now()
    })
    set('profile', p)
    refreshHeader()
    modal('契约已存档', '<div style="text-align:center;font-size:36px">📜</div><div class="muted" style="text-align:center;margin-top:8px">签名生效。反悔无效（才怪），但主治医生会一直盯着你。</div>',
      [{ text: '返回病房', onClick: () => go('ward') }])
  }

  /* ============================================================
     F3 日常打卡
     ============================================================ */
  VIEWS.checkin = function () {
    const checks = get('checkins', {})
    const today = todayKey()
    const done = !!checks[today]
    const days = []
    const d = new Date()
    for (let i = 27; i >= 0; i--) {
      const dd = new Date(d.getTime() - i * 86400000)
      const key = todayKey(dd)
      days.push({ key, done: !!checks[key], label: dd.getDate() })
    }
    return `
      <div class="card green">
        <span class="card-tag">F3 · 日常打卡</span>
        <div class="card-title">今日治疗签到</div>
        <div class="stats">
          <div class="stat"><div class="stat-num">${streak()}</div><div class="stat-label">连续康复(天)</div></div>
          <div class="stat"><div class="stat-num green">${Object.keys(checks).length}</div><div class="stat-label">累计签到(天)</div></div>
          <div class="stat"><div class="stat-num green">${maxStreak()}</div><div class="stat-label">最长记录(天)</div></div>
        </div>
        <button class="btn green block ${done ? 'ghost' : ''}" onclick="App.doCheckin()" ${done ? 'disabled' : ''}>
          ${done ? '✓ 今日已签到，明天见' : '🩺 今日签到 · 领腕带积分'}
        </button>
        <div class="muted" style="margin-top:8px;text-align:center">断签会重置连续天数，但历史记录永久保留。</div>
      </div>
      <div class="card">
        <div class="section-title">近 28 天康复热力图</div>
        <div class="heatmap">${days.map(x => `<div class="heat ${x.done ? 'done' : ''}" title="${x.key}">${x.label}</div>`).join('')}</div>
        <div class="muted">康复不是冲刺，是每天来报到一次。</div>
      </div>`
  }
  function doCheckin() {
    const checks = get('checkins', {})
    const today = todayKey()
    if (checks[today]) return toast('今天已经签到过啦')
    checks[today] = true; set('checkins', checks)
    // 连续天数：昨天有签则 +1，否则从 1 开始
    const y = new Date(Date.now() - 86400000)
    const cont = !!checks[todayKey(y)]
    const s = cont ? streak() + 1 : 1
    set('streak', s)
    if (s > maxStreak()) set('maxStreak', s)
    checkBadges()
    go('checkin')
    toast(s >= 7 ? `连续 ${s} 天！反派都没你耐力强` : '签到成功，主治医生记你一笔 ✓')
  }
  function checkBadges() {
    const d = badgeData()
    const unlocked = get('badges', [])
    BADGES.forEach(b => {
      if (b.test(d) && unlocked.indexOf(b.code) < 0) {
        unlocked.push(b.code)
        setTimeout(() => toast('🎉 解锁勋章：' + b.name), 600)
      }
    })
    set('badges', unlocked)
  }

  /* ============================================================
     F4 瘾发急救包（倒计时/转盘/呼吸/暴击语录）
     ============================================================ */
  const TOTAL = 300
  let cdTimer = null, breathTimer = null
  VIEWS.emergency = function () {
    const saved = get('countdownState', null)
    counting = !!(saved && saved.endAt > Date.now())
    cdEnd = counting ? saved.endAt : 0
    return `
      <div class="card">
        <span class="card-tag">F4 · 瘾发急救包</span>
        <div class="card-title">冲动来了？先扛过这 5 分钟</div>
        <div class="muted">没有跳过按钮。离开页面再回来，倒计时仍按真实时间算——别想绕过去 😏</div>
      </div>
      <div class="card green">
        <div class="countdown">
          <div class="cd-ring ${counting ? 'counting' : ''}" id="cdRing" style="--deg:0deg">
            <div><div class="cd-time" id="cdTime">05:00</div><div class="muted">冷静倒计时</div></div>
          </div>
          <button class="btn" id="cdBtn" onclick="App.startCountdown()">🛑 开始 5 分钟冷静</button>
          <div id="cdGiveUp" style="margin-top:10px"></div>
        </div>
      </div>
      <div class="card blue">
        <div class="section-title">替代活动转盘</div>
        <div class="wheel-wrap">
          <div class="wheel-pointer">▼</div>
          <div class="wheel" id="wheel"></div>
          <div class="btn-row" style="justify-content:center"><button class="btn blue" onclick="App.spin()">🎡 转一个平替活动</button></div>
          <div id="pickResult"></div>
        </div>
      </div>
      <div class="card amber">
        <div class="section-title">清醒暴击 · 主治医生语录</div>
        <div class="card" style="box-shadow:none;border:1px solid var(--line)" id="strikeMeme">${esc(doctorText())}</div>
        <button class="btn ghost sm" onclick="App.refreshStrike()" style="margin-top:10px">换一条扎心的</button>
      </div>
      <div class="card green">
        <div class="section-title">4-7-8 呼吸引导</div>
        <div class="breath-stage">
          <div class="breath-circle" id="breathCircle"></div>
          <div class="breath-hint" id="breathHint">跟着圈圈，吸——呼——</div>
          <button class="btn green sm" id="breathBtn" onclick="App.toggleBreath()" style="margin-top:14px">开始呼吸引导</button>
        </div>
      </div>`
  }
  let counting = false, cdEnd = 0
  VIEWS['_after_emergency'] = function () {
    updateCd()
    if (counting) {
      cdTimer = setInterval(updateCd, 1000)
      cleanups.push(() => { clearInterval(cdTimer); cdTimer = null })
    }
  }
  function updateCd() {
    const t = document.getElementById('cdTime')
    if (!t) return
    if (!counting) { t.textContent = '05:00'; document.getElementById('cdRing').style.setProperty('--deg', '0deg'); return }
    const left = Math.max(0, Math.ceil((cdEnd - Date.now()) / 1000))
    const mm = String(Math.floor(left / 60)).padStart(2, '0')
    const ss = String(left % 60).padStart(2, '0')
    t.textContent = mm + ':' + ss
    document.getElementById('cdRing').style.setProperty('--deg', ((TOTAL - left) / TOTAL * 360) + 'deg')
    if (left <= 0) {
      clearInterval(cdTimer); cdTimer = null; counting = false
      set('countdownState', null)
      set('calmCount', calmCount() + 1)
      checkBadges()
      const btn = document.getElementById('cdBtn')
      if (btn) { btn.textContent = '✓ 扛住了！冲动退潮'; btn.disabled = true }
      const give = document.getElementById('cdGiveUp'); if (give) give.innerHTML = ''
      toast('冷静完成！冲动它先怂了')
    }
  }
  function startCountdown() {
    if (counting) return
    cdEnd = Date.now() + TOTAL * 1000
    set('countdownState', { startAt: Date.now(), endAt: cdEnd })
    counting = true
    const btn = document.getElementById('cdBtn')
    btn.textContent = '⏳ 冷静中…别急'; btn.disabled = true
    document.getElementById('cdRing').classList.add('counting')
    document.getElementById('cdGiveUp').innerHTML = '<button class="btn ghost sm" onclick="App.giveUp()">放弃冷静</button>'
    cdTimer = setInterval(updateCd, 1000)
    cleanups.push(() => { clearInterval(cdTimer); cdTimer = null })
    updateCd()
  }
  function giveUp() {
    modal('真要放弃？', '冲动是暂时的，再扛 5 分钟它就退潮了。放弃也不扣分，主治医生不骂人。',
      [{ text: '继续扛' }, { text: '放弃', ghost: true, onClick: () => {
        clearInterval(cdTimer); cdTimer = null; counting = false
        set('countdownState', null)
        set('giveUpCount', get('giveUpCount', 0) + 1)
        const btn = document.getElementById('cdBtn'); btn.textContent = '🛑 重新开始 5 分钟冷静'; btn.disabled = false
        document.getElementById('cdRing').classList.remove('counting')
        document.getElementById('cdGiveUp').innerHTML = ''
        updateCd()
        toast('没关系，复健随时欢迎你')
      } }])
  }
  let wheelDeg = 0, spinning = false
  function spin() {
    if (spinning) return
    spinning = true
    const total = ALTERNATIVES.reduce((s, a) => s + a.weight, 0)
    let r = Math.random() * total, idx = 0
    for (let i = 0; i < ALTERNATIVES.length; i++) { r -= ALTERNATIVES[i].weight; if (r <= 0) { idx = i; break } }
    wheelDeg += 360 * 5 + (360 - idx * (360 / ALTERNATIVES.length))
    const wheel = document.getElementById('wheel')
    wheel.style.transition = 'transform 2.6s cubic-bezier(.15,.85,.2,1)'
    wheel.style.transform = 'rotate(' + wheelDeg + 'deg)'
    document.getElementById('pickResult').innerHTML = ''
    setTimeout(() => {
      spinning = false
      const a = ALTERNATIVES[idx], mins = 5 + Math.floor(Math.random() * 11)
      document.getElementById('pickResult').innerHTML = `<div class="pick-result"><div style="font-size:28px">${a.icon}</div><b>${esc(a.name)}</b>（${mins} 分钟）<div class="muted">${esc(a.desc)}</div></div>`
    }, 2650)
  }
  function refreshStrike() { document.getElementById('strikeMeme').textContent = doctorText() }
  let breathing = false
  function toggleBreath() {
    const btn = document.getElementById('breathBtn')
    const circle = document.getElementById('breathCircle')
    const hint = document.getElementById('breathHint')
    if (breathing) {
      clearInterval(breathTimer); breathing = false
      circle.style.transform = 'scale(1)'; hint.textContent = '跟着圈圈，吸——呼——'; btn.textContent = '开始呼吸引导'
      return
    }
    breathing = true; btn.textContent = '停止呼吸引导'
    const roundStart = Date.now()
    breathTimer = setInterval(() => {
      const el = (Date.now() - roundStart) % 8000
      if (el < 4000) { circle.style.transform = 'scale(' + (1 + el / 4000 * 0.6) + ')'; hint.textContent = '吸———' }
      else { circle.style.transform = 'scale(' + (1.6 - (el - 4000) / 4000 * 0.6) + ')'; hint.textContent = '呼———' }
    }, 60)
    cleanups.push(() => { clearInterval(breathTimer); breathing = false })
  }

  /* ============================================================
     F5 时间账本
     ============================================================ */
  VIEWS.ledger = function () {
    const recs = get('ledger', [])
    const total = savedMinutes()
    const r = regain(total)
    const days = []
    const d = new Date()
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(d.getTime() - i * 86400000)
      const key = todayKey(dd)
      const m = recs.filter(x => x.date === key).reduce((s, x) => s + Number(x.minutes), 0)
      days.push({ label: ['日', '一', '二', '三', '四', '五', '六'][dd.getDay()], m })
    }
    const max = Math.max(BASELINE, ...days.map(x => x.m)) || 1
    const unlocked = get('badges', [])
    return `
      <div class="card">
        <span class="card-tag">F5 · 时间账本</span>
        <div class="card-title">我省下了多少条命</div>
        <div class="stats">
          <div class="stat"><div class="stat-num">${Math.floor(total / 60)}<small style="font-size:14px">h</small></div><div class="stat-label">累计省下</div></div>
          <div class="stat"><div class="stat-num green">${recs.length}</div><div class="stat-label">记账笔数</div></div>
          <div class="stat"><div class="stat-num green">${BASELINE}</div><div class="stat-label">日基准(分)</div></div>
        </div>
        <div class="muted">省下的时间可以折算成：</div>
        <div class="card green" style="box-shadow:none;border:1px solid var(--line);margin-top:8px">
          😴 多睡 <b>${r.sleepHours}</b> 小时 · 📖 读 <b>${r.readPages}</b> 页书 · 👨‍👩‍👧 陪家人 <b>${r.familyHours}</b> 小时
        </div>
      </div>
      <div class="card">
        <div class="section-title">记一笔</div>
        <div class="field"><label>今天忍住没刷的时间（分钟）</label><input id="lMin" type="number" min="1" max="1440" placeholder="比如 60"></div>
        <div class="field"><label>备注（选填）</label><input id="lNote" maxlength="30" placeholder="比如：想刷时去跑了步"></div>
        <button class="btn block" onclick="App.addLedger()">💰 记入账本</button>
      </div>
      <div class="card">
        <div class="section-title">近 7 天省下时间（分钟）</div>
        <div class="chart">${days.map(x => `<div class="chart-col"><div class="chart-bar ${x.m > BASELINE ? 'high' : x.m === 0 ? 'none' : ''}" style="height:${Math.max(3, x.m / max * 120)}px"></div><div class="chart-label">${x.label}</div></div>`).join('')}</div>
        <div class="muted">红线为每日基准 ${BASELINE} 分钟，超过说明今天特别能扛 💪</div>
      </div>
      <div class="card">
        <div class="section-title">康复勋章墙</div>
        <div class="badges">${BADGES.map(b => `<div class="badge ${unlocked.indexOf(b.code) >= 0 ? 'unlocked' : ''}"><div class="badge-ico">${b.icon}</div><div class="badge-name">${b.name}</div><div class="badge-desc">${b.desc}</div></div>`).join('')}</div>
      </div>`
  }
  function regain(minutes) {
    const m = Math.max(0, Number(minutes) || 0)
    return { sleepHours: (m / 60).toFixed(1), readPages: Math.floor(m / 10), familyHours: (m / 60 * 0.6).toFixed(1) }
  }
  function addLedger() {
    const m = Number(document.getElementById('lMin').value)
    if (!m || m < 1) return toast('请输入有效的分钟数')
    const recs = get('ledger', [])
    recs.push({ date: todayKey(), minutes: Math.min(1440, m), note: document.getElementById('lNote').value.trim(), at: Date.now() })
    set('ledger', recs)
    checkBadges()
    go('ledger')
    toast('已记账！又从短剧手里抢回 ' + m + ' 分钟')
  }

  /* ============================================================
     F6 替代内容（段子/冷知识/记忆游戏）
     ============================================================ */
  VIEWS.alternatives = function () {
    return `
      <div class="card">
        <span class="card-tag">F6 · 替代内容</span>
        <div class="card-title">活动室 · 用快乐替代剧毒</div>
        <div class="muted">刷剧的爽感，用更便宜的方式也能拿到。挑一个玩玩。</div>
      </div>
      <div class="card amber">
        <div class="section-title">😆 戒毒段子</div>
        <div id="jokeBox" class="card" style="box-shadow:none;border:1px solid var(--line)">${esc(JOKES[0])}</div>
        <button class="btn ghost sm" onclick="App.nextJoke()" style="margin-top:10px">再来一个</button>
      </div>
      <div class="card blue">
        <div class="section-title">📚 戒断冷知识</div>
        <div id="factBox" class="card" style="box-shadow:none;border:1px solid var(--line)">${esc(FACTS[0])}</div>
        <button class="btn ghost sm" onclick="App.nextFact()" style="margin-top:10px">换一条</button>
      </div>
      <div class="card green">
        <div class="section-title">🧠 记忆翻牌 · 治疗无聊</div>
        <div class="muted">翻开两张，找出相同的图案。</div>
        <div class="game-grid" id="gameGrid"></div>
        <div class="btn-row" style="justify-content:center"><button class="btn green sm" onclick="App.newGame()">🔄 新一局</button></div>
      </div>`
  }
  let jokeIdx = 0, factIdx = 0
  function nextJoke() { jokeIdx = (jokeIdx + 1) % JOKES.length; document.getElementById('jokeBox').textContent = JOKES[jokeIdx] }
  function nextFact() { factIdx = (factIdx + 1) % FACTS.length; document.getElementById('factBox').textContent = FACTS[factIdx] }
  const GAME_ICONS = ['🩺', '💊', '🩹', '📋', '🎫', '🏅']
  let gameState = null
  VIEWS['_after_alternatives'] = function () { newGame() }
  function newGame() {
    const deck = GAME_ICONS.concat(GAME_ICONS).sort(() => Math.random() - 0.5)
    gameState = { deck, flipped: [], matched: [], busy: false }
    renderGame()
  }
  function renderGame() {
    const grid = document.getElementById('gameGrid')
    if (!grid) return
    grid.innerHTML = gameState.deck.map((icon, i) => {
      const open = gameState.flipped.indexOf(i) >= 0 || gameState.matched.indexOf(i) >= 0
      return `<div class="game-cell ${open ? 'lit' : ''}" onclick="App.flip(${i})">${open ? icon : '❓'}</div>`
    }).join('')
  }
  function flip(i) {
    if (gameState.busy || gameState.flipped.indexOf(i) >= 0 || gameState.matched.indexOf(i) >= 0) return
    gameState.flipped.push(i)
    renderGame()
    if (gameState.flipped.length === 2) {
      gameState.busy = true
      const [a, b] = gameState.flipped
      setTimeout(() => {
        if (gameState.deck[a] === gameState.deck[b]) { gameState.matched.push(a, b); toast('配对成功！') }
        gameState.flipped = []; gameState.busy = false; renderGame()
        if (gameState.matched.length === gameState.deck.length) setTimeout(() => toast('🎉 全部配对！脑子回来了'), 300)
      }, 700)
    }
  }

  /* ============================================================
     F7 病友社区
     ============================================================ */
  VIEWS.community = function () {
    const posts = get('posts', [])
    const paired = !!get('buddy', null)
    const bud = get('buddy', null)
    const me = profile().nickname || '我'
    const rank = FAKE_PATIENTS.concat([{ name: me + '（我）', streak: streak(), me: true }]).sort((a, b) => b.streak - a.streak)
    return `
      <div class="card">
        <span class="card-tag">F7 · 病友圈</span>
        <div class="card-title">戒友互助社区</div>
        <div class="muted">这里没人嘲笑复吸，大家都是一遍遍重来的人。（内容仅本地保存，别写真实隐私）</div>
      </div>
      <div class="card green">
        <div class="field"><textarea id="postText" maxlength="140" placeholder="今天扛住了什么？吐槽主治医生也行…（≤140字）"></textarea></div>
        <button class="btn green block" onclick="App.post()">📢 发帖</button>
        <div class="btn-row">
          <button class="btn ghost sm" onclick="App.toggleBuddy()">${paired ? '✓ 已结对：' + esc(bud.name) : '🤝 找结对病友'}</button>
        </div>
      </div>
      <div class="card">
        <div class="section-title">📋 康复排行榜</div>
        ${rank.map((x, i) => `<div class="rank-row ${x.me ? 'me' : ''}"><span class="rank-no">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}</span><span class="rank-name">${esc(x.name)}</span><span class="rank-streak">${x.streak} 天</span></div>`).join('')}
      </div>
      <div class="section-title">💬 病友动态</div>
      <div id="postList">${posts.length ? posts.map(renderPost).join('') : '<div class="empty"><span class="empty-ico">💬</span>还没有帖子，来发第一条吧</div>'}</div>`
  }
  function renderPost(p) {
    return `<div class="post"><div class="post-head"><span class="post-author">${esc(p.author)}</span><span class="post-time">${esc(p.timeStr)}</span></div>
      <div class="post-content">${esc(p.content)}</div>
      <div class="post-actions"><span class="like-btn ${p.liked ? 'liked' : ''}" onclick="App.like('${p.id}')">${p.liked ? '❤️' : '🤍'} ${p.likes}</span></div></div>`
  }
  function post() {
    const el = document.getElementById('postText')
    const content = el.value.trim()
    if (!content) return toast('写点什么再发')
    if (SENSITIVE.some(w => content.indexOf(w) >= 0)) return toast('内容含敏感词，请换个说法～')
    const posts = get('posts', [])
    posts.unshift({
      id: String(Date.now()), author: profile().nickname || '匿名病友', content,
      timeStr: new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      likes: 0, liked: false
    })
    set('posts', posts)
    go('community')
    toast('发帖成功，戒友会来捧场的')
  }
  function like(id) {
    const posts = get('posts', [])
    const p = posts.find(x => x.id === id)
    if (!p) return
    p.liked = !p.liked; p.likes += p.liked ? 1 : -1
    set('posts', posts)
    go('community')
  }
  function toggleBuddy() {
    const cur = get('buddy', null)
    if (cur) { set('buddy', null); go('community'); return toast('已解除结对') }
    const cand = FAKE_PATIENTS[Math.floor(Math.random() * FAKE_PATIENTS.length)]
    modal('结对病友', `<div style="text-align:center"><div style="font-size:40px">🤝</div>为你匹配到 <b>${esc(cand.name)}</b>（连续 ${cand.streak} 天）<div class="muted" style="margin-top:8px">这是虚拟病友，纯娱乐陪伴，不产生真实联系。</div></div>`,
      [{ text: '再想想', ghost: true }, { text: '确认结对', onClick: () => { set('buddy', cand); go('community'); toast('结对成功，互相监督！') } }])
  }

  /* ============================================================
     F8 出院系统
     ============================================================ */
  const NEED_DAYS = 7 // 本地演示门槛（云端默认 21 天）
  VIEWS.discharge = function () {
    const s = streak(), pct = Math.min(100, Math.round(s / NEED_DAYS * 100)), can = s >= NEED_DAYS
    const p = profile()
    const date = todayKey()
    return `
      <div class="card">
        <span class="card-tag">F8 · 出院系统</span>
        <div class="card-title">出院申请</div>
        <div class="muted">连续康复满 ${NEED_DAYS} 天即可申请出院，领取你的出院证明。</div>
        <div class="stats">
          <div class="stat"><div class="stat-num">${s}</div><div class="stat-label">当前连续(天)</div></div>
          <div class="stat"><div class="stat-num green">${NEED_DAYS}</div><div class="stat-label">出院门槛(天)</div></div>
          <div class="stat"><div class="stat-num green">${get('relapseCount', 0)}</div><div class="stat-label">复健次数</div></div>
        </div>
        <div class="prog"><div class="prog-fill green" style="width:${pct}%"></div></div>
        <div class="muted" style="text-align:center">康复进度 ${pct}%</div>
        <button class="btn green block" onclick="App.dischargeCert()" style="margin-top:14px" ${can ? '' : 'disabled'}>
          ${can ? '🎓 申请出院 · 领证明' : '还差 ' + (NEED_DAYS - s) + ' 天，别急'}
        </button>
      </div>
      ${get('discharged', false) ? `<div class="card amber" style="border:3px solid var(--accent)">
        <div class="report-stamp" style="border-color:var(--primary);color:var(--primary)">已出院</div>
        <div class="card-title">🎉 出院证明</div>
        <div style="font-size:14px;line-height:2">
          兹证明 <b>${esc(p.nickname || '匿名病友')}</b>（病历号 ${esc(p.bedNo || '000')}）<br>
          于 ${date} 完成康复疗程，连续签到 ${s} 天，<br>
          成功摆脱剧毒控制，准予出院。<br>
          <span class="muted">—— 红果戒毒所 · 主治医生签发</span>
        </div>
      </div>` : ''}
      <div class="card blue">
        <div class="section-title">复健通道</div>
        <div class="muted">复吸不羞辱。重新入所会清零连续天数，但历史记录和最长记录永久保留。</div>
        <button class="btn ghost sm" onclick="App.rehab()" style="margin-top:10px">🔄 我要复健 · 重新入所</button>
      </div>`
  }
  function dischargeCert() {
    if (streak() < NEED_DAYS) return toast('还差 ' + (NEED_DAYS - streak()) + ' 天')
    set('discharged', true)
    checkBadges()
    go('discharge')
    modal('恭喜出院！', '<div style="text-align:center;font-size:46px">🎓</div><div class="muted" style="text-align:center;margin-top:8px">出院证明已生成！你终于不用靠短剧续命了。</div>',
      [{ text: '查看证明' }])
  }
  function rehab() {
    modal('复健通道', '确认后连续天数清零，但你的康复记录会保留——从头再来，也是一种勇敢。',
      [{ text: '取消', ghost: true }, { text: '重新入所', onClick: () => {
        set('streak', 0); set('discharged', false); set('relapseCount', get('relapseCount', 0) + 1)
        go('discharge'); toast('已重新入所，主治医生继续接诊')
      } }])
  }

  /* ============================================================
     F9 提醒预警 + 设置
     ============================================================ */
  VIEWS.settings = function () {
    const s = get('settings', {})
    return `
      <div class="card">
        <span class="card-tag">F9 · 提醒预警</span>
        <div class="card-title">夜间岗设置</div>
        <div class="muted">网页版无法主动推送，但你可以在高危时段打开本页，主治医生会在此守夜。</div>
      </div>
      <div class="card blue">
        <div class="field"><label>高危时段开始</label><input id="sStart" type="time" value="${esc(s.highRiskStart || '23:00')}"></div>
        <div class="field"><label>高危时段结束</label><input id="sEnd" type="time" value="${esc(s.highRiskEnd || '02:00')}"></div>
        <div class="field"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="sSleep" ${s.remindSleep !== false ? 'checked' : ''} style="width:auto"> 睡前提醒（打开本页时提示）</label></div>
        <div class="field"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="sCheckin" ${s.remindCheckin !== false ? 'checked' : ''} style="width:auto"> 打卡提醒</label></div>
        <div class="field"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="sMotion" ${s.reduceMotion ? 'checked' : ''} style="width:auto"> 减少动画</label></div>
        <button class="btn block" onclick="App.saveSettings()">💾 保存设置</button>
      </div>
      <div class="card amber">
        <div class="section-title">⚠️ 高危时段提示</div>
        <div id="highRiskBox" class="muted">正在检测…</div>
      </div>`
  }
  VIEWS['_after_settings'] = function () { updateHighRisk() }
  function inHighRisk() {
    const s = get('settings', {})
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    const parse = t => { const p = (t || '').split(':'); return Number(p[0]) * 60 + Number(p[1]) }
    const a = parse(s.highRiskStart || '23:00'), b = parse(s.highRiskEnd || '02:00')
    return a <= b ? (cur >= a && cur < b) : (cur >= a || cur < b)
  }
  function updateHighRisk() {
    const box = document.getElementById('highRiskBox')
    if (!box) return
    if (inHighRisk()) box.innerHTML = '<b style="color:var(--brand)">🌙 现在是高危时段！半夜刷剧最上头，先来个 5 分钟冷静吧。</b>'
    else box.innerHTML = '✅ 当前不在高危时段，继续保持。'
  }
  function saveSettings() {
    const s = {
      highRiskStart: document.getElementById('sStart').value,
      highRiskEnd: document.getElementById('sEnd').value,
      remindSleep: document.getElementById('sSleep').checked,
      remindCheckin: document.getElementById('sCheckin').checked,
      reduceMotion: document.getElementById('sMotion').checked
    }
    set('settings', s)
    document.body.classList.toggle('reduce-motion', s.reduceMotion)
    updateHighRisk()
    toast('设置已保存，夜间岗已安排')
  }

  /* ============================================================
     "我的" + 病房首页
     ============================================================ */
  VIEWS.me = function () {
    const p = profile(), lv = level(), d = badgeData()
    return `
      <div class="card">
        <span class="card-tag">我的 · 病历档案</span>
        <div class="wristband">
          <div class="wb-name">${esc(p.nickname || '匿名病友')}</div>
          <div class="wb-meta">病历号 ${esc(p.bedNo || '000')} · ${lv ? esc(lv.level) : '未体检'}</div>
          <div class="wb-status">${p.mode ? esc(MODES.find(m => m.key === p.mode) ? MODES.find(m => m.key === p.mode).name : '戒断中') : '未签契约'}</div>
        </div>
        ${p.whyQuit ? `<div class="card green" style="box-shadow:none;border:1px solid var(--line)"><div class="muted">签名：${esc(p.whyQuit)}</div>${p.pledge ? `<div class="muted" style="margin-top:6px">违约惩罚：${esc(p.pledge)}</div>` : ''}</div>` : '<div class="muted">还没签契约，去「病房 → 康复契约」签一个吧。</div>'}
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-num">${d.totalCheckins}</div><div class="stat-label">签到天数</div></div>
        <div class="stat"><div class="stat-num green">${d.calmCount}</div><div class="stat-label">扛住次数</div></div>
        <div class="stat"><div class="stat-num green">${get('badges', []).length}/${BADGES.length}</div><div class="stat-label">勋章收集</div></div>
      </div>
      <div class="card">
        <div class="section-title">快捷入口</div>
        <div class="btn-row">
          <button class="btn ghost sm" onclick="App.go('checkup')">🩺 体检报告</button>
          <button class="btn ghost sm" onclick="App.go('contract')">📜 康复契约</button>
          <button class="btn ghost sm" onclick="App.go('settings')">⚙️ 提醒设置</button>
          <button class="btn ghost sm" onclick="App.go('discharge')">🎓 出院系统</button>
        </div>
      </div>
      <div class="card blue">
        <div class="section-title">⚠️ 数据管理</div>
        <div class="muted">所有数据仅存于此浏览器，不会上传。清空后不可恢复。</div>
        <button class="btn ghost sm" onclick="App.clearData()" style="margin-top:10px">🗑 清空所有数据</button>
      </div>
      <div class="muted" style="text-align:center;margin-top:20px">红果戒毒所 · 娱乐向 · 主治医生提示：本所不能监控红果 App，靠的是你自己 😏</div>`
  }
  function clearData() {
    modal('确认清空？', '这会删除所有体检、打卡、账本、帖子数据，且不可恢复。',
      [{ text: '取消', ghost: true }, { text: '确认清空', onClick: () => {
        Object.keys(localStorage).filter(k => k.indexOf(P) === 0).forEach(k => localStorage.removeItem(k))
        quizState.idx = 0; quizState.answers = []
        go('ward'); toast('已清空，欢迎重新入所')
      } }])
  }

  VIEWS.ward = function () {
    const p = profile(), lv = level(), checks = get('checkins', {}), done = !!checks[todayKey()]
    const s = streak(), need = NEED_DAYS, pct = Math.min(100, Math.round(s / need * 100))
    const entries = [
      { ico: '🩺', name: '入所体检', view: 'checkup' },
      { ico: '📜', name: '康复契约', view: 'contract' },
      { ico: '✅', name: '每日打卡', view: 'checkin' },
      { ico: '🆘', name: '瘾发急救', view: 'emergency' },
      { ico: '📒', name: '时间账本', view: 'ledger' },
      { ico: '🎮', name: '活动室', view: 'alternatives' },
      { ico: '💬', name: '病友圈', view: 'community' },
      { ico: '🎓', name: '出院系统', view: 'discharge' },
      { ico: '⚙️', name: '提醒设置', view: 'settings' }
    ]
    return `
      <div class="wristband">
        <div class="wb-name">${esc(p.nickname || '欢迎入所，病友')}</div>
        <div class="wb-meta">病历号 ${esc(p.bedNo || '--')} · ${lv ? esc(lv.level) + '囚' : '待体检'}</div>
        <div class="wb-status"><span class="light ${inHighRisk() ? 'danger' : ''}"></span>${inHighRisk() ? '高危时段 · 主治医生值班中' : '状态稳定 · 查房正常'}</div>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-num">${s}</div><div class="stat-label">连续康复(天)</div></div>
        <div class="stat"><div class="stat-num green">${calmCount()}</div><div class="stat-label">扛住剧瘾(次)</div></div>
        <div class="stat"><div class="stat-num green">${Math.floor(savedMinutes() / 60)}h</div><div class="stat-label">省下时间</div></div>
      </div>
      <button class="btn ${done ? 'ghost' : ''} block" onclick="App.go('checkin')" ${done ? 'disabled' : ''}>
        ${done ? '✓ 今日已签到' : '🩺 今日签到 · 领腕带积分'}
      </button>
      <div class="section-title">出院进度</div>
      <div class="card green" style="margin-top:0">
        <div class="muted">距离出院还差 ${Math.max(0, need - s)} 天</div>
        <div class="prog"><div class="prog-fill green" style="width:${pct}%"></div></div>
        <div class="muted" style="text-align:center">${pct}% · ${s >= need ? '可以出院啦！' : '康复不是冲刺，慢慢来'}</div>
      </div>
      <div class="section-title">诊疗科室 · 九大模块</div>
      <div class="entries">${entries.map(e => `<div class="entry" onclick="App.go('${e.view}')"><span class="entry-ico">${e.ico}</span><span class="entry-name">${e.name}</span></div>`).join('')}</div>
      <div class="card amber">
        <div class="section-title">🆘 冲动来了？</div>
        <div class="muted">别硬扛，来「瘾发急救」转个转盘、做个呼吸，5 分钟就过去了。</div>
        <button class="btn sm" onclick="App.go('emergency')" style="margin-top:10px">立即进入急救包 →</button>
      </div>`
  }

  /* ---------- 导出 App 全局 ---------- */
  window.App = {
    go, modal, closeModal, toast,
    quizPick, retakeQuiz, saveContract,
    doCheckin, startCountdown, giveUp, spin, refreshStrike, toggleBreath,
    addLedger, nextJoke, nextFact, newGame, flip,
    post, like, toggleBuddy, dischargeCert, rehab, saveSettings, clearData
  }

  /* ---------- 启动 ---------- */
  document.body.classList.toggle('reduce-motion', !!(get('settings', {}).reduceMotion))
  go('ward')
})()
