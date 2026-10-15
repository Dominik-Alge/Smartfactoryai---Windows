SMARTFACTORYAI – WINDOWS SERVER DEPLOYMENT

PROJEKT
Shopfloor Management Panel (Shopfloor-Maske)

Die Anwendung dient zur digitalen Erfassung von Maschinenstati, Kriterienübersichten (Ampelsystem), Schichtübergaben sowie zur Verwaltung von Shopfloor- und Verbesserungsmassnahmen.

═══════════════════════════════════════════════════
1. SYSTEMAUFBAU
═══════════════════════════════════════════════════

Die Anwendung ist hierarchisch aufgebaut:

GRUPPE
→ Produktionsübersicht einer gesamten Gruppe

INSEL
→ Zusammenfassung mehrerer Arbeitsplätze

MASCHINE
→ Detailansicht eines einzelnen Arbeitsplatzes

═══════════════════════════════════════════════════
2. TECHNISCHE ARCHITEKTUR
═══════════════════════════════════════════════════

Frontend:
- React
- Vite (Build-System)

Backend:
- Node.js
- Express

Datenspeicherung:
- JSON-Datei (shopfloor_storage.json)

Betriebsmodell:
- On-Premise auf Windows Server
- Kein Docker erforderlich

Hinweis:
Das React-Frontend wird einmalig erstellt (Build) und anschliessend direkt durch den Express-Server bereitgestellt. Im Produktivbetrieb läuft nur noch das Backend.

═══════════════════════════════════════════════════
3. PROJEKTSTRUKTUR
═══════════════════════════════════════════════════

Smartfactoryai
│
├── starten.bat
├── README.md
│
├── backend
│   ├── server.js
│   ├── package.json
│   └── shopfloor_data
│       └── shopfloor_storage.json
│
└── frontend
    ├── dist
    ├── src
    ├── package.json
    └── vite.config.js

Beschreibung:

starten.bat
→ Startet die Anwendung unter Windows

backend/server.js
→ Node.js-Server für API und Frontend-Auslieferung

backend/shopfloor_data
→ Persistente Datenspeicherung und Backup-Ordner

frontend/dist
→ Kompilierte Produktionsversion des Frontends

═══════════════════════════════════════════════════
4. INSTALLATION AUF DEM WINDOWS SERVER
═══════════════════════════════════════════════════

Voraussetzungen:

- Windows Server
- Node.js LTS Version
- Administratorrechte

Schritt 1: Projekt bereitstellen

Projekt nach folgendem Pfad kopieren:

C:\Smartfactoryai

Schritt 2: Backend-Abhängigkeiten installieren

cd C:\Smartfactoryai\backend
npm install

Schritt 3: Frontend-Abhängigkeiten installieren und Build erstellen

cd C:\Smartfactoryai\frontend
npm install
npm run build

Hinweis:
Der Build erzeugt den Ordner:

frontend\dist

Dieser wird später vom Backend automatisch ausgeliefert.

Schritt 4: Anwendung starten

cd C:\Smartfactoryai\backend
node server.js

Alternativ:

Doppelklick auf starten.bat

═══════════════════════════════════════════════════
5. ZUGRIFF AUF DIE ANWENDUNG
═══════════════════════════════════════════════════

Nach erfolgreichem Start ist die Anwendung erreichbar unter:

http://<SERVER-IP>:5000

Firewall-Anforderung:

Der TCP-Port 5000 muss für eingehende Verbindungen freigegeben sein.

═══════════════════════════════════════════════════
6. BETRIEB ALS WINDOWS-DIENST
═══════════════════════════════════════════════════

Für einen produktiven Betrieb kann die Anwendung als Windows-Dienst eingerichtet werden, sodass sie nach einem Serverneustart automatisch gestartet wird.

Die konkrete Umsetzung (Windows-Dienst, Task Scheduler oder alternative Betriebsform) erfolgt in Abstimmung mit der IT und entsprechend den geltenden Betriebsstandards.

Produktiver Startbefehl:

cd C:\Smartfactoryai\backend
node server.js

═══════════════════════════════════════════════════
7. DATENSICHERUNG
═══════════════════════════════════════════════════

Alle Betriebsdaten werden in folgendem Verzeichnis gespeichert:

C:\Smartfactoryai\backend\shopfloor_data

Datei:

shopfloor_storage.json

Empfehlung:

Das Verzeichnis

C:\Smartfactoryai\backend\shopfloor_data

soll in die bestehende Backup-Lösung (z.B. Veeam) aufgenommen werden.

═══════════════════════════════════════════════════
8. WARTUNG
═══════════════════════════════════════════════════

Frontend-Änderungen:

cd C:\Smartfactoryai\frontend
npm run build

Backend-Neustart:

cd C:\Smartfactoryai\backend
node server.js

Im Normalbetrieb sind keine manuellen Eingriffe an der Datenstruktur erforderlich.

═══════════════════════════════════════════════════
STATUS
═══════════════════════════════════════════════════

Die Anwendung wurde erfolgreich auf einem Windows-System ohne Docker getestet und validiert.
