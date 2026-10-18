// De reis door het zonnestelsel: elke planeet is één leerdoel.
const PLANETEN = [
  {
    id: 0, naam: 'Aarde', kleur: '#3b82f6', kleur2: '#22c55e',
    titel: 'De ik-vorm',
    doel: 'Ik schrijf de persoonsvorm bij "ik" goed: ik + stam.',
    uitleg: [
      'Bij <b>ik</b> schrijf je alleen de <b>stam</b> van het werkwoord.',
      'De stam vind je zo: haal <b>-en</b> van het hele werkwoord af. fietsen → <b>fiets</b>.',
      'Klinkt het gek? Pas de spelling aan: maken → <b>maak</b>, zwemmen → <b>zwem</b>, leven → <b>leef</b>, reizen → <b>reis</b>.',
      'Let op: worden → ik <b>word</b>. Bij ik komt er nooit een t achter!'
    ],
    voorbeelden: ['ik fiets', 'ik maak', 'ik word', 'ik vind', 'ik leef']
  },
  {
    id: 1, naam: 'Maan', kleur: '#cbd5e1', kleur2: '#94a3b8',
    titel: 'Hij, zij, het: stam + t',
    doel: 'Ik schrijf de persoonsvorm bij hij/zij/het of een naam goed: stam + t.',
    uitleg: [
      'Gaat de zin over <b>één ander</b> (hij, zij, het, opa, de juf)? Dan schrijf je <b>stam + t</b>.',
      'fietsen → hij fiets<b>t</b>, maken → zij maak<b>t</b>.',
      'Eindigt de stam op een <b>d</b>? Dan krijg je <b>dt</b>: hij wor<b>dt</b>, zij vin<b>dt</b>.',
      'Eindigt de stam al op een <b>t</b>? Dan schrijf je maar één t: hij zi<b>t</b>, opa praa<b>t</b>.'
    ],
    voorbeelden: ['hij fietst', 'opa wordt', 'de juf zit', 'zij vindt']
  },
  {
    id: 2, naam: 'Mars', kleur: '#ef4444', kleur2: '#f97316',
    titel: 'Jij en je: met of zonder t?',
    doel: 'Ik weet wanneer er bij jij/je wel of geen t achter de stam komt.',
    uitleg: [
      'Staat <b>jij</b> of <b>je</b> <b>vóór</b> het werkwoord? Dan stam + t: jij fiets<b>t</b>, je wor<b>dt</b>.',
      'Staat <b>jij</b> of <b>je</b> <b>achter</b> het werkwoord? Dan <b>geen t</b>: fiets jij? word je?',
      'Uitzondering: bij <b>jouw</b> (jouw broer, jouw juf) gaat het over iemand anders. Dan wél een t: wordt jouw broer?'
    ],
    voorbeelden: ['jij fietst', 'fiets jij?', 'je wordt', 'word je?', 'vindt jouw zus?']
  },
  {
    id: 3, naam: 'Venus', kleur: '#facc15', kleur2: '#fb923c',
    titel: 'Enkelvoud of meervoud?',
    doel: 'Ik zie of het onderwerp enkelvoud of meervoud is en kies de goede vorm.',
    uitleg: [
      'Is het onderwerp <b>meervoud</b> (wij, we, jullie, de kinderen)? Dan schrijf je het <b>hele werkwoord</b>: wij fietsen.',
      'Is het onderwerp <b>enkelvoud</b>? Dan stam + t: de klas fietst.',
      'Pas op voor woorden als <b>het team</b>, <b>de klas</b>, <b>iedereen</b> en <b>mijn familie</b>. Dat zijn veel mensen, maar het woord is enkelvoud!'
    ],
    voorbeelden: ['wij spelen', 'jullie lopen', 'de klas speelt', 'iedereen lacht']
  },
  {
    id: 4, naam: 'Jupiter', kleur: '#d97706', kleur2: '#fde68a',
    titel: "Verleden tijd: 't kofschip",
    doel: "Ik schrijf de verleden tijd van zwakke werkwoorden met -te(n) of -de(n).",
    uitleg: [
      "Zit de laatste letter van de stam in <b>'t kofschip</b> (t, k, f, s, ch, p)? Dan: stam + <b>te</b> (meervoud: <b>ten</b>).",
      'Zo niet? Dan: stam + <b>de</b> (meervoud: <b>den</b>).',
      'werken → werk → k zit in \'t kofschip → werk<b>te</b>. spelen → speel → l niet → speel<b>de</b>.'
    ],
    voorbeelden: ['ik werkte', 'wij fietsten', 'hij speelde', 'zij woonden']
  },
  {
    id: 5, naam: 'Saturnus', kleur: '#eab308', kleur2: '#a16207',
    titel: 'Lastige verleden tijd: tt, dd, z en v',
    doel: 'Ik schrijf lastige vormen van de verleden tijd goed, zoals praatte, antwoordde en verhuisde.',
    uitleg: [
      'Eindigt de stam op <b>t</b>? Dan komt er nog <b>te</b> achter: praat + te = praa<b>tte</b>.',
      'Eindigt de stam op <b>d</b>? Dan komt er nog <b>de</b> achter: antwoord + de = antwoor<b>dde</b>.',
      "Bij <b>z</b> en <b>v</b>: kijk naar het hele werkwoord! verhui<b>z</b>en → z zit niet in 't kofschip → verhuis<b>de</b>. le<b>v</b>en → leef<b>de</b>."
    ],
    voorbeelden: ['ik praatte', 'wij wachtten', 'hij antwoordde', 'zij verhuisden', 'ik leefde']
  },
  {
    id: 6, naam: 'Uranus', kleur: '#22d3ee', kleur2: '#0891b2',
    titel: 'Het voltooid deelwoord',
    doel: 'Ik schrijf het voltooid deelwoord van zwakke werkwoorden goed: ge- + stam + t of d.',
    uitleg: [
      'Het voltooid deelwoord staat vaak achteraan, bij <b>heb, heeft, is, ben</b>: ik heb ge<b>fietst</b>.',
      "Kofschip-letter? Dan eindigt het op een <b>t</b>: gewerk<b>t</b>. Anders op een <b>d</b>: gespeel<b>d</b>.",
      'Twijfel je? Maak het woord langer: de gespeel<b>d</b>e wedstrijd, het gewerk<b>t</b>e uur.',
      'Begint het werkwoord met <b>be-, ver-, ont-, her-</b>? Dan komt er geen ge- voor: <b>beloofd</b>, <b>verhuisd</b>.'
    ],
    voorbeelden: ['ik heb gewerkt', 'hij heeft gespeeld', 'wij zijn verhuisd', 'ik heb beloofd']
  },
  {
    id: 7, naam: 'Neptunus', kleur: '#4f46e5', kleur2: '#818cf8',
    titel: 'Sterke werkwoorden',
    doel: 'Ik ken de verleden tijd en het voltooid deelwoord van sterke werkwoorden.',
    uitleg: [
      'Bij <b>sterke werkwoorden</b> verandert de klinker in de verleden tijd: lopen → <b>liep</b>, vinden → <b>vond</b>.',
      'Je plakt er dus geen -te of -de achter. Niet: loopte!',
      'Het voltooid deelwoord eindigt meestal op <b>-en</b>: gelop<b>en</b>, gevond<b>en</b>.',
      'Deze vormen moet je gewoon leren. Zeg ze hardop: lopen – liep – gelopen.'
    ],
    voorbeelden: ['ik liep – ik ben gelopen', 'hij vond – hij heeft gevonden', 'wij zwommen']
  },
  {
    id: 8, naam: 'Pluto', kleur: '#a855f7', kleur2: '#f0abfc',
    titel: 'Eindbaas: persoonsvorm of voltooid deelwoord?',
    doel: 'Ik kies tussen de persoonsvorm en het voltooid deelwoord als ze hetzelfde klinken (betaalt of betaald).',
    uitleg: [
      'Sommige vormen klinken hetzelfde: hij betaal<b>t</b> en hij heeft betaal<b>d</b>.',
      'Truc: vervang het werkwoord door <b>lopen</b>.',
      'Hoor je <b>loopt</b> of <b>loop</b>? Dan is het een <b>persoonsvorm</b>: gebruik de regels van ik, jij en hij.',
      "Hoor je <b>gelopen</b>? Dan is het een <b>voltooid deelwoord</b>: gebruik 't kofschip (t of d)."
    ],
    voorbeelden: ['hij betaalt – hij heeft betaald', 'zij verhuist – zij is verhuisd', 'hij wordt – hij is geworden']
  }
];

module.exports = { PLANETEN };
