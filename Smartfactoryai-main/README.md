===============================================================================
               SMARTFACTORYAI — WINDOWS SERVER DEPLOYMENT
===============================================================================

PROJEKT: Shopfloor Management Panel (Shopfloor-Maske)
-------------------------------------------------------------------------------
Dieses Projekt ist eine digitale Shopfloor-Maske zur Online-Erfassung von 
Maschinenstati, Kriterienübersichten (Ampelsystem) und zur Bündelung von 
Notizen für Gruppentreffen und Schichtübergaben.


[1] ARCHITEKTUR & STRUKTUR (LAYER-SYSTEM)
===============================================================================
Das System ist so aufgebaut, dass Informationen über verschiedene Ebenen 
gebündelt werden können:

* GRUPPE:           Top-Level Produktionsübersicht
* INSEL:            Zusammenfassung mehrerer Arbeitsplätze
* MASCHINE:         Detaillierte Matrixansicht des Arbeitsplatzes


[2] TECH-STACK
===============================================================================
* Frontend:         React
* Backend:          Node.js / Express (stellt API & Frontend kombiniert bereit)
* Infrastruktur:    Nativer Windows-Server-Betrieb (On-Premise)
* Datenbank:        JSON-File Persistence (shopfloor_storage.json)


[3] PROJEKTSTRUKTUR
===============================================================================
Smartfactoryai/
│
├── starten.bat              <-- Startet das System per Doppelklick unter Windows
├── README.md                <-- Diese Dokumentation
│
├── backend/
│   ├── server.js            <-- Node.js Express Server (API & Dateiausgabe)
│   ├── package.json         <-- Backend-Abhängigkeiten
│   └── shopfloor_data/      <-- Automatisch erstellter Ordner (IT-Backup)
│       └── shopfloor_storage.json
│
└── frontend/
    ├── dist/ oder build/    <-- Kompilierte Produktionsdateien des Frontends
    ├── src/                 <-- Quellcode des React-Frontends
    └── package.json         <-- Frontend-Abhängigkeiten


[4] INSTALLATION AUF DEM WINDOWS-FIRMENSERVER
===============================================================================

VORAUSSETZUNGEN:
-------------------------------------------------------------------------------
1. Node.js (Empfohlen: Aktuelle LTS-Version) muss auf dem Server installiert sein.
2. Eine Eingabeaufforderung (CMD) oder PowerShell mit Administratorrechten.


SCHRITT-FÜR-SCHRITT-ANLEITUNG:
-------------------------------------------------------------------------------
Schritt 1: Paket entpacken
  Kopiere die ZIP-Datei auf den Server und entpacke sie in ein beliebiges 
  Verzeichnis (Beispiel: C:\Smartfactoryai).

Schritt 2: Frontend bauen (Kompilieren für Produktion)
  Öffne die Windows-Eingabeaufforderung (CMD), wechsle in den Frontend-Ordner 
  und führen Sie folgende Befehle aus:

  cd C:\Smartfactoryai\frontend
  npm install
  npm run build

Schritt 3: Anwendung starten
  Wechsle zurück in das Hauptverzeichnis und führe die Start-Datei aus:

  cd C:\Smartfactoryai
  starten.bat

Schritt 4: Erreichbarkeit prüfen
  Die Anwendung ist nun im Firmennetzwerk unter der IP-Adresse des Windows-
  Servers erreichbar: 
  --> URL: http://<SERVER-IP>:5000

  WICHTIGER HINWEIS FÜR DIE IT:
  Der Port 5000 muss in der Windows-Firewall für eingehende Verbindungen 
  freigegeben sein!


[5] PRODUKTIONS-BETRIEB: EINRICHTUNG ALS WINDOWS-DIENST
===============================================================================
Damit die Anwendung permanent im Hintergrund läuft und nach einem Server-Neustart 
automatisch mit hochfährt, wird die Registrierung als Windows-Service empfohlen.

1. Öffne die Windows-Eingabeaufforderung (CMD) als Administrator.
2. Installiere das leichtgewichtige Hilfswerkzeug global mit dem Befehl:

   npm install -g qckwinsvc

3. Starte den Einrichtungs-Assistenten:

   qckwinsvc

4. Beantworte die Fragen des Assistenten wie folgt:
   * Service Name:        SmartfactoryAI_Shopfloor
   * Service Description: Shopfloor Management Panel Backend & Frontend
   * Node Script Path:    C:\Smartfactoryai\backend\server.js

Der Dienst ist danach im offiziellen Windows-Dienstemanager (services.msc) 
aktiv und startet sich bei jedem Server-Boot vollautomatisch.


[6] DATENSICHERHEIT & BACKUP
===============================================================================
Das Backend erstellt beim allerersten Start automatisch einen Unterordner namens 
".\backend\shopfloor_data\", in welchem die Datei "shopfloor_storage.json" liegt.

* PERMANENTE SPEICHERUNG: 
  In dieser JSON-Datei liegt die gesamte Datenbanklogik (Maschinenstati, 
  KVP-Tickets, Notizen und Konfigurationen). Sie überlebt jeden Neustart.

* BACKUP-STRATEGIE FÜR DIE IT:
  Für die tägliche Datensicherung muss die IT lediglich folgenden Ordner 
  in die Backup-Routine aufnehmen:
  --> PFAD: C:\Smartfactoryai\backend\shopfloor_data\
===============================================================================
