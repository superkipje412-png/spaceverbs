// Genereert de vragenbank: 100 vragen per planeet → data/vragen.json
// Draai opnieuw met: npm run vragen
const fs = require('fs');
const path = require('path');

// Zwakke werkwoorden: hele ww, stam, hij-vorm, vt enkelvoud, vt meervoud, volt. deelwoord,
// hulpwerkwoord (h = hebben, z = zijn), aanvulling in de zin, labels.
const Z = (inf, stam, ott3, ovt, ovtmv, vd, aux, c, tags = '') =>
  ({ inf, stam, ott3, ovt, ovtmv, vd, aux, c, sterk: false, tags: tags.split(' ').filter(Boolean) });
const S = (inf, stam, ott3, ovt, ovtmv, vd, aux, c, tags = '') =>
  ({ ...Z(inf, stam, ott3, ovt, ovtmv, vd, aux, c, tags), sterk: true });

const ZWAK = [
  Z('werken', 'werk', 'werkt', 'werkte', 'werkten', 'gewerkt', 'h', 'in de moestuin'),
  Z('fietsen', 'fiets', 'fietst', 'fietste', 'fietsten', 'gefietst', 'z', 'naar het zwembad'),
  Z('spelen', 'speel', 'speelt', 'speelde', 'speelden', 'gespeeld', 'h', 'met de knikkers'),
  Z('wonen', 'woon', 'woont', 'woonde', 'woonden', 'gewoond', 'h', 'in een groot huis'),
  Z('leren', 'leer', 'leert', 'leerde', 'leerden', 'geleerd', 'h', 'voor de toets'),
  Z('maken', 'maak', 'maakt', 'maakte', 'maakten', 'gemaakt', 'h', 'een tekening'),
  Z('dansen', 'dans', 'danst', 'danste', 'dansten', 'gedanst', 'h', 'op het podium'),
  Z('zetten', 'zet', 'zet', 'zette', 'zetten', 'gezet', 'h', 'de beker op tafel', 't lastig'),
  Z('praten', 'praat', 'praat', 'praatte', 'praatten', 'gepraat', 'h', 'met de juf', 't lastig'),
  Z('antwoorden', 'antwoord', 'antwoordt', 'antwoordde', 'antwoordden', 'geantwoord', 'h', 'op de vraag', 'd lastig'),
  Z('landen', 'land', 'landt', 'landde', 'landden', 'geland', 'z', 'op de maan', 'd lastig'),
  Z('planten', 'plant', 'plant', 'plantte', 'plantten', 'geplant', 'h', 'een boom in de tuin', 't lastig'),
  Z('poetsen', 'poets', 'poetst', 'poetste', 'poetsten', 'gepoetst', 'h', 'de ramen van de raket'),
  Z('kloppen', 'klop', 'klopt', 'klopte', 'klopten', 'geklopt', 'h', 'op de deur'),
  Z('stoppen', 'stop', 'stopt', 'stopte', 'stopten', 'gestopt', 'z', 'met snoepen'),
  Z('verhuizen', 'verhuis', 'verhuist', 'verhuisde', 'verhuisden', 'verhuisd', 'z', 'naar een andere stad', 'vv zs lastig'),
  Z('reizen', 'reis', 'reist', 'reisde', 'reisden', 'gereisd', 'z', 'naar Mars', 'zs lastig'),
  Z('leven', 'leef', 'leeft', 'leefde', 'leefden', 'geleefd', 'h', 'op een ruimtestation', 'fv lastig'),
  Z('beloven', 'beloof', 'belooft', 'beloofde', 'beloofden', 'beloofd', 'h', 'een ijsje aan mijn broertje', 'vv fv lastig'),
  Z('vertellen', 'vertel', 'vertelt', 'vertelde', 'vertelden', 'verteld', 'h', 'een spannend verhaal', 'vv'),
  Z('herhalen', 'herhaal', 'herhaalt', 'herhaalde', 'herhaalden', 'herhaald', 'h', 'de tafel van zeven', 'vv'),
  Z('ontdekken', 'ontdek', 'ontdekt', 'ontdekte', 'ontdekten', 'ontdekt', 'h', 'een nieuwe planeet', 'vv'),
  Z('betalen', 'betaal', 'betaalt', 'betaalde', 'betaalden', 'betaald', 'h', 'bij de kassa', 'vv'),
  Z('wachten', 'wacht', 'wacht', 'wachtte', 'wachtten', 'gewacht', 'h', 'op de bus', 't lastig'),
  Z('rusten', 'rust', 'rust', 'rustte', 'rustten', 'gerust', 'h', 'na de wedstrijd', 't lastig'),
  Z('hopen', 'hoop', 'hoopt', 'hoopte', 'hoopten', 'gehoopt', 'h', 'op mooi weer'),
  Z('tekenen', 'teken', 'tekent', 'tekende', 'tekenden', 'getekend', 'h', 'een raket'),
  Z('bellen', 'bel', 'belt', 'belde', 'belden', 'gebeld', 'h', 'met oma'),
  Z('rennen', 'ren', 'rent', 'rende', 'renden', 'gerend', 'z', 'naar de raket'),
  Z('schudden', 'schud', 'schudt', 'schudde', 'schudden', 'geschud', 'h', 'de fles met limonade', 'd lastig'),
  Z('redden', 'red', 'redt', 'redde', 'redden', 'gered', 'h', 'de kat uit de boom', 'd lastig'),
  Z('kussen', 'kus', 'kust', 'kuste', 'kusten', 'gekust', 'h', 'de baby'),
  Z('missen', 'mis', 'mist', 'miste', 'misten', 'gemist', 'h', 'de trein'),
  Z('botsen', 'bots', 'botst', 'botste', 'botsten', 'gebotst', 'z', 'tegen een meteoriet'),
  Z('zweven', 'zweef', 'zweeft', 'zweefde', 'zweefden', 'gezweefd', 'h', 'door het ruimteschip', 'fv lastig'),
  Z('verven', 'verf', 'verft', 'verfde', 'verfden', 'geverfd', 'h', 'het hek', 'fv lastig'),
  Z('bouwen', 'bouw', 'bouwt', 'bouwde', 'bouwden', 'gebouwd', 'h', 'een hut van takken'),
  Z('vullen', 'vul', 'vult', 'vulde', 'vulden', 'gevuld', 'h', 'de tank van de raket'),
  Z('groeten', 'groet', 'groet', 'groette', 'groetten', 'gegroet', 'h', 'de buurman', 't lastig'),
  Z('printen', 'print', 'print', 'printte', 'printten', 'geprint', 'h', 'een kleurplaat', 't lastig'),
  Z('smeren', 'smeer', 'smeert', 'smeerde', 'smeerden', 'gesmeerd', 'h', 'een boterham'),
  Z('pakken', 'pak', 'pakt', 'pakte', 'pakten', 'gepakt', 'h', 'een koekje'),
  Z('trainen', 'train', 'traint', 'trainde', 'trainden', 'getraind', 'h', 'voor de wedstrijd'),
  Z('scoren', 'scoor', 'scoort', 'scoorde', 'scoorden', 'gescoord', 'h', 'een doelpunt'),
  Z('verwachten', 'verwacht', 'verwacht', 'verwachtte', 'verwachtten', 'verwacht', 'h', 'een pakketje', 'vv t lastig'),
  Z('verbeteren', 'verbeter', 'verbetert', 'verbeterde', 'verbeterden', 'verbeterd', 'h', 'de fouten', 'vv'),
  Z('koken', 'kook', 'kookt', 'kookte', 'kookten', 'gekookt', 'h', 'soep'),
  Z('knippen', 'knip', 'knipt', 'knipte', 'knipten', 'geknipt', 'h', 'een ster uit papier'),
  Z('plakken', 'plak', 'plakt', 'plakte', 'plakten', 'geplakt', 'h', 'stickers in het album'),
  Z('zwaaien', 'zwaai', 'zwaait', 'zwaaide', 'zwaaiden', 'gezwaaid', 'h', 'naar de astronauten'),
  Z('juichen', 'juich', 'juicht', 'juichte', 'juichten', 'gejuicht', 'h', 'voor het team')
];

const STERK = [
  S('lopen', 'loop', 'loopt', 'liep', 'liepen', 'gelopen', 'z', 'naar huis'),
  S('zwemmen', 'zwem', 'zwemt', 'zwom', 'zwommen', 'gezwommen', 'h', 'in het meer'),
  S('vinden', 'vind', 'vindt', 'vond', 'vonden', 'gevonden', 'h', 'een sleutel', 'd'),
  S('worden', 'word', 'wordt', 'werd', 'werden', 'geworden', 'z', 'boos', 'd'),
  S('rijden', 'rijd', 'rijdt', 'reed', 'reden', 'gereden', 'z', 'naar de stad', 'd'),
  S('houden', 'houd', 'houdt', 'hield', 'hielden', 'gehouden', 'h', 'van pannenkoeken', 'd vast geenik'),
  S('snijden', 'snijd', 'snijdt', 'sneed', 'sneden', 'gesneden', 'h', 'het brood', 'd'),
  S('zitten', 'zit', 'zit', 'zat', 'zaten', 'gezeten', 'h', 'op de bank', 't'),
  S('eten', 'eet', 'eet', 'at', 'aten', 'gegeten', 'h', 'een appel', 't'),
  S('schrijven', 'schrijf', 'schrijft', 'schreef', 'schreven', 'geschreven', 'h', 'een brief'),
  S('lezen', 'lees', 'leest', 'las', 'lazen', 'gelezen', 'h', 'een boek'),
  S('drinken', 'drink', 'drinkt', 'dronk', 'dronken', 'gedronken', 'h', 'een glas melk'),
  S('zingen', 'zing', 'zingt', 'zong', 'zongen', 'gezongen', 'h', 'een liedje'),
  S('springen', 'spring', 'springt', 'sprong', 'sprongen', 'gesprongen', 'z', 'over de sloot'),
  S('vliegen', 'vlieg', 'vliegt', 'vloog', 'vlogen', 'gevlogen', 'z', 'naar de maan'),
  S('kijken', 'kijk', 'kijkt', 'keek', 'keken', 'gekeken', 'h', 'naar de sterren'),
  S('slapen', 'slaap', 'slaapt', 'sliep', 'sliepen', 'geslapen', 'h', 'in een tent'),
  S('geven', 'geef', 'geeft', 'gaf', 'gaven', 'gegeven', 'h', 'een cadeautje'),
  S('vergeten', 'vergeet', 'vergeet', 'vergat', 'vergaten', 'vergeten', 'h', 'de sleutel', 't'),
  S('bijten', 'bijt', 'bijt', 'beet', 'beten', 'gebeten', 'h', 'in een peer', 't'),
  S('schieten', 'schiet', 'schiet', 'schoot', 'schoten', 'geschoten', 'h', 'op het doel', 't'),
  S('zien', 'zie', 'ziet', 'zag', 'zagen', 'gezien', 'h', 'een vallende ster'),
  S('gaan', 'ga', 'gaat', 'ging', 'gingen', 'gegaan', 'z', 'naar de bibliotheek'),
  S('doen', 'doe', 'doet', 'deed', 'deden', 'gedaan', 'h', 'een spelletje'),
  S('komen', 'kom', 'komt', 'kwam', 'kwamen', 'gekomen', 'z', 'naar het feest'),
  S('nemen', 'neem', 'neemt', 'nam', 'namen', 'genomen', 'h', 'een snoepje'),
  S('brengen', 'breng', 'brengt', 'bracht', 'brachten', 'gebracht', 'h', 'de post naar de buren'),
  S('denken', 'denk', 'denkt', 'dacht', 'dachten', 'gedacht', 'h', 'aan de vakantie'),
  S('kopen', 'koop', 'koopt', 'kocht', 'kochten', 'gekocht', 'h', 'een ijsje'),
  S('zoeken', 'zoek', 'zoekt', 'zocht', 'zochten', 'gezocht', 'h', 'een schat'),
  S('vechten', 'vecht', 'vecht', 'vocht', 'vochten', 'gevochten', 'h', 'tegen de draak', 't'),
  S('winnen', 'win', 'wint', 'won', 'wonnen', 'gewonnen', 'h', 'de wedstrijd'),
  S('vallen', 'val', 'valt', 'viel', 'vielen', 'gevallen', 'z', 'van de fiets'),
  S('roepen', 'roep', 'roept', 'riep', 'riepen', 'geroepen', 'h', 'om hulp'),
  S('helpen', 'help', 'helpt', 'hielp', 'hielpen', 'geholpen', 'h', 'de buurvrouw'),
  S('verliezen', 'verlies', 'verliest', 'verloor', 'verloren', 'verloren', 'h', 'het spel'),
  S('staan', 'sta', 'staat', 'stond', 'stonden', 'gestaan', 'h', 'bij de deur'),
  S('liggen', 'lig', 'ligt', 'lag', 'lagen', 'gelegen', 'h', 'in bed'),
  S('trekken', 'trek', 'trekt', 'trok', 'trokken', 'getrokken', 'h', 'aan het touw'),
  S('blijven', 'blijf', 'blijft', 'bleef', 'bleven', 'gebleven', 'z', 'thuis'),
  S('schrikken', 'schrik', 'schrikt', 'schrok', 'schrokken', 'geschrokken', 'z', 'van het onweer'),
  S('breken', 'breek', 'breekt', 'brak', 'braken', 'gebroken', 'h', 'een glas'),
  S('verdwijnen', 'verdwijn', 'verdwijnt', 'verdween', 'verdwenen', 'verdwenen', 'z', 'in een zwart gat')
];

const ALLE = [...ZWAK, ...STERK];
const heeft = (v, t) => v.tags.includes(t);

// Onderwerpen: s = begin van de zin, m = midden in de zin, p = persoon (1, 2, 3, mv)
const ond = (s, m, p, extra = {}) => ({ s, m: m ?? s, p, ...extra });
const IK = [ond('Ik', 'ik', 1)];
const JIJ = [ond('Jij', 'jij', 2), ond('Je', 'je', 2)];
const HIJ = [
  ond('Hij', 'hij', 3), ond('Mijn broer', 'mijn broer', 3), ond('Juf Sara', 'juf Sara', 3),
  ond('De astronaut', 'de astronaut', 3), ond('Opa', 'opa', 3), ond('Het meisje', 'het meisje', 3),
  ond('Meester Ali', 'meester Ali', 3), ond('Mijn vriendin', 'mijn vriendin', 3), ond('De alien', 'de alien', 3)
];
const MV = [
  ond('Wij', 'wij', 'mv'), ond('We', 'we', 'mv'), ond('Jullie', 'jullie', 'mv'), ond('De kinderen', 'de kinderen', 'mv'),
  ond('Mijn ouders', 'mijn ouders', 'mv'), ond('De astronauten', 'de astronauten', 'mv'),
  ond('Tim en Noor', 'Tim en Noor', 'mv'), ond('De aliens', 'de aliens', 'mv')
];
const GROEP = [ // enkelvoud, ook al zijn het veel mensen
  ond('Het team', 'het team', 3, { groep: true }), ond('De klas', 'de klas', 3, { groep: true }),
  ond('Iedereen', 'iedereen', 3, { groep: true }), ond('Mijn familie', 'mijn familie', 3, { groep: true }),
  ond('Elk kind', 'elk kind', 3, { groep: true }), ond('Niemand', 'niemand', 3, { groep: true })
];

const NU = ['vandaag', 'elke dag', 'vaak', 'op zaterdag', 'morgen', 'altijd'];
const TOEN = ['gisteren', 'vorige week', 'vanochtend', 'vorige zomer', 'zaterdag'];

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const zin = (...delen) => delen.filter(Boolean).join(' ').replace(/ ([.?])$/, '$1');
const GAT = '___';

function hulp(v, o, inversie) {
  if (v.aux === 'h') return { 1: 'heb', 2: inversie ? 'heb' : 'hebt', 3: 'heeft', mv: 'hebben' }[o.p];
  return { 1: 'ben', 2: inversie ? 'ben' : 'bent', 3: 'is', mv: 'zijn' }[o.p];
}
const nuBijw = v => (heeft(v, 'vast') ? [''] : NU);
const toenBijw = v => (heeft(v, 'vast') ? ['vroeger'] : TOEN);

// ---------- zinsjablonen ----------
// Tegenwoordige tijd: gewone volgorde, inversie (bijwoord eerst) en vraagzin.
function tt(v, o, antw, vorm, uitleg, regel) {
  const uit = [];
  for (const b of nuBijw(v)) {
    uit.push({ zin: zin(o.s, GAT, b, v.c + '.'), antwoord: antw, v, uitleg, regel, vorm });
    if (b) uit.push({ zin: zin(cap(b), GAT, o.m, v.c + '.'), antwoord: antw, v, uitleg, regel, vorm });
  }
  return uit;
}

function uitlegStam(v) {
  let u = `Bij <b>ik</b> schrijf je de stam: ${v.inf} → <b>${v.stam}</b>.`;
  if (v.stam.endsWith('d')) u += ' De d hoort bij de stam. Er komt <b>geen t</b> bij!';
  else if (v.inf.endsWith('ven') && v.stam.endsWith('f')) u += ' Aan het eind van een woord schrijf je geen v, maar een f.';
  else if (v.inf.endsWith('zen') && v.stam.endsWith('s')) u += ' Aan het eind van een woord schrijf je geen z, maar een s.';
  return u;
}
function uitlegStamT(v, wie) {
  let u = `${wie} → stam + t: ${v.stam} + t = <b>${v.ott3}</b>.`;
  if (v.stam.endsWith('d')) u += ' De stam eindigt op een d, dus je krijgt <b>dt</b>.';
  else if (v.stam.endsWith('t')) u += ' De stam eindigt al op een t. Je schrijft maar <b>één t</b>.';
  return u;
}

// ---------- planeet 1: ik ----------
function planeet1() {
  const r = [];
  for (const v of ALLE) {
    if (heeft(v, 'geenik')) continue;
    for (const o of IK) {
      r.push(...tt(v, o, v.stam, 'stam', uitlegStam(v), 'ik + stam'));
      for (const b of nuBijw(v).filter(Boolean).slice(0, 3))
        r.push({ zin: zin(GAT, 'ik', b, v.c + '?'), antwoord: v.stam, v, uitleg: uitlegStam(v), regel: 'ik + stam', vorm: 'stam', hoofdletter: true });
    }
  }
  return r;
}

// ---------- planeet 2: hij/zij/het ----------
function planeet2() {
  const r = [];
  for (const v of ALLE) for (const o of HIJ)
    r.push(...tt(v, o, v.ott3, 'ott3', uitlegStamT(v, `<b>${o.m}</b> is één ander`), 'hij/zij/het + stam + t'));
  return r;
}

// ---------- planeet 3: jij/je ----------
function planeet3() {
  const r = [];
  const zonder = (v, o) => `<b>${o.m}</b> staat achter het werkwoord → <b>geen t</b>: ${v.stam} ${o.m}.` +
    (v.stam.endsWith('t') ? ' (De t hoort hier gewoon bij de stam.)' : '');
  for (const v of ALLE) {
    if (heeft(v, 'geenik')) continue;
    for (const o of JIJ) {
      for (const b of nuBijw(v)) {
        const met = uitlegStamT(v, `<b>${o.m}</b> staat vóór het werkwoord`);
        r.push({ zin: zin(o.s, GAT, b, v.c + '.'), antwoord: v.ott3, v, uitleg: met, regel: 'jij/je vóór ww → stam + t', vorm: 'ott3' });
        if (!b) continue;
        r.push({ zin: zin(cap(b), GAT, o.m, v.c + '.'), antwoord: v.stam, v, uitleg: zonder(v, o), regel: 'jij/je achter ww → stam', vorm: 'stam' });
        r.push({ zin: zin(GAT, o.m, b, v.c + '?'), antwoord: v.stam, v, uitleg: zonder(v, o), regel: 'jij/je achter ww → stam', vorm: 'stam', hoofdletter: true });
      }
    }
    for (const wie of ['jouw broer', 'jouw juf', 'jouw zus']) {
      const b = nuBijw(v)[1] || '';
      r.push({ zin: zin(GAT, wie, b, v.c + '?'), antwoord: v.ott3, v, hoofdletter: true,
        uitleg: `<b>${wie}</b> is niet jij, maar een ander (hij/zij) → stam + t = <b>${v.ott3}</b>.`, regel: 'jouw … → stam + t', vorm: 'ott3' });
    }
  }
  return r;
}

// ---------- planeet 4: enkelvoud of meervoud ----------
function planeet4() {
  const r = [];
  for (const v of ALLE) {
    for (const o of MV)
      r.push(...tt(v, o, v.inf, 'inf', `<b>${o.m}</b> is meervoud → het hele werkwoord: <b>${v.inf}</b>.`, 'meervoud → hele werkwoord'));
    for (const o of GROEP)
      r.push(...tt(v, o, v.ott3, 'ott3',
        `<b>${o.m}</b> klinkt als veel, maar het woord is <b>enkelvoud</b> → stam + t = <b>${v.ott3}</b>.`, 'enkelvoud → stam + t'));
  }
  return r;
}

// ---------- planeet 5 en 6: verleden tijd zwak ----------
function kofschipLetter(v) {
  // kijk naar de laatste letter van de stam zoals in het hele werkwoord (verhuizen → z)
  const voorEn = v.inf.slice(0, -2);
  if (voorEn.endsWith('ch')) return 'ch';
  return voorEn.slice(-1);
}
const KOF = ['t', 'k', 'f', 's', 'ch', 'p', 'x'];
function uitlegOvt(v, mv) {
  const l = kofschipLetter(v);
  const inKof = KOF.includes(l);
  const uitgang = (inKof ? 'te' : 'de') + (mv ? 'n' : '');
  let u = `Stam: <b>${v.stam}</b>. Bij ${v.inf} is de laatste letter een <b>${l}</b>. `;
  u += inKof ? `Die zit in 't kofschip → <b>-${uitgang}</b>.` : `Die zit niet in 't kofschip → <b>-${uitgang}</b>.`;
  if (heeft(v, 'zs') || heeft(v, 'fv')) u += ` Let op: kijk naar het hele werkwoord (${v.inf}), niet naar de stam (${v.stam}).`;
  if (v.stam.endsWith('t') || v.stam.endsWith('d')) u += ` ${v.stam} + ${uitgang} = <b>${mv ? v.ovtmv : v.ovt}</b> (dus twee keer een ${v.stam.slice(-1)}!).`;
  else u += ` → <b>${mv ? v.ovtmv : v.ovt}</b>.`;
  return u;
}
function vtZinnen(v, onderwerpen) {
  const r = [];
  for (const o of onderwerpen) for (const b of toenBijw(v)) {
    const mv = o.p === 'mv';
    const antw = mv ? v.ovtmv : v.ovt;
    const uit = uitlegOvt(v, mv);
    const regel = mv ? 'vt meervoud: -ten / -den' : 'vt enkelvoud: -te / -de';
    r.push({ zin: zin(o.s, GAT, b, v.c + '.'), antwoord: antw, v, uitleg: uit, regel, vorm: mv ? 'ovtmv' : 'ovt' });
    r.push({ zin: zin(cap(b), GAT, o.m, v.c + '.'), antwoord: antw, v, uitleg: uit, regel, vorm: mv ? 'ovtmv' : 'ovt' });
  }
  return r;
}
const VT_OND = [...IK, ond('Jij', 'jij', 2), ...HIJ.slice(0, 5), ...MV.slice(0, 6)];
function planeet5() {
  const r = [];
  for (const v of ZWAK) if (!heeft(v, 'lastig')) r.push(...vtZinnen(v, VT_OND));
  return r;
}
function planeet6() {
  const r = [];
  for (const v of ZWAK) if (heeft(v, 'lastig')) r.push(...vtZinnen(v, VT_OND));
  return r;
}

// ---------- planeet 7: voltooid deelwoord zwak ----------
function uitlegVd(v) {
  const l = kofschipLetter(v);
  const inKof = KOF.includes(l);
  let u = '';
  if (heeft(v, 'vv')) u += `${v.inf} begint met <b>${v.inf.match(/^(be|ver|ont|her)/)[1]}-</b>, dus er komt <b>geen ge-</b> voor. `;
  else u += 'Voltooid deelwoord: <b>ge-</b> + stam + t of d. ';
  u += inKof ? `De ${l} zit in 't kofschip → eindigt op een <b>t</b>.` : `De ${l} zit niet in 't kofschip → eindigt op een <b>d</b>.`;
  if (v.stam.endsWith('t') || v.stam.endsWith('d')) u += ` De stam eindigt al op een ${v.stam.slice(-1)}, dus er komt niets meer bij: <b>${v.vd}</b>.`;
  else u += ` → <b>${v.vd}</b>.`;
  return u;
}
function vdZinnen(v, onderwerpen, regel, uitleg) {
  const r = [];
  for (const o of onderwerpen) for (const b of toenBijw(v)) {
    r.push({ zin: zin(o.s, hulp(v, o, false), b, v.c, GAT + '.'), antwoord: v.vd, v, uitleg, regel, vorm: 'vd' });
    r.push({ zin: zin(cap(b), hulp(v, o, true), o.m, v.c, GAT + '.'), antwoord: v.vd, v, uitleg, regel, vorm: 'vd' });
  }
  return r;
}
function planeet7() {
  const r = [];
  for (const v of ZWAK) r.push(...vdZinnen(v, VT_OND, heeft(v, 'vv') ? 'vd zonder ge- (be/ver/ont/her)' : 'vd: ge- + stam + t/d', uitlegVd(v)));
  return r;
}

// ---------- planeet 8: sterke werkwoorden ----------
function planeet8() {
  const r = [];
  for (const v of STERK) {
    const rij = `${v.inf} – ${v.ovt} – ${v.vd}`;
    for (const o of VT_OND) for (const b of toenBijw(v)) {
      const mv = o.p === 'mv';
      r.push({ zin: zin(o.s, GAT, b, v.c + '.'), antwoord: mv ? v.ovtmv : v.ovt, v, vorm: mv ? 'ovtmv' : 'ovt',
        uitleg: `<b>${v.inf}</b> is een sterk werkwoord: de klinker verandert. ${o.m} <b>${mv ? v.ovtmv : v.ovt}</b>. Onthoud: ${rij}.`, regel: 'sterk ww: verleden tijd' });
    }
    r.push(...vdZinnen(v, VT_OND, 'sterk ww: voltooid deelwoord',
      `<b>${v.inf}</b> is een sterk werkwoord. Het voltooid deelwoord is <b>${v.vd}</b>. Onthoud: ${rij}.`));
  }
  return r;
}

// ---------- planeet 9: persoonsvorm of voltooid deelwoord ----------
const PLUTO = ['betalen', 'beloven', 'verhuizen', 'vertellen', 'herhalen', 'verbeteren', 'ontdekken', 'verwachten', 'verven',
  'leven', 'reizen', 'antwoorden', 'landen', 'schudden', 'redden', 'worden', 'vinden', 'rijden', 'snijden', 'zweven', 'trainen', 'scoren'];
function planeet9() {
  const r = [];
  for (const naam of PLUTO) {
    const v = ALLE.find(w => w.inf === naam);
    const pvUitleg = (vorm, wie) => `Vervang door <b>lopen</b>: ${wie} <b>${vorm}</b>. Dat is een <b>persoonsvorm</b>. `;
    for (const o of HIJ.slice(0, 6)) {
      for (const b of nuBijw(v).slice(0, 4)) {
        r.push({ zin: zin(o.s, GAT, b, v.c + '.'), antwoord: v.ott3, v, vorm: 'ott3', regel: 'persoonsvorm (lopen → loopt)',
          uitleg: pvUitleg('loopt', o.m) + uitlegStamT(v, o.m) });
      }
      for (const b of toenBijw(v).slice(0, 3)) {
        r.push({ zin: zin(o.s, hulp(v, o, false), b, v.c, GAT + '.'), antwoord: v.vd, v, vorm: 'vd', regel: 'voltooid deelwoord (lopen → gelopen)',
          uitleg: `Vervang door <b>lopen</b>: ${o.m} ${hulp({ aux: 'z' }, o, false)} <b>gelopen</b>. Dat is een <b>voltooid deelwoord</b>. ` + (v.sterk ? `Sterk werkwoord: <b>${v.vd}</b>.` : uitlegVd(v)) });
      }
    }
    if (!heeft(v, 'geenik')) for (const b of nuBijw(v).slice(0, 3)) {
      r.push({ zin: zin('Ik', GAT, b, v.c + '.'), antwoord: v.stam, v, vorm: 'stam', regel: 'persoonsvorm bij ik',
        uitleg: pvUitleg('loop', 'ik') + uitlegStam(v) });
      r.push({ zin: zin(GAT, 'jij', b, v.c + '?'), antwoord: v.stam, v, vorm: 'stam', hoofdletter: true, regel: 'persoonsvorm, jij erachter',
        uitleg: 'Vervang door <b>lopen</b>: <b>loop</b> jij? Dat is een <b>persoonsvorm</b>. Jij staat achter het werkwoord → <b>geen t</b>: ' + v.stam + ' jij?' });
    }
  }
  return r;
}

// ---------- foute antwoorden voor meerkeuze ----------
function varianten(c, v) {
  const swaps = new Set();
  const add = (set, x) => { if (x && x !== c && x.length > 1) set.add(x); };
  if (/dt$/.test(c)) { add(swaps, c.slice(0, -1)); add(swaps, c.slice(0, -2) + 't'); }
  else if (/d$/.test(c)) { add(swaps, c + 't'); add(swaps, c.slice(0, -1) + 't'); }
  else if (/t$/.test(c)) { add(swaps, c.slice(0, -1) + 'd'); if (!/tt$/.test(c)) add(swaps, c.slice(0, -1) + 'dt'); }
  else if (!/(en|e)$/.test(c)) { add(swaps, c + 't'); add(swaps, c + 'd'); }
  if (/tte(n?)$/.test(c)) add(swaps, c.replace(/tte(n?)$/, 'te$1'));
  else if (/dde(n?)$/.test(c)) add(swaps, c.replace(/dde(n?)$/, 'de$1'));
  if (/te(n?)$/.test(c)) add(swaps, c.replace(/te(n?)$/, 'de$1'));
  else if (/de(n?)$/.test(c)) add(swaps, c.replace(/de(n?)$/, 'te$1'));
  if (c.startsWith('ge') && v.vd === c) add(swaps, c.slice(2));
  if (v.vd === c && !c.startsWith('ge')) add(swaps, 'ge' + c);
  // sterk werkwoord als zwak vervoegd: liep → loopte
  if (v.sterk && (c === v.ovt || c === v.ovtmv)) {
    add(swaps, v.stam + (KOF.includes(kofschipLetter(v)) ? 'te' : 'de') + (c === v.ovtmv ? 'n' : ''));
  }
  const vormen = new Set();
  for (const k of ['stam', 'ott3', 'inf', 'ovt', 'ovtmv', 'vd']) add(vormen, v[k]);
  return { swaps: [...swaps], vormen: [...vormen] };
}

// ---------- seeded random ----------
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function schud(arr, r) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Kies 100 vragen zo dat zoveel mogelijk verschillende werkwoorden aan bod komen.
function kies(kandidaten, n, r, weging) {
  const perWw = new Map();
  for (const k of schud(kandidaten, r)) {
    const sleutel = k.v.inf + (weging ? weging(k) : '');
    if (!perWw.has(sleutel)) perWw.set(sleutel, []);
    perWw.get(sleutel).push(k);
  }
  const groepen = schud([...perWw.values()], r);
  const gekozen = []; const zinnen = new Set();
  while (gekozen.length < n) {
    let iets = false;
    for (const g of groepen) {
      while (g.length) {
        const k = g.shift();
        if (zinnen.has(k.zin)) continue;
        zinnen.add(k.zin); gekozen.push(k); iets = true; break;
      }
      if (gekozen.length >= n) break;
    }
    if (!iets) throw new Error('Te weinig kandidaten');
  }
  return gekozen;
}

function bouw() {
  const makers = [planeet1, planeet2, planeet3, planeet4, planeet5, planeet6, planeet7, planeet8, planeet9];
  // weging: zorgt voor een mooie mix binnen een planeet (bv. ott3 én stam bij Mars)
  const wegingen = [null, null, k => k.vorm, null, k => k.vorm, k => k.vorm, null, k => k.vorm, k => k.vorm];
  const vragen = [];
  makers.forEach((maak, p) => {
    const r = rng(1000 + p * 77);
    const kandidaten = maak();
    let gekozen;
    if (p === 3) {
      // Venus: 65 meervoud, 35 enkelvoud-groepswoorden
      const mvK = kandidaten.filter(k => k.vorm === 'inf');
      const evK = kandidaten.filter(k => k.vorm !== 'inf');
      gekozen = schud([...kies(mvK, 65, r), ...kies(evK, 35, r)], r);
    } else {
      gekozen = kies(kandidaten, 100, r, wegingen[p]);
    }
    gekozen.forEach((k, i) => {
      const id = `p${p + 1}-${String(i + 1).padStart(3, '0')}`;
      const mc = i % 10 === 2 || i % 10 === 5 || i % 10 === 8; // 30% meerkeuze, 70% zelf invullen
      const vraag = {
        id, planeet: p, type: mc ? 'mk' : 'open', zin: k.zin, ww: k.v.inf, antwoord: k.antwoord,
        regel: k.regel, uitleg: k.uitleg, vorm: k.vorm, sterk: k.v.sterk
      };
      if (k.hoofdletter) vraag.hoofdletter = true;
      if (mc) {
        const { swaps, vormen } = varianten(k.antwoord, k.v);
        const fout = [];
        for (const x of schud(swaps, r)) if (fout.length < 2 && !fout.includes(x)) fout.push(x);
        for (const x of schud(vormen, r)) if (fout.length < 3 && !fout.includes(x) && x !== k.antwoord) fout.push(x);
        for (const x of swaps) if (fout.length < 3 && !fout.includes(x)) fout.push(x);
        vraag.opties = schud([k.antwoord, ...fout], r);
      }
      vragen.push(vraag);
    });
  });
  return vragen;
}

if (require.main === module) {
  const vragen = bouw();
  const uit = path.join(__dirname, '..', 'data', 'vragen.json');
  fs.writeFileSync(uit, JSON.stringify(vragen, null, 1));
  const tel = {};
  for (const v of vragen) tel[v.planeet] = (tel[v.planeet] || 0) + 1;
  console.log(`✔ ${vragen.length} vragen geschreven naar data/vragen.json`, tel);
}

module.exports = { bouw, ALLE };
