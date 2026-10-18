#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js staat nog niet op deze computer."
  echo "Download en installeer het via https://nodejs.org en dubbelklik daarna opnieuw op dit bestand."
  open https://nodejs.org
  read -p "Druk op Enter om te sluiten."
  exit 1
fi
echo "SpaceVerbs start... Laat dit venster open zolang je SpaceVerbs gebruikt."
(sleep 2; open http://localhost:3000) &
node --disable-warning=ExperimentalWarning server.js
