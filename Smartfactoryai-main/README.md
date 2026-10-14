
martfactoryai — Windows Deployment


Shopfloor Management Panel - Shopfloor-Maske

Dieses Projekt ist eine digitale Shopfloor-Maske zur Online-Erfassung von Maschinenstati, Kriterienübersichten (Ampelsystem) und zur Bündelung von Notizen für Gruppentreffen und Schichtübergaben.

🚀 Architektur & Struktur (Layer-System)

Das System ist so aufgebaut, dass Informationen über verschiedene Ebenen gebündelt werden können:
• Gruppe (Top-Level Produktionsübersicht)
• Insel (Zusammenfassung mehrerer Arbeitsplätze)
• Maschine / Arbeitsplatz (Detaillierte Matrixansicht)

🛠️ Tech-Stack

• Frontend: React
• Backend: Node.js / Express (Auslieferung von API und Frontend kombiniert)
• Infrastruktur: Nativer Windows-Server-Betrieb (On-Premise)
• Datenbank: JSON-File Persistence (shopfloor_storage.json)

📁 Projektstruktur

text
Smartfactoryai/
├── starten.bat              # Startet das System per Doppelklick unter Windows
├── README.md                # Diese Dokumentation
├── backend/
│   ├── server.js            # Node.js Express Server (API & Statische Dateiausgabe)
│   ├── package.json         # Backend-Abhängigkeiten
│   └── shopfloor_data/      # Automatisch erstellter Datenordner (IT-Backup)
│       └── shopfloor_storage.json
└── frontend/
    ├── dist/ oder build/    # Kompilierte Produktionsdateien des Frontends
    ├── src/                 # Quellcode des React-Frontends
    └── package.json         # Frontend-Abhängigkeiten
Use code with caution.

💻 Installation auf dem Windows-Firmenserver (On-Premise)


Voraussetzungen

Auf dem Zielserver müssen folgende Komponenten installiert sein:
1. Node.js (Empfohlen: Aktuelle LTS-Version)
2. Eingabeaufforderung (CMD) oder PowerShell mit Administratorrechten

Schritt-für-Schritt-Installation

1. Paket entpacken: Kopiere die ZIP-Datei auf den Server und entpacke sie in ein beliebiges Verzeichnis (z. B. C:\Smartfactoryai).
2. Frontend bauen: Öffne die Eingabeaufforderung, wechsle in den Frontend-Ordner und baue die Produktionsdateien:cmd
cd C:\Smartfactoryai\frontend
npm install
npm run build
Use code with caution.
3. Anwendung starten: Wechsle zurück in den Hauptordner und führe die Start-Datei aus:cmd
cd C:\Smartfactoryai
starten.bat
Use code with caution.
4. Erreichbarkeit prüfen: Die App ist nun im Firmennetzwerk unter der IP-Adresse des Windows-Servers auf Port 5000 erreichbar: http://<SERVER-IP>:5000
⚠️ Hinweis für die IT: Port 5000 muss in der Windows-Firewall für eingehende Verbindungen freigegeben sein.

⚙️ Produktions-Betrieb: Einrichtung als Windows-Dienst (Empfohlen)

Damit die Anwendung permanent im Hintergrund läuft und nach einem Server-Neustart automatisch startet, sollte sie als Windows-Service registriert werden.
1. Öffne die Eingabeaufforderung (CMD) als Administrator.
2. Installiere das leichtgewichtige Hilfswerkzeug global:cmd
npm install -g qckwinsvc
Use code with caution.
3. Starte den Assistenten mit dem Befehl:cmd
qckwinsvc
Use code with caution.
4. Beantworte die Fragen des Assistenten wie folgt:
	• Service Name: SmartfactoryAI_Shopfloor
	• Service Description: Shopfloor Management Panel Backend & Frontend
	• Node Script Path: C:\Smartfactoryai\backend\server.js
Der Dienst ist nun im Windows-Dienstemanager (services.msc) aktiv und startet sich bei jedem Server-Boot automatisch neu.

💾 Datensicherheit & Backup

Das Backend erstellt beim ersten Start automatisch einen Unterordner namens .\backend\shopfloor_data\, in welchem die Datei shopfloor_storage.json verwaltet wird.
• Permanente Speicherung: Hierin liegt die gesamte Datenbanklogik (Maschinenstati, Tickets, Notizen und Konfigurationen).
• Backup: Für die tägliche Datensicherung muss die IT lediglich den Ordner C:\Smartfactoryai\backend\shopfloor_data\ in die Backup-Routine aufnehmen.
