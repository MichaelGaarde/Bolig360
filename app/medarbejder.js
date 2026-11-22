/* Bolig360 – medarbejderdelen af appen (prototype med testdata). Indlæses før app.js. */
window.B360Staff = function (api) {
  'use strict';
  var state = api.state, $ = api.$, esc = api.esc, icon = api.icon, hrs = api.hrs;

  Object.assign(api.ICONS, {
    route: '<circle cx="6" cy="18" r="2.500"/><circle cx="18" cy="6" r="2.500"/><path d="M8.500 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.500"/>',
    tasks: '<path d="m4 6 1.500 1.500L8 5M4 12l1.500 1.500L8 11M4 18l1.500 1.500L8 17M11 6h9M11 12h9M11 18h9"/>',
    alert: '<path d="M12 4 2.500 20h19zM12 10v5M12 17.500h.01"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>',
    map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    box: '<path d="M4 8 12 4l8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>'
  });

  // ---------- Datoer ----------
  var DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
  var MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fromIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function isWork(d) { return d.getDay() % 6 !== 0; }
  function addWork(d, n) { d = new Date(d); while (n > 0) { d.setDate(d.getDate() + 1); if (isWork(d)) n--; } return d; }
  function nice(d) { return DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + MONTHS[d.getMonth()]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var base = new Date(today); while (!isWork(base)) base.setDate(base.getDate() + 1); // næste rutedag
  var baseIso = iso(base);

  // ---------- Testdata: rute de næste to uger ----------
  // [arbejdsdag nr., tid, kunde, adresse, pakke, timer tilbage i puljen, opgaver, adgang, kendte forhold, medbring]
  var RAW = [
    [0, '08.00', 'A. Lund', 'Lindevænget 24', 'Total', 3, [['Ophængning af spejl i gangen', 1], ['Justering af skabslåge i køkken', 0.5]], 'Kunden er hjemme. Parkering i indkørslen.', 'Tagrende mod nord delvist tilstoppet (forår). Tilbud på rens godkendt.', ['Spejlbeslag og rawlplugs', 'Udstyr til tagrenderens']],
    [0, '10.30', 'M. Østergaard', 'Birkevej 8', 'Plus', 1, [['Smøring og justering af havelåge', 1]], 'Nøgleboks ved bagdør. Koden står i ordren.', 'Fuge i bad blev noteret sidst.', ['Smøremiddel']],
    [0, '12.30', 'K. Bach', 'Egeparken 3, st.', 'Basis', 0, [], 'Ring på dørtelefonen. Kunden er hjemme til kl. 14.', 'Første besøg: registrér kendte fejl som baseline.', []],
    [0, '14.00', 'S. Winther', 'Møllestien 15', 'Total', 5, [['Opsætning af to hylder i bryggers', 2]], 'Hund i haven. Brug hoveddøren.', 'Ingen åbne observationer.', ['Hyldebeslag og skruer til gips']],
    [1, '08.30', 'L. Dam', 'Skovbrynet 41', 'Plus', 2, [['Rensning af vandlås i køkken', 0.5]], 'Kunden er på arbejde. Nøgle hos naboen i nr. 43.', 'Løbende toilet noteret i foråret.', ['Spand og pakninger']],
    [1, '10.30', 'P. Juhl', 'Kastanievej 6', 'Basis', 0, [], 'Kunden er hjemme.', 'Ingen åbne observationer.', []],
    [1, '13.00', 'E/F Søndergade 12', 'Søndergade 12', 'Ejendomsaftale', 3, [['Udskiftning af pærer i opgang B', 1], ['Justering af kælderdør', 1]], 'Mød viceværten ved port A. Fællesnøgle udleveres.', 'Ejendomsaftale: kun fællesarealer. Beboeropgaver faktureres særskilt.', ['LED-pærer E27', 'Dørpumpe-nøgle']],
    [2, '09.00', 'H. Kjær', 'Rosenhaven 2', 'Total', 4, [['Ophængning af gardinstang', 1], ['Smøring af vinduesbeslag', 1]], 'Kunden er hjemme.', 'Terrassebrædder slidte ved trappen.', ['Stige', 'Smøremiddel']],
    [2, '11.30', 'T. Nygaard', 'Åbrinken 19', 'Plus', 2, [], 'Nøgleboks ved carport.', 'Ingen åbne observationer.', []],
    [3, '08.00', 'B. Frost', 'Lærkevej 7', 'Plus', 1, [['Justering af terrassedør', 1]], 'Kunden er hjemme til kl. 10.', 'Sandfangsbrønd var næsten fuld sidst.', []],
    [3, '10.00', 'J. Skov', 'Fasanvej 22', 'Basis', 0, [], 'Kunden er hjemme.', 'Ingen åbne observationer.', []],
    [3, '12.30', 'R. Holt', 'Pilealle 5', 'Total', 5, [['Samling og opsætning af skab i entré', 2]], 'Kunden er hjemme.', 'Revne i sokkel mod øst følges.', ['Skruemaskine med lang bit']],
    [4, '09.00', 'N. Brandt', 'Engdraget 11', 'Plus', 2, [['Opsætning af knagerække', 0.5]], 'Kunden er på arbejde. Nøgleboks ved hoveddør.', 'Ingen åbne observationer.', []],
    [5, '08.00', 'C. Thygesen', 'Bakkekammen 4', 'Total', 5, [['Fastgørelse af løs gelænder-stolpe', 1]], 'Kunden er hjemme.', 'Ingen åbne observationer.', []],
    [5, '10.30', 'G. Mørk', 'Solsiden 30', 'Basis', 0, [], 'Kunden er hjemme.', 'Første besøg: registrér kendte fejl som baseline.', []],
    [7, '09.00', 'D. Lykke', 'Havnegade 9, 2. tv.', 'Plus', 2, [['Udskiftning af toiletsæde', 0.5]], 'Ring på hos Lykke.', 'Ingen åbne observationer.', ['Toiletsæde (kunden har købt)']],
    [8, '08.30', 'A/B Vestervang', 'Vestervang 2-14', 'Ejendomsaftale', 4, [['Gennemgang af cykelkælder og belysning', 2]], 'Mød bestyrelsesformanden ved nr. 2.', 'Ejendomsaftale: fællesarealer og fælles installationer.', ['LED-pærer E27']]
  ];
  var VISITS = RAW.map(function (r, i) {
    return { id: 'b' + i, date: iso(addWork(base, r[0])), time: r[1], name: r[2], addr: r[3], plan: r[4], pool: r[5],
      tasks: r[6].map(function (t) { return { text: t[0], hours: t[1] }; }), access: r[7], known: r[8], bring: r[9] };
  });

  var TODOS = [
    { id: 't1', title: 'Hent udstyr til tagrenderens på lageret', sub: 'Skal med til Lindevænget 24 kl. 08.00', due: 'I dag', prio: 'warn' },
    { id: 't2', title: 'Ring til kunden på Birkevej 8 om tilbud på omfugning', sub: 'Kunden har spurgt til pris og tidspunkt', due: 'I dag', prio: '' },
    { id: 't3', title: 'Send rapport for Egeparken 3', sub: 'Rapporten skal være hos kunden senest to arbejdsdage efter besøget', due: 'Frist i morgen', prio: 'warn' },
    { id: 't4', title: 'Bekræft mødetid med viceværten, Søndergade 12', sub: 'Ejendomsaftale · fællesnøgle skal udleveres', due: 'I morgen', prio: '' },
    { id: 't5', title: 'Tjek lager af LED-pærer og hyldebeslag', sub: 'Meld til kontoret, hvis der skal bestilles', due: 'Denne uge', prio: 'plain' },
    { id: 't6', title: 'Tilmeld dig kurset "Arbejde i højden"', sub: 'Kræves før tagrendeopgaver med stige over 5 m', due: 'Denne måned', prio: 'plain' }
  ];

  // ---------- Tilstand ----------
  var st = state.staff = state.staff || {};
  st.visits = st.visits || {}; st.todos = st.todos || {};
  st.sel = baseIso; st.month = baseIso.slice(0, 7);
  var photos = {}; // kun i hukommelsen
  var draft = { i: 0, prio: 'soon' };

  function vs(id) { return st.visits[id] || (st.visits[id] = { status: 'planned', check: {}, tasks: {}, materials: '' }); }
  function byId(id) { return VISITS.filter(function (v) { return v.id === id; })[0]; }
  function on(date) { return VISITS.filter(function (v) { return v.date === date; }); }
  function checked(v) { return Object.keys(vs(v.id).check).length; }
  function taskMin(v) { var t = vs(v.id).tasks, s = 0; Object.keys(t).forEach(function (k) { if (t[k].done) s += t[k].min; }); return s; }
  function planned(v) { return 60 + v.tasks.reduce(function (a, t) { return a + t.hours * 60; }, 0); }
  function mins(m) { var h = Math.floor(m / 60), r = m % 60; return (h ? h + ' t' : '') + (h && r ? ' ' : '') + (r || !h ? r + ' min' : ''); }
  function clock(ts) { var d = new Date(ts); return ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2); }
  function openTodos() { return TODOS.filter(function (t) { return !st.todos[t.id]; }).length; }

  function statusPill(v) {
    var s = vs(v.id).status;
    return s === 'done' ? '<span class="pill">' + icon('check', 14) + 'Udført</span>' : s === 'started' ? '<span class="pill warn">I gang</span>' : '<span class="pill plain">Planlagt</span>';
  }
  function visitRow(v) {
    return '<button data-act="s-open" data-id="' + v.id + '"><div class="time">' + v.time + '</div><div class="grow"><div class="t">' + v.addr + '</div><div class="s">' + v.name + ' · ' + v.plan +
      (v.tasks.length ? ' · ' + v.tasks.length + (v.tasks.length === 1 ? ' opgave' : ' opgaver') : '') + '</div></div>' + statusPill(v) + '</button>';
  }

  // ---------- Skærme ----------
  function sToday() {
    var list = on(baseIso), done = list.filter(function (v) { return vs(v.id).status === 'done'; }).length;
    var next = list.filter(function (v) { return vs(v.id).status !== 'done'; })[0];
    var total = list.reduce(function (a, v) { return a + planned(v); }, 0);
    var bring = [];
    list.forEach(function (v) { if (vs(v.id).status !== 'done') v.bring.forEach(function (b) { bring.push([b, v.addr]); }); });
    var isToday = baseIso === iso(today);

    var hero = next ? '<button class="hero" data-act="s-open" data-id="' + next.id + '"><div class="eyebrow">' + (vs(next.id).status === 'started' ? 'Besøg i gang' : 'Næste besøg') + '</div>' +
      '<div class="between" style="align-items:flex-start"><div><div class="date">' + next.time + '</div><div class="sub">' + next.addr + '</div><div class="when">' + next.name + ' · ' + next.plan + ' · ca. ' + mins(planned(next)) + '</div></div><div class="cal">' + icon('route', 20) + '</div></div>' +
      '<div class="between foot"><span>' + (next.tasks.length ? next.tasks.length + ' småopgave' + (next.tasks.length > 1 ? 'r' : '') + ' bestilt' : 'Kun gennemgang') + '</span><span class="go">Åbn besøget ' + icon('arrow', 18) + '</span></div></button>' :
      '<div class="card"><h3>Ruten er kørt</h3><p class="small muted" style="margin-top:6px">Alle dagens besøg er afsluttet, og rapporterne er sendt til kundernes servicebog.</p></div>';

    return api.topbar(true) + '<div class="eyebrow">' + (isToday ? 'I dag' : 'Næste rutedag') + ' · ' + nice(base) + '</div>' +
      '<h1 class="headline">' + list.length + ' besøg<br>på ruten.</h1>' + hero +
      '<div class="tiles"><button class="tile" data-act="tab" data-id="opgaver">' + icon('tasks') + '<span>' + openTodos() + ' åbne opgaver</span></button>' +
      '<button class="tile" data-act="tab" data-id="kalender">' + icon('cal') + '<span>Se kalenderen</span></button></div>' +
      '<div class="card" style="margin-top:16px"><div class="between"><h3>Dagens rute</h3><span class="pill">' + done + ' af ' + list.length + '</span></div>' +
      '<div class="bar"><i style="width:' + (list.length ? done / list.length * 100 : 0) + '%"></i></div><div class="between small"><span class="muted">Planlagt arbejdstid</span><b>' + mins(total) + '</b></div></div>' +
      '<h2 class="section-title">Rækkefølge</h2><div class="list">' + list.map(visitRow).join('') + '</div>' +
      (bring.length ? '<h2 class="section-title">Pakkeliste til bilen</h2><div class="list">' + bring.map(function (b) {
        return '<div><div class="ico">' + icon('box', 18) + '</div><div class="grow"><div class="t" style="font-weight:400">' + b[0] + '</div><div class="s">' + b[1] + '</div></div></div>';
      }).join('') + '</div>' : '');
  }

  function sCalendar() {
    var p = st.month.split('-'), y = +p[0], m = +p[1] - 1, first = new Date(y, m, 1);
    var lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), cells = '';
    for (var i = 0; i < lead; i++) cells += '<span></span>';
    for (var d = 1; d <= days; d++) {
      var key = iso(new Date(y, m, d)), n = on(key).length;
      cells += '<button data-act="s-day" data-id="' + key + '" class="' + (key === st.sel ? 'sel ' : '') + (key === iso(today) ? 'today' : '') + '">' + d + (n ? '<i>' + n + '</i>' : '') + '</button>';
    }
    var list = on(st.sel), sel = fromIso(st.sel);
    return api.topbar(true) + '<div class="eyebrow">Kalender</div><h1 class="headline">Dine besøg.<br>Dag for dag.</h1>' +
      '<div class="card"><div class="between"><button class="iconbtn sm" data-act="s-month" data-id="-1" aria-label="Forrige måned">' + icon('left', 18) + '</button><h3>' + cap(MONTHS[m]) + ' ' + y + '</h3>' +
      '<button class="iconbtn sm" data-act="s-month" data-id="1" aria-label="Næste måned">' + icon('right', 18) + '</button></div>' +
      '<div class="calgrid head"><span>M</span><span>T</span><span>O</span><span>T</span><span>F</span><span>L</span><span>S</span></div><div class="calgrid">' + cells + '</div></div>' +
      '<h2 class="section-title">' + cap(nice(sel)) + '</h2>' +
      (list.length ? '<div class="list">' + list.map(visitRow).join('') + '</div>' : '<div class="empty">Ingen besøg denne dag.</div>');
  }

  function sVisit(v) {
    var s = vs(v.id), d = fromIso(v.date), nCheck = checked(v), used = taskMin(v), over = used > v.pool * 60;
    var top;
    if (s.status === 'planned') top = '<button class="btn" data-act="s-start" data-id="' + v.id + '">' + icon('clock', 20) + 'Start besøg</button>';
    else if (s.status === 'started') top = '<div class="note">' + icon('clock', 18) + '<span>Startet kl. ' + clock(s.start) + '. Tiden til gennemgang, kørsel og rapport trækkes ikke fra kundens småservicepulje.</span></div>';
    else top = '<div class="card"><div class="between"><h3>Besøget er afsluttet</h3><span class="pill">' + icon('check', 14) + 'Rapport sendt</span></div>' +
      '<div class="kv" style="margin-top:8px"><span>Tid på stedet</span><span>kl. ' + clock(s.start) + '-' + clock(s.end) + '</span></div><div class="kv"><span>Småservice</span><span>' + mins(used) + '</span></div>' +
      '<div class="kv"><span>Observationer</span><span>' + Object.keys(s.check).filter(function (k) { return s.check[k].s === 'obs'; }).length + '</span></div></div>';

    var maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.addr);
    var pics = photos[v.id] || [];

    return api.backbar(v.addr) +
      '<div class="eyebrow">' + cap(nice(d)) + ' · kl. ' + v.time + '</div><h1 class="headline" style="margin-bottom:16px">' + v.name + '</h1>' + top +
      '<div class="card" style="margin-top:12px"><div class="kv"><span>Aftale</span><span>' + v.plan + '</span></div><div class="kv"><span>Småservicepulje</span><span>' + (v.pool ? hrs(v.pool) + ' tilbage' : 'Ingen · tilkøb') + '</span></div>' +
      '<div class="kv"><span>Adgang</span><span>' + v.access + '</span></div><div class="kv"><span>Kendte forhold</span><span>' + v.known + '</span></div></div>' +
      '<div class="row" style="margin-top:12px"><a class="btn ghost" href="' + maps + '" target="_blank" rel="noopener">' + icon('map', 20) + 'Rutevejledning</a><button class="btn danger" data-act="s-akut">' + icon('alert', 20) + 'Akut fare</button></div>' +

      '<div class="between section-title"><span>Tjekliste</span><span class="pill ' + (nCheck === api.CHECKLIST.length ? '' : 'plain') + '">' + nCheck + ' af ' + api.CHECKLIST.length + '</span></div>' +
      '<div class="list">' + api.CHECKLIST.map(function (c, i) {
        var e = s.check[i] || {};
        return '<div class="chk"><div class="grow"><div class="t" style="font-weight:400">' + c + '</div>' + (e.s === 'obs' ? '<div class="s">' + esc(e.note) + ' · ' + PRIO[e.prio] + (e.quote ? ' · tilbud foreslået' : '') + '</div>' : '') + '</div>' +
          '<button class="seg ' + (e.s === 'ok' ? 'on' : '') + '" data-act="s-ok" data-id="' + i + '">OK</button><button class="seg obs ' + (e.s === 'obs' ? 'on' : '') + '" data-act="s-obs" data-id="' + i + '">Obs</button></div>';
      }).join('') + '</div>' +

      '<h2 class="section-title">Småservice bestilt af kunden</h2>' +
      (v.tasks.length ? '<div class="list">' + v.tasks.map(function (t, i) {
        var e = s.tasks[i] || { done: false, min: t.hours * 60 };
        return '<div class="chk"><button class="tick ' + (e.done ? 'on' : '') + '" data-act="s-task" data-id="' + i + '" aria-label="Markér udført">' + (e.done ? icon('check', 22) : '') + '</button><div class="grow"><div class="t" style="font-weight:400">' + t.text + '</div><div class="s">Anslået ' + hrs(t.hours) + '</div></div>' +
          '<div class="stepper"><button data-act="s-min" data-id="' + i + '" data-val="-15" aria-label="Mindre tid">−</button><span>' + e.min + ' min</span><button data-act="s-min" data-id="' + i + '" data-val="15" aria-label="Mere tid">+</button></div></div>';
      }).join('') + '</div>' +
        (over ? '<div class="note warn" style="margin-top:12px">' + icon('alert', 18) + '<span>Registreret tid (' + mins(used) + ') overstiger kundens pulje. Merarbejde skal godkendes af kunden, før du fortsætter.</span></div>' : '')
        : '<div class="empty">Kunden har ikke bestilt småservice til dette besøg.</div>') +

      '<h2 class="section-title">Billeder</h2>' + (pics.length ? '<div class="photos" style="margin-bottom:12px">' + pics.map(function (u) { return '<div class="photo" style="background:url(' + u + ') center/cover"></div>'; }).join('') + '</div>' : '') +
      '<label class="btn soft">' + icon('camera', 20) + 'Tag eller vælg billede<input type="file" accept="image/*" capture="environment" id="s-photo" hidden></label>' +
      '<h2 class="section-title">Materialer</h2><label class="field" style="margin:0"><input id="s-mat" placeholder="Fx 4 rawlplugs, 1 pakning" value="' + esc(s.materials) + '"></label>' +
      '<p class="small muted" style="margin-top:8px">Materialer faktureres kun, når kunden har godkendt dem.</p>' +
      (s.status === 'done' ? '<button class="btn ghost" style="margin-top:20px" data-act="s-reopen" data-id="' + v.id + '">Genåbn besøget</button>' :
        '<button class="btn" style="margin-top:20px" data-act="s-finish" data-id="' + v.id + '">' + icon('check', 20) + 'Afslut og send rapport</button>');
  }
  var PRIO = { now: 'Akut', soon: 'Inden vinter', watch: 'Inden for 12 mdr.' };

  function sTodos() {
    function row(t) {
      var done = st.todos[t.id];
      return '<div class="chk"><button class="tick ' + (done ? 'on' : '') + '" data-act="s-todo" data-id="' + t.id + '" aria-label="Markér udført">' + (done ? icon('check', 22) : '') + '</button><div class="grow"><div class="t"' + (done ? ' style="text-decoration:line-through;color:var(--muted)"' : '') + '>' + t.title + '</div><div class="s">' + t.sub + '</div></div>' +
        (done ? '' : '<span class="pill ' + t.prio + '">' + t.due + '</span>') + '</div>';
    }
    var open = TODOS.filter(function (t) { return !st.todos[t.id]; }), done = TODOS.filter(function (t) { return st.todos[t.id]; });
    return api.topbar(true) + '<div class="eyebrow">Opgaver fra kontoret</div><h1 class="headline">' + open.length + ' åbne<br>opgaver.</h1>' +
      (open.length ? '<div class="list">' + open.map(row).join('') + '</div>' : '<div class="empty">Du har ingen åbne opgaver.</div>') +
      '<button class="btn soft" style="margin-top:16px" data-act="s-msg">' + icon('msg', 20) + 'Skriv til kontoret</button>' +
      (done.length ? '<h2 class="section-title">Udført</h2><div class="list">' + done.map(row).join('') + '</div>' : '');
  }

  function sProfile() {
    var week = VISITS.filter(function (v) { return v.date >= baseIso && v.date <= iso(addWork(base, 4)); });
    var done = week.filter(function (v) { return vs(v.id).status === 'done'; });
    var plan = week.reduce(function (a, v) { return a + planned(v); }, 0);
    var obs = 0; done.forEach(function (v) { var c = vs(v.id).check; Object.keys(c).forEach(function (k) { if (c[k].s === 'obs') obs++; }); });
    return api.topbar(true) + '<div class="eyebrow">Min uge</div><h1 class="headline">Overblik<br>over ugen.</h1>' +
      '<div class="card"><div class="between"><h3>Besøg de næste fem rutedage</h3><span class="pill">' + done.length + ' af ' + week.length + '</span></div><div class="bar"><i style="width:' + (done.length / week.length * 100) + '%"></i></div>' +
      '<div class="kv"><span>Planlagt arbejdstid</span><span>' + mins(plan) + '</span></div><div class="kv"><span>Observationer registreret</span><span>' + obs + '</span></div><div class="kv"><span>Åbne opgaver fra kontoret</span><span>' + openTodos() + '</span></div></div>' +
      '<h2 class="section-title">Servicemål</h2><div class="card"><div class="kv"><span>Rapport efter besøg</span><span>Senest 2 arbejdsdage</span></div><div class="kv"><span>Besøg inden for aftalt interval</span><span>Mindst 95 %</span></div><div class="kv"><span>Genbesøg pga. egne fejl</span><span>Under 3 %</span></div></div>' +
      '<div class="note" style="margin-top:12px">' + icon('info', 18) + '<span>En gennemgang må ikke registreres som fuldført, før alle punkter på tjeklisten er gennemgået, også selv om tidsbudgettet er brugt.</span></div>' +
      '<h2 class="section-title">Konto</h2><div class="list"><button data-act="s-reset"><div class="ico">' + icon('clock', 18) + '</div><span class="grow t">Nulstil testdata</span></button>' +
      '<button data-act="logout"><div class="ico">' + icon('out', 18) + '</div><span class="grow t">Log ud</span></button></div>';
  }

  // ---------- Ark ----------
  function akut() {
    api.sheet('<h2>Akut fare</h2><div class="list">' + ['Stands arbejdet, og bring dig selv og kunden i sikkerhed.', 'Ring 112 ved brand, gaslugt, elulykke eller personskade.', 'Afbryd vand eller strøm, hvis det er forsvarligt.', 'Kontakt kunden med det samme, og ring derefter til kontoret.', 'Tag billeder, og registrér forholdet som en akut observation.'].map(function (t, i) {
      return '<div><div class="ico">' + (i + 1) + '</div><span class="grow">' + t + '</span></div>';
    }).join('') + '</div><p class="small muted" style="margin-top:14px">Beskeder i appen overvåges ikke døgnet rundt og må ikke bruges som alarmkanal.</p>');
  }
  function obsSheet(i) {
    var v = byId(state.view.id), e = vs(v.id).check[i] || {};
    draft = { i: i, prio: e.prio || 'soon' };
    api.sheet('<h2>Observation</h2><p class="small muted" style="margin:-8px 0 14px">' + api.CHECKLIST[i] + '</p><form id="obs-form">' +
      '<label class="field"><span>Hvad har du set?</span><textarea id="obs-note" maxlength="200" placeholder="Fx fuge ved brusekabine er mørnet">' + esc(e.note || '') + '</textarea></label>' +
      '<div class="field"><span>Prioritet</span><div class="chips">' + Object.keys(PRIO).map(function (k) { return '<button type="button" data-act="s-prio" data-id="' + k + '" class="' + (draft.prio === k ? 'on' : '') + '">' + PRIO[k] + '</button>'; }).join('') + '</div></div>' +
      '<label class="row small" style="margin-bottom:16px"><input type="checkbox" id="obs-quote"' + (e.quote ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--green)">Foreslå tilbud til kunden</label>' +
      '<p class="error" id="obs-error" hidden>Beskriv kort, hvad du har observeret.</p><button class="btn" type="submit">Gem observation</button></form>');
  }
  function msgSheet() {
    api.sheet('<h2>Skriv til kontoret</h2><form id="msg-form"><label class="field"><span>Besked</span><textarea id="msg-text" maxlength="300" placeholder="Fx mangler hyldebeslag på lageret"></textarea></label><button class="btn" type="submit">Send besked</button></form>');
  }

  // ---------- Handlinger ----------
  function cur() { return byId(state.view.id); }
  var actions = {
    's-open': function (id) { api.go(state.stab, { name: 'svisit', id: id }); },
    's-day': function (id) { st.sel = id; api.render(true); },
    's-month': function (id) { var p = st.month.split('-'), d = new Date(+p[0], +p[1] - 1 + (+id), 1); st.month = iso(d).slice(0, 7); api.render(true); },
    's-start': function (id) { var s = vs(id); s.status = 'started'; s.start = Date.now(); api.render(true); api.toast('Besøget er startet'); },
    's-ok': function (id) { var c = vs(cur().id).check; if (c[id] && c[id].s === 'ok') delete c[id]; else c[id] = { s: 'ok' }; api.render(true); },
    's-obs': function (id) { obsSheet(+id); },
    's-prio': function (id, el) { draft.prio = id; [].forEach.call(el.parentElement.children, function (b) { b.classList.toggle('on', b === el); }); },
    's-task': function (id) { var v = cur(), t = vs(v.id).tasks; t[id] = t[id] || { done: false, min: v.tasks[id].hours * 60 }; t[id].done = !t[id].done; api.render(true); },
    's-min': function (id, el) { var v = cur(), t = vs(v.id).tasks; t[id] = t[id] || { done: false, min: v.tasks[id].hours * 60 }; t[id].min = Math.max(15, t[id].min + (+el.dataset.val)); api.render(true); },
    's-finish': function (id) {
      var v = byId(id), s = vs(id), missing = api.CHECKLIST.length - checked(v);
      if (s.status === 'planned') { api.toast('Start besøget, før du afslutter det'); return; }
      if (missing) { api.toast(missing + ' punkt' + (missing > 1 ? 'er' : '') + ' på tjeklisten mangler'); return; }
      s.status = 'done'; s.end = Date.now(); api.render(); api.toast('Rapporten er sendt til kundens servicebog');
    },
    's-reopen': function (id) { vs(id).status = 'started'; api.render(true); },
    's-todo': function (id) { st.todos[id] = !st.todos[id]; api.render(true); },
    's-msg': msgSheet,
    's-akut': akut,
    's-reset': function () { st.visits = {}; st.todos = {}; photos = {}; api.render(); api.toast('Testdata er nulstillet'); }
  };

  function submit(e) {
    if (e.target.id === 'obs-form') {
      var note = $('obs-note').value.trim();
      if (!note) { $('obs-error').hidden = false; return; }
      vs(cur().id).check[draft.i] = { s: 'obs', note: note, prio: draft.prio, quote: $('obs-quote').checked };
      api.closeSheet(); api.render(true); api.toast('Observationen er gemt');
    }
    if (e.target.id === 'msg-form') {
      if (!$('msg-text').value.trim()) return;
      api.closeSheet(); api.toast('Prototype: beskeden er ikke sendt');
    }
  }

  document.addEventListener('input', function (e) {
    if (e.target.id === 's-mat' && state.view) { vs(state.view.id).materials = e.target.value; api.save(); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 's-photo' || !e.target.files[0] || !state.view) return;
    (photos[state.view.id] = photos[state.view.id] || []).push(URL.createObjectURL(e.target.files[0]));
    api.render(true); api.toast('Billedet er tilføjet');
  });

  return {
    tabs: [['idag', 'I dag', 'route'], ['kalender', 'Kalender', 'cal'], ['opgaver', 'Opgaver', 'tasks'], ['profil', 'Min uge', 'user']],
    badge: function (tab) { return tab === 'opgaver' ? openTodos() : 0; },
    screen: function () {
      if (state.view && state.view.name === 'svisit' && byId(state.view.id)) return sVisit(byId(state.view.id));
      return { idag: sToday, kalender: sCalendar, opgaver: sTodos, profil: sProfile }[state.stab]();
    },
    actions: actions,
    submit: submit
  };
};
