// Database van SpaceVerbs. Twee mogelijkheden:
// - Lokaal (standaard): een SQLite-bestand in de map data/, ingebouwd in Node.js.
// - Online: een Turso-database (gratis), als TURSO_DATABASE_URL en TURSO_AUTH_TOKEN zijn ingesteld.
//   Dat is nodig bij hosting zonder blijvende schijf, zoals de gratis versie van Render.
// Alle functies zijn async, zodat de rest van de code voor beide hetzelfde werkt.
const path = require('path');
const fs = require('fs');

const SCHEMA = `

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
`;

function lokaal() {
  const { DatabaseSync } = require('node:sqlite');
  const map = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  fs.mkdirSync(map, { recursive: true });
  const sql = new DatabaseSync(process.env.DB_PATH || path.join(map, 'spaceverbs.db'));
  sql.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return {
    soort: 'lokaal',
    get: async (q, ...args) => sql.prepare(q).get(...args),
    all: async (q, ...args) => sql.prepare(q).all(...args),
    run: async (q, ...args) => {
      const r = sql.prepare(q).run(...args);
      return { lastInsertRowid: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    exec: async q => sql.exec(q),
    // meerdere schrijfopdrachten in één keer: alles of niets
    batch: async opdrachten => {
      sql.exec('BEGIN');
      try { for (const [q, ...args] of opdrachten) sql.prepare(q).run(...args); sql.exec('COMMIT'); }
      catch (e) { sql.exec('ROLLBACK'); throw e; }
    }
  };
}

function turso() {
  const { createClient } = require('@libsql/client');
  const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  // libsql geeft rijen terug als speciale objecten; maak er gewone objecten van zoals bij node:sqlite
  const rijen = r => r.rows.map(rij => Object.fromEntries(r.columns.map((k, i) => [k, rij[i]])));
  const uitvoer = (q, args) => client.execute({ sql: q, args });
  return {
    soort: 'turso',
    get: async (q, ...args) => rijen(await uitvoer(q, args))[0],
    all: async (q, ...args) => rijen(await uitvoer(q, args)),
    run: async (q, ...args) => {
      const r = await uitvoer(q, args);
      return { lastInsertRowid: Number(r.lastInsertRowid ?? 0), changes: r.rowsAffected };
    },
    exec: async q => client.executeMultiple(q),
    batch: async opdrachten => { await client.batch(opdrachten.map(([q, ...args]) => ({ sql: q, args })), 'write'); }
  };
}

const db = process.env.TURSO_DATABASE_URL ? turso() : lokaal();

// Tabellen aanmaken en oudere databases bijwerken met nieuwe kolommen
db.klaar = (async () => {
  await db.exec(SCHEMA);
  const kolommen = async tabel => (await db.all(`PRAGMA table_info(${tabel})`)).map(k => k.name);
  // herhaling = nummer van de planeet waarna de herhalingsster nog gehaald moet worden (NULL = geen)
  if (!(await kolommen('leerlingen')).includes('herhaling')) await db.exec('ALTER TABLE leerlingen ADD COLUMN herhaling INTEGER');
  if (!(await kolommen('toetsen')).includes('soort')) await db.exec("ALTER TABLE toetsen ADD COLUMN soort TEXT NOT NULL DEFAULT 'planeet'");
  // Beheerder: alleen die mag collega's uitnodigen. De eerste leerkracht wordt automatisch beheerder.
  if (!(await kolommen('leerkrachten')).includes('beheerder')) await db.exec('ALTER TABLE leerkrachten ADD COLUMN beheerder INTEGER NOT NULL DEFAULT 0');
  if (!(await db.get('SELECT 1 AS x FROM leerkrachten WHERE beheerder = 1')))
    await db.run('UPDATE leerkrachten SET beheerder = 1 WHERE id = (SELECT MIN(id) FROM leerkrachten)');
  // les_tot: tot wanneer de oefenles van de groep loopt. Alleen dan groeit de dierentuin.
  if (!(await kolommen('groepen')).includes('les_tot')) await db.exec('ALTER TABLE groepen ADD COLUMN les_tot TEXT');
  await db.exec(`CREATE TABLE IF NOT EXISTS uitnodigingen (
    code TEXT PRIMARY KEY, gemaakt_door INTEGER NOT NULL REFERENCES leerkrachten(id) ON DELETE CASCADE,
    naam TEXT, verloopt TEXT NOT NULL, gebruikt_door INTEGER, gemaakt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
})();

module.exports = db;
