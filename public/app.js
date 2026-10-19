// SpaceVerbs — de app in de browser (leerling + leerkracht)
const app = document.getElementById('app');
const modalEl = document.getElementById('modal');
const { planeetSVG, blobSVG, alienSVG, sterrenbeeldSVG, herhalingsSterSVG, munt, raketSVG } = window.Art;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const logo = () => '<span class="s">Space</span><span class="v">Verbs</span>';

async function api(methode, url, body) {
  const r = await fetch(url, {
    method: methode, credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && !url.includes('login')) { IK = { rol: null }; ga('/'); }
  if (!r.ok) throw new Error(data.fout || 'Er ging iets mis.');
  return data;
}

let IK = { rol: null };
const ga = pad => { if (location.hash !== '#' + pad) location.hash = pad; else route(); };
window.addEventListener('hashchange', route);

function modal(html, { sluitKnop = 'Oké!' } = {}) {
  return new Promise(resolve => {
    modalEl.innerHTML = `<div class="paneel" role="dialog" aria-modal="true">${html}
      <div class="knoppen" style="justify-content:center">
        ${sluitKnop ? `<button class="knop groen" data-ant="ok">${sluitKnop}</button>` : ''}
      </div></div>`;
    modalEl.hidden = false;
    const knoppen = modalEl.querySelectorAll('[data-ant]');
    knoppen.forEach(k => k.addEventListener('click', () => { modalEl.hidden = true; resolve(k.dataset.ant); }));
    (modalEl.querySelector('[data-ant="ok"]') || knoppen[0])?.focus();
  });
}
function vraagModal(html, ja = 'Ja', nee = 'Nee') {
  return new Promise(resolve => {
    modalEl.innerHTML = `<div class="paneel" role="dialog" aria-modal="true">${html}
      <div class="knoppen" style="justify-content:center"><button class="knop grijs" data-a="0">${nee}</button><button class="knop groen" data-a="1">${ja}</button></div></div>`;
    modalEl.hidden = false;
    modalEl.querySelectorAll('[data-a]').forEach(k => k.addEventListener('click', () => { modalEl.hidden = true; resolve(k.dataset.a === '1'); }));
    modalEl.querySelector('[data-a="1"]').focus();
  });
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div');
  c.className = 'confetti';
  const kleuren = ['#facc15', '#22c55e', '#a855f7', '#38bdf8', '#f43f5e', '#fb923c'];
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + 'vw';
    s.style.background = kleuren[i % kleuren.length];
    s.style.animationDelay = Math.random() * .8 + 's';
    s.style.animationDuration = 2 + Math.random() * 1.5 + 's';
    c.appendChild(s);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 4000);
}

async function toonNieuwDier(dier) {
  if (!dier) return;
  confetti();
  await modal(`<h2>Nieuw aliendier! 🎉</h2>
    <p>Jullie klas heeft samen zo goed geoefend, dat er een nieuw dier in de dierentuin woont:</p>
    <div class="zweef">${alienSVG({ ...dier, open: true }, 150)}</div><h3>${esc(dier.naam)}</h3>`, { sluitKnop: 'Hoera!' });
}

// ================= router =================
async function route() {
  const pad = location.hash.slice(1) || '/';
  const delen = pad.split('/').filter(Boolean);
  document.body.classList.toggle('lk', IK.rol === 'leerkracht');
  window.scrollTo(0, 0);
  try {
    if (!IK.rol) return schermLogin();
    if (IK.rol === 'leerling') {
      if (delen[0] === 'planeet') return schermPlaneet(Number(delen[1]));
      if (delen[0] === 'oefenen') return schermOefenen(Number(delen[1]));
      if (delen[0] === 'toets') return schermToets(Number(delen[1]));
      if (delen[0] === 'ster') return schermSter(Number(delen[1]));
      if (delen[0] === 'oefenen-ster') return schermOefenen(Number(delen[1]), true);
      if (delen[0] === 'ster-toets') return schermToets(Number(delen[1]), true);
      if (delen[0] === 'winkel') return schermWinkel();
      if (delen[0] === 'dierentuin') return schermDierentuin();
      if (delen[0] === 'blob') return schermBlob();
      return schermKaart();
    }
    if (delen[0] === 'groep') return lkGroep(Number(delen[1]));
    if (delen[0] === 'kaartjes') return lkKaartjes(Number(delen[1]));
    if (delen[0] === 'leerling') return lkLeerling(Number(delen[1]));
    if (delen[0] === 'leerdoelen') return lkLeerdoelen();
    if (delen[0] === 'collegas') return lkCollegas();
    return lkGroepen();
  } catch (e) {
    app.innerHTML = `<div class="wrap"><div class="fout-melding">${esc(e.message)}</div><a class="knop" href="#/">Terug</a></div>`;
  }
}

async function loguit() {
  await api('POST', '/api/loguit', {});
  IK = { rol: null };
  ga('/');
}

// ================= inloggen =================
function schermLogin() {
  let tab = 'leerling', lkModus = 'login', eerste = false;
  const p = [{ naam: 'Aarde', kleur: '#3b82f6', kleur2: '#22c55e' }, { naam: 'Mars', kleur: '#ef4444', kleur2: '#f97316' }, { naam: 'Saturnus', kleur: '#eab308', kleur2: '#a16207' }];
  const teken = (fout = '') => {
    app.innerHTML = `<div class="login"><div class="login-kaart">
      <div class="zweef">${blobSVG({ kleur: '#a855f7', ogen: 3, accessoires: ['helm', 'antenne'] }, 130)}</div>
      <h1 class="titel">${logo()}</h1>
      <p class="zacht">Oefen werkwoordspelling tussen de sterren!</p>
      <div class="paneel">
        <div class="tabs" role="tablist">
          <button role="tab" class="${tab === 'leerling' ? 'aan' : ''}" data-tab="leerling">🧑‍🚀 Leerling</button>
          <button role="tab" class="${tab === 'leerkracht' ? 'aan' : ''}" data-tab="leerkracht">🍎 Leerkracht</button>
        </div>
        ${fout ? `<div class="fout-melding">${esc(fout)}</div>` : ''}
        ${tab === 'leerling' ? `
          <form id="f">
            <label class="veld"><span>Je gebruikersnaam</span><input name="gebruikersnaam" autocomplete="username" autocapitalize="off" required></label>
            <label class="veld"><span>Je geheime wachtwoord</span><input name="wachtwoord" type="password" autocomplete="current-password" autocapitalize="off" required></label>
            <button class="knop groen groot" style="width:100%;margin-top:8px">🚀 Opstijgen!</button>
          </form>` : `
          <form id="f">
            ${lkModus === 'nieuw' ? (eerste
              ? '<p class="zacht" style="margin:12px 0 0">Je bent de eerste leerkracht. Jij wordt de <b>beheerder</b> en kunt daarna collega\'s uitnodigen.</p>'
              : '<p class="zacht" style="margin:12px 0 0">Een account maken kan alleen met een <b>uitnodigingscode</b> van de beheerder van SpaceVerbs op jouw school.</p><label class="veld"><span>Uitnodigingscode</span><input name="code" required placeholder="SV-ABC123" autocapitalize="characters" autocomplete="off"></label>')
              + '<label class="veld"><span>Je naam</span><input name="naam" required placeholder="Juf Anna"></label>' : ''}
            <label class="veld"><span>E-mailadres</span><input name="email" type="email" autocomplete="email" required></label>
            <label class="veld"><span>Wachtwoord</span><input name="wachtwoord" type="password" autocomplete="${lkModus === 'nieuw' ? 'new-password' : 'current-password'}" minlength="${lkModus === 'nieuw' ? 8 : 1}" required></label>
            <button class="knop groot" style="width:100%;margin-top:8px">${lkModus === 'nieuw' ? 'Account maken' : 'Inloggen'}</button>
            <p style="text-align:center;margin-bottom:0"><a href="#" id="wissel">${lkModus === 'nieuw' ? 'Ik heb al een account' : 'Nieuw hier? Account maken met een uitnodigingscode'}</a></p>
          </form>`}
      </div>
      <div class="login-planeten">${p.map(x => planeetSVG(x, 56)).join('')}</div>
    </div></div>`;
    app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; teken(); });
    const w = app.querySelector('#wissel');
    if (w) w.onclick = async e => {
      e.preventDefault();
      lkModus = lkModus === 'nieuw' ? 'login' : 'nieuw';
      if (lkModus === 'nieuw') eerste = (await api('GET', '/api/leerkracht/eerste')).eerste;
      teken();
    };
    app.querySelector('#f').onsubmit = async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      try {
        if (tab === 'leerling') await api('POST', '/api/leerling/login', data);
        else await api('POST', lkModus === 'nieuw' ? '/api/leerkracht/registreer' : '/api/leerkracht/login', data);
        IK = await api('GET', '/api/ik');
        ga('/');
      } catch (err) { teken(err.message); }
    };
    app.querySelector('input')?.focus();
  };
  teken();
}

// ================= leerling =================
function kopLeerling(st) {
  return `<header class="kop wrap">
    <a href="#/" class="logo">${logo()}</a>
    <nav>
      <span class="munten" title="Jouw munten">${munt()} <span id="muntTeller">${st.leerling.munten}</span></span>
      <a class="knop klein geel" href="#/winkel">⭐ Winkel</a>
      <a class="knop klein blauw" href="#/dierentuin">👾 Dierentuin</a>
      <a class="ik" href="#/blob" title="Pas je blob aan">${blobSVG(st.leerling.blob, 46)}<b>${esc(st.leerling.naam.split(' ')[0])}</b></a>
      <button class="knop klein grijs" id="uit">Uitloggen</button>
    </nav>
  </header>`;
}
function koppelKop() { const u = app.querySelector('#uit'); if (u) u.onclick = loguit; }

async function schermKaart() {
  const st = await api('GET', '/api/status');
  if (!st.leerling.blob) return ga('/blob');
  const huidig = st.planeten.find(p => p.status === 'huidig');
  const ster = st.sterren.find(s => s.status === 'huidig');
  const planeetStop = (p, i) => `
    <div class="stop ${i % 2 ? 'rechts' : ''} ${p.status}">
      <button class="bol" ${p.status === 'slot' ? 'disabled' : ''} data-p="${i}" aria-label="Planeet ${p.naam}">
        ${planeetSVG(p, 130, p.status === 'slot')}
        ${p.status === 'slot' ? '<span class="slotje">🔒</span>' : ''}
        ${p.status === 'klaar' ? '<span class="vinkje">✓</span>' : ''}
        ${p.status === 'huidig' ? `<span class="blobje zweef">${blobSVG(st.leerling.blob, 58)}</span>` : ''}
      </button>
      <div class="info">
        ${p.status === 'klaar' ? '<span class="label groen">Gehaald!</span>' : p.status === 'huidig' ? `<span class="label geel">${p.toets_open ? 'Toets klaar!' : 'Hier ben je'}</span>` : ''}
        <h3>${i + 1}. ${p.naam}</h3>
        <p>${esc(p.titel)}</p>
        ${p.status === 'huidig' ? `<div class="balk mini-balk"><div style="width:${p.gedaan}%"></div></div><small class="zacht">${p.gedaan} van ${p.totaal} vragen goed</small>` : ''}
      </div>
    </div>`;
  const sterStop = s => `
    <div class="stop midden ${s.status}">
      <button class="bol ster-bol" ${s.status === 'slot' ? 'disabled' : ''} data-ster="${s.nr}" aria-label="Herhalingsster na ${s.na}">
        ${herhalingsSterSVG(84, s.status)}
        ${s.status === 'huidig' ? `<span class="blobje zweef">${blobSVG(st.leerling.blob, 46)}</span>` : ''}
      </button>
      <div class="info">
        ${s.status === 'klaar' ? '<span class="label groen">Gehaald!</span>' : s.status === 'huidig' ? '<span class="label geel">Hier ben je</span>' : ''}
        <h3>Herhalingsster</h3><p>Alles herhalen vóór ${s.voor}</p>
      </div>
    </div>`;
  app.innerHTML = kopLeerling(st) + `<div class="wrap">
    <div class="kaart-intro">
      <div>
        <h1>Hoi ${esc(st.leerling.naam.split(' ')[0])}! 👋</h1>
        <p class="zacht" style="margin:0">${huidig
          ? `Je bent op <b style="color:var(--geel)">${huidig.naam}</b>: ${esc(huidig.titel)}. Klik op de planeet om verder te gaan!`
          : ster ? `Je bent bij de <b style="color:var(--geel)">herhalingsster</b>. Haal de ster, dan vlieg je door naar ${ster.voor}!`
          : 'Wauw! Je hebt alle planeten gehaald. Je bent een echte werkwoord-astronaut! 🏆'}</p>
      </div>
      <a class="paneel dt-widget" href="#/dierentuin">
        ${alienSVG({ soort: 'octo', kleur: '#fb923c', open: true }, 54)}
        <div style="min-width:180px"><b>Klassendierentuin</b><br><small class="zacht">${st.dierentuin.ontgrendeld} van ${st.dierentuin.totaal} dieren · ${st.dierentuin.les_actief ? '🟢 oefenles bezig!' : `nog ${st.dierentuin.min_tot_volgende} min`}</small>
        <div class="balk mini-balk"><div style="width:${Math.round(st.dierentuin.naar_volgende * 100)}%"></div></div></div>
      </a>
    </div>
    <div class="reis">
      <svg class="pad" aria-hidden="true"><path stroke="#6366f1" stroke-width="3" stroke-dasharray="8 10" fill="none" opacity=".7"/></svg>
      ${st.planeten.map((p, i) => planeetStop(p, i) + (st.sterren[i] ? sterStop(st.sterren[i]) : '')).join('')}
    </div>
  </div>`;
  koppelKop();
  app.querySelectorAll('.bol[data-p]').forEach(b => b.onclick = () => ga('/planeet/' + b.dataset.p));
  app.querySelectorAll('.bol[data-ster]').forEach(b => b.onclick = () => ga('/ster/' + b.dataset.ster));
  tekenPad();
}

// Het stippelpad loopt door het midden van alle planeten en sterren, ook als de schermbreedte verandert.
function tekenPad() {
  const reis = app.querySelector('.reis');
  if (!reis) return;
  const r = reis.getBoundingClientRect();
  const punten = [...reis.querySelectorAll('.bol')].map(b => {
    const k = b.getBoundingClientRect();
    return [k.left - r.left + k.width / 2, k.top - r.top + k.height / 2];
  });
  const d = punten.map(([x, y], i) => {
    if (!i) return `M ${x} ${y}`;
    const [px, py] = punten[i - 1], my = (py + y) / 2;
    return `C ${px} ${my}, ${x} ${my}, ${x} ${y}`;
  }).join(' ');
  const svg = reis.querySelector('svg.pad');
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  svg.querySelector('path').setAttribute('d', d);
}
window.addEventListener('resize', tekenPad);

async function schermSter(k) {
  const st = await api('GET', '/api/status');
  const s = st.sterren[k];
  if (!s || s.status === 'slot') return ga('/');
  const doelen = st.planeten.slice(0, k + 1);
  app.innerHTML = kopLeerling(st) + `<div class="wrap">
    <a href="#/" class="knop klein grijs">← Terug naar de kaart</a>
    <div class="paneel" style="margin-top:16px">
      <div class="planeet-kop">
        <div class="zweef">${herhalingsSterSVG(170, s.status)}</div>
        <div>
          <span class="label">Herhalingsster</span>
          <h1 style="font-size:2.2rem">Tussen ${s.na} en ${s.voor}</h1>
          <p style="font-size:1.15rem;margin:0">Voordat je naar <b>${s.voor}</b> vliegt, laat je zien dat je alles nog weet!
          Je krijgt <b>${st.herhaling.aantal} vragen</b> van alle planeten door elkaar. Heb je er minstens <b>${st.herhaling.nodig}</b> goed? Dan gaat ${s.voor} open.</p>
          ${s.status === 'klaar' ? '<p class="zacht">Deze herhalingsster heb je al gehaald! ✓ Je mag hier altijd nog oefenen.</p>' : ''}
        </div>
      </div>
      <h2 style="margin-top:22px">Dit herhaal je</h2>
      <div class="voorbeelden">${doelen.map((p, i) => `<span>${i + 1}. ${p.naam}: ${esc(p.titel)}</span>`).join('')}</div>
      <p class="zacht">Twijfel je over een regel? Klik op de kaart op een planeet om de uitleg nog eens te lezen.</p>
      <div class="knoppen">
        <a class="knop groen groot" href="#/oefenen-ster/${k}">💪 Oefenen (10 gemengde vragen)</a>
        ${s.status === 'huidig' ? `<a class="knop geel groot" href="#/ster-toets/${k}">⭐ Haal de herhalingsster!</a>` : ''}
      </div>
    </div>
  </div>`;
  koppelKop();
}

async function schermPlaneet(i) {
  const st = await api('GET', '/api/status');
  const p = st.planeten[i];
  if (!p || p.status === 'slot') return ga('/');
  app.innerHTML = kopLeerling(st) + `<div class="wrap">
    <a href="#/" class="knop klein grijs">← Terug naar de kaart</a>
    <div class="paneel" style="margin-top:16px">
      <div class="planeet-kop">
        <div class="zweef">${planeetSVG(p, 170)}</div>
        <div>
          <span class="label">Planeet ${i + 1}</span>
          <h1 style="font-size:2.2rem">${p.naam}: ${esc(p.titel)}</h1>
          <p style="font-size:1.15rem;margin:0 0 10px"><b>🎯 Leerdoel:</b> ${esc(p.doel)}</p>
          <div class="balk"><div style="width:${p.gedaan / p.totaal * 100}%"></div></div>
          <p class="zacht" style="margin:6px 0 0">${p.gedaan} van ${p.totaal} vragen goed${p.status === 'klaar' ? ' · Deze planeet heb je gehaald! ✓' : ''}</p>
        </div>
      </div>
      <h2 style="margin-top:22px">Zo werkt het</h2>
      <ul class="uitleg-lijst">${p.uitleg.map(u => `<li>${u}</li>`).join('')}</ul>
      <p class="zacht" style="margin-bottom:6px">Voorbeelden:</p>
      <div class="voorbeelden">${p.voorbeelden.map(v => `<span>${esc(v)}</span>`).join('')}</div>
      <div class="knoppen">
        <a class="knop groen groot" href="#/oefenen/${i}">${p.gedaan >= p.totaal ? '🔁 Herhalen' : '🚀 Oefenen (10 vragen)'}</a>
        ${p.toets_open ? `<a class="knop geel groot" href="#/toets/${i}">🏁 Doe de toets!</a>` : ''}
      </div>
      ${p.status === 'huidig' && !p.toets_open ? `<p class="zacht">Maak alle ${p.totaal} vragen goed. Dan mag je de toets doen. Haal je 10 van de 10? Dan vlieg je door naar de volgende planeet!</p>` : ''}
      ${p.toets_open ? '<p class="zacht">Je hebt alle vragen goed gedaan! In de toets krijg je 10 vragen. Heb je ze <b>allemaal</b> goed? Dan vlieg je naar de volgende planeet.</p>' : ''}
    </div>
  </div>`;
  koppelKop();
}

function zinHTML(v, invoer) {
  const [voor, na] = v.zin.split('___');
  const gat = invoer
    ? `<input id="antw" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Vul het werkwoord in">`
    : '<span class="gat">?</span>';
  return `${esc(voor)}${gat}${esc(na)} <span class="ww">(${esc(v.ww)})</span>`;
}

async function schermOefenen(i, ster = false) {
  const st = await api('GET', '/api/status');
  const ronde = await api('GET', ster ? '/api/oefenen?ster=' + i : '/api/oefenen?planeet=' + i);
  const terug = ster ? '#/ster/' + i : '#/planeet/' + i;
  const p = st.planeten[i];
  let nr = 0, goedAantal = 0, verdiendTotaal = 0, gedaan = p.gedaan, munten = st.leerling.munten, reeks = st.leerling.reeks;
  const uitslagen = [];

  const teken = () => {
    const v = ronde.vragen[nr];
    const procent = Math.min(100, gedaan / p.totaal * 100);
    app.innerHTML = `
      <div class="oefen-kop wrap">
        <a href="${terug}" class="knop klein grijs" aria-label="Stoppen">✕</a>
        ${ster ? `<div style="text-align:center"><b>⭐ Herhalingsster: oefenen</b><small class="zacht" style="display:block">Vragen van alle planeten door elkaar</small></div>` : `<div class="voortgang">
          <div class="balk"><div style="width:${procent}%"></div></div>
          <span class="raketje" style="left:${procent}%">${raketSVG(34)}</span>
          <small>${p.naam}: ${gedaan} / ${p.totaal} goed</small>
        </div>`}
        <span class="munten">${munt()} <span id="mt">${munten}</span></span>
      </div>
      <div class="wrap">
        <div class="paneel vraag-kaart">
          <div class="soort">Vraag ${nr + 1} van ${ronde.vragen.length} · ${v.type === 'mk' ? 'Kies het goede antwoord' : 'Typ het werkwoord in de zin'}
            ${reeks >= 3 ? `<span class="reeks"> · 🔥 ${reeks} op rij</span>` : ''}</div>
          <div class="puntjes">${ronde.vragen.map((_, k) => `<i class="${k < nr ? (uitslagen[k] ? 'goed' : 'fout') : k === nr ? 'nu' : ''}"></i>`).join('')}</div>
          <p class="zin">${zinHTML(v, v.type === 'open')}</p>
          ${v.type === 'mk'
            ? `<div class="opties">${v.opties.map(o => `<button class="optie" data-o="${esc(o)}">${esc(v.hoofdletter ? cap(o) : o)}</button>`).join('')}</div>`
            : `<button class="knop groen groot" id="check">Controleer ✓</button>`}
          <div id="fb"></div>
        </div>
      </div>`;
    const start = performance.now();
    let bezig = false;
    const verstuur = async antwoord => {
      if (bezig) return;
      if (!antwoord.trim()) { app.querySelector('#antw')?.focus(); return; }
      bezig = true;
      const sec = (performance.now() - start) / 1000;
      let r;
      try { r = await api('POST', '/api/antwoord', { id: v.id, antwoord, sec }); }
      catch (e) { bezig = false; return modal(`<p>${esc(e.message)}</p>`); }
      uitslagen[nr] = r.goed;
      if (r.goed) goedAantal++;
      verdiendTotaal += r.verdiend + r.bonus;
      munten = r.munten; reeks = r.reeks;
      app.querySelector('#mt').textContent = munten;
      if (!ster) {
        gedaan = r.gedaan;
        app.querySelector('.balk > div').style.width = Math.min(100, gedaan / p.totaal * 100) + '%';
        app.querySelector('.raketje').style.left = Math.min(100, gedaan / p.totaal * 100) + '%';
        app.querySelector('.voortgang small').textContent = `${p.naam}: ${gedaan} / ${p.totaal} goed`;
      }
      const inp = app.querySelector('#antw');
      if (inp) { inp.disabled = true; inp.classList.add(r.goed ? 'goed' : 'fout'); }
      app.querySelectorAll('.optie').forEach(b => {
        b.disabled = true;
        if (b.dataset.o === r.antwoord) b.classList.add('goed');
        else if (b.dataset.o === antwoord) b.classList.add('fout');
      });
      app.querySelector('#check')?.remove();
      const juist = v.hoofdletter ? cap(r.antwoord) : r.antwoord;
      const prijs = ['Super!', 'Goed zo!', 'Top!', 'Knap gedaan!', 'Raak!', 'Yes!', 'Geweldig!'];
      app.querySelector('#fb').innerHTML = `<div class="feedback ${r.goed ? 'goed' : 'fout'}">
        ${r.goed
          ? `<h3>✅ ${prijs[Math.floor(Math.random() * prijs.length)]} <span class="verdiend">+${r.verdiend + r.bonus} ${munt(20)}</span>${r.bonus ? ` <small>(🔥 bonus voor ${r.reeks} op rij!)</small>` : ''}</h3>`
          : `<h3>💫 Bijna!</h3><div>Het goede antwoord is: <span class="juist">${esc(juist)}</span></div>`}
        <div class="uitleg">${r.uitleg}</div>
        <span class="regel">Regel: ${esc(r.regel)}</span>
        <div style="margin-top:14px;text-align:right"><button class="knop" id="volgende">${nr + 1 < ronde.vragen.length ? 'Volgende →' : 'Klaar! →'}</button></div>
      </div>`;
      const volg = app.querySelector('#volgende');
      volg.focus();
      volg.onclick = async () => {
        await toonNieuwDier(r.nieuwDier);
        nr++;
        if (nr < ronde.vragen.length) teken(); else klaar();
      };
    };
    const inp = app.querySelector('#antw');
    if (inp) {
      inp.focus();
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') verstuur(inp.value); });
      app.querySelector('#check').onclick = () => verstuur(inp.value);
    }
    app.querySelectorAll('.optie').forEach(b => b.onclick = () => verstuur(b.dataset.o));
  };

  const klaar = () => {
    const toetsOpen = !ster && gedaan >= p.totaal && p.status === 'huidig';
    const sterOpen = ster && st.sterren[i].status === 'huidig';
    if (goedAantal >= 8) confetti();
    app.innerHTML = `<div class="wrap"><div class="paneel resultaat">
      <div class="zweef">${blobSVG(st.leerling.blob, 140)}</div>
      <h1>${goedAantal === ronde.vragen.length ? 'Alles goed! 🌟' : goedAantal >= 7 ? 'Goed gedaan! 🚀' : 'Lekker geoefend! 💪'}</h1>
      <p class="groot-getal">${goedAantal} / ${ronde.vragen.length}</p>
      <p>Je verdiende <span class="prijs">${verdiendTotaal} ${munt()}</span></p>
      ${ster ? '' : `<div class="balk" style="margin:16px 0 6px"><div style="width:${Math.min(100, gedaan / p.totaal * 100)}%"></div></div>
      <p class="zacht">${p.naam}: ${gedaan} van ${p.totaal} vragen goed</p>`}
      ${toetsOpen ? '<p style="font-size:1.2rem">🏁 <b>Je hebt alle vragen goed gedaan! Je mag nu de toets doen.</b></p>' : ''}
      <div class="knoppen" style="justify-content:center">
        <a class="knop grijs" href="#/">🗺️ Naar de kaart</a>
        ${toetsOpen ? `<a class="knop geel groot" href="#/toets/${i}">🏁 Naar de toets</a>` : ''}
        ${sterOpen ? `<a class="knop geel groot" href="#/ster-toets/${i}">⭐ Haal de herhalingsster</a>` : ''}
        <button class="knop groen groot" id="nog">🔁 Nog een ronde</button>
      </div>
    </div></div>`;
    app.querySelector('#nog').onclick = () => route();
  };

  teken();
}

async function schermToets(i, ster = false) {
  const st = await api('GET', '/api/status');
  const p = st.planeten[i];
  const terug = ster ? '#/ster/' + i : '#/planeet/' + i;
  let toets;
  try { toets = await api('POST', ster ? '/api/ster/start' : '/api/toets/start', ster ? { ster: i } : { planeet: i }); }
  catch (e) { await modal(`<p>${esc(e.message)}</p>`); return ga(terug.slice(1)); }
  let nr = 0;

  const teken = () => {
    const v = toets.vragen[nr];
    app.innerHTML = `
      <div class="oefen-kop wrap">
        <a href="${terug}" class="knop klein grijs" aria-label="Stoppen">✕</a>
        <div style="text-align:center"><b>${ster ? '⭐ Herhalingsster' : '🏁 Toets ' + p.naam}</b><div class="puntjes">${toets.vragen.map((_, k) => `<i class="${k < nr ? 'klaar' : k === nr ? 'nu' : ''}"></i>`).join('')}</div></div>
        <span></span>
      </div>
      <div class="wrap"><div class="paneel vraag-kaart">
        <div class="soort">Toetsvraag ${nr + 1} van ${toets.vragen.length} · Denk goed na, je hoort het antwoord aan het eind!</div>
        <p class="zin">${zinHTML(v, v.type === 'open')}</p>
        ${v.type === 'mk'
          ? `<div class="opties">${v.opties.map(o => `<button class="optie" data-o="${esc(o)}">${esc(v.hoofdletter ? cap(o) : o)}</button>`).join('')}</div>`
          : '<button class="knop groen groot" id="check">Volgende →</button>'}
      </div></div>`;
    const start = performance.now();
    let bezig = false;
    const verstuur = async antwoord => {
      if (bezig || !antwoord.trim()) return app.querySelector('#antw')?.focus();
      bezig = true;
      app.querySelectorAll('.optie').forEach(b => { b.disabled = true; if (b.dataset.o === antwoord) b.classList.add('gekozen'); });
      let r;
      try { r = await api('POST', '/api/toets/antwoord', { toets_id: toets.toets_id, id: v.id, antwoord, sec: (performance.now() - start) / 1000 }); }
      catch (e) { bezig = false; return modal(`<p>${esc(e.message)}</p>`); }
      await toonNieuwDier(r.nieuwDier);
      if (!r.klaar) { nr++; return teken(); }
      uitslag(r);
    };
    const inp = app.querySelector('#antw');
    if (inp) {
      inp.focus();
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') verstuur(inp.value); });
      app.querySelector('#check').onclick = () => verstuur(inp.value);
    }
    app.querySelectorAll('.optie').forEach(b => b.onclick = () => verstuur(b.dataset.o));
  };

  const uitslag = r => {
    const volgende = st.planeten[i + 1];
    if (r.gehaald) confetti();
    const blob = { ...st.leerling.blob, accessoires: [...new Set([...(st.leerling.blob?.accessoires || []), ...(r.accessoire ? [r.accessoire.id] : [])])] };
    let kop;
    if (r.gehaald && ster) {
      kop = `<div class="zweef">${herhalingsSterSVG(150, 'klaar')}</div>
        <h1>Herhalingsster gehaald! ⭐</h1><p class="groot-getal">${r.score} / ${r.totaal}</p>
        <p style="font-size:1.2rem">Je verdiende <span class="prijs">${r.verdiend} ${munt()}</span></p>
        <p>Je weet alles nog! Je raket vliegt door naar <b>${volgende.naam}</b>! 🚀</p>`;
    } else if (r.gehaald) {
      kop = `<div class="zweef">${blobSVG(blob, 150)}</div>
        <h1>Toets gehaald! 🎉</h1><p class="groot-getal">${r.score} / ${r.totaal}</p>
        <p style="font-size:1.2rem">Je verdiende <span class="prijs">${r.verdiend} ${munt()}</span>
        ${r.accessoire ? `en je blob krijgt iets nieuws: <b style="color:var(--geel)">${esc(r.accessoire.naam)}</b>!` : ''}</p>
        <p>${r.herhalingsster ? `Op weg naar <b>${volgende.naam}</b> wacht eerst nog de <b>herhalingsster</b> ⭐. Haal je die, dan vlieg je door!` : volgende ? `Je raket vliegt door naar <b>${volgende.naam}</b>! 🚀` : 'Je hebt het hele zonnestelsel veroverd! 🏆'}</p>`;
    } else {
      kop = `<div>${ster ? herhalingsSterSVG(120, 'huidig') : planeetSVG(p, 120)}</div><h1>Nog niet helemaal… 💫</h1><p class="groot-getal">${r.score} / ${r.totaal}</p>
        <p>Je moet ${r.nodig === r.totaal ? `alle ${r.totaal} vragen` : `minstens ${r.nodig} van de ${r.totaal} vragen`} goed hebben. Kijk hieronder wat er misging en probeer het nog eens!</p>`;
    }
    app.innerHTML = `<div class="wrap"><div class="paneel resultaat">
      ${kop}
      <div class="nakijk">${r.nakijken.map(n => `<div class="${n.goed ? '' : 'fout'}">
        ${n.goed ? '✅' : '❌'} ${esc(n.zin.replace('___', n.goed ? (n.hoofdletter ? cap(n.juist) : n.juist) : '…'))} <span class="ww">(${esc(n.ww)})</span>
        ${n.goed ? '' : `<br>Jij schreef: <s>${esc(n.antwoord) || '(niets)'}</s> · Goed is: <b style="color:var(--geel)">${esc(n.juist)}</b><div class="uitleg zacht" style="margin-top:4px">${n.uitleg}</div>`}
      </div>`).join('')}</div>
      <div class="knoppen" style="justify-content:center">
        <a class="knop grijs" href="#/">🗺️ Naar de kaart</a>
        ${r.gehaald
          ? (r.herhalingsster ? `<a class="knop geel" href="#/ster/${i}">⭐ Naar de herhalingsster</a>` : '') + (r.accessoire ? '<a class="knop" href="#/blob">👕 Blob aankleden</a>' : '')
          : `<a class="knop" href="#/${ster ? 'oefenen-ster' : 'oefenen'}/${i}">💪 Eerst nog oefenen</a><button class="knop geel" id="opnieuw">${ster ? '⭐ Opnieuw proberen' : '🏁 Toets opnieuw'}</button>`}
      </div>
    </div></div>`;
    const o = app.querySelector('#opnieuw');
    if (o) o.onclick = () => route();
  };

  teken();
}

async function schermBlob() {
  const st = await api('GET', '/api/status');
  const nieuw = !st.leerling.blob;
  const b = { kleur: '#22c55e', ogen: 2, accessoires: [], naam: '', ...(st.leerling.blob || {}) };
  const kleuren = ['#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#facc15', '#06b6d4', '#ef4444'];
  const teken = () => {
    app.innerHTML = (nieuw ? `<header class="kop wrap"><span class="logo">${logo()}</span></header>` : kopLeerling(st)) + `<div class="wrap">
      ${nieuw ? '' : '<a href="#/" class="knop klein grijs">← Terug naar de kaart</a>'}
      <div class="paneel" style="margin-top:16px">
        <h1>${nieuw ? `Welkom, ${esc(st.leerling.naam.split(' ')[0])}! Maak je eigen blob 👾` : 'Mijn blob'}</h1>
        <p class="zacht">${nieuw ? 'Je blob reist met je mee door het zonnestelsel. Bij elke planeet die je haalt, krijgt je blob iets nieuws!' : 'Bij elke planeet die je haalt, krijgt je blob iets nieuws.'}</p>
        <div class="blob-maker">
          <div style="text-align:center"><div class="zweef">${blobSVG(b, 240)}</div><h2>${esc(b.naam || 'Blobbie')}</h2></div>
          <div>
            <label class="veld"><span>Naam van je blob</span><input id="naam" maxlength="20" value="${esc(b.naam)}" placeholder="Blobbie"></label>
            <p style="margin:14px 0 8px;font-weight:600" class="zacht">Kleur</p>
            <div class="kleurtjes">${kleuren.map(k => `<button style="background:${k}" class="${b.kleur === k ? 'aan' : ''}" data-k="${k}" aria-label="Kleur"></button>`).join('')}</div>
            <p style="margin:14px 0 8px;font-weight:600" class="zacht">Ogen</p>
            <div class="keuzes">${[1, 2, 3].map(o => `<button class="${b.ogen === o ? 'aan' : ''}" data-ogen="${o}">${'👁️'.repeat(o)}</button>`).join('')}</div>
            <p style="margin:14px 0 8px;font-weight:600" class="zacht">Spullen: kies zoveel je wilt! (haal planeten om meer te krijgen)</p>
            <div class="keuzes">${st.accessoires.filter(a => a.id !== 'geen').map(a => `<button class="${b.accessoires.includes(a.id) ? 'aan' : ''}" data-acc="${a.id}" ${a.open ? '' : 'disabled'} aria-pressed="${b.accessoires.includes(a.id)}" title="${a.open ? '' : 'Haal planeet ' + (a.planeet + 1) + ' om dit te krijgen'}">${a.open ? (b.accessoires.includes(a.id) ? '✓ ' : '') : '🔒 '}${esc(a.naam)}</button>`).join('')}
              ${st.accessoires.some(a => a.open && a.id !== 'geen') ? `<button data-uit="1">Alles uit</button>` : ''}</div>
            <div class="knoppen"><button class="knop groen groot" id="opslaan">${nieuw ? '🚀 Klaar, op naar de Aarde!' : 'Opslaan'}</button></div>
          </div>
        </div>
      </div></div>`;
    if (!nieuw) koppelKop();
    const naamIn = app.querySelector('#naam');
    naamIn.oninput = () => { b.naam = naamIn.value; app.querySelector('.blob-maker h2').textContent = b.naam || 'Blobbie'; };
    app.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { b.kleur = x.dataset.k; teken(); });
    app.querySelectorAll('[data-ogen]').forEach(x => x.onclick = () => { b.ogen = Number(x.dataset.ogen); teken(); });
    app.querySelectorAll('[data-acc]').forEach(x => x.onclick = () => {
      const id = x.dataset.acc;
      b.accessoires = b.accessoires.includes(id) ? b.accessoires.filter(a => a !== id) : [...b.accessoires, id];
      teken();
    });
    const uit = app.querySelector('[data-uit]');
    if (uit) uit.onclick = () => { b.accessoires = []; teken(); };
    app.querySelector('#opslaan').onclick = async () => { await api('POST', '/api/blob', b); ga('/'); };
  };
  teken();
}

async function schermWinkel() {
  const st = await api('GET', '/api/status');
  const w = await api('GET', '/api/winkel');
  st.leerling.munten = w.munten;
  const totaal = w.kaarten.reduce((s, k) => s + k.sterren.length, 0);
  const heb = w.kaarten.reduce((s, k) => s + k.gekocht.length, 0);
  app.innerHTML = kopLeerling(st) + `<div class="wrap">
    <a href="#/" class="knop klein grijs">← Terug naar de kaart</a>
    <div class="rij tussen" style="margin:16px 0">
      <div><h1>⭐ De Sterrenwinkel</h1>
      <p class="zacht" style="margin:0">Spaar munten en koop sterren voor je sterrenkaart. Is een sterrenbeeld vol? Dan gaat het stralen en mag je aan de volgende kaart beginnen!</p></div>
      <div class="paneel" style="padding:12px 18px"><b>${heb}</b> van ${totaal} sterren verzameld</div>
    </div>
    <div class="kaarten">${w.kaarten.map(k => `
      <div class="paneel spaarkaart ${k.open ? '' : 'dicht'}">
        ${k.vol ? '<span class="label groen vol-label">Compleet! ✨</span>' : ''}
        <h2>${k.open ? '' : '🔒 '}${esc(k.naam)}</h2>
        ${sterrenbeeldSVG(k, 260)}
        <p style="margin:8px 0 0">${k.gekocht.length} / ${k.sterren.length} sterren
        ${!k.vol ? ` · <span class="prijs">${k.prijs} ${munt(18)}</span> per ster` : ''}</p>
        ${!k.open ? '<p class="zacht" style="margin:4px 0 0"><small>Maak eerst de kaart hiervoor vol.</small></p>' : !k.vol ? '<p class="zacht" style="margin:4px 0 0"><small>Klik op een lege ster om hem te kopen.</small></p>' : ''}
      </div>`).join('')}</div>
  </div>`;
  koppelKop();
  app.querySelectorAll('.ster.koop').forEach(s => {
    const kaart = w.kaarten.find(k => k.id === s.dataset.beeld);
    if (!kaart.open) return;
    const koop = async () => {
      if (w.munten < kaart.prijs) return modal(`<h2>Nog even sparen! 🪙</h2><p>Deze ster kost <b>${kaart.prijs}</b> munten. Jij hebt er ${w.munten}. Oefen nog wat om meer munten te verdienen!</p>`);
      if (!await vraagModal(`<h2>Ster kopen?</h2><p>Wil je deze ster in <b>${esc(kaart.naam)}</b> kopen voor <span class="prijs">${kaart.prijs} ${munt()}</span>?</p>`, 'Ja, kopen!', 'Nee')) return;
      try {
        const r = await api('POST', '/api/winkel/koop', { beeld: kaart.id, nr: Number(s.dataset.nr) });
        if (r.vol) { confetti(); await modal(`<h2>${esc(r.naam)} is compleet! ✨</h2><p>Wat een prachtig sterrenbeeld. De volgende spaarkaart is nu open!</p>`); }
        route();
      } catch (e) { modal(`<p>${esc(e.message)}</p>`); }
    };
    s.addEventListener('click', koop);
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); koop(); } });
  });
}

async function schermDierentuin() {
  const st = await api('GET', '/api/status');
  const d = await api('GET', '/api/dierentuin');
  app.innerHTML = kopLeerling(st) + `<div class="wrap">
    <a href="#/" class="knop klein grijs">← Terug naar de kaart</a>
    <div class="paneel" style="margin-top:16px">
      <h1>👾 De Aliendierentuin van ${esc(d.groep)}</h1>
      <p class="zacht">Iedereen in de klas helpt mee! Elke ${d.per_dier_min} minuten dat jullie samen oefenen tijdens de <b>oefenles in de klas</b>, komt er een nieuw aliendier bij.</p>
      <div class="les-status ${d.les_actief ? 'aan' : ''}">${d.les_actief
        ? '🟢 <b>De oefenles is bezig!</b> Elke minuut die je nu oefent, helpt de klas aan een nieuw dier.'
        : '⏸️ Er is nu geen oefenles. Je kunt gewoon oefenen en munten verdienen, maar de dierentuin groeit alleen als de juf of meester de oefenles aanzet.'}</div>
      <div class="rij tussen"><b>${d.ontgrendeld} van ${d.totaal} dieren</b>
        <span class="zacht">${d.ontgrendeld >= d.totaal ? 'De dierentuin is vol! 🎉' : `Nog ${d.min_tot_volgende} minuten samen oefenen tot het volgende dier`}</span></div>
      <div class="balk grote-balk" style="margin-top:8px"><div style="width:${Math.round(d.naar_volgende * 100)}%"></div></div>
      <p class="zacht" style="margin-bottom:0">Jij hebt al <b style="color:var(--geel)">${d.mijn_min} minuten</b> geoefend. Super!</p>
    </div>
    <div class="dieren" style="margin-top:18px">${d.dieren.map(x => `
      <div class="dier ${x.open ? 'open' : ''}">${x.open ? `<div class="zweef" style="animation-delay:${(x.id % 5) * .4}s">${alienSVG(x, 110)}</div>` : alienSVG(x, 110)}
      <div class="naam">${x.open ? esc(x.naam) : '???'}</div></div>`).join('')}</div>
    <div class="paneel" style="margin-top:18px">
      <h2>Het team</h2>
      <div class="klasblobs">${d.klas.map(k => `<div>${blobSVG(k.blob, 54)}<br>${esc(k.naam)}</div>`).join('')}</div>
    </div>
  </div>`;
  koppelKop();
}

// ================= leerkracht =================
function kopLk(actief) {
  return `<header class="lk-kop"><div class="wrap">
    <a href="#/" class="logo">${logo()} <small style="font-size:.9rem;font-weight:500;color:#c7d2fe">voor leerkrachten</small></a>
    <nav>
      <a href="#/" class="${actief === 'groepen' ? 'aan' : ''}">👥 Groepen</a>
      <a href="#/leerdoelen" class="${actief === 'leerdoelen' ? 'aan' : ''}">🪐 Leerdoelen & vragen</a>
      ${IK.leerkracht?.beheerder ? `<a href="#/collegas" class="${actief === 'collegas' ? 'aan' : ''}">🔐 Collega's</a>` : ''}
      <a href="#" id="uit">Uitloggen</a>
    </nav></div></header>`;
}
function koppelLk() { const u = app.querySelector('#uit'); if (u) u.onclick = e => { e.preventDefault(); loguit(); }; }
const PLANEETNAMEN = ['Aarde', 'Maan', 'Mars', 'Venus', 'Jupiter', 'Saturnus', 'Uranus', 'Neptunus', 'Pluto'];
const planeetLabel = (p, h = null) => h !== null && h !== undefined ? `<span class="pill geel">⭐ Herhaling na ${PLANEETNAMEN[h]}</span>`
  : p >= PLANEETNAMEN.length ? '<span class="pill groen">Alles gehaald 🏆</span>' : `<span class="pill">${p + 1}. ${PLANEETNAMEN[p]}</span>`;
const tijdstip = iso => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
function wanneer(iso) {
  if (!iso) return '<span class="zacht">nog nooit</span>';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  const min = Math.round((Date.now() - d) / 60000);
  if (min < 2) return 'net nog';
  if (min < 60) return `${min} min geleden`;
  if (min < 60 * 24) return `${Math.round(min / 60)} uur geleden`;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}
function staven(rijen) {
  const max = Math.max(1, ...rijen.map(r => r.n));
  return rijen.length ? rijen.map(r => `<div class="staaf"><span>${esc(r.label)}</span><div class="b"><div style="width:${r.n / max * 100}%"></div></div><b>${r.n}</b></div>`).join('')
    : '<p class="zacht">Nog geen fouten gemaakt.</p>';
}

async function lkGroepen() {
  const d = await api('GET', '/api/lk/groepen');
  app.innerHTML = kopLk('groepen') + `<div class="wrap">
    <h1 style="margin-top:12px">Hallo ${esc(d.leerkracht.naam)} 👋</h1>
    <p class="zacht">Kies een groep om de voortgang van je leerlingen te bekijken, of maak een nieuwe groep aan.</p>
    <div class="groepen-raster">
      ${d.groepen.map(g => `<a class="kaart groep-kaart" href="#/groep/${g.id}">
        <h2>${esc(g.naam)}</h2>
        <p class="zacht" style="margin:0 0 10px">${g.leerlingen} leerling${g.leerlingen === 1 ? '' : 'en'}</p>
        <div class="rij">${alienSVG({ soort: 'octo', kleur: '#a855f7' }, 40)}<span>${g.dierentuin.ontgrendeld} / ${g.dierentuin.totaal} aliendieren</span></div>
        ${g.dierentuin.les_actief ? `<span class="pill groen" style="margin-top:8px">🟢 Oefenles tot ${tijdstip(g.dierentuin.les_tot)}</span>` : ''}
      </a>`).join('')}
      <form class="kaart" id="nieuw">
        <h2>➕ Nieuwe groep</h2>
        <label class="veld"><span>Naam van de groep</span><input name="naam" placeholder="Groep 6b" required></label>
        <button class="knop">Groep maken</button>
      </form>
    </div>
  </div>`;
  koppelLk();
  app.querySelector('#nieuw').onsubmit = async e => {
    e.preventDefault();
    const r = await api('POST', '/api/lk/groepen', Object.fromEntries(new FormData(e.target)));
    ga('/groep/' + r.id);
  };
}

async function lkGroep(id, melding = '') {
  const d = await api('GET', '/api/lk/groepen/' + id);
  const g = d.groep;
  app.innerHTML = kopLk('groepen') + `<div class="wrap">
    <div class="rij tussen" style="margin:12px 0">
      <div><a href="#/" class="zacht">← Alle groepen</a><h1>${esc(g.naam)}</h1></div>
      <div class="rij niet-printen">
        <a class="knop klein" href="#/kaartjes/${g.id}">🖨️ Inlogkaartjes</a>
      </div>
    </div>
    ${melding}
    <div class="kaart les ${d.dierentuin.les_actief ? 'aan' : ''}">
      <div class="rij tussen">
        <div>
          <h2 style="margin-bottom:4px">${d.dierentuin.les_actief ? `🟢 Oefenles bezig tot ${tijdstip(d.dierentuin.les_tot)}` : '⏸️ Geen oefenles bezig'}</h2>
          <p class="zacht" style="margin:0">${d.dierentuin.les_actief
            ? 'Alle oefentijd telt nu mee voor de aliendierentuin van de klas.'
            : 'Leerlingen kunnen altijd oefenen (ook thuis), maar de aliendierentuin groeit alleen tijdens een oefenles die jij aanzet.'}</p>
        </div>
        <div class="rij niet-printen">
          ${d.dierentuin.les_actief
            ? '<button class="knop klein grijs" data-les="15">+ 15 min</button><button class="knop rood" data-les="0">Oefenles stoppen</button>'
            : '<span class="zacht">Start oefenles:</span>' + [30, 45, 60, 90].map(m => `<button class="knop groen klein" data-les="${m}">${m} min</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="drie" style="margin-bottom:18px">
      <div class="stat"><span class="zacht">Leerlingen</span><b>${d.leerlingen.length}</b></div>
      <div class="stat"><span class="zacht">Aliendierentuin</span><b>${d.dierentuin.ontgrendeld} / ${d.dierentuin.totaal}</b>
        <div class="balk"><div style="width:${d.dierentuin.naar_volgende * 100}%"></div></div><small class="zacht">nog ${d.dierentuin.min_tot_volgende} min tot het volgende dier</small></div>
      <div class="stat"><span class="zacht">Samen geoefend in oefenlessen</span><b>${Math.round(d.dierentuin.sec / 60)} min</b></div>
    </div>

    <div class="kaart">
      <h2>Leerlingen</h2>
      ${d.leerlingen.length ? `<div class="tabel-wrap"><table>
        <thead><tr><th>Naam</th><th>Inloggen</th><th>Planeet</th><th>Voortgang</th><th>% goed</th><th>Meeste fouten</th><th>Tijd</th><th>Actief</th><th></th></tr></thead>
        <tbody>${d.leerlingen.map(l => `<tr>
          <td><a href="#/leerling/${l.id}" style="display:flex;align-items:center;gap:6px;color:inherit;font-weight:600">${blobSVG(l.blob, 32)} ${esc(l.naam)}</a></td>
          <td><span class="code">${esc(l.gebruikersnaam)}</span> <span class="code">${esc(l.wachtwoord)}</span></td>
          <td>${planeetLabel(l.planeet, l.herhaling)}</td>
          <td style="min-width:120px">${l.gedaan === null || l.herhaling !== null ? '–' : `<div class="balk"><div style="width:${l.gedaan}%"></div></div><small class="zacht">${l.gedaan}/100</small>`}</td>
          <td>${l.percentage_goed === null ? '–' : `<span class="pill ${l.percentage_goed >= 80 ? 'groen' : l.percentage_goed >= 60 ? 'geel' : 'rood'}">${l.percentage_goed}%</span>`}</td>
          <td><small>${esc(l.meeste_fouten || '–')}</small></td>
          <td>${l.oefen_min} min</td>
          <td><small>${wanneer(l.laatst_actief)}</small></td>
          <td><div class="acties">
            <a class="knop klein" href="#/leerling/${l.id}">Bekijk</a>
            <button class="knop klein grijs" data-ww="${l.id}" title="Nieuw wachtwoord">🔑</button>
            <button class="knop klein rood" data-weg="${l.id}" data-naam="${esc(l.naam)}" title="Verwijderen">🗑️</button>
          </div></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="leeg">Nog geen leerlingen. Voeg ze hieronder toe!</p>'}
    </div>

    <div class="twee">
      <form class="kaart" id="toevoegen">
        <h2>➕ Leerlingen toevoegen</h2>
        <p class="zacht" style="margin-top:0">Eén naam per regel. SpaceVerbs maakt automatisch een gebruikersnaam en een makkelijk wachtwoord.</p>
        <label class="veld"><textarea name="namen" rows="6" placeholder="Emma de Vries&#10;Noah Bakker&#10;Sara"></textarea></label>
        <button class="knop">Toevoegen</button>
      </form>
      <form class="kaart" id="instellingen">
        <h2>⚙️ Instellingen</h2>
        <label class="veld"><span>Naam van de groep</span><input name="naam" value="${esc(g.naam)}"></label>
        <label class="veld"><span>Minuten oefenen per nieuw aliendier (hele klas samen)</span><input name="minuten_per_dier" type="number" min="1" max="600" value="${g.minuten_per_dier}"></label>
        <div class="rij tussen"><button class="knop">Opslaan</button><button type="button" class="knop klein rood" id="groepWeg">Groep verwijderen</button></div>
      </form>
    </div>

    <div class="twee">
      <div class="kaart"><h2>🔍 Welke fouten maakt de groep?</h2>${staven(d.fouten)}</div>
      <div class="kaart"><h2>🧩 Moeilijkste vragen</h2>
        ${d.moeilijk.length ? `<div class="tabel-wrap"><table><thead><tr><th>Zin</th><th>Goed</th><th>Fout</th></tr></thead><tbody>
        ${d.moeilijk.map(m => `<tr><td>${esc(m.zin)} <small class="zacht">(${esc(m.ww)}) · ${PLANEETNAMEN[m.planeet]}</small></td><td><b>${esc(m.antwoord)}</b></td><td><span class="pill rood">${m.fout}×</span></td></tr>`).join('')}
        </tbody></table></div>` : '<p class="zacht">Nog geen gegevens.</p>'}</div>
    </div>
  </div>`;
  koppelLk();
  app.querySelectorAll('[data-les]').forEach(b => b.onclick = async () => {
    let min = Number(b.dataset.les);
    if (min && d.dierentuin.les_actief) min += Math.max(0, Math.round((new Date(d.dierentuin.les_tot) - Date.now()) / 60000)); // verlengen
    await api('POST', `/api/lk/groepen/${id}/les`, { minuten: min });
    lkGroep(id);
  });
  app.querySelector('#toevoegen').onsubmit = async e => {
    e.preventDefault();
    try {
      const r = await api('POST', `/api/lk/groepen/${id}/leerlingen`, { namen: new FormData(e.target).get('namen') });
      lkGroep(id, `<div class="melding">✅ ${r.nieuw.length} leerling${r.nieuw.length === 1 ? '' : 'en'} toegevoegd. <a href="#/kaartjes/${id}">Print de inlogkaartjes</a>.</div>`);
    } catch (err) { lkGroep(id, `<div class="fout-melding">${esc(err.message)}</div>`); }
  };
  app.querySelector('#instellingen').onsubmit = async e => {
    e.preventDefault();
    await api('PATCH', '/api/lk/groepen/' + id, Object.fromEntries(new FormData(e.target)));
    lkGroep(id, '<div class="melding">✅ Instellingen opgeslagen.</div>');
  };
  app.querySelector('#groepWeg').onclick = async () => {
    if (!await vraagModal(`<h2>Groep verwijderen?</h2><p>Alle leerlingen in <b>${esc(g.naam)}</b> en hun voortgang worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.</p>`, 'Verwijderen', 'Annuleren')) return;
    await api('DELETE', '/api/lk/groepen/' + id);
    ga('/');
  };
  app.querySelectorAll('[data-ww]').forEach(b => b.onclick = async () => {
    if (!await vraagModal('<h2>Nieuw wachtwoord?</h2><p>De leerling krijgt een nieuw wachtwoord en moet daarmee opnieuw inloggen.</p>', 'Ja, nieuw wachtwoord', 'Annuleren')) return;
    const r = await api('POST', `/api/lk/leerlingen/${b.dataset.ww}/nieuw-wachtwoord`, {});
    lkGroep(id, `<div class="melding">🔑 Nieuw wachtwoord: <span class="code">${esc(r.wachtwoord)}</span></div>`);
  });
  app.querySelectorAll('[data-weg]').forEach(b => b.onclick = async () => {
    if (!await vraagModal(`<h2>${esc(b.dataset.naam)} verwijderen?</h2><p>De leerling en alle voortgang worden verwijderd. De minuten in de dierentuin blijven bewaard.</p>`, 'Verwijderen', 'Annuleren')) return;
    await api('DELETE', '/api/lk/leerlingen/' + b.dataset.weg);
    lkGroep(id, `<div class="melding">🗑️ ${esc(b.dataset.naam)} is verwijderd.</div>`);
  });
}

async function lkKaartjes(id) {
  const d = await api('GET', '/api/lk/groepen/' + id);
  app.innerHTML = kopLk('groepen') + `<div class="wrap">
    <div class="rij tussen niet-printen" style="margin:12px 0">
      <div><a href="#/groep/${id}" class="zacht">← ${esc(d.groep.naam)}</a><h1>Inlogkaartjes</h1></div>
      <button class="knop" onclick="window.print()">🖨️ Printen</button>
    </div>
    <p class="zacht niet-printen">Knip de kaartjes uit en geef elke leerling zijn of haar eigen kaartje. Inloggen kan op: <b>${esc(location.origin)}</b></p>
    <div class="kaartjes">${d.leerlingen.map(l => `<div class="kaartje">
      ${blobSVG(l.blob || { kleur: '#a855f7', ogen: 2 }, 64)}
      <div><div class="k-logo">${logo()}</div><b>${esc(l.naam)}</b>
      <dl><dt>Naam:</dt><dd>${esc(l.gebruikersnaam)}</dd><dt>Wachtwoord:</dt><dd>${esc(l.wachtwoord)}</dd></dl></div>
    </div>`).join('') || '<p class="leeg">Nog geen leerlingen in deze groep.</p>'}</div>
  </div>`;
  koppelLk();
}

async function lkLeerling(id, melding = '') {
  const [d, gr] = await Promise.all([api('GET', '/api/lk/leerlingen/' + id), api('GET', '/api/lk/groepen')]);
  const l = d.leerling;
  app.innerHTML = kopLk('groepen') + `<div class="wrap">
    <div class="rij" style="margin:12px 0">
      ${blobSVG(l.blob, 80)}
      <div><a href="#/groep/${l.groep_id}" class="zacht">← Terug naar de groep</a><h1 style="margin:0">${esc(l.naam)}</h1>
      <span class="zacht">Inloggen met <span class="code">${esc(l.gebruikersnaam)}</span> / <span class="code">${esc(l.wachtwoord)}</span></span></div>
    </div>
    ${melding}
    <div class="drie" style="margin-bottom:18px">
      <div class="stat"><span class="zacht">Nu op</span><b>${l.herhaling !== null ? `⭐ Herhalingsster na ${PLANEETNAMEN[l.herhaling]}` : l.planeet >= PLANEETNAMEN.length ? 'Alles gehaald 🏆' : `${l.planeet + 1}. ${PLANEETNAMEN[l.planeet]}`}</b></div>
      <div class="stat"><span class="zacht">Geoefend</span><b>${l.oefen_min} min</b><small class="zacht">laatst actief: ${wanneer(l.laatst_actief)}</small></div>
      <div class="stat"><span class="zacht">Munten / sterren</span><b>${l.munten} 🪙 · ${l.sterren} ⭐</b></div>
    </div>
    <div class="twee">
      <div class="kaart"><h2>🪐 Voortgang per leerdoel</h2>
        ${d.perPlaneet.map((p, i) => `<div style="margin:10px 0">
          <div class="rij tussen"><span><b>${i + 1}. ${p.naam}</b> <small class="zacht">${esc(p.titel)}</small></span>
          <small>${i < l.planeet ? '<span class="pill groen">gehaald</span>' : i === l.planeet ? '<span class="pill geel">bezig</span>' : ''} ${p.percentage_goed !== null ? `${p.percentage_goed}% goed` : ''}</small></div>
          <div class="balk"><div style="width:${p.gedaan / p.totaal * 100}%"></div></div>
        </div>`).join('')}
      </div>
      <div>
        <div class="kaart"><h2>🔍 Soorten fouten</h2>${staven(d.fouten)}</div>
        <div class="kaart"><h2>🏁 Toetsen</h2>
          ${d.toetsen.length ? `<table><thead><tr><th>Planeet</th><th>Score</th><th>Datum</th></tr></thead><tbody>
          ${d.toetsen.map(t => `<tr><td>${t.naam}</td><td><span class="pill ${t.gehaald ? 'groen' : 'rood'}">${t.score}/${t.totaal} ${t.gehaald ? '✓' : ''}</span></td><td><small>${wanneer(t.klaar)}</small></td></tr>`).join('')}
          </tbody></table>` : '<p class="zacht">Nog geen toetsen gemaakt.</p>'}</div>
      </div>
    </div>
    <div class="kaart"><h2>✏️ Laatste fouten</h2>
      ${d.recent.length ? `<div class="tabel-wrap"><table><thead><tr><th>Zin</th><th>Antwoord</th><th>Goed is</th><th>Soort fout</th><th>Wanneer</th></tr></thead><tbody>
      ${d.recent.map(r => `<tr><td>${esc(r.zin)} <small class="zacht">(${esc(r.ww)}) · ${PLANEETNAMEN[r.planeet]}${r.modus === 'toets' ? ' · toets' : ''}</small></td>
        <td><span class="pill rood">${esc(r.antwoord) || '(leeg)'}</span></td><td><b>${esc(r.juist)}</b></td><td><small>${esc(r.label)}</small></td><td><small>${wanneer(r.tijd)}</small></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="zacht">Nog geen fouten gemaakt.</p>'}
    </div>
    <form class="kaart" id="beheer">
      <h2>⚙️ Beheer</h2>
      <div class="drie">
        <label class="veld"><span>Naam</span><input name="naam" value="${esc(l.naam)}"></label>
        <label class="veld"><span>Planeet (zelf aanpassen)</span><select name="stap">
          ${PLANEETNAMEN.map((n, i) => `<option value="p${i}" ${i === l.planeet && l.herhaling === null ? 'selected' : ''}>${i + 1}. ${n}</option>`
            + (i < PLANEETNAMEN.length - 1 ? `<option value="s${i}" ${l.herhaling === i ? 'selected' : ''}>⭐ Herhalingsster na ${n}</option>` : '')).join('')}
          <option value="p${PLANEETNAMEN.length}" ${l.planeet >= PLANEETNAMEN.length ? 'selected' : ''}>Alles gehaald</option></select></label>
        <label class="veld"><span>Groep</span><select name="groep_id">${gr.groepen.map(g => `<option value="${g.id}" ${g.id === l.groep_id ? 'selected' : ''}>${esc(g.naam)}</option>`).join('')}</select></label>
      </div>
      <div class="rij tussen"><button class="knop">Opslaan</button><button type="button" class="knop klein rood" id="weg">Leerling verwijderen</button></div>
    </form>
  </div>`;
  koppelLk();
  app.querySelector('#beheer').onsubmit = async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    await api('PATCH', '/api/lk/leerlingen/' + id, { naam: f.naam, stap: f.stap, groep_id: Number(f.groep_id) });
    lkLeerling(id, '<div class="melding">✅ Opgeslagen.</div>');
  };
  app.querySelector('#weg').onclick = async () => {
    if (!await vraagModal(`<h2>${esc(l.naam)} verwijderen?</h2><p>De leerling en alle voortgang worden verwijderd.</p>`, 'Verwijderen', 'Annuleren')) return;
    await api('DELETE', '/api/lk/leerlingen/' + id);
    ga('/groep/' + l.groep_id);
  };
}

async function lkCollegas(melding = '') {
  const d = await api('GET', '/api/lk/collegas');
  app.innerHTML = kopLk('collegas') + `<div class="wrap">
    <h1 style="margin-top:12px">Collega's</h1>
    <p class="zacht">Alleen jij als beheerder kunt collega's toegang geven. Een nieuwe leerkracht kan alleen een account maken met een uitnodigingscode. Zo kunnen leerlingen geen leerkracht-account aanmaken.</p>
    ${melding}
    <div class="twee">
      <form class="kaart" id="uitnodigen">
        <h2>✉️ Collega uitnodigen</h2>
        <p class="zacht" style="margin-top:0">Maak een code en geef die aan je collega. De code werkt één keer en is 14 dagen geldig.</p>
        <label class="veld"><span>Voor wie? (alleen voor jezelf, om het te onthouden)</span><input name="naam" placeholder="Meester Tim, groep 7"></label>
        <button class="knop">Code maken</button>
      </form>
      <div class="kaart">
        <h2>🎟️ Open uitnodigingen</h2>
        ${d.uitnodigingen.length ? `<table><thead><tr><th>Code</th><th>Voor</th><th>Geldig tot</th><th></th></tr></thead><tbody>
          ${d.uitnodigingen.map(u => `<tr><td><span class="code">${esc(u.code)}</span></td><td>${esc(u.naam) || '–'}</td>
            <td><small>${new Date(u.verloopt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</small></td>
            <td><button class="knop klein rood" data-intrekken="${esc(u.code)}">Intrekken</button></td></tr>`).join('')}
        </tbody></table>` : '<p class="zacht">Geen open uitnodigingen.</p>'}
      </div>
    </div>
    <div class="kaart">
      <h2>👩‍🏫 Leerkrachten</h2>
      <div class="tabel-wrap"><table><thead><tr><th>Naam</th><th>E-mail</th><th>Groepen</th><th>Rol</th><th></th></tr></thead><tbody>
      ${d.collegas.map(c => `<tr><td><b>${esc(c.naam)}</b>${c.ik ? ' <small class="zacht">(jij)</small>' : ''}</td><td>${esc(c.email)}</td><td>${c.groepen}</td>
        <td>${c.beheerder ? '<span class="pill geel">Beheerder</span>' : '<span class="pill">Leerkracht</span>'}</td>
        <td>${c.ik ? '' : `<div class="acties">
          <button class="knop klein grijs" data-rol="${c.id}" data-beheerder="${c.beheerder ? 0 : 1}">${c.beheerder ? 'Geen beheerder meer' : 'Maak beheerder'}</button>
          <button class="knop klein rood" data-weg="${c.id}" data-naam="${esc(c.naam)}" data-groepen="${c.groepen}">Verwijderen</button></div>`}</td></tr>`).join('')}
      </tbody></table></div>
    </div>
  </div>`;
  koppelLk();
  app.querySelector('#uitnodigen').onsubmit = async e => {
    e.preventDefault();
    const r = await api('POST', '/api/lk/uitnodigingen', Object.fromEntries(new FormData(e.target)));
    lkCollegas(`<div class="melding">✅ Nieuwe uitnodigingscode: <span class="code" style="font-size:1.2rem">${esc(r.code)}</span>. Je collega vult deze in bij <b>Leerkracht → Account maken</b> op ${esc(location.origin)}.</div>`);
  };
  app.querySelectorAll('[data-intrekken]').forEach(b => b.onclick = async () => {
    await api('DELETE', '/api/lk/uitnodigingen/' + encodeURIComponent(b.dataset.intrekken));
    lkCollegas('<div class="melding">Uitnodiging ingetrokken.</div>');
  });
  app.querySelectorAll('[data-rol]').forEach(b => b.onclick = async () => {
    await api('PATCH', '/api/lk/collegas/' + b.dataset.rol, { beheerder: b.dataset.beheerder === '1' });
    lkCollegas();
  });
  app.querySelectorAll('[data-weg]').forEach(b => b.onclick = async () => {
    if (!await vraagModal(`<h2>${esc(b.dataset.naam)} verwijderen?</h2><p>Het account wordt verwijderd${Number(b.dataset.groepen) ? `, samen met ${b.dataset.groepen} groep(en) en alle leerlingen daarin` : ''}. Dit kan niet ongedaan worden gemaakt.</p>`, 'Verwijderen', 'Annuleren')) return;
    await api('DELETE', '/api/lk/collegas/' + b.dataset.weg);
    lkCollegas(`<div class="melding">🗑️ ${esc(b.dataset.naam)} is verwijderd.</div>`);
  });
}

async function lkLeerdoelen() {
  const d = await api('GET', '/api/lk/leerdoelen');
  app.innerHTML = kopLk('leerdoelen') + `<div class="wrap">
    <h1 style="margin-top:12px">Leerdoelen per planeet</h1>
    <p class="zacht">Leerlingen beginnen op de Aarde. Per planeet maken ze 100 vragen goed (ongeveer 70% zelf invullen, 30% meerkeuze). Daarna doen ze een toets van 10 vragen: alles goed = planeet gehaald. Tussen twee planeten ligt een <b>herhalingsster</b>: 10 gemengde vragen van alle planeten tot dan toe, waarvan er minstens 9 goed moeten zijn. Pas dan gaat de volgende planeet open.</p>
    ${d.planeten.map((p, i) => `<div class="kaart">
      <div class="planeet-kop" style="grid-template-columns:auto 1fr">
        ${planeetSVG(p, 90)}
        <div><span class="pill">Planeet ${i + 1}: ${p.naam}</span><h2 style="margin:6px 0 4px">${esc(p.titel)}</h2><p style="margin:0"><b>Leerdoel:</b> ${esc(p.doel)}</p></div>
      </div>
      <ul class="uitleg-lijst">${p.uitleg.map(u => `<li>${u}</li>`).join('')}</ul>
      <details class="vragen"><summary>Bekijk alle ${p.vragen.length} vragen</summary>
        <div class="tabel-wrap"><table><thead><tr><th>#</th><th>Zin</th><th>Antwoord</th><th>Soort</th><th>Regel</th></tr></thead><tbody>
        ${p.vragen.map((v, k) => `<tr><td>${k + 1}</td><td>${esc(v.zin)} <small class="zacht">(${esc(v.ww)})</small></td><td><b>${esc(v.antwoord)}</b></td>
          <td>${v.type === 'mk' ? `<span class="pill geel" title="${esc(v.opties.join(' / '))}">meerkeuze</span>` : '<span class="pill">invullen</span>'}</td><td><small>${esc(v.regel)}</small></td></tr>`).join('')}
        </tbody></table></div>
      </details>
    </div>`).join('')}
  </div>`;
  koppelLk();
}

// ================= start =================
(async () => {
  try { IK = await api('GET', '/api/ik'); } catch { IK = { rol: null }; }
  route();
})();
