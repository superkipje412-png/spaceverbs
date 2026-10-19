# 🚀 SpaceVerbs

Werkwoordspelling oefenen voor de basisschool, tussen de sterren.

Leerlingen reizen met hun eigen **blob** van de Aarde naar Pluto. Elke planeet is één leerdoel met 100 vragen en een toets van 10 vragen. Ondertussen verdienen ze **munten** voor sterren op hun **spaarkaart**, en spaart de hele klas samen voor een **aliendierentuin**.

Welk leerdoel bij welke planeet hoort, staat in [LEERDOELEN.md](LEERDOELEN.md).

## Wat zit erin?

**Voor leerlingen**
- Een eigen inlog (gebruikersnaam + makkelijk wachtwoord). De voortgang wordt bewaard, dus ze gaan de volgende keer verder waar ze gebleven waren.
- Een eigen **blob** die ze zelf maken (kleur, ogen, naam). Bij elke gehaalde planeet krijgt de blob een nieuw spulletje, zoals antennes, een ruimtehelm, een jetpack of een gouden kroon. De blob kan alle spulletjes tegelijk dragen.
- **Ruimtekaart** met 9 planeten en 8 herhalingssterren ertussen. Een planeet gaat pas open als de vorige planeet én de herhalingsster daarna gehaald zijn.
- **Oefenen** in rondes van 10 vragen: 70% zelf invullen in de zin, 30% meerkeuze. Na elke vraag volgt direct uitleg met de regel. Foute vragen komen terug tot ze goed zijn.
- **Toets**: zijn alle 100 vragen goed gemaakt, dan volgt een toets van 10 vragen. Alle 10 goed? Dan is de planeet gehaald.
- **Herhalingsster**: na elke planeet (behalve Pluto) volgt een herhalingsster met 10 gemengde vragen van alle planeten tot nu toe. Minstens 9 goed? Dan gaat de volgende planeet open. Leerlingen kunnen eerst oefenen met gemengde vragen. Het aantal vragen en de grens stel je in met `HERHALING_AANTAL` en `HERHALING_NODIG` in `lib/spel.js`.
- **Munten**: 2 voor een goed ingevulde vraag, 1 voor meerkeuze of herhaling, 5 bonus per 5 goed op rij, 50 voor een gehaalde toets en 30 voor een herhalingsster.
- **Sterrenwinkel**: met munten kopen leerlingen sterren voor 24 sterrenbeelden (spaarkaarten, samen 198 sterren, 5 tot 16 munten per ster). Is een kaart vol, dan gaat het sterrenbeeld stralen en opent de volgende kaart.
- **Aliendierentuin (hele klas)**: elke 30 minuten dat de klas samen oefent **tijdens een oefenles**, komt er een nieuw aliendier bij (24 in totaal). Thuis oefenen kan altijd, maar dat telt niet mee voor de dierentuin. Per vraag tellen maximaal 60 seconden mee, zodat stilzitten niet telt.

**Voor de leerkracht**
- Een eigen account (e-mail + wachtwoord). De **eerste** leerkracht die een account maakt, wordt **beheerder**. Daarna kan een nieuwe leerkracht alleen een account maken met een **uitnodigingscode** van de beheerder (eenmalig te gebruiken, 14 dagen geldig). Zo kunnen leerlingen geen leerkracht-account aanmaken.
- De beheerder ziet onder **Collega's** alle leerkrachten. Daar kan de beheerder codes maken en intrekken, collega's verwijderen en ook andere collega's beheerder maken.
- **Oefenles** per groep: start een oefenles van 30, 45, 60 of 90 minuten (verlengen kan). Alleen tijdens de oefenles groeit de aliendierentuin. Na de ingestelde tijd stopt de les vanzelf.
- Groepen maken, hernoemen en verwijderen.
- Leerlingen toevoegen (meerdere tegelijk: één naam per regel), verwijderen, een nieuw wachtwoord geven, of naar een andere groep, planeet of herhalingsster zetten.
- **Inlogkaartjes** om te printen en uit te knippen.
- Per groep een overzicht van planeet, voortgang, percentage goed, meest gemaakte soort fout, oefentijd en laatst actief. Daarnaast de foutsoorten van de hele groep en de moeilijkste vragen.
- Per leerling: voortgang per leerdoel, soorten fouten, toetsuitslagen en de laatste 40 fouten (wat de leerling schreef en wat het had moeten zijn).
- Per groep stel je in hoeveel minuten de klas samen moet oefenen voor een nieuw aliendier (standaard 30).

De fouten worden automatisch ingedeeld in soorten: *t vergeten*, *t te veel*, *d en t verwisseld*, *te/de verwisseld ('t kofschip)*, *enkele/dubbele letter*, *ge- vergeten of te veel*, *sterk werkwoord zwak vervoegd*, *verkeerde vorm of tijd* en *enkelvoud/meervoud verwisseld*.

## Starten

Je hebt alleen **Node.js 22.13 of nieuwer** nodig. Er zijn geen extra pakketten nodig.

```bash
npm start
```

Open daarna http://localhost:3000 en maak eerst een leerkracht-account aan via het tabblad *Leerkracht*. Dat eerste account wordt de beheerder.

Instellingen via omgevingsvariabelen:

| Variabele | Standaard | Betekenis |
|---|---|---|
| `PORT` | `3000` | Poort van de webserver |
| `DATA_DIR` | `./data` | Map voor de database |
| `DB_PATH` | `./data/spaceverbs.db` | Exacte plek van de database |

## Online zetten

SpaceVerbs is één Node.js-server met een SQLite-database in één bestand. Het draait op elke host die Node.js 22 ondersteunt, zoals Render, Railway, Fly.io, een VPS of een server van school. Let hierbij op twee dingen:

1. Zorg dat de map met de database (`DATA_DIR`) op een **blijvende schijf** staat, anders is de voortgang weg na een herstart.
2. Gebruik **https** (bij de meeste hosts gaat dat automatisch).

## Vragen aanpassen

Alle 900 vragen staan in `data/vragen.json`. Ze worden gemaakt door `scripts/maak-vragen.js`, op basis van een lijst van ruim 90 werkwoorden met al hun vormen. Je kunt op twee manieren vragen aanpassen:

- Pas `data/vragen.json` direct aan en herstart de server, **of**
- pas de werkwoorden en zinnen aan in `scripts/maak-vragen.js` en draai `npm run vragen`.

Let op: de vraag-id's (`p1-001` enzovoort) koppelen de voortgang van leerlingen aan de vragen. Maak je de vragenbank opnieuw terwijl er al leerlingen oefenen, dan kan hun voortgang per planeet veranderen.

## Privacy

- Wachtwoorden van leerkrachten worden versleuteld opgeslagen (scrypt).
- Wachtwoorden van leerlingen worden **leesbaar** opgeslagen. Zo kan de leerkracht ze altijd terugzien en inlogkaartjes printen. Het zijn simpele oefenwachtwoorden zoals `raket42`.
- Van leerlingen wordt alleen de naam bewaard die de leerkracht invult (een voornaam is genoeg), plus de oefengegevens.

## Bestanden

```
server.js              webserver + API
lib/planeten.js        de 9 planeten en hun leerdoel en uitleg
lib/spel.js            munten, sterrenbeelden, aliendieren, blob-spulletjes
lib/fouten.js          indeling van fouten in soorten
lib/db.js              database (SQLite, ingebouwd in Node.js)
scripts/maak-vragen.js maakt de vragenbank
data/vragen.json       de 900 vragen
public/                de website (HTML, CSS, JavaScript, alle tekeningen als SVG)
```
