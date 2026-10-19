// SpaceVerbs — werkwoordspelling oefenen tussen de sterren.
// Start met: npm start   (Node.js 22 of nieuwer, geen extra pakketten nodig)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const db = require('./lib/db');
const { PLANETEN } = require('./lib/planeten');
const { norm, categorie, CATEGORIEEN } = require('./lib/fouten');
const SPEL = require('./lib/spel');
const { ALLE } = require('./scripts/maak-vragen');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

// ---------- vragen laden ----------
const vragenBestand = path.join(__dirname, 'data', 'vragen.json');
if (!fs.existsSync(vragenBestand)) {
  fs.writeFileSync(vragenBestand, JSON.stringify(require('./scripts/maak-vragen').bouw(), null, 1));
}
const VRAGEN = JSON.parse(fs.readFileSync(vragenBestand, 'utf8'));
const VRAAG = new Map(VRAGEN.map(v => [v.id, v]));
const PER_PLANEET = PLANETEN.map((_, p) => VRAGEN.filter(v => v.planeet === p));
const VORMEN = new Map(ALLE.map(w => [w.inf, { stam: w.stam, ott3: w.ott3, inf: w.inf, ovt: w.ovt, ovtmv: w.ovtmv, vd: w.vd }]));
const AANTAL = p => PER_PLANEET[p].length;

// ---------- hulpjes ----------
function hash(wachtwoord) {
  const zout = crypto.randomBytes(16).toString('hex');
  return zout + ':' + crypto.scryptSync(wachtwoord, zout, 32).toString('hex');
}
function klopt(wachtwoord, opgeslagen) {
  const [zout, h] = opgeslagen.split(':');
  const test = crypto.scryptSync(wachtwoord, zout, 32);
  return crypto.timingSafeEqual(test, Buffer.from(h, 'hex'));
}
const schud = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nu = () => new Date().toISOString();

class Fout extends Error { constructor(status, bericht) { super(bericht); this.status = status; } }

function cookies(req) {
  const uit = {};
  for (const deel of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = deel.trim().split('=');
    if (k) uit[k] = decodeURIComponent(v.join('='));
  }
  return uit;
}
function sessie(req) {
  const token = cookies(req).sv;
  if (!token) return null;
  return db.prepare('SELECT * FROM sessies WHERE token = ?').get(token) || null;
}
function nieuweSessie(res, soort, id) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessies (token, soort, gebruiker_id) VALUES (?, ?, ?)').run(token, soort, id);
  // Online (achter https) krijgt het inlogkoekje ook de Secure-vlag
  const veilig = res.req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `sv=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 180}${veilig}`);
}

// Eenvoudige rem op inlogpogingen per IP
const pogingenPerIp = new Map();
function remInlog(req) {
  const ip = req.socket.remoteAddress;
  const t = Date.now();
  const lijst = (pogingenPerIp.get(ip) || []).filter(x => t - x < 60_000);
  lijst.push(t);
  pogingenPerIp.set(ip, lijst);
  if (lijst.length > 30) throw new Fout(429, 'Te veel pogingen. Wacht even een minuutje.');
}

const WOORDEN = ['raket', 'komeet', 'ster', 'maan', 'planeet', 'alien', 'robot', 'zon', 'meteoor', 'galaxy', 'ufo', 'nova'];
const maakWachtwoord = () => WOORDEN[crypto.randomInt(WOORDEN.length)] + (10 + crypto.randomInt(90));
function maakGebruikersnaam(naam) {
  const delen = naam.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').split(' ').filter(Boolean);
  const basis = (delen[0] || 'leerling').slice(0, 10) + (delen.length > 1 ? delen[delen.length - 1][0] : '');
  for (let i = 0; i < 1000; i++) {
    const kandidaat = basis + (10 + crypto.randomInt(i < 50 ? 90 : 900));
    if (!db.prepare('SELECT 1 FROM leerlingen WHERE gebruikersnaam = ?').get(kandidaat)) return kandidaat;
  }
  throw new Fout(500, 'Kon geen gebruikersnaam maken');
}

// ---------- spelregels ----------
function gedaanPerPlaneet(leerlingId) {
  const rijen = db.prepare('SELECT planeet, COUNT(*) AS n FROM voortgang WHERE leerling_id = ? AND goed > 0 GROUP BY planeet').all(leerlingId);
  const uit = PLANETEN.map(() => 0);
  for (const r of rijen) uit[r.planeet] = r.n;
  return uit;
}
const lesActief = groep => !!groep.les_tot && groep.les_tot > nu();
function dierentuin(groep) {
  const per = groep.minuten_per_dier * 60;
  const aantal = Math.min(SPEL.DIEREN.length, Math.floor(groep.dierentuin_sec / per));
  return {
    per_dier_min: groep.minuten_per_dier, sec: groep.dierentuin_sec, ontgrendeld: aantal, totaal: SPEL.DIEREN.length,
    naar_volgende: aantal >= SPEL.DIEREN.length ? 1 : (groep.dierentuin_sec % per) / per,
    min_tot_volgende: aantal >= SPEL.DIEREN.length ? 0 : Math.ceil((per - (groep.dierentuin_sec % per)) / 60),
    les_actief: lesActief(groep), les_tot: lesActief(groep) ? groep.les_tot : null
  };
}
function blobVan(l) {
  let b;
  try { b = JSON.parse(l.blob); } catch { return null; }
  if (!b) return null;
  // oude blobs hadden één accessoire, nu kan een blob alles tegelijk dragen
  if (!Array.isArray(b.accessoires)) b.accessoires = b.accessoire && b.accessoire !== 'geen' ? [b.accessoire] : [];
  delete b.accessoire;
  return b;
}
// Hoogste planeet waarop de leerling mag oefenen (tijdens een herhalingsster blijft de volgende planeet dicht).
const hoogstePlaneet = l => (l.herhaling ?? l.planeet);
// Gemengde vragen uit alle planeten t/m planeet k, eerlijk verdeeld.
function gemengd(k, n) {
  const stapels = PER_PLANEET.slice(0, k + 1).map(schud);
  const uit = [];
  for (let i = 0; uit.length < n; i++) {
    const stapel = stapels[i % stapels.length];
    if (stapel.length) uit.push(stapel.pop());
  }
  return schud(uit);
}
function vraagVoorLeerling(v) {
  const { id, type, zin, ww, opties, hoofdletter, planeet } = v;
  return { id, type, zin, ww, opties, hoofdletter, planeet };
}
function leerlingStatus(l) {
  const gedaan = gedaanPerPlaneet(l.id);
  const groep = db.prepare('SELECT * FROM groepen WHERE id = ?').get(l.groep_id);
  return {
    leerling: { id: l.id, naam: l.naam, munten: l.munten, planeet: l.planeet, herhaling: l.herhaling, reeks: l.reeks, blob: blobVan(l), oefen_min: Math.round(l.oefen_sec / 60) },
    groep: { naam: groep.naam },
    planeten: PLANETEN.map((p, i) => ({
      ...p, gedaan: gedaan[i], totaal: AANTAL(i),
      status: i < l.planeet ? 'klaar' : i === l.planeet && l.herhaling === null ? 'huidig' : 'slot',
      toets_open: i === l.planeet && l.herhaling === null && gedaan[i] >= AANTAL(i)
    })),
    // herhalingssterren: ster k ligt tussen planeet k en planeet k + 1
    sterren: PLANETEN.slice(0, -1).map((_, k) => ({
      nr: k, na: PLANETEN[k].naam, voor: PLANETEN[k + 1].naam,
      status: l.herhaling === k ? 'huidig' : k < l.planeet - 1 || (k === l.planeet - 1 && l.herhaling === null) ? 'klaar' : 'slot'
    })),
    herhaling: { aantal: SPEL.HERHALING_AANTAL, nodig: SPEL.HERHALING_NODIG },
    dierentuin: dierentuin(groep),
    accessoires: SPEL.ACCESSOIRES.map(a => ({ ...a, open: a.planeet < l.planeet }))
  };
}

// Tijd en dierentuin bijwerken, geeft een nieuw dier terug als dat net ontgrendeld is.
function telTijd(l, sec) {
  sec = Math.max(0, Math.min(SPEL.MAX_SEC_PER_VRAAG, Math.ceil(Number(sec) || 0)));
  const groep = db.prepare('SELECT * FROM groepen WHERE id = ?').get(l.groep_id);
  const voor = dierentuin(groep).ontgrendeld;
  db.prepare('UPDATE leerlingen SET oefen_sec = oefen_sec + ?, laatst_actief = ? WHERE id = ?').run(sec, nu(), l.id);
  // De dierentuin groeit alleen tijdens een oefenles die de leerkracht heeft aangezet (dus niet thuis).
  if (!lesActief(groep)) return null;
  db.prepare('UPDATE groepen SET dierentuin_sec = dierentuin_sec + ? WHERE id = ?').run(sec, groep.id);
  const na = dierentuin({ ...groep, dierentuin_sec: groep.dierentuin_sec + sec }).ontgrendeld;
  return na > voor ? SPEL.DIEREN[na - 1] : null;
}

// ---------- routes ----------
const routes = [];
const route = (methode, patroon, rol, fn) => {
  const sleutels = [];
  const re = new RegExp('^' + patroon.replace(/:(\w+)/g, (_, k) => { sleutels.push(k); return '([^/]+)'; }) + '$');
  routes.push({ methode, re, sleutels, rol, fn });
};

// --- inloggen ---
route('POST', '/api/leerkracht/registreer', null, ({ body, res }) => {
  const naam = String(body.naam || '').trim(), email = norm(body.email), ww = String(body.wachtwoord || '');
  if (!naam || !/^\S+@\S+\.\S+$/.test(email)) throw new Fout(400, 'Vul je naam en een geldig e-mailadres in.');
  if (ww.length < 8) throw new Fout(400, 'Kies een wachtwoord van minimaal 8 tekens.');
  if (db.prepare('SELECT 1 FROM leerkrachten WHERE email = ?').get(email)) throw new Fout(400, 'Dit e-mailadres heeft al een account.');
  // De allereerste leerkracht wordt beheerder. Daarna kan alleen iemand met een uitnodigingscode een account maken.
  const eerste = !db.prepare('SELECT 1 FROM leerkrachten').get();
  let uitnodiging = null;
  if (!eerste) {
    const code = String(body.code || '').trim().toUpperCase();
    uitnodiging = db.prepare('SELECT * FROM uitnodigingen WHERE code = ? AND gebruikt_door IS NULL AND verloopt > ?').get(code, nu());
    if (!uitnodiging) throw new Fout(400, 'Deze uitnodigingscode klopt niet of is verlopen. Vraag de beheerder van SpaceVerbs om een nieuwe code.');
  }
  const { lastInsertRowid } = db.prepare('INSERT INTO leerkrachten (naam, email, wachtwoord, beheerder) VALUES (?, ?, ?, ?)').run(naam, email, hash(ww), eerste ? 1 : 0);
  if (uitnodiging) db.prepare('UPDATE uitnodigingen SET gebruikt_door = ? WHERE code = ?').run(Number(lastInsertRowid), uitnodiging.code);
  nieuweSessie(res, 'leerkracht', Number(lastInsertRowid));
  return { ok: true };
});
route('GET', '/api/leerkracht/eerste', null, () => ({ eerste: !db.prepare('SELECT 1 FROM leerkrachten').get() }));
route('POST', '/api/leerkracht/login', null, ({ body, res, req }) => {
  remInlog(req);
  const lk = db.prepare('SELECT * FROM leerkrachten WHERE email = ?').get(norm(body.email));
  if (!lk || !klopt(String(body.wachtwoord || ''), lk.wachtwoord)) throw new Fout(401, 'E-mailadres of wachtwoord klopt niet.');
  nieuweSessie(res, 'leerkracht', lk.id);
  return { ok: true };
});
route('POST', '/api/leerling/login', null, ({ body, res, req }) => {
  remInlog(req);
  const l = db.prepare('SELECT * FROM leerlingen WHERE gebruikersnaam = ?').get(norm(body.gebruikersnaam));
  if (!l || norm(body.wachtwoord) !== norm(l.wachtwoord)) throw new Fout(401, 'Deze naam of dit wachtwoord klopt niet. Probeer het nog eens!');
  nieuweSessie(res, 'leerling', l.id);
  return { ok: true };
});
route('POST', '/api/loguit', null, ({ req, res }) => {
  const s = sessie(req);
  if (s) db.prepare('DELETE FROM sessies WHERE token = ?').run(s.token);
  res.setHeader('Set-Cookie', 'sv=; HttpOnly; Path=/; Max-Age=0');
  return { ok: true };
});
route('GET', '/api/ik', null, ({ req }) => {
  const s = sessie(req);
  if (!s) return { rol: null };
  if (s.soort === 'leerkracht') {
    const lk = db.prepare('SELECT id, naam, email, beheerder FROM leerkrachten WHERE id = ?').get(s.gebruiker_id);
    return lk ? { rol: 'leerkracht', leerkracht: lk } : { rol: null };
  }
  const l = db.prepare('SELECT id, naam FROM leerlingen WHERE id = ?').get(s.gebruiker_id);
  return l ? { rol: 'leerling', leerling: l } : { rol: null };
});

// --- leerling ---
route('GET', '/api/status', 'leerling', ({ l }) => leerlingStatus(l));

route('POST', '/api/blob', 'leerling', ({ l, body }) => {
  const kleuren = ['#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#facc15', '#06b6d4', '#ef4444'];
  const kleur = kleuren.includes(body.kleur) ? body.kleur : kleuren[0];
  const ogen = [1, 2, 3].includes(Number(body.ogen)) ? Number(body.ogen) : 2;
  const gekozen = Array.isArray(body.accessoires) ? body.accessoires : [];
  const accessoires = SPEL.ACCESSOIRES.filter(a => a.id !== 'geen' && a.planeet < l.planeet && gekozen.includes(a.id)).map(a => a.id);
  const naam = String(body.naam || '').trim().slice(0, 20) || 'Blobbie';
  db.prepare('UPDATE leerlingen SET blob = ? WHERE id = ?').run(JSON.stringify({ kleur, ogen, accessoires, naam }), l.id);
  return { ok: true };
});

function magPlaneet(l, p) {
  p = Number(p);
  if (!Number.isInteger(p) || p < 0 || p >= PLANETEN.length || p > hoogstePlaneet(l)) throw new Fout(403, 'Deze planeet is nog op slot.');
  return p;
}

route('GET', '/api/oefenen', 'leerling', ({ l, query }) => {
  if (query.ster !== undefined) {
    // oefenen voor een herhalingsster: gemengde vragen uit alle planeten tot nu toe
    const k = magPlaneet(l, query.ster);
    if (k >= PLANETEN.length - 1 || (k === hoogstePlaneet(l) && l.herhaling === null)) throw new Fout(403, 'Deze herhalingsster is nog op slot.');
    return { ster: k, vragen: gemengd(k, 10).map(vraagVoorLeerling) };
  }
  const p = magPlaneet(l, query.planeet);
  const goed = new Set(db.prepare('SELECT vraag_id FROM voortgang WHERE leerling_id = ? AND planeet = ? AND goed > 0').all(l.id, p).map(r => r.vraag_id));
  const open = schud(PER_PLANEET[p].filter(v => !goed.has(v.id)));
  const herhaal = schud(PER_PLANEET[p].filter(v => goed.has(v.id)));
  const ronde = [...open, ...herhaal].slice(0, 10);
  return { planeet: p, vragen: ronde.map(vraagVoorLeerling), herhaling: open.length === 0 };
});

route('POST', '/api/antwoord', 'leerling', ({ l, body }) => {
  const v = VRAAG.get(String(body.id));
  if (!v) throw new Fout(404, 'Vraag niet gevonden');
  magPlaneet(l, v.planeet);
  const antwoord = String(body.antwoord || '').slice(0, 60);
  const goed = norm(antwoord) === norm(v.antwoord);
  const cat = goed ? null : categorie(antwoord, v, VORMEN.get(v.ww));
  const nieuwDier = telTijd(l, body.sec);

  const vg = db.prepare('SELECT * FROM voortgang WHERE leerling_id = ? AND vraag_id = ?').get(l.id, v.id);
  const eersteKeerGoed = goed && (!vg || vg.goed === 0);
  db.prepare(`INSERT INTO voortgang (leerling_id, vraag_id, planeet, goed, fout) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(leerling_id, vraag_id) DO UPDATE SET goed = goed + excluded.goed, fout = fout + excluded.fout`)
    .run(l.id, v.id, v.planeet, goed ? 1 : 0, goed ? 0 : 1);
  db.prepare('INSERT INTO pogingen (leerling_id, vraag_id, planeet, antwoord, goed, categorie, modus) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(l.id, v.id, v.planeet, antwoord, goed ? 1 : 0, cat, 'oefenen');

  let verdiend = 0, bonus = 0;
  const reeks = goed ? l.reeks + 1 : 0;
  if (goed) {
    verdiend = eersteKeerGoed ? SPEL.MUNTEN[v.type] : SPEL.MUNTEN.herhaling;
    if (reeks % 5 === 0) bonus = SPEL.MUNTEN.reeks;
  }
  db.prepare('UPDATE leerlingen SET munten = munten + ?, reeks = ? WHERE id = ?').run(verdiend + bonus, reeks, l.id);
  const gedaan = gedaanPerPlaneet(l.id)[v.planeet];
  return {
    goed, antwoord: v.antwoord, uitleg: v.uitleg, regel: v.regel, verdiend, bonus, reeks,
    munten: l.munten + verdiend + bonus, gedaan, totaal: AANTAL(v.planeet), nieuwDier
  };
});

route('POST', '/api/toets/start', 'leerling', ({ l, body }) => {
  const p = magPlaneet(l, body.planeet);
  if (p !== l.planeet || l.herhaling !== null) throw new Fout(400, 'Deze toets kun je nu niet doen.');
  if (gedaanPerPlaneet(l.id)[p] < AANTAL(p)) throw new Fout(400, 'Maak eerst alle vragen van deze planeet goed.');
  const vragen = schud(PER_PLANEET[p]).slice(0, SPEL.TOETS_AANTAL);
  const { lastInsertRowid } = db.prepare('INSERT INTO toetsen (leerling_id, planeet, vragen) VALUES (?, ?, ?)')
    .run(l.id, p, JSON.stringify(vragen.map(v => v.id)));
  return { toets_id: Number(lastInsertRowid), vragen: vragen.map(vraagVoorLeerling) };
});

route('POST', '/api/ster/start', 'leerling', ({ l, body }) => {
  const k = Number(body.ster);
  if (l.herhaling === null || k !== l.herhaling) throw new Fout(400, 'Deze herhalingsster kun je nu niet doen.');
  const vragen = gemengd(k, SPEL.HERHALING_AANTAL);
  const { lastInsertRowid } = db.prepare("INSERT INTO toetsen (leerling_id, planeet, vragen, soort) VALUES (?, ?, ?, 'ster')")
    .run(l.id, k, JSON.stringify(vragen.map(v => v.id)));
  return { toets_id: Number(lastInsertRowid), vragen: vragen.map(vraagVoorLeerling), nodig: SPEL.HERHALING_NODIG };
});

route('POST', '/api/toets/antwoord', 'leerling', ({ l, body }) => {
  const t = db.prepare('SELECT * FROM toetsen WHERE id = ? AND leerling_id = ?').get(Number(body.toets_id), l.id);
  if (!t || t.klaar) throw new Fout(400, 'Deze toets is al klaar.');
  const ids = JSON.parse(t.vragen);
  const antwoorden = JSON.parse(t.antwoorden);
  const id = String(body.id);
  if (!ids.includes(id) || antwoorden.some(a => a.id === id)) throw new Fout(400, 'Deze vraag hoort niet bij de toets.');
  const v = VRAAG.get(id);
  const antwoord = String(body.antwoord || '').slice(0, 60);
  const goed = norm(antwoord) === norm(v.antwoord);
  antwoorden.push({ id, antwoord, goed });
  const nieuwDier = telTijd(l, body.sec);
  db.prepare('INSERT INTO pogingen (leerling_id, vraag_id, planeet, antwoord, goed, categorie, modus) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(l.id, v.id, v.planeet, antwoord, goed ? 1 : 0, goed ? null : categorie(antwoord, v, VORMEN.get(v.ww)), 'toets');

  if (antwoorden.length < ids.length) {
    db.prepare('UPDATE toetsen SET antwoorden = ? WHERE id = ?').run(JSON.stringify(antwoorden), t.id);
    return { klaar: false, nieuwDier };
  }
  const score = antwoorden.filter(a => a.goed).length;
  const ster = t.soort === 'ster';
  const nodig = ster ? SPEL.HERHALING_NODIG : ids.length;
  const gehaald = score >= nodig;
  db.prepare('UPDATE toetsen SET antwoorden = ?, score = ?, gehaald = ?, klaar = ? WHERE id = ?')
    .run(JSON.stringify(antwoorden), score, gehaald ? 1 : 0, nu(), t.id);
  let verdiend = 0, accessoire = null, herhalingsster = false;
  if (gehaald && ster && l.herhaling === t.planeet) {
    verdiend = SPEL.MUNTEN.herhalingsster;
    db.prepare('UPDATE leerlingen SET herhaling = NULL, munten = munten + ? WHERE id = ?').run(verdiend, l.id);
  } else if (gehaald && !ster && t.planeet === l.planeet && l.herhaling === null) {
    verdiend = SPEL.MUNTEN.toets;
    // na elke planeet (behalve de laatste) volgt eerst een herhalingsster
    herhalingsster = t.planeet < PLANETEN.length - 1;
    accessoire = SPEL.ACCESSOIRES.find(a => a.planeet === t.planeet) || null;
    const blob = blobVan(l);
    if (blob && accessoire && !blob.accessoires.includes(accessoire.id)) blob.accessoires.push(accessoire.id); // meteen aantrekken
    db.prepare('UPDATE leerlingen SET planeet = planeet + 1, herhaling = ?, munten = munten + ?, blob = ? WHERE id = ?')
      .run(herhalingsster ? t.planeet : null, verdiend, blob ? JSON.stringify(blob) : l.blob, l.id);
  }
  return {
    klaar: true, score, totaal: ids.length, nodig, gehaald, verdiend, nieuwDier, ster, herhalingsster, accessoire,
    nakijken: antwoorden.map(a => { const v = VRAAG.get(a.id); return { zin: v.zin, ww: v.ww, antwoord: a.antwoord, goed: a.goed, juist: v.antwoord, uitleg: v.uitleg, hoofdletter: !!v.hoofdletter }; })
  };
});

function winkelKaarten(l) {
  const gekocht = db.prepare('SELECT beeld, nr FROM sterren WHERE leerling_id = ?').all(l.id);
  let vorigeVol = true;
  const kaarten = SPEL.STERRENBEELDEN.map(b => {
    const mijn = gekocht.filter(g => g.beeld === b.id).map(g => g.nr);
    const kaart = { ...b, gekocht: mijn, vol: mijn.length === b.sterren.length, open: vorigeVol };
    vorigeVol = kaart.vol;
    return kaart;
  });
  return kaarten;
}
route('GET', '/api/winkel', 'leerling', ({ l }) => ({ munten: l.munten, kaarten: winkelKaarten(l) }));
route('POST', '/api/winkel/koop', 'leerling', ({ l, body }) => {
  const kaart = winkelKaarten(l).find(k => k.id === body.beeld);
  const nr = Number(body.nr);
  if (!kaart || !kaart.open) throw new Fout(400, 'Deze spaarkaart is nog op slot.');
  if (!Number.isInteger(nr) || nr < 0 || nr >= kaart.sterren.length || kaart.gekocht.includes(nr)) throw new Fout(400, 'Deze ster kun je niet kopen.');
  if (l.munten < kaart.prijs) throw new Fout(400, `Je hebt ${kaart.prijs} munten nodig. Nog even sparen!`);
  db.prepare('UPDATE leerlingen SET munten = munten - ? WHERE id = ?').run(kaart.prijs, l.id);
  db.prepare('INSERT INTO sterren (leerling_id, beeld, nr) VALUES (?, ?, ?)').run(l.id, kaart.id, nr);
  return { ok: true, munten: l.munten - kaart.prijs, vol: kaart.gekocht.length + 1 === kaart.sterren.length, naam: kaart.naam };
});

route('GET', '/api/dierentuin', 'leerling', ({ l }) => {
  const groep = db.prepare('SELECT * FROM groepen WHERE id = ?').get(l.groep_id);
  const dt = dierentuin(groep);
  const klas = db.prepare('SELECT naam, oefen_sec, blob FROM leerlingen WHERE groep_id = ? ORDER BY naam').all(l.groep_id);
  return {
    groep: groep.naam, ...dt, mijn_min: Math.round(l.oefen_sec / 60),
    dieren: SPEL.DIEREN.map((d, i) => (i < dt.ontgrendeld ? { ...d, open: true } : { id: d.id, soort: d.soort, open: false })),
    klas: klas.map(k => ({ naam: k.naam.split(' ')[0], blob: blobVan(k) }))
  };
});

// --- leerkracht ---
function mijnGroep(lk, id) {
  const g = db.prepare('SELECT * FROM groepen WHERE id = ? AND leerkracht_id = ?').get(Number(id), lk.id);
  if (!g) throw new Fout(404, 'Groep niet gevonden');
  return g;
}
function mijnLeerling(lk, id) {
  const l = db.prepare('SELECT l.* FROM leerlingen l JOIN groepen g ON g.id = l.groep_id WHERE l.id = ? AND g.leerkracht_id = ?').get(Number(id), lk.id);
  if (!l) throw new Fout(404, 'Leerling niet gevonden');
  return l;
}

route('GET', '/api/lk/groepen', 'leerkracht', ({ lk }) => ({
  leerkracht: { naam: lk.naam, email: lk.email, beheerder: !!lk.beheerder },
  groepen: db.prepare(`SELECT g.id, g.naam, g.minuten_per_dier, g.dierentuin_sec, g.les_tot, COUNT(l.id) AS leerlingen
    FROM groepen g LEFT JOIN leerlingen l ON l.groep_id = g.id WHERE g.leerkracht_id = ? GROUP BY g.id ORDER BY g.naam`).all(lk.id)
    .map(g => ({ ...g, dierentuin: dierentuin(g) }))
}));
route('POST', '/api/lk/groepen', 'leerkracht', ({ lk, body }) => {
  const naam = String(body.naam || '').trim().slice(0, 40);
  if (!naam) throw new Fout(400, 'Geef de groep een naam.');
  const { lastInsertRowid } = db.prepare('INSERT INTO groepen (leerkracht_id, naam) VALUES (?, ?)').run(lk.id, naam);
  return { id: Number(lastInsertRowid) };
});
route('PATCH', '/api/lk/groepen/:id', 'leerkracht', ({ lk, body, params }) => {
  const g = mijnGroep(lk, params.id);
  const naam = body.naam !== undefined ? String(body.naam).trim().slice(0, 40) || g.naam : g.naam;
  const min = body.minuten_per_dier !== undefined ? Math.max(1, Math.min(600, Math.round(Number(body.minuten_per_dier)) || 30)) : g.minuten_per_dier;
  db.prepare('UPDATE groepen SET naam = ?, minuten_per_dier = ? WHERE id = ?').run(naam, min, g.id);
  return { ok: true };
});
route('POST', '/api/lk/groepen/:id/les', 'leerkracht', ({ lk, body, params }) => {
  const g = mijnGroep(lk, params.id);
  const min = Math.round(Number(body.minuten) || 0);
  if (min < 0 || min > 240) throw new Fout(400, 'Kies een lesduur tussen 1 en 240 minuten.');
  const tot = min ? new Date(Date.now() + min * 60_000).toISOString() : null; // 0 = les stoppen
  db.prepare('UPDATE groepen SET les_tot = ? WHERE id = ?').run(tot, g.id);
  return { les_tot: tot };
});
route('DELETE', '/api/lk/groepen/:id', 'leerkracht', ({ lk, params }) => {
  const g = mijnGroep(lk, params.id);
  db.prepare('DELETE FROM groepen WHERE id = ?').run(g.id);
  return { ok: true };
});

route('GET', '/api/lk/groepen/:id', 'leerkracht', ({ lk, params }) => {
  const g = mijnGroep(lk, params.id);
  const leerlingen = db.prepare('SELECT * FROM leerlingen WHERE groep_id = ? ORDER BY naam').all(g.id).map(l => {
    const gedaan = gedaanPerPlaneet(l.id);
    const p = db.prepare('SELECT COUNT(*) AS n, SUM(goed) AS g FROM pogingen WHERE leerling_id = ?').get(l.id);
    const top = db.prepare(`SELECT categorie, COUNT(*) AS n FROM pogingen WHERE leerling_id = ? AND goed = 0
      GROUP BY categorie ORDER BY n DESC LIMIT 1`).get(l.id);
    return {
      id: l.id, naam: l.naam, gebruikersnaam: l.gebruikersnaam, wachtwoord: l.wachtwoord, planeet: l.planeet, herhaling: l.herhaling,
      gedaan: l.planeet < PLANETEN.length ? gedaan[l.planeet] : null, munten: l.munten,
      oefen_min: Math.round(l.oefen_sec / 60), laatst_actief: l.laatst_actief, pogingen: p.n,
      percentage_goed: p.n ? Math.round((p.g / p.n) * 100) : null,
      meeste_fouten: top ? CATEGORIEEN[top.categorie] : null, blob: blobVan(l)
    };
  });
  const fouten = db.prepare(`SELECT categorie, COUNT(*) AS n FROM pogingen p JOIN leerlingen l ON l.id = p.leerling_id
    WHERE l.groep_id = ? AND p.goed = 0 GROUP BY categorie ORDER BY n DESC`).all(g.id)
    .map(r => ({ ...r, label: CATEGORIEEN[r.categorie] || r.categorie }));
  const moeilijk = db.prepare(`SELECT vraag_id, SUM(goed = 0) AS fout, COUNT(*) AS totaal FROM pogingen p JOIN leerlingen l ON l.id = p.leerling_id
    WHERE l.groep_id = ? GROUP BY vraag_id HAVING fout > 0 ORDER BY fout DESC, totaal ASC LIMIT 10`).all(g.id)
    .map(r => { const v = VRAAG.get(r.vraag_id); return { ...r, zin: v.zin, ww: v.ww, antwoord: v.antwoord, planeet: v.planeet }; });
  return { groep: { id: g.id, naam: g.naam, minuten_per_dier: g.minuten_per_dier }, dierentuin: dierentuin(g), leerlingen, fouten, moeilijk };
});

route('POST', '/api/lk/groepen/:id/leerlingen', 'leerkracht', ({ lk, body, params }) => {
  const g = mijnGroep(lk, params.id);
  const namen = (Array.isArray(body.namen) ? body.namen : String(body.namen || '').split('\n'))
    .map(n => String(n).trim().slice(0, 40)).filter(Boolean).slice(0, 60);
  if (!namen.length) throw new Fout(400, 'Vul minstens één naam in.');
  const nieuw = namen.map(naam => {
    const gebruikersnaam = maakGebruikersnaam(naam), wachtwoord = maakWachtwoord();
    db.prepare('INSERT INTO leerlingen (groep_id, naam, gebruikersnaam, wachtwoord) VALUES (?, ?, ?, ?)').run(g.id, naam, gebruikersnaam, wachtwoord);
    return { naam, gebruikersnaam, wachtwoord };
  });
  return { nieuw };
});

route('GET', '/api/lk/leerlingen/:id', 'leerkracht', ({ lk, params }) => {
  const l = mijnLeerling(lk, params.id);
  const gedaan = gedaanPerPlaneet(l.id);
  const perPlaneet = PLANETEN.map((p, i) => {
    const r = db.prepare('SELECT COUNT(*) AS n, SUM(goed) AS g FROM pogingen WHERE leerling_id = ? AND planeet = ? AND modus = ?').get(l.id, i, 'oefenen');
    return { naam: p.naam, titel: p.titel, gedaan: gedaan[i], totaal: AANTAL(i), pogingen: r.n, percentage_goed: r.n ? Math.round((r.g / r.n) * 100) : null };
  });
  const fouten = db.prepare('SELECT categorie, COUNT(*) AS n FROM pogingen WHERE leerling_id = ? AND goed = 0 GROUP BY categorie ORDER BY n DESC').all(l.id)
    .map(r => ({ ...r, label: CATEGORIEEN[r.categorie] || r.categorie }));
  const recent = db.prepare('SELECT * FROM pogingen WHERE leerling_id = ? AND goed = 0 ORDER BY id DESC LIMIT 40').all(l.id)
    .map(r => { const v = VRAAG.get(r.vraag_id); return { zin: v.zin, ww: v.ww, antwoord: r.antwoord, juist: v.antwoord, label: CATEGORIEEN[r.categorie], modus: r.modus, tijd: r.tijd, planeet: v.planeet }; });
  const toetsen = db.prepare('SELECT planeet, soort, score, gehaald, klaar, vragen FROM toetsen WHERE leerling_id = ? AND klaar IS NOT NULL ORDER BY id DESC').all(l.id)
    .map(t => ({ planeet: t.planeet, soort: t.soort, score: t.score, gehaald: t.gehaald, klaar: t.klaar, totaal: JSON.parse(t.vragen).length,
      naam: t.soort === 'ster' ? `⭐ Herhalingsster na ${PLANETEN[t.planeet].naam}` : PLANETEN[t.planeet].naam }));
  const sterren = db.prepare('SELECT COUNT(*) AS n FROM sterren WHERE leerling_id = ?').get(l.id).n;
  return {
    leerling: { id: l.id, naam: l.naam, gebruikersnaam: l.gebruikersnaam, wachtwoord: l.wachtwoord, planeet: l.planeet, herhaling: l.herhaling, munten: l.munten,
      oefen_min: Math.round(l.oefen_sec / 60), laatst_actief: l.laatst_actief, blob: blobVan(l), groep_id: l.groep_id, sterren },
    perPlaneet, fouten, recent, toetsen
  };
});
route('PATCH', '/api/lk/leerlingen/:id', 'leerkracht', ({ lk, body, params }) => {
  const l = mijnLeerling(lk, params.id);
  const naam = body.naam !== undefined ? String(body.naam).trim().slice(0, 40) || l.naam : l.naam;
  // stap: 'p3' = op planeet 3, 's2' = bij de herhalingsster na planeet 2
  let planeet = l.planeet, herhaling = l.herhaling;
  if (body.stap !== undefined) {
    const m = /^([ps])(\d+)$/.exec(String(body.stap));
    const n = m ? Number(m[2]) : -1;
    if (m && m[1] === 'p' && n >= 0 && n <= PLANETEN.length) { planeet = n; herhaling = null; }
    else if (m && m[1] === 's' && n >= 0 && n < PLANETEN.length - 1) { planeet = n + 1; herhaling = n; }
    else throw new Fout(400, 'Ongeldige planeet');
  }
  let groep = l.groep_id;
  if (body.groep_id !== undefined) groep = mijnGroep(lk, body.groep_id).id;
  db.prepare('UPDATE leerlingen SET naam = ?, planeet = ?, herhaling = ?, groep_id = ? WHERE id = ?').run(naam, planeet, herhaling, groep, l.id);
  return { ok: true };
});
route('POST', '/api/lk/leerlingen/:id/nieuw-wachtwoord', 'leerkracht', ({ lk, params }) => {
  const l = mijnLeerling(lk, params.id);
  const wachtwoord = maakWachtwoord();
  db.prepare('UPDATE leerlingen SET wachtwoord = ? WHERE id = ?').run(wachtwoord, l.id);
  db.prepare("DELETE FROM sessies WHERE soort = 'leerling' AND gebruiker_id = ?").run(l.id);
  return { wachtwoord };
});
route('DELETE', '/api/lk/leerlingen/:id', 'leerkracht', ({ lk, params }) => {
  const l = mijnLeerling(lk, params.id);
  db.prepare('DELETE FROM leerlingen WHERE id = ?').run(l.id);
  db.prepare("DELETE FROM sessies WHERE soort = 'leerling' AND gebruiker_id = ?").run(l.id);
  return { ok: true };
});

// --- collega's (alleen beheerder) ---
function alleenBeheerder(lk) { if (!lk.beheerder) throw new Fout(403, 'Alleen de beheerder kan dit doen.'); }
const CODETEKENS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const maakCode = () => 'SV-' + Array.from({ length: 6 }, () => CODETEKENS[crypto.randomInt(CODETEKENS.length)]).join('');

route('GET', '/api/lk/collegas', 'leerkracht', ({ lk }) => {
  alleenBeheerder(lk);
  return {
    collegas: db.prepare(`SELECT k.id, k.naam, k.email, k.beheerder, k.gemaakt, COUNT(g.id) AS groepen
      FROM leerkrachten k LEFT JOIN groepen g ON g.leerkracht_id = k.id GROUP BY k.id ORDER BY k.naam`).all()
      .map(k => ({ ...k, beheerder: !!k.beheerder, ik: k.id === lk.id })),
    uitnodigingen: db.prepare('SELECT code, naam, verloopt FROM uitnodigingen WHERE gebruikt_door IS NULL AND verloopt > ? ORDER BY gemaakt DESC').all(nu())
  };
});
route('POST', '/api/lk/uitnodigingen', 'leerkracht', ({ lk, body }) => {
  alleenBeheerder(lk);
  const code = maakCode();
  const verloopt = new Date(Date.now() + 14 * 24 * 3600_000).toISOString();
  db.prepare('INSERT INTO uitnodigingen (code, gemaakt_door, naam, verloopt) VALUES (?, ?, ?, ?)').run(code, lk.id, String(body.naam || '').trim().slice(0, 60), verloopt);
  return { code, verloopt };
});
route('DELETE', '/api/lk/uitnodigingen/:code', 'leerkracht', ({ lk, params }) => {
  alleenBeheerder(lk);
  db.prepare('DELETE FROM uitnodigingen WHERE code = ?').run(params.code);
  return { ok: true };
});
route('PATCH', '/api/lk/collegas/:id', 'leerkracht', ({ lk, body, params }) => {
  alleenBeheerder(lk);
  const id = Number(params.id);
  if (id === lk.id) throw new Fout(400, 'Je kunt je eigen beheerdersrol niet weghalen.');
  db.prepare('UPDATE leerkrachten SET beheerder = ? WHERE id = ?').run(body.beheerder ? 1 : 0, id);
  return { ok: true };
});
route('DELETE', '/api/lk/collegas/:id', 'leerkracht', ({ lk, params }) => {
  alleenBeheerder(lk);
  const id = Number(params.id);
  if (id === lk.id) throw new Fout(400, 'Je kunt je eigen account niet verwijderen.');
  db.prepare('DELETE FROM leerkrachten WHERE id = ?').run(id); // groepen en leerlingen gaan mee
  db.prepare("DELETE FROM sessies WHERE soort = 'leerkracht' AND gebruiker_id = ?").run(id);
  return { ok: true };
});

route('GET', '/api/lk/leerdoelen', 'leerkracht', () => ({
  planeten: PLANETEN.map((p, i) => ({ ...p, vragen: PER_PLANEET[i] }))
}));

// ---------- server ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };

function statisch(req, res, pad) {
  let bestand = path.normalize(path.join(PUBLIC, pad === '/' ? 'index.html' : pad));
  if (!bestand.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(bestand) || fs.statSync(bestand).isDirectory()) bestand = path.join(PUBLIC, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(bestand)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(bestand).pipe(res);
}

function leesBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', d => { data += d; if (data.length > 1e5) { reject(new Fout(413, 'Te groot')); req.destroy(); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Fout(400, 'Ongeldige gegevens')); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) return statisch(req, res, decodeURIComponent(url.pathname));
  const stuur = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
  try {
    let gevonden;
    for (const r of routes) {
      if (r.methode !== req.method) continue;
      const m = url.pathname.match(r.re);
      if (m) { gevonden = { r, params: Object.fromEntries(r.sleutels.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }; break; }
    }
    if (!gevonden) throw new Fout(404, 'Niet gevonden');
    if (req.method !== 'GET' && !String(req.headers['content-type']).startsWith('application/json')) throw new Fout(415, 'Verwacht JSON');
    const ctx = { req, res, params: gevonden.params, query: Object.fromEntries(url.searchParams), body: req.method === 'GET' ? {} : await leesBody(req) };
    if (gevonden.r.rol) {
      const s = sessie(req);
      if (!s || s.soort !== gevonden.r.rol) throw new Fout(401, 'Log eerst in.');
      if (s.soort === 'leerling') ctx.l = db.prepare('SELECT * FROM leerlingen WHERE id = ?').get(s.gebruiker_id);
      else ctx.lk = db.prepare('SELECT * FROM leerkrachten WHERE id = ?').get(s.gebruiker_id);
      if (!ctx.l && !ctx.lk) throw new Fout(401, 'Log eerst in.');
    }
    stuur(200, gevonden.r.fn(ctx));
  } catch (e) {
    if (!e.status) console.error(e);
    stuur(e.status || 500, { fout: e.status ? e.message : 'Er ging iets mis op de server.' });
  }
});

server.listen(PORT, () => console.log(`🚀 SpaceVerbs draait op http://localhost:${PORT}`));
