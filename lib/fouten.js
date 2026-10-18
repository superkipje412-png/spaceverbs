// Bepaalt wat voor fout een leerling maakt, zodat de leerkracht patronen ziet.
const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

const CATEGORIEEN = {
  't-vergeten': 't vergeten (bijv. hij word i.p.v. wordt)',
  't-teveel': 't te veel (bijv. ik wordt, word jij → wordt jij)',
  'd-t': 'd en t verwisseld (bijv. betaalt ↔ betaald)',
  'te-de': "te/de verwisseld ('t kofschip)",
  'dubbel': 'Enkele of dubbele letter (bijv. praate / praatte)',
  'ge': 'ge- vergeten of te veel',
  'sterk': 'Sterk werkwoord zwak vervoegd (bijv. loopte)',
  'vorm': 'Verkeerde vorm of tijd gekozen',
  'enk-mv': 'Enkelvoud / meervoud verwisseld',
  'spelling': 'Andere spelfout'
};

function categorie(antwoord, vraag, vormen) {
  const a = norm(antwoord), c = norm(vraag.antwoord);
  if (!a) return 'spelling';
  if (a + 't' === c) return 't-vergeten';
  if (c + 't' === a) return 't-teveel';
  if (a.replace(/d$/, 't') === c || a.replace(/t$/, 'd') === c) return 'd-t';
  if (a.replace(/dt$/, 'd') === c || a.replace(/dt$/, 't') === c) return 't-teveel';
  if (a.replace(/de(n?)$/, 'te$1') === c || a.replace(/te(n?)$/, 'de$1') === c) return 'te-de';
  if ('ge' + a === c || a === 'ge' + c) return 'ge';
  const enkel = s => s.replace(/(.)\1/g, '$1');
  if (enkel(a) === enkel(c)) return 'dubbel';
  if (vormen) {
    if (vraag.planeet === 3 && (a === vormen.inf || a === vormen.ott3)) return 'enk-mv';
    if (Object.values(vormen).includes(a)) return 'vorm';
    if (vraag.sterk && vormen.stam && a.startsWith(vormen.stam) && /(te|de|ten|den)$/.test(a)) return 'sterk';
  }
  return 'spelling';
}

module.exports = { norm, categorie, CATEGORIEEN };
