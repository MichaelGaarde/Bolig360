/* Bolig360 kundeapp – prototype med testdata og mock-login. */
(function () {
  'use strict';

  // ---------- Mock-login (kun til prototypen) ----------
  var MOCK_USER = 'test';
  var MOCK_PASS = 'test';
  var STORE_KEY = 'bolig360-app-v1';
  var EXTRA_RATE = 750; // kr. pr. arbejdstime inkl. moms, illustrativ pris fra forretningsplanen

  // ---------- Testdata ----------
  var PLANS = {
    basis: { name: 'Basis', price: 399, visits: 1, hours: 0 },
    plus: { name: 'Plus', price: 599, visits: 2, hours: 2 },
    total: { name: 'Total', price: 999, visits: 2, hours: 5 }
  };

  var HOME = {
    address: 'Lindevænget 24',
    label: 'Min bolig',
    type: 'Parcelhus',
    area: '148 m²',
    built: '1978',
    heating: 'Fjernvarme',
    scope: 'Bolig, terrasse og carport'
  };

  var VISITS = [
    {
      id: 'foraar',
      season: 'foraar',
      title: 'Forårsservice',
      date: '23. april',
      weekday: 'Torsdag',
      time: 'kl. 09.00-11.00',
      status: 'done',
      technician: 'Mads Holm',
      company: 'Bolig360 Service',
      duration: 'Gennemgang 1 t · småservice 2 t',
      done: [
        { text: 'Gennemgang efter tjekliste (9 områder)', hours: null },
        { text: 'Opsætning af hylde i entré', hours: 1 },
        { text: 'Justering af køkkenlåger og smøring af terrassedør', hours: 1 }
      ],
      materials: 'Rawlplugs og skruer – 45 kr. (godkendt 23. april)',
      photos: ['Tagrende nord', 'Fuge i bad', 'Hylde – før', 'Hylde – efter', 'Terrassedør', 'Sokkel syd'],
      observations: [
        { title: 'Tagrende mod nord delvist tilstoppet', area: 'Tagrender og nedløb', prio: 'soon', prioText: 'Inden vinter', action: 'Anbefalet: tagrenderens. Se tilbud.' },
        { title: 'Fuge ved brusekabine er mørnet', area: 'Toiletter og vandlåse', prio: 'watch', prioText: 'Inden for 12 mdr.', action: 'Anbefalet: omfugning. Vi ser på den igen ved næste besøg.' },
        { title: 'Vinduer og døre fungerer normalt', area: 'Vinduer og døre', prio: 'ok', prioText: 'Ingen handling', action: 'Terrassedør smurt under besøget.' }
      ]
    },
    {
      id: 'efteraar',
      season: 'efteraar',
      title: 'Efterårsservice',
      date: '12. november',
      weekday: 'Torsdag',
      time: 'kl. 09.00-11.00',
      status: 'confirmed',
      technician: 'Mads Holm',
      company: 'Bolig360 Service'
    }
  ];

  var CHECKLIST = ['Toiletter og vandlåse', 'Varme', 'VVS', 'El', 'Klimaskærm', 'Vinduer og døre', 'Tagrender og nedløb', 'Sandfangsbrønd', 'Terrasse og fliser'];

  var QUOTES = [
    { id: 'q1', title: 'Tagrenderens, nordside', price: 1200, from: 'Bolig360 Service', note: 'Udføres ved efterårsservice 12. november. Fast pris inkl. moms.' }
  ];

  var ADDONS = [
    { id: 'vindue', icon: 'sparkle', title: 'Vinduespudsning', sub: 'Fast månedligt tillæg' },
    { id: 'tagrende', icon: 'drop', title: 'Tagrenderens', sub: 'Sæsonaftale eller enkeltopgave' },
    { id: 'terrasse', icon: 'grid', title: 'Terrassevask og behandling', sub: 'Årligt tilvalg efter besigtigelse' },
    { id: 'fliser', icon: 'grid', title: 'Fliserens', sub: 'Konkret tilbud' },
    { id: 'varme', icon: 'flame', title: 'Varme- og ventilationsservice', sub: 'Specialistabonnement' },
    { id: 'have', icon: 'leaf', title: 'Have- og vinterservice', sub: 'Særskilt driftsaftale' }
  ];

  var SEASONS = [['vinter', 'Vinter'], ['foraar', 'Forår'], ['sommer', 'Sommer'], ['efteraar', 'Efterår']];
  var TABS = [['overblik', 'Overblik', 'home'], ['servicebog', 'Servicebog', 'book'], ['bestil', 'Bestil', 'plus'], ['aftale', 'Min aftale', 'user']];

  // ---------- Tilstand ----------
  var state = load() || {};
  state = Object.assign({
    auth: false, mode: 'kunde', tab: 'overblik', stab: 'idag', view: null, season: 'efteraar', plan: 'total',
    usedHours: 2, tasks: [], quotes: {}, addons: {}, notifSeen: false, draftHours: 1
  }, state);
  state.view = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* appen virker uden lagring */ }
  }

  // ---------- Hjælpere ----------
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hrs(n) {
    var s = String(n).replace('.', ',');
    return s + (n === 1 ? ' time' : ' timer');
  }
  function kr(n) { return n.toLocaleString('da-DK') + ' kr.'; }
  function visit(id) { return VISITS.filter(function (v) { return v.id === id; })[0]; }
  function nextVisit() { return VISITS.filter(function (v) { return v.status !== 'done'; })[0]; }

  function hours() {
    var pool = PLANS[state.plan].hours;
    var requested = state.tasks.reduce(function (a, t) { return a + t.hours; }, 0);
    var free = Math.max(0, pool - state.usedHours);
    var reserved = Math.min(free, requested);
    return { pool: pool, used: state.usedHours, reserved: reserved, left: free - reserved, extra: requested - reserved };
  }

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M12 6c-2-1.5-4.5-2-8-2v14c3.500 0 6 .5 8 2 2-1.500 4.500-2 8-2V4c-3.500 0-6 .5-8 2zM12 6v14"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.500-6 8-6s8 2 8 6"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.500 2h-15zM10 21h4"/>',
    pin: '<path d="M12 21s7-6.200 7-11a7 7 0 1 0-14 0c0 4.800 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    back: '<path d="m15 6-6 6 6 6"/>',
    arrow: '<path d="M7 17 17 7M9 7h8v8"/>',
    cal: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8.500 12 2.500 2.500 4.500-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    file: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6"/>',
    doc: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
    wrench: '<path d="M14.500 6a4 4 0 0 0 5 5L11 19.500a2.100 2.100 0 0 1-3-3L16.500 8"/>',
    sparkle: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    drop: '<path d="M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z"/>',
    grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
    flame: '<path d="M12 3c1 4 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
    leaf: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 14zM5 19l7-7"/>',
    out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  function icon(name, size) {
    size = size || 22;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.600" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  // ---------- Fælles byggesten ----------
  function topbar(staff) {
    var right = staff ? '<button class="iconbtn" data-act="s-akut" aria-label="Akut fare">' + icon('alert', 20) + '</button>' :
      '<button class="iconbtn" data-act="notifs" aria-label="Notifikationer">' + icon('bell', 20) + (state.notifSeen ? '' : '<i class="dot"></i>') + '</button>';
    return '<div class="topbar">' + brand() + right + '</div>' +
      (staff ? '' : '<button class="address" data-act="home-info">' + icon('pin', 18) + '<span class="grow">' + HOME.address + ' · ' + HOME.label + '</span>' + icon('down', 18) + '</button>');
  }
  function brand() {
    return '<div class="brand"><div class="mark">' + icon('home', 20) + '</div><span>bolig<b>360</b></span></div>';
  }
  function backbar(title) {
    return '<div class="backbar"><button class="iconbtn" data-act="back" aria-label="Tilbage">' + icon('back', 20) + '</button><h2>' + title + '</h2></div>';
  }
  function planCard() {
    var p = PLANS[state.plan], h = hours();
    var body;
    if (!p.hours) {
      body = '<p class="small muted" style="margin-top:6px">1 årligt besøg. Småservice kan tilkøbes for ' + EXTRA_RATE + ' kr. pr. time.</p>';
    } else {
      body = '<p class="small muted" style="margin-top:6px">' + p.visits + ' besøg og ' + hrs(p.hours) + 's småservice pr. år</p>' +
        '<div class="bar"><i style="width:' + (h.used / p.hours * 100) + '%"></i><i class="reserved" style="width:' + (h.reserved / p.hours * 100) + '%"></i></div>' +
        '<div class="between small"><span class="muted">' + hrs(h.used) + ' brugt' + (h.reserved ? ' · ' + hrs(h.reserved) + ' reserveret' : '') + '</span><b>' + hrs(h.left) + ' tilbage</b></div>';
    }
    return '<div class="card"><div class="between"><h3>Din ' + p.name + '-pakke</h3><span class="pill">' + p.price + ' kr./md.</span></div>' + body + '</div>';
  }
  function taskList(removable) {
    if (!state.tasks.length) return '<div class="empty">Ingen opgaver tilføjet endnu.</div>';
    return '<div class="list">' + state.tasks.map(function (t) {
      return '<div><div class="ico">' + icon('wrench', 18) + '</div><div class="grow"><div class="t">' + esc(t.text) + '</div><div class="s">Ca. ' + hrs(t.hours) + '</div></div>' +
        (removable ? '<button class="iconbtn" style="width:36px;height:36px;background:var(--mint-soft)" data-act="task-remove" data-id="' + t.id + '" aria-label="Fjern opgave">' + icon('close', 16) + '</button>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function extraNote() {
    var h = hours();
    if (!h.extra) return '';
    return '<div class="note" style="margin-top:12px">' + icon('info', 18) + '<span>' + hrs(h.extra) + ' ligger ud over din pulje. Det koster ' + kr(h.extra * EXTRA_RATE) + ' inkl. moms, og du får et tilbud til godkendelse, før vi udfører noget.</span></div>';
  }

  // ---------- Skærme ----------
  var LOGIN_TITLE = { kunde: 'Log ind på<br>din bolig.', staff: 'Log ind på<br>din rute.' };
  function vLogin() {
    var modes = STAFF ? '<div class="mode" role="tablist" aria-label="Log ind som">' + [['kunde', 'Kunde'], ['staff', 'Medarbejder']].map(function (m) {
      return '<button type="button" data-act="mode" data-id="' + m[0] + '" class="' + (state.mode === m[0] ? 'on' : '') + '">' + m[1] + '</button>';
    }).join('') + '</div>' : '';
    return '<div class="login">' + brand() +
      '<div class="eyebrow">Velkommen</div><h1 class="headline" id="login-title">' + LOGIN_TITLE[isStaff() ? 'staff' : 'kunde'] + '</h1>' + modes +
      '<form id="login-form" autocomplete="off">' +
      '<label class="field"><span>Brugernavn</span><input id="login-user" autocapitalize="none" spellcheck="false"></label>' +
      '<label class="field"><span>Adgangskode</span><input id="login-pass" type="password"></label>' +
      '<p class="error" id="login-error" hidden>Forkert brugernavn eller adgangskode.</p>' +
      '<button class="btn" type="submit">Log ind</button></form>' +
      '<p class="hint small muted">Prototype · testlogin: test / test</p></div>';
  }

  function vOverblik() {
    var n = nextVisit();
    var hero = n ? '<button class="hero" data-act="open-visit" data-id="' + n.id + '">' +
      '<div class="eyebrow">Næste servicebesøg</div>' +
      '<div class="between" style="align-items:flex-start"><div><div class="date">' + n.date + '</div><div class="sub">' + n.title + '</div><div class="when">' + n.weekday + ' · ' + n.time + '</div></div><div class="cal">' + icon('cal', 20) + '</div></div>' +
      '<div class="between foot"><span class="row" style="gap:6px">' + icon('check', 18) + 'Bekræftet</span><span class="go">Se besøget ' + icon('arrow', 18) + '</span></div></button>' : '';

    return topbar() +
      '<div class="eyebrow">Godt at være hjemme</div><h1 class="headline">Din bolig.<br>I gode hænder.</h1>' + hero +
      '<div class="tiles"><button class="tile" data-act="tab" data-id="servicebog">' + icon('book') + '<span>Åbn servicebogen</span></button>' +
      '<button class="tile" data-act="tab" data-id="bestil">' + icon('plus') + '<span>Tilføj en opgave</span></button></div>' +
      '<div style="margin-top:16px">' + planCard() + '</div>' +
      '<h2 class="section-title">Din serviceplan · 2026</h2>' + seasonPlan();
  }

  function seasonPlan() {
    var tabs = '<div class="seasons">' + SEASONS.map(function (s) {
      return '<button data-act="season" data-id="' + s[0] + '" class="' + (state.season === s[0] ? 'on' : '') + '">' + s[1] + '</button>';
    }).join('') + '</div>';
    var items = VISITS.filter(function (v) { return v.season === state.season; });
    if (!items.length) return tabs + '<div class="empty">Ingen planlagte besøg i denne sæson.<br>Din pakke har besøg forår og efterår.</div>';
    return tabs + '<div class="timeline">' + items.map(function (v) {
      var done = v.status === 'done';
      return '<div class="tl-item ' + (done ? '' : 'next') + '"><div class="eyebrow">' + v.date + ' · ' + (done ? 'Gennemført' : 'Næste besøg') + '</div>' +
        '<button class="card" data-act="' + (done ? 'open-report' : 'open-visit') + '" data-id="' + v.id + '"><div class="between"><div><h3>' + v.title + '</h3>' +
        '<p class="small muted" style="margin-top:4px">' + (done ? 'Rapport og billeder er klar' : v.time.replace('kl.', 'Kl.') + ' · bekræftet') + '</p></div><span class="chev">' + icon(done ? 'arrow' : 'right', 18) + '</span></div></button></div>';
    }).join('') + '</div>';
  }

  function vVisit(v) {
    return backbar(v.title) +
      '<div class="hero" style="margin-bottom:16px"><div class="eyebrow">' + v.weekday + ' · ' + v.time + '</div><div class="date">' + v.date + '</div>' +
      '<div class="foot row" style="gap:6px">' + icon('check', 18) + 'Bekræftet · ' + v.technician + ', ' + v.company + '</div></div>' +
      '<h2 class="section-title">Dine opgaver til besøget</h2>' + taskList(true) + extraNote() +
      '<button class="btn soft" style="margin-top:12px" data-act="tab" data-id="bestil">' + icon('plus', 20) + 'Tilføj en opgave til besøget</button>' +
      '<h2 class="section-title">Gennemgangen omfatter</h2>' +
      '<div class="list">' + CHECKLIST.map(function (c) { return '<div><span style="color:var(--green)">' + icon('check', 18) + '</span><span class="grow t" style="font-weight:400">' + c + '</span></div>'; }).join('') + '</div>' +
      '<div class="note" style="margin-top:16px">' + icon('info', 18) + '<span>Gennemgangen er et servicebesøg med observationer af synlige og tilgængelige dele. Den erstatter ikke en tilstandsrapport eller lovpligtige eftersyn.</span></div>' +
      '<button class="btn ghost" style="margin-top:16px" data-act="reschedule">Foreslå et andet tidspunkt</button>';
  }

  function prioPill(o) {
    var cls = o.prio === 'soon' ? 'warn' : o.prio === 'ok' ? '' : 'plain';
    return '<span class="pill ' + cls + '">' + o.prioText + '</span>';
  }

  function vReport(v) {
    return backbar('Rapport') +
      '<div class="eyebrow">' + v.date + ' 2026 · Gennemført</div><h1 class="headline" style="margin-bottom:16px">' + v.title + '</h1>' +
      '<div class="card"><div class="kv"><span>Udført af</span><span>' + v.technician + '</span></div><div class="kv"><span>Virksomhed</span><span>' + v.company + '</span></div>' +
      '<div class="kv"><span>Tidsforbrug</span><span>' + v.duration + '</span></div><div class="kv"><span>Materialer</span><span>' + v.materials + '</span></div></div>' +
      '<h2 class="section-title">Udført arbejde</h2><div class="list">' + v.done.map(function (d) {
        return '<div><span style="color:var(--green)">' + icon('check', 18) + '</span><span class="grow">' + d.text + '</span>' + (d.hours ? '<span class="small muted">' + hrs(d.hours) + '</span>' : '') + '</div>';
      }).join('') + '</div>' +
      '<h2 class="section-title">Observationer</h2><div class="stack">' + v.observations.map(function (o) {
        return '<div class="card"><div class="between" style="align-items:flex-start"><h3>' + o.title + '</h3>' + prioPill(o) + '</div><p class="small muted" style="margin-top:6px">' + o.area + '</p><p class="small" style="margin-top:8px">' + o.action + '</p></div>';
      }).join('') + '</div>' +
      '<h2 class="section-title">Billeder</h2><div class="photos">' + v.photos.map(function (p) { return '<div class="photo">' + p + '</div>'; }).join('') + '</div>';
  }

  function quoteCard(q) {
    var st = state.quotes[q.id];
    var foot = st === 'approved' ? '<span class="pill">' + icon('check', 14) + 'Godkendt</span>' :
      st === 'declined' ? '<span class="pill plain">Afvist</span>' :
        '<div class="row" style="margin-top:14px"><button class="btn sm" data-act="quote" data-id="' + q.id + '" data-val="approved">Godkend</button><button class="btn sm ghost" data-act="quote" data-id="' + q.id + '" data-val="declined">Afvis</button></div>';
    return '<div class="card"><div class="between" style="align-items:flex-start"><div><h3>' + q.title + '</h3><p class="small muted" style="margin-top:4px">' + q.from + '</p></div><b>' + kr(q.price) + '</b></div>' +
      '<p class="small" style="margin:10px 0 ' + (st ? '12px' : '0') + '">' + q.note + '</p>' + foot + '</div>';
  }

  function vServicebog() {
    var done = VISITS.filter(function (v) { return v.status === 'done'; });
    var obs = [];
    done.forEach(function (v) { v.observations.forEach(function (o) { if (o.prio !== 'ok') obs.push(o); }); });
    return topbar() + '<div class="eyebrow">Servicebog</div><h1 class="headline">Alt om boligen.<br>Samlet ét sted.</h1>' +
      '<h2 class="section-title" style="margin-top:0">Tilbud til godkendelse</h2><div class="stack">' + QUOTES.map(quoteCard).join('') + '</div>' +
      '<h2 class="section-title">Åbne observationer</h2><div class="list">' + obs.map(function (o) {
        return '<button data-act="open-report" data-id="foraar"><div class="grow"><div class="t">' + o.title + '</div><div class="s">' + o.area + '</div></div>' + prioPill(o) + '</button>';
      }).join('') + '</div>' +
      '<h2 class="section-title">Besøg og rapporter</h2><div class="list">' + done.map(function (v) {
        return '<button data-act="open-report" data-id="' + v.id + '"><div class="ico">' + icon('file', 18) + '</div><div class="grow"><div class="t">' + v.title + '</div><div class="s">' + v.date + ' 2026 · rapport og ' + v.photos.length + ' billeder</div></div><span class="chev">' + icon('right', 18) + '</span></button>';
      }).join('') + '</div>' +
      '<h2 class="section-title">Boligen</h2><div class="card"><div class="kv"><span>Adresse</span><span>' + HOME.address + '</span></div><div class="kv"><span>Type</span><span>' + HOME.type + ' · ' + HOME.area + '</span></div>' +
      '<div class="kv"><span>Opført</span><span>' + HOME.built + '</span></div><div class="kv"><span>Varme</span><span>' + HOME.heating + '</span></div><div class="kv"><span>Omfattet</span><span>' + HOME.scope + '</span></div></div>' +
      '<button class="btn ghost" style="margin-top:16px" data-act="export">' + icon('doc', 20) + 'Eksportér servicehistorik</button>';
  }

  function vBestil() {
    var n = nextVisit(), p = PLANS[state.plan], h = hours();
    var options = [0.5, 1, 1.5, 2];
    return topbar() + '<div class="eyebrow">Bestil</div><h1 class="headline">Hvad skal vi<br>hjælpe med?</h1>' +
      '<div class="card"><div class="between"><h3>Småservice til næste besøg</h3></div><p class="small muted" style="margin:6px 0 16px">' + n.title + ' · ' + n.date + ' · ' +
      (p.hours ? hrs(h.left) + ' tilbage i din pulje' : 'tilkøb for ' + EXTRA_RATE + ' kr. pr. time') + '</p>' +
      '<form id="task-form"><label class="field"><span>Beskriv opgaven</span><textarea id="task-text" maxlength="200" placeholder="Fx ophængning af spejl i gangen"></textarea></label>' +
      '<div class="field"><span>Anslået tid</span><div class="chips">' + options.map(function (o) {
        return '<button type="button" data-act="draft-hours" data-id="' + o + '" class="' + (state.draftHours === o ? 'on' : '') + '">' + hrs(o) + '</button>';
      }).join('') + '</div></div>' +
      '<p class="error" id="task-error" hidden>Skriv kort, hvad opgaven går ud på.</p>' +
      '<button class="btn" type="submit">' + icon('plus', 20) + 'Tilføj til besøget</button></form></div>' +
      (state.tasks.length ? '<h2 class="section-title">Tilføjet til ' + n.date + '</h2>' + taskList(true) + extraNote() : '') +
      '<div class="note" style="margin-top:16px">' + icon('info', 18) + '<span>Småservice er mindre opgaver som ophængning, justering og smøring. Materialer og arbejde, der kræver autorisation, aftales særskilt og skal altid godkendes af dig først.</span></div>' +
      '<h2 class="section-title">Tilvalg</h2><div class="list">' + ADDONS.map(function (a) {
        var asked = state.addons[a.id];
        return '<div><div class="ico">' + icon(a.icon, 18) + '</div><div class="grow"><div class="t">' + a.title + '</div><div class="s">' + a.sub + '</div></div>' +
          (asked ? '<span class="pill">Tilbud på vej</span>' : '<button class="btn sm soft" data-act="addon" data-id="' + a.id + '">Få tilbud</button>') + '</div>';
      }).join('') + '</div>';
  }

  function vAftale() {
    var p = PLANS[state.plan];
    return topbar() + '<div class="eyebrow">Min aftale</div><h1 class="headline">Din aftale.<br>Dit overblik.</h1>' + planCard() +
      '<div class="card"><div class="kv"><span>Pris</span><span>' + p.price + ' kr./md. inkl. moms</span></div><div class="kv"><span>Næste betaling</span><span>1. december</span></div>' +
      '<div class="kv"><span>Abonnementsår</span><span>1. januar - 31. december</span></div><div class="kv"><span>Binding</span><span>Ingen · månedlig opsigelse</span></div></div>' +
      '<h2 class="section-title">Pakker</h2><div class="plans">' + Object.keys(PLANS).map(function (k) {
        var x = PLANS[k], on = k === state.plan;
        return '<button class="plan ' + (on ? 'on' : '') + '" data-act="plan" data-id="' + k + '"><div class="grow"><div class="t" style="font-weight:600">' + x.name + '</div><div class="small muted" style="margin-top:2px">' +
          x.visits + (x.visits === 1 ? ' årligt besøg' : ' årlige besøg') + (x.hours ? ' · ' + hrs(x.hours) + 's småservice' : '') + '</div></div><span class="price">' + x.price + ' kr.</span>' + (on ? '<span class="pill">Din</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<h2 class="section-title">Ikke inkluderet</h2><div class="card small" style="line-height:1.6">Materialer og reservedele, autorisationskrævende arbejde, ekstra fremmøde, større reparationer samt døgnvagt og akut udrykning. Abonnementet er ikke en forsikring.</div>' +
      '<div class="note" style="margin-top:12px">' + icon('info', 18) + '<span>Beskeder i appen overvåges ikke døgnet rundt. Ved akut fare skal du ringe 112 eller kontakte dit forsikringsselskabs skadeservice.</span></div>' +
      '<h2 class="section-title">Konto</h2><div class="list">' +
      '<button data-act="export"><div class="ico">' + icon('doc', 18) + '</div><span class="grow t">Eksportér servicehistorik</span><span class="chev">' + icon('right', 18) + '</span></button>' +
      '<button data-act="cancel"><div class="ico">' + icon('close', 18) + '</div><span class="grow t">Opsig aftale</span><span class="chev">' + icon('right', 18) + '</span></button>' +
      '<button data-act="logout"><div class="ico">' + icon('out', 18) + '</div><span class="grow t">Log ud</span></button></div>';
  }

  // ---------- Ark ----------
  function sheet(html) {
    $('overlay').innerHTML = '<div class="sheet"><div class="grab"></div><button class="iconbtn sheet-x" data-act="close" aria-label="Luk">' + icon('close', 18) + '</button>' + html + '</div>';
    $('overlay').hidden = false;
  }
  function closeSheet() { $('overlay').hidden = true; $('overlay').innerHTML = ''; }

  function sNotifs() {
    sheet('<h2>Notifikationer</h2><div class="list">' +
      '<button data-act="open-visit" data-id="efteraar"><div class="ico">' + icon('cal', 18) + '</div><div class="grow"><div class="t">Efterårsservice er bekræftet</div><div class="s">12. november kl. 09.00-11.00</div></div></button>' +
      '<button data-act="tab" data-id="servicebog"><div class="ico">' + icon('file', 18) + '</div><div class="grow"><div class="t">Nyt tilbud: Tagrenderens</div><div class="s">Afventer din godkendelse</div></div></button>' +
      '<button data-act="open-report" data-id="foraar"><div class="ico">' + icon('book', 18) + '</div><div class="grow"><div class="t">Rapport fra forårsservice er klar</div><div class="s">23. april</div></div></button></div>');
  }
  function sHome() {
    sheet('<h2>Dine boliger</h2><div class="plans"><div class="plan on"><div class="ico">' + icon('home', 18) + '</div><div class="grow"><div class="t" style="font-weight:600">' + HOME.address + '</div><div class="small muted">' + HOME.type + ' · ' + HOME.area + ' · ' + PLANS[state.plan].name + '</div></div><span class="pill">Valgt</span></div></div>' +
      '<p class="small muted" style="margin-top:14px">Har du flere boliger eller er du med i en forening, vises de her.</p>');
  }
  function sPlan(k) {
    var x = PLANS[k];
    sheet('<h2>Skift til ' + x.name + '?</h2><p class="small muted" style="margin-bottom:16px;line-height:1.5">' + x.price + ' kr./md. inkl. moms · ' + x.visits + (x.visits === 1 ? ' årligt besøg' : ' årlige besøg') + (x.hours ? ' · ' + hrs(x.hours) + 's småservice årligt' : ' · ingen småservice inkluderet') +
      '. Skiftet gælder fra næste betaling, og vi bekræfter fordelingen af servicetimer, før det træder i kraft.</p><div class="stack"><button class="btn" data-act="plan-confirm" data-id="' + k + '">Anmod om skift</button><button class="btn ghost" data-act="close">Behold min pakke</button></div>');
  }
  function sCancel() {
    sheet('<h2>Opsig aftale</h2><p class="small muted" style="margin-bottom:16px;line-height:1.5">Du kan opsige digitalt uden binding. Din servicebog bliver ved med at være tilgængelig, og du kan eksportere historikken. Vi sender en bekræftelse med slutdato og opgørelse af servicetimer.</p><div class="stack"><button class="btn danger" data-act="cancel-confirm">Opsig aftalen</button><button class="btn ghost" data-act="close">Fortryd</button></div>');
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ---------- Rendering ----------
  function render(keepScroll) {
    var s = $('screen'), top = s.scrollTop, html;
    var staff = isStaff();
    if (!state.auth) html = vLogin();
    else if (staff) html = STAFF.screen();
    else if (state.view && state.view.name === 'visit') html = vVisit(visit(state.view.id));
    else if (state.view && state.view.name === 'report') html = vReport(visit(state.view.id));
    else html = { overblik: vOverblik, servicebog: vServicebog, bestil: vBestil, aftale: vAftale }[state.tab]();
    s.innerHTML = html;
    s.scrollTop = keepScroll ? top : 0;
    if (!keepScroll) { s.classList.remove('in'); void s.offsetWidth; s.classList.add('in'); }

    var pending = QUOTES.filter(function (q) { return !state.quotes[q.id]; }).length;
    var bar = $('tabbar');
    bar.hidden = !state.auth;
    bar.innerHTML = (staff ? STAFF.tabs : TABS).map(function (t) {
      var n = staff ? STAFF.badge(t[0]) : (t[0] === 'servicebog' ? pending : 0);
      return '<button data-act="tab" data-id="' + t[0] + '" class="' + (state[tabKey()] === t[0] && !state.view ? 'on' : '') + '">' + icon(t[2]) + (n ? '<i class="badge">' + n + '</i>' : '') + '<span>' + t[1] + '</span></button>';
    }).join('');
    save();
  }

  function isStaff() { return !!STAFF && state.mode === 'staff'; }
  function tabKey() { return isStaff() ? 'stab' : 'tab'; }
  function pushHistory() {
    try { history.pushState({ mode: state.mode, tab: state.tab, stab: state.stab, view: state.view }, ''); } catch (e) { /* virker også uden historik */ }
  }

  // Navigation med historik, så telefonens tilbage-knap virker
  function go(tab, view) {
    if (tab === state[tabKey()] && !view && !state.view) { closeSheet(); $('screen').scrollTop = 0; return; }
    state[tabKey()] = tab; state.view = view || null;
    closeSheet();
    pushHistory();
    render();
  }
  window.addEventListener('popstate', function (e) {
    if (!state.auth) return;
    var h = e.state || {};
    closeSheet();
    state.tab = h.tab || 'overblik';
    state.stab = h.stab || 'idag';
    state.view = h.view || null;
    render();
  });

  // ---------- Handlinger ----------
  var actions = {
    tab: function (id) { go(id); },
    back: function () { if (history.state && history.state.view) history.back(); else go(state[tabKey()]); },
    mode: function (id, el) {
      // Rollen vælges på login-skærmen; felterne beholder det, der er skrevet
      if (state.auth) return;
      state.mode = id;
      $('login-title').innerHTML = LOGIN_TITLE[id];
      [].forEach.call(el.parentElement.children, function (b) { b.classList.toggle('on', b === el); });
      save();
    },
    season: function (id) { state.season = id; render(true); },
    'open-visit': function (id) { go(state.tab, { name: 'visit', id: id }); },
    'open-report': function (id) { go(state.tab, { name: 'report', id: id }); },
    notifs: function () { state.notifSeen = true; render(true); sNotifs(); },
    'home-info': sHome,
    close: closeSheet,
    'draft-hours': function (id) {
      var text = $('task-text').value;
      state.draftHours = parseFloat(id); render(true);
      $('task-text').value = text;
    },
    'task-remove': function (id) {
      state.tasks = state.tasks.filter(function (t) { return String(t.id) !== id; });
      render(true); toast('Opgaven er fjernet');
    },
    quote: function (id, el) {
      state.quotes[id] = el.dataset.val; render(true);
      toast(el.dataset.val === 'approved' ? 'Tilbuddet er godkendt' : 'Tilbuddet er afvist');
    },
    addon: function (id) { state.addons[id] = true; render(true); toast('Vi vender tilbage med et tilbud'); },
    plan: function (id) { if (id !== state.plan) sPlan(id); },
    'plan-confirm': function () { closeSheet(); toast('Vi har modtaget dit ønske om pakkeskift'); },
    cancel: sCancel,
    'cancel-confirm': function () { closeSheet(); toast('Prototype: opsigelsen er ikke gennemført'); },
    'export': function () { toast('Prototype: eksport kommer i næste version'); },
    reschedule: function () { toast('Vi kontakter dig om et nyt tidspunkt'); },
    logout: function () { state.auth = false; state.tab = 'overblik'; state.stab = 'idag'; state.view = null; closeSheet(); render(); }
  };

  document.addEventListener('click', function (e) {
    if (e.target.id === 'overlay') { closeSheet(); return; }
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = actions[el.dataset.act];
    if (fn) fn(el.dataset.id, el);
  });

  document.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'login-form') {
      var ok = $('login-user').value.trim().toLowerCase() === MOCK_USER.toLowerCase() && $('login-pass').value === MOCK_PASS;
      if (ok) { state.auth = true; render(); } else { $('login-error').hidden = false; }
    }
    if (e.target.id === 'task-form') {
      var text = $('task-text').value.trim();
      if (!text) { $('task-error').hidden = false; return; }
      state.tasks.push({ id: Date.now(), text: text, hours: state.draftHours });
      render(true);
      toast('Opgaven er tilføjet til besøget');
    }
    if (STAFF) STAFF.submit(e);
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'login-user' || e.target.id === 'login-pass') $('login-error').hidden = true;
    if (e.target.id === 'task-text') $('task-error').hidden = true;
  });

  // Medarbejderdelen (medarbejder.js) kobles på, hvis den er indlæst
  var STAFF = window.B360Staff ? window.B360Staff({
    state: state, $: $, esc: esc, icon: icon, hrs: hrs, ICONS: ICONS, CHECKLIST: CHECKLIST,
    topbar: topbar, backbar: backbar, sheet: sheet, closeSheet: closeSheet, toast: toast, render: render, go: go, save: save
  }) : null;
  if (STAFF) Object.keys(STAFF.actions).forEach(function (k) { actions[k] = STAFF.actions[k]; });

  try { history.replaceState({ mode: state.mode, tab: state.tab, stab: state.stab, view: null }, ''); } catch (e) { /* ok */ }
  render();
})();
