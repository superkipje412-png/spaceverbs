const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const map = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(map, { recursive: true });
const db = new DatabaseSync(process.env.DB_PATH || path.join(map, 'spaceverbs.db'));

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS leerkrachten (
  id INTEGER PRIMARY KEY, naam TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  wachtwoord TEXT NOT NULL, gemaakt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS groepen (
  id INTEGER PRIMARY KEY, leerkracht_id INTEGER NOT NULL REFERENCES leerkrachten(id) ON DELETE CASCADE,
  naam TEXT NOT NULL, minuten_per_dier INTEGER NOT NULL DEFAULT 30,
  dierentuin_sec INTEGER NOT NULL DEFAULT 0, gemaakt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS leerlingen (
  id INTEGER PRIMARY KEY, groep_id INTEGER NOT NULL REFERENCES groepen(id) ON DELETE CASCADE,
  naam TEXT NOT NULL, gebruikersnaam TEXT NOT NULL UNIQUE, wachtwoord TEXT NOT NULL,
  planeet INTEGER NOT NULL DEFAULT 0, munten INTEGER NOT NULL DEFAULT 0, reeks INTEGER NOT NULL DEFAULT 0,
  oefen_sec INTEGER NOT NULL DEFAULT 0, blob TEXT, laatst_actief TEXT, gemaakt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS voortgang (
  leerling_id INTEGER NOT NULL REFERENCES leerlingen(id) ON DELETE CASCADE,
  vraag_id TEXT NOT NULL, planeet INTEGER NOT NULL, goed INTEGER NOT NULL DEFAULT 0, fout INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (leerling_id, vraag_id)
);
CREATE TABLE IF NOT EXISTS pogingen (
  id INTEGER PRIMARY KEY, leerling_id INTEGER NOT NULL REFERENCES leerlingen(id) ON DELETE CASCADE,
  vraag_id TEXT NOT NULL, planeet INTEGER NOT NULL, antwoord TEXT, goed INTEGER NOT NULL,
  categorie TEXT, modus TEXT NOT NULL, tijd TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS pogingen_ll ON pogingen(leerling_id, tijd);
CREATE TABLE IF NOT EXISTS toetsen (
  id INTEGER PRIMARY KEY, leerling_id INTEGER NOT NULL REFERENCES leerlingen(id) ON DELETE CASCADE,
  planeet INTEGER NOT NULL, vragen TEXT NOT NULL, antwoorden TEXT NOT NULL DEFAULT '[]',
  score INTEGER, gehaald INTEGER, gestart TEXT DEFAULT CURRENT_TIMESTAMP, klaar TEXT
);
CREATE TABLE IF NOT EXISTS sterren (
  leerling_id INTEGER NOT NULL REFERENCES leerlingen(id) ON DELETE CASCADE,
  beeld TEXT NOT NULL, nr INTEGER NOT NULL, gekocht TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (leerling_id, beeld, nr)
);
CREATE TABLE IF NOT EXISTS sessies (
  token TEXT PRIMARY KEY, soort TEXT NOT NULL, gebruiker_id INTEGER NOT NULL, gemaakt TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
