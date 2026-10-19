// Alle tekeningen van SpaceVerbs als SVG, zodat er geen plaatjes nodig zijn.
(() => {
let uid = 0;
const nid = () => 'g' + (++uid);

function planeetSVG(p, grootte = 120, opSlot = false) {
  const g = nid(), r = 40;
  const k1 = opSlot ? '#475569' : p.kleur, k2 = opSlot ? '#1e293b' : p.kleur2;
  let extra = '';
  switch (p.naam) {
    case 'Aarde':
      extra = `<path d="M25 35 q8 -10 18 -4 q6 6 -2 12 q-8 2 -6 10 q-6 4 -12 -4 q-4 -8 2 -14z" fill="${opSlot ? '#334155' : '#22c55e'}"/>
               <path d="M58 52 q10 -6 16 2 q2 10 -8 14 q-10 0 -8 -16z" fill="${opSlot ? '#334155' : '#16a34a'}"/>
               <path d="M48 22 q6 -4 12 0 q-2 4 -12 0z" fill="#fff" opacity=".7"/>`;
      break;
    case 'Maan': case 'Mars': case 'Pluto':
      extra = `<circle cx="35" cy="38" r="7" fill="#000" opacity=".15"/><circle cx="60" cy="58" r="10" fill="#000" opacity=".13"/>
               <circle cx="62" cy="30" r="4" fill="#000" opacity=".15"/><circle cx="38" cy="64" r="4" fill="#000" opacity=".12"/>`;
      if (p.naam === 'Pluto') extra += `<path d="M50 64 l-10 -10 a6 6 0 0 1 10 -7 a6 6 0 0 1 10 7z" fill="#fff" opacity=".55"/>`;
      break;
    case 'Jupiter': case 'Neptunus': case 'Venus':
      extra = `<path d="M12 38 Q50 30 88 38" stroke="${k2}" stroke-width="6" fill="none" opacity=".7"/>
               <path d="M11 54 Q50 62 89 54" stroke="#fff" stroke-width="4" fill="none" opacity=".35"/>
               <path d="M16 68 Q50 74 84 68" stroke="${k2}" stroke-width="5" fill="none" opacity=".6"/>`;
      if (p.naam === 'Jupiter') extra += `<ellipse cx="62" cy="58" rx="8" ry="5" fill="#b91c1c" opacity=".7"/>`;
      break;
  }
  const ring = (p.naam === 'Saturnus' || p.naam === 'Uranus')
    ? `<ellipse cx="50" cy="50" rx="56" ry="13" fill="none" stroke="${opSlot ? '#64748b' : '#fde68a'}" stroke-width="5" opacity=".85" transform="rotate(${p.naam === 'Uranus' ? 70 : -15} 50 50)"/>` : '';
  const ringAchter = ring ? ring.replace('opacity=".85"', 'opacity=".5"') : '';
  return `<svg viewBox="-12 -12 124 124" width="${grootte}" height="${grootte}" aria-hidden="true">
    <defs><radialGradient id="${g}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${k1}"/><stop offset="1" stop-color="${k2}"/></radialGradient>
    <clipPath id="${g}c"><circle cx="50" cy="50" r="${r}"/></clipPath></defs>
    ${ringAchter}
    <circle cx="50" cy="50" r="${r}" fill="url(#${g})"/>
    <g clip-path="url(#${g}c)">${extra}<circle cx="70" cy="70" r="${r}" fill="#000" opacity=".18"/></g>
    <circle cx="36" cy="32" r="8" fill="#fff" opacity=".25"/>
    ${ring ? `<path d="${p.naam === 'Saturnus' ? 'M-4 62 Q50 82 104 38' : 'M46 -4 Q56 50 54 104'}" stroke="${opSlot ? '#64748b' : '#fde68a'}" stroke-width="5" fill="none" opacity=".9"/>` : ''}
  </svg>`;
}

function blobSVG(blob, grootte = 120) {
  const b = blob || { kleur: '#22c55e', ogen: 2, accessoires: [] };
  const draagt = new Set(Array.isArray(b.accessoires) ? b.accessoires : b.accessoire ? [b.accessoire] : []);
  const k = b.kleur;
  const ogen = { 1: [[50, 46, 11]], 2: [[39, 46, 8], [61, 46, 8]], 3: [[34, 48, 7], [50, 40, 7], [66, 48, 7]] }[b.ogen] || [[39, 46, 8], [61, 46, 8]];
  const oog = ([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + r * .25}" cy="${y + r * .15}" r="${r * .5}" fill="#1e1b4b"/><circle cx="${x + r * .45}" cy="${y - r * .2}" r="${r * .18}" fill="#fff"/>`;
  const acc = {
    antenne: `<path d="M40 22 Q36 8 30 6 M60 22 Q64 8 70 6" stroke="${k}" stroke-width="3" fill="none"/><circle cx="30" cy="6" r="4" fill="#facc15"/><circle cx="70" cy="6" r="4" fill="#facc15"/>`,
    helm: `<circle cx="50" cy="52" r="42" fill="#bae6fd" opacity=".25" stroke="#e0f2fe" stroke-width="3"/><path d="M24 28 Q30 18 40 16" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>`,
    bril: `<rect x="26" y="38" width="20" height="13" rx="5" fill="#0f172a"/><rect x="54" y="38" width="20" height="13" rx="5" fill="#0f172a"/><path d="M46 43 h8" stroke="#0f172a" stroke-width="3"/><path d="M29 41 l5 0" stroke="#fff" stroke-width="2" opacity=".6"/>`,
    koptelefoon: `<path d="M18 50 Q18 14 50 14 Q82 14 82 50" stroke="#334155" stroke-width="5" fill="none"/><rect x="11" y="44" width="12" height="20" rx="5" fill="#ef4444"/><rect x="77" y="44" width="12" height="20" rx="5" fill="#ef4444"/>`,
    cape: `<path d="M24 60 Q10 90 20 98 L80 98 Q90 90 76 60z" fill="#dc2626" opacity=".95"/>`,
    ring: `<ellipse cx="50" cy="76" rx="44" ry="9" fill="none" stroke="#fde68a" stroke-width="4"/>`,
    jetpack: `<rect x="6" y="50" width="12" height="28" rx="4" fill="#94a3b8"/><path d="M8 78 l4 14 l4 -14z" fill="#f97316"/><rect x="82" y="50" width="12" height="28" rx="4" fill="#94a3b8"/><path d="M84 78 l4 14 l4 -14z" fill="#f97316"/>`,
    ster: `<path d="M88 30 L88 84" stroke="#a16207" stroke-width="3"/><path d="M88 16 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1z" fill="#facc15"/>`,
    kroon: `<path d="M32 22 L36 6 L44 16 L50 2 L56 16 L64 6 L68 22z" fill="#facc15" stroke="#ca8a04" stroke-width="2"/><circle cx="50" cy="14" r="2.5" fill="#ef4444"/>`
  };
  // volgorde van tekenen: achter de blob, dan ervoor (de helm als laatste, als een bel over alles heen)
  const laag = ids => ids.filter(id => draagt.has(id)).map(id => acc[id]).join('');
  const achter = laag(['cape', 'jetpack']);
  const voor = laag(['ring', 'bril', 'koptelefoon', 'antenne', 'kroon', 'ster', 'helm']);
  return `<svg viewBox="0 0 100 100" width="${grootte}" height="${grootte}" class="blob" aria-hidden="true">
    ${achter}
    <path d="M50 18 C72 18 86 34 86 56 C86 78 74 90 50 90 C26 90 14 78 14 56 C14 34 28 18 50 18z" fill="${k}"/>
    <path d="M50 18 C72 18 86 34 86 56 C86 78 74 90 50 90" fill="#000" opacity=".12"/>
    <ellipse cx="34" cy="32" rx="8" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 34 32)"/>
    <ellipse cx="30" cy="60" rx="6" ry="4" fill="#f472b6" opacity=".5"/><ellipse cx="70" cy="60" rx="6" ry="4" fill="#f472b6" opacity=".5"/>
    ${ogen.map(oog).join('')}
    <path d="M40 64 Q50 74 60 64" stroke="#1e1b4b" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    ${voor}
  </svg>`;
}

function alienSVG(d, grootte = 110) {
  const open = d.open !== false;
  const k = open ? d.kleur : '#1e293b';
  const lijn = open ? '#1e1b4b' : '#0f172a';
  const oog = (x, y, r = 6) => open ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 1}" cy="${y + 1}" r="${r / 2}" fill="#1e1b4b"/>` : '';
  const mond = open ? `<path d="M44 66 Q50 71 56 66" stroke="${lijn}" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : '';
  const lijf = (rx = 26, ry = 22, cy = 60) => `<ellipse cx="50" cy="${cy}" rx="${rx}" ry="${ry}" fill="${k}"/>`;
  let s = '';
  switch (d.soort) {
    case 'slak': s = `<path d="M14 80 Q50 70 86 80 Q86 88 14 88z" fill="${k}"/><circle cx="58" cy="60" r="20" fill="${open ? '#fde68a' : k}" stroke="${open ? '#d97706' : k}" stroke-width="3"/><path d="M58 60 m-8 0 a8 8 0 1 0 8 -8" stroke="${open ? '#d97706' : k}" stroke-width="3" fill="none"/><path d="M24 78 L20 52 M30 76 L32 50" stroke="${k}" stroke-width="3"/>${oog(20, 50, 5)}${oog(32, 48, 5)}`; break;
    case 'vlieg': s = `<ellipse cx="30" cy="44" rx="18" ry="12" fill="${open ? '#e0f2fe' : k}" opacity=".85"/><ellipse cx="70" cy="44" rx="18" ry="12" fill="${open ? '#e0f2fe' : k}" opacity=".85"/>${lijf(18, 22)}<path d="M36 62 h28 M36 70 h28" stroke="${open ? '#1e1b4b' : k}" stroke-width="4" opacity=".4"/>${oog(43, 52)}${oog(57, 52)}`; break;
    case 'krab': s = `<path d="M22 56 Q8 40 18 30 Q24 38 28 34 M78 56 Q92 40 82 30 Q76 38 72 34" stroke="${k}" stroke-width="7" fill="none" stroke-linecap="round"/>${lijf(30, 18, 64)}<path d="M26 74 l-8 10 M34 78 l-4 10 M74 74 l8 10 M66 78 l4 10" stroke="${k}" stroke-width="4"/><path d="M42 50 v-12 M58 50 v-12" stroke="${k}" stroke-width="3"/>${oog(42, 38, 5)}${oog(58, 38, 5)}`; break;
    case 'kat': s = `${lijf(26, 26)}<path d="M28 44 L26 22 L44 36z M72 44 L74 22 L56 36z" fill="${k}"/>${oog(40, 54, 7)}${oog(60, 54, 7)}<path d="M30 66 h-14 M30 70 h-12 M70 66 h14 M70 70 h12" stroke="${open ? '#fff' : k}" stroke-width="1.5"/>`; break;
    case 'kikker': s = `${lijf(30, 22, 64)}<circle cx="36" cy="42" r="11" fill="${k}"/><circle cx="64" cy="42" r="11" fill="${k}"/>${oog(36, 42, 7)}${oog(64, 42, 7)}<path d="M36 70 Q50 80 64 70" stroke="${lijn}" stroke-width="3" fill="none"/>`; break;
    case 'vis': s = `<path d="M74 60 L94 44 L94 76z" fill="${k}"/>${lijf(32, 20)}<path d="M44 42 Q54 30 62 42" fill="${k}"/>${oog(34, 56, 7)}<path d="M50 52 q6 8 0 16 M58 52 q6 8 0 16" stroke="#fff" stroke-width="2" fill="none" opacity="${open ? .5 : 0}"/>`; break;
    case 'worm': s = `<circle cx="22" cy="72" r="12" fill="${k}"/><circle cx="38" cy="66" r="13" fill="${k}"/><circle cx="54" cy="70" r="13" fill="${k}"/><circle cx="68" cy="58" r="15" fill="${k}"/>${oog(64, 54, 5)}${oog(75, 54, 5)}<path d="M62 30 Q66 40 68 44 M76 30 Q74 40 72 44" stroke="${k}" stroke-width="3"/><circle cx="62" cy="30" r="3" fill="${k}"/><circle cx="76" cy="30" r="3" fill="${k}"/>`; break;
    case 'octo': s = `<circle cx="50" cy="44" r="26" fill="${k}"/>${[22, 34, 46, 58, 70].map((x, i) => `<path d="M${x + 4} 62 Q${x - 6 + i * 2} 78 ${x + 2} 92" stroke="${k}" stroke-width="7" fill="none" stroke-linecap="round"/>`).join('')}${oog(40, 42, 7)}${oog(60, 42, 7)}`; break;
    case 'spin': s = `${[0, 1, 2, 3].map(i => `<path d="M40 ${54 + i * 6} Q${18 - i * 2} ${40 + i * 10} ${12 + i * 2} ${70 + i * 6} M60 ${54 + i * 6} Q${82 + i * 2} ${40 + i * 10} ${88 - i * 2} ${70 + i * 6}" stroke="${k}" stroke-width="3.5" fill="none"/>`).join('')}${lijf(20, 20)}${oog(43, 56, 5)}${oog(57, 56, 5)}${oog(50, 46, 4)}`; break;
    case 'pluis': s = `${Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `<circle cx="${50 + Math.cos(a) * 26}" cy="${58 + Math.sin(a) * 24}" r="9" fill="${k}"/>`; }).join('')}<circle cx="50" cy="58" r="26" fill="${k}"/>${oog(42, 56, 7)}${oog(58, 56, 7)}`; break;
    case 'beer': s = `<circle cx="30" cy="36" r="10" fill="${k}"/><circle cx="70" cy="36" r="10" fill="${k}"/>${lijf(28, 28)}<ellipse cx="50" cy="66" rx="12" ry="9" fill="#fff" opacity="${open ? .35 : 0}"/>${oog(40, 52, 5)}${oog(60, 52, 5)}<circle cx="50" cy="62" r="3" fill="${lijn}"/>`; break;
    case 'kwal': s = `<path d="M22 54 Q22 24 50 24 Q78 24 78 54z" fill="${k}" opacity=".9"/>${[28, 38, 50, 62, 72].map(x => `<path d="M${x} 54 q-5 10 0 20 q5 10 0 18" stroke="${k}" stroke-width="3" fill="none"/>`).join('')}${oog(42, 42, 5)}${oog(58, 42, 5)}`; break;
    case 'kever': s = `<circle cx="50" cy="34" r="12" fill="${open ? '#1e1b4b' : k}"/>${lijf(26, 26, 62)}<path d="M50 36 V88" stroke="${lijn}" stroke-width="2" opacity=".5"/>${open ? '<circle cx="38" cy="58" r="5" fill="#1e1b4b" opacity=".5"/><circle cx="62" cy="58" r="5" fill="#1e1b4b" opacity=".5"/><circle cx="40" cy="74" r="4" fill="#1e1b4b" opacity=".5"/><circle cx="60" cy="74" r="4" fill="#1e1b4b" opacity=".5"/>' : ''}${oog(45, 32, 4)}${oog(55, 32, 4)}`; break;
    case 'uil': s = `${lijf(26, 30)}<path d="M28 36 L32 22 L42 32z M72 36 L68 22 L58 32z" fill="${k}"/>${oog(40, 48, 10)}${oog(60, 48, 10)}<path d="M46 60 l4 6 l4 -6z" fill="${open ? '#f97316' : k}"/>`; break;
    case 'haas': s = `<ellipse cx="38" cy="22" rx="7" ry="20" fill="${k}"/><ellipse cx="62" cy="22" rx="7" ry="20" fill="${k}"/>${lijf(26, 26)}${oog(41, 54, 6)}${oog(59, 54, 6)}<path d="M47 64 h6" stroke="${lijn}" stroke-width="3"/>`; break;
    case 'olifant': s = `<circle cx="24" cy="50" r="16" fill="${k}"/><circle cx="76" cy="50" r="16" fill="${k}"/>${lijf(26, 26, 56)}<path d="M50 64 Q50 86 62 88" stroke="${k}" stroke-width="10" fill="none" stroke-linecap="round"/>${oog(41, 50, 5)}${oog(59, 50, 5)}`; break;
    default: s = `${lijf()}${oog(42, 56)}${oog(58, 56)}`;
  }
  const extraMond = ['vlieg', 'kat', 'pluis', 'kwal', 'haas', 'octo', 'spin'].includes(d.soort) ? mond : '';
  const vraag = open ? '' : `<text x="50" y="62" text-anchor="middle" font-size="30" font-weight="700" fill="#64748b" font-family="inherit">?</text>`;
  return `<svg viewBox="0 0 100 100" width="${grootte}" height="${grootte}" aria-hidden="true">${s}${extraMond}${vraag}</svg>`;
}

function sterrenbeeldSVG(kaart, grootte = 260) {
  const gekocht = new Set(kaart.gekocht);
  const lijnen = kaart.lijnen.map(([a, b]) => {
    const [x1, y1] = kaart.sterren[a], [x2, y2] = kaart.sterren[b];
    const aan = gekocht.has(a) && gekocht.has(b);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${aan ? '#fde68a' : '#475569'}" stroke-width="${aan ? 1.6 : 0.8}" stroke-dasharray="${aan ? '' : '2 2'}" ${kaart.vol ? 'class="lijn-aan"' : ''}/>`;
  }).join('');
  const sterren = kaart.sterren.map(([x, y], i) => {
    const heb = gekocht.has(i);
    return `<g class="ster ${heb ? 'heb' : 'koop'}" data-beeld="${kaart.id}" data-nr="${i}" tabindex="${heb || !kaart.open ? -1 : 0}" role="button" aria-label="${heb ? 'Ster gekocht' : 'Koop ster voor ' + kaart.prijs + ' munten'}">
      <circle cx="${x}" cy="${y}" r="8" fill="transparent"/>
      ${heb ? `<circle cx="${x}" cy="${y}" r="6" fill="#facc15" opacity=".25"/><path d="M${x} ${y - 5} l1.5 3.4 3.6 .4 -2.7 2.4 .8 3.6 -3.2 -1.9 -3.2 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4z" fill="#fde047"/>`
        : `<circle cx="${x}" cy="${y}" r="3.2" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="1.5 1"/>`}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 100 100" width="${grootte}" height="${grootte}" class="sterrenbeeld">${lijnen}${sterren}</svg>`;
}

function herhalingsSterSVG(grootte = 84, status = 'huidig') {
  const g = nid();
  const dicht = status === 'slot';
  const k1 = dicht ? '#64748b' : '#fde047', k2 = dicht ? '#334155' : '#f59e0b';
  return `<svg viewBox="0 0 100 100" width="${grootte}" height="${grootte}" aria-hidden="true">
    <defs><radialGradient id="${g}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${k1}"/><stop offset="1" stop-color="${k2}"/></radialGradient></defs>
    ${dicht ? '' : '<circle cx="50" cy="52" r="44" fill="#facc15" opacity=".15"/>'}
    <path d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36z" fill="url(#${g})" stroke="${dicht ? '#1e293b' : '#b45309'}" stroke-width="3" stroke-linejoin="round"/>
    ${dicht ? '<text x="50" y="62" text-anchor="middle" font-size="22">🔒</text>'
      : status === 'klaar' ? '<path d="M37 52 l9 9 l17 -19" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<circle cx="42" cy="50" r="4" fill="#422006"/><circle cx="58" cy="50" r="4" fill="#422006"/><path d="M43 60 Q50 66 57 60" stroke="#422006" stroke-width="3" fill="none" stroke-linecap="round"/>'}
  </svg>`;
}

function munt(grootte = 22) {
  return `<svg viewBox="0 0 24 24" width="${grootte}" height="${grootte}" aria-hidden="true" class="munt-ico"><circle cx="12" cy="12" r="10" fill="#facc15" stroke="#ca8a04" stroke-width="2"/><path d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L12 14.7l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fef9c3"/></svg>`;
}

function raketSVG(grootte = 48) {
  return `<svg viewBox="0 0 64 64" width="${grootte}" height="${grootte}" aria-hidden="true" class="raket"><path d="M32 4 C44 14 46 30 42 44 H22 C18 30 20 14 32 4z" fill="#f1f5f9"/><circle cx="32" cy="24" r="6" fill="#38bdf8" stroke="#0f172a" stroke-width="2"/><path d="M22 36 L12 50 L22 46z M42 36 L52 50 L42 46z" fill="#ef4444"/><path d="M26 44 h12 l-6 14z" fill="#f97316" class="vlam"/></svg>`;
}

window.Art = { planeetSVG, blobSVG, alienSVG, sterrenbeeldSVG, herhalingsSterSVG, munt, raketSVG };
})();
