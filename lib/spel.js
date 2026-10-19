// Spelonderdelen: munten, sterrenkaarten (spaarkaart), aliendierentuin en blob-accessoires.

const MUNTEN = { open: 2, mk: 1, herhaling: 1, reeks: 5, toets: 50, herhalingsster: 30 };
const TOETS_AANTAL = 10;
// Herhalingsster tussen twee planeten: gemengde vragen uit alle planeten tot nu toe.
const HERHALING_AANTAL = 10;
const HERHALING_NODIG = 9; // zoveel goed om door te mogen
const MAX_SEC_PER_VRAAG = 60; // langer telt niet mee voor de dierentuin

// Sterrenbeelden als spaarkaarten. Coördinaten in een vlak van 100 x 100.
// De kaarten gaan één voor één open; de prijs per ster loopt langzaam op.
const B = (id, naam, sterren, lijnen) => ({ id, naam, sterren, lijnen });
const keten = n => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
const STERRENBEELDEN = [
  B('cassiopeia', 'Cassiopeia', [[10, 30], [28, 62], [48, 40], [68, 64], [88, 28]], keten(5)),
  B('ram', 'De Ram', [[14, 54], [36, 42], [58, 36], [80, 40], [88, 58]], keten(5)),
  B('lier', 'De Lier', [[50, 12], [40, 34], [62, 36], [34, 70], [58, 74]], [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]]),
  B('pijl', 'De Pijl', [[10, 72], [30, 63], [50, 54], [76, 42], [66, 28], [84, 60]], [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]]),
  B('dolfijn', 'De Dolfijn', [[28, 30], [46, 20], [56, 38], [38, 48], [62, 62], [74, 82]], [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5]]),
  B('kreeft', 'De Kreeft', [[50, 50], [50, 26], [44, 8], [26, 78], [74, 76], [52, 64]], [[1, 0], [1, 2], [0, 5], [5, 3], [5, 4]]),
  B('grotebeer', 'De Grote Beer', [[8, 30], [24, 26], [38, 32], [50, 42], [54, 64], [78, 68], [82, 46]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]),
  B('zwaan', 'De Zwaan', [[50, 8], [50, 34], [50, 60], [50, 90], [18, 42], [82, 28]], [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]]),
  B('noorderkroon', 'De Noorderkroon', [[12, 40], [22, 58], [38, 70], [56, 72], [72, 64], [84, 50], [88, 34]], keten(7)),
  B('kleinebeer', 'De Kleine Beer', [[12, 18], [28, 26], [40, 38], [52, 54], [74, 50], [82, 70], [60, 76]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]),
  B('arend', 'De Arend', [[50, 16], [52, 38], [50, 60], [30, 42], [72, 34], [12, 52], [88, 26], [48, 84]],
    [[0, 1], [1, 2], [1, 3], [1, 4], [3, 5], [4, 6], [2, 7]]),
  B('orion', 'Orion', [[50, 8], [28, 24], [72, 26], [42, 52], [50, 50], [58, 48], [30, 84], [70, 82]],
    [[0, 1], [0, 2], [1, 3], [2, 5], [3, 4], [4, 5], [3, 6], [5, 7]]),
  B('leeuw', 'De Leeuw', [[22, 30], [30, 18], [44, 16], [50, 30], [40, 44], [46, 60], [76, 54], [88, 68]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [5, 7]]),
  B('stier', 'De Stier', [[50, 60], [40, 48], [30, 36], [60, 48], [70, 36], [16, 14], [84, 18], [50, 84], [56, 72]],
    [[0, 1], [1, 2], [0, 3], [3, 4], [2, 5], [4, 6], [0, 8], [8, 7]]),
  B('andromeda', 'Andromeda', [[10, 62], [26, 56], [42, 50], [58, 44], [74, 36], [90, 26], [46, 30], [54, 14], [36, 70]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [2, 8]]),
  B('tweelingen', 'De Tweelingen', [[26, 10], [30, 34], [34, 60], [28, 88], [62, 8], [64, 34], [66, 60], [72, 86], [14, 52], [84, 56]],
    [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [1, 5], [2, 8], [6, 9]]),
  B('pegasus', 'Pegasus', [[30, 30], [66, 30], [66, 66], [30, 66], [82, 18], [94, 8], [16, 78], [6, 92], [18, 52], [6, 42]],
    [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5], [3, 6], [6, 7], [3, 8], [8, 9]]),
  B('perseus', 'Perseus', [[50, 8], [48, 26], [44, 44], [36, 58], [26, 72], [16, 88], [62, 54], [74, 68], [30, 30], [64, 34]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [1, 8], [1, 9]]),
  B('grotehond', 'De Grote Hond', [[30, 30], [22, 14], [42, 20], [44, 40], [50, 56], [40, 70], [30, 88], [64, 66], [78, 84], [60, 44]],
    [[1, 0], [0, 2], [0, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [3, 9]]),
  B('schorpioen', 'De Schorpioen', [[82, 12], [88, 28], [76, 38], [64, 44], [54, 56], [48, 70], [40, 82], [26, 86], [14, 78], [18, 66]],
    [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]]),
  B('boogschutter', 'De Boogschutter', [[18, 60], [34, 48], [50, 50], [64, 40], [80, 48], [72, 64], [50, 70], [32, 72], [90, 64], [62, 22], [40, 30]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [2, 6], [4, 8], [3, 9], [1, 10], [10, 3]]),
  B('maagd', 'De Maagd', [[50, 16], [46, 34], [40, 52], [30, 68], [16, 84], [62, 48], [78, 40], [90, 28], [56, 66], [64, 84], [28, 36]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 7], [5, 8], [8, 9], [1, 10]]),
  B('draak', 'De Draak', [[80, 10], [90, 22], [80, 30], [70, 20], [60, 34], [54, 50], [64, 62], [50, 74], [34, 70], [24, 56], [16, 40], [26, 22]],
    [...keten(12), [3, 0]]),
  B('hercules', 'Hercules', [[40, 40], [60, 38], [62, 58], [42, 60], [30, 22], [22, 8], [70, 20], [80, 8], [30, 76], [20, 92], [72, 76], [84, 90]],
    [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 5], [1, 6], [6, 7], [3, 8], [8, 9], [2, 10], [10, 11]])
].map((b, k) => ({ ...b, prijs: 5 + Math.floor(k / 2) }));

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

module.exports = { MUNTEN, TOETS_AANTAL, HERHALING_AANTAL, HERHALING_NODIG, MAX_SEC_PER_VRAAG, STERRENBEELDEN, DIEREN, ACCESSOIRES };
