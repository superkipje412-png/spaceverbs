// Spelonderdelen: munten, sterrenkaarten (spaarkaart), aliendierentuin en blob-accessoires.

const MUNTEN = { open: 2, mk: 1, herhaling: 1, reeks: 5, toets: 50 };
const TOETS_AANTAL = 10;
const MAX_SEC_PER_VRAAG = 60; // langer telt niet mee voor de dierentuin

// Sterrenbeelden als spaarkaarten. Coördinaten in een vlak van 100 x 100.
const STERRENBEELDEN = [
  { id: 'cassiopeia', naam: 'Cassiopeia', prijs: 10,
    sterren: [[10, 30], [28, 62], [48, 40], [68, 64], [88, 28]], lijnen: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { id: 'grotebeer', naam: 'De Grote Beer', prijs: 15,
    sterren: [[8, 30], [24, 26], [38, 32], [50, 42], [54, 64], [78, 68], [82, 46]],
    lijnen: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { id: 'zwaan', naam: 'De Zwaan', prijs: 20,
    sterren: [[50, 8], [50, 34], [50, 60], [50, 90], [18, 42], [82, 28]], lijnen: [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]] },
  { id: 'kleinebeer', naam: 'De Kleine Beer', prijs: 25,
    sterren: [[12, 18], [28, 26], [40, 38], [52, 54], [74, 50], [82, 70], [60, 76]],
    lijnen: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { id: 'orion', naam: 'Orion', prijs: 30,
    sterren: [[50, 8], [28, 24], [72, 26], [42, 52], [50, 50], [58, 48], [30, 84], [70, 82]],
    lijnen: [[0, 1], [0, 2], [1, 3], [2, 5], [3, 4], [4, 5], [3, 6], [5, 7]] },
  { id: 'leeuw', naam: 'De Leeuw', prijs: 35,
    sterren: [[22, 30], [30, 18], [44, 16], [50, 30], [40, 44], [46, 60], [76, 54], [88, 68]],
    lijnen: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [5, 7]] },
  { id: 'schorpioen', naam: 'De Schorpioen', prijs: 40,
    sterren: [[82, 12], [88, 28], [76, 38], [64, 44], [54, 56], [48, 70], [40, 82], [26, 86], [14, 78], [18, 66]],
    lijnen: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]] }
];

// Aliendieren voor de klassendierentuin. De tekening wordt in de browser gemaakt uit deze kenmerken.
const DIEREN = [
  ['Blubbo de Ruimteslak', '#22c55e', 'slak'], ['Zoemi de Sterrenbij', '#facc15', 'vlieg'],
  ['Kraak de Maankrab', '#f97316', 'krab'], ['Flopsie de Nevelkat', '#a855f7', 'kat'],
  ['Gorrel de Kraterkikker', '#84cc16', 'kikker'], ['Plons de Plasmavis', '#06b6d4', 'vis'],
  ['Wiebel de Wolkenwurm', '#ec4899', 'worm'], ['Toeter de Tentakeltapir', '#6366f1', 'octo'],
  ['Spikkel de Spiraalspin', '#ef4444', 'spin'], ['Fluf de Pluisplaneet', '#f472b6', 'pluis'],
  ['Brom de Brokkenbeer', '#b45309', 'beer'], ['Zwiep de Zwevende Kwal', '#38bdf8', 'kwal'],
  ['Knoet de Kometenkever', '#10b981', 'kever'], ['Glim de Glimuil', '#eab308', 'uil'],
  ['Hoppel de Hyperhaas', '#e2e8f0', 'haas'], ['Slurp de Sterrenslurf', '#8b5cf6', 'olifant'],
  ['Pruttel de Pruttelpad', '#65a30d', 'kikker'], ['Flits de Lichtvis', '#0ea5e9', 'vis'],
  ['Gonzo de Gaswolk', '#c084fc', 'pluis'], ['Rakker de Ringslang', '#f59e0b', 'worm'],
  ['Kriebel de Kraterkever', '#dc2626', 'kever'], ['Nova de Nachtvlinder', '#f0abfc', 'vlieg'],
  ['Bonk de Botsbeer', '#78716c', 'beer'], ['Zappa de Zonneoctopus', '#fb923c', 'octo']
].map(([naam, kleur, soort], id) => ({ id, naam, kleur, soort }));

// Wat de blob krijgt als een planeet gehaald is (index = aantal gehaalde planeten).
const ACCESSOIRES = [
  { id: 'geen', naam: 'Niets', planeet: -1 },
  { id: 'antenne', naam: 'Antennes', planeet: 0 },
  { id: 'helm', naam: 'Ruimtehelm', planeet: 1 },
  { id: 'bril', naam: 'Zonnebril', planeet: 2 },
  { id: 'koptelefoon', naam: 'Koptelefoon', planeet: 3 },
  { id: 'cape', naam: 'Superheld-cape', planeet: 4 },
  { id: 'ring', naam: 'Saturnusring', planeet: 5 },
  { id: 'jetpack', naam: 'Jetpack', planeet: 6 },
  { id: 'ster', naam: 'Sterrenstaf', planeet: 7 },
  { id: 'kroon', naam: 'Gouden kroon', planeet: 8 }
];

module.exports = { MUNTEN, TOETS_AANTAL, MAX_SEC_PER_VRAAG, STERRENBEELDEN, DIEREN, ACCESSOIRES };
