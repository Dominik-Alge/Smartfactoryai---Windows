# SMARTFACTORYAI — WINDOWS SERVER DEPLOYMENT
## PROJEKT: Shopfloor Management Panel (Shopfloor-Maske)

Dieses Projekt ist eine digitale Shopfloor-Maske zur Online-Erfassung von Maschinenstati, Kriterienübersichten (Ampelsystem) und zur Bündelung von Notizen für Gruppentreffen und Schichtübergaben.

---

### [1] ARCHITEKTUR & STRUKTUR (LAYER-SYSTEM)
Das System ist so aufgebaut, dass Informationen über verschiedene Ebenen gebündelt werden können:
- **GRUPPE:** Top-Level Produktionsübersicht
- **INSEL:** Zusammenfassung mehrerer Arbeitsplätze
- **MASCHINE:** Detaillierte Matrixansicht des Arbeitsplatzes

### [2] TECH-STACK
- **Frontend:** React (Vite-Kompiliert)
- **Backend:** Node.js / Express (stellt API & Frontend kombiniert bereit)
- **Infrastruktur:** Nativer Windows-Server-Betrieb (On-Premise) – **Kein Docker erforderlich!**
- **Datenbank:** JSON-File Persistence (`shopfloor_storage.json`)

### [3] PROJEKTSTRUKTUR
```text
Smartfactoryai/
├── starten.bat             <-- Startet das System per Doppelklick unter Windows
├── README.md               <-- Diese Dokumentation
│
├── backend/
│   ├── server.js           <-- Node.js Express Server (API & statische Dateiausgabe)
│   ├── package.json        <-- Backend-Abhängigkeiten
│   └── shopfloor_data/     <-- AUTOMATISCH ERSTELLT (Hier liegt das IT-Backup)
│       └── shopfloor_storage.json
│
└── frontend/
    ├── dist/               <-- Produktionsdateien des Frontends (erzeugt via npm run build)
    ├── src/                <-- Quellcode des React-Frontends
    └── package.json        <-- Frontend-Abhängigkeiten
```

---

### [4] INSTALLATION AUF DEM WINDOWS-FIRMENSERVER

#### VORAUSSETZUNGEN:
1. **Node.js (LTS-Version):** Muss systemweit auf dem Windows Server installiert sein.
2. Eine Eingabeaufforderung (CMD) oder PowerShell mit Administratorrechten.

#### SCHRITT-FÜR-SCHRITT-ANLEITUNG:

**Schritt 1: Paket entpacken**
Kopiere das Projektverzeichnis auf den Server und lege es im Hauptverzeichnis ab: `C:\Smartfactoryai`.

**Schritt 2: Frontend einmalig für Produktion bauen**
Öffne die Windows-Eingabeaufforderung (CMD), wechsle in den Frontend-Ordner und baue die Oberflächen-Dateien:
```cmd
cd C:\Smartfactoryai\frontend
npm install
npm run build
```
*(Hinweis: Erzeugt den für das Backend erforderlichen `frontend/dist`-Ordner).*

**Schritt 3: Anwendung starten**
Navigiere zu `C:\Smartfactoryai` und starte das System per Doppelklick auf die **`starten.bat`**.

**Schritt 4: Erreichbarkeit prüfen**
Die Anwendung ist nun im Firmennetzwerk unter der Port-Freigabe des Windows-Servers erreichbar:
👉 **URL:** `http://<SERVER-IP>:5000`

*WICHTIGER HINWEIS FÜR DIE IT:* Der **Port 5000** muss in der Windows-Firewall für eingehende Verbindungen (Inbound Rule) freigegeben sein!

---

### [5] PRODUKTIONS-BETRIEB: EINRICHTUNG ALS WINDOWS-DIENST
Damit die Anwendung permanent im Hintergrund läuft und nach einem Server-Neustart automatisch mit hochfährt, wird die App als offizieller Windows-Service registriert.

1. Öffne die Windows-Eingabeaufforderung (CMD) als **Administrator**.
2. Installiere das Hilfswerkzeug global:
   ```cmd
   npm install -g qckwinsvc
   ```
3. Starte den Einrichtungs-Assistenten:
   ```cmd
   qckwinsvc
   ```
4. Beantworte die Fragen des Assistenten wie folgt:
   - **Service Name:** `SmartfactoryAI_Shopfloor`
   - **Service Description:** `Shopfloor Management Panel Backend & Frontend`
   - **Node Script Path:** `C:\Smartfactoryai\backend\server.js`

Der Dienst ist danach in der Windows-Diensteverwaltung (`services.msc`) aktiv und startet vollautomatisch beim Booten.

---

### [6] DATENSICHERHEIT & BACKUP (FÜR DIE IT)
Das Backend erstellt beim ersten Start automatisch die Datei `shopfloor_storage.json` im Ordner `.\backend\shopfloor_data`.

- **Backup-Strategie:** Für die tägliche Datensicherung muss die IT lediglich folgenden Ordner in die Backup-Routine (z.B. Veeam) aufnehmen:
  👉 **PFAD:** `C:\Smartfactoryai\backend\shopfloor_data`
