# FactoryAI - Shopfloor Management Panel (Windows Native)

Dieses Projekt ist eine digitale Shopfloor-Maske zur Online-Erfassung von Maschinenstati, Kriterienübersichten (Ampelsystem) und zur Bündelung von Notizen für Gruppentreffen und Schichtübergaben.

## Architektur
Die Anwendung wurde vollständig von Docker auf eine **native Windows-Architektur** umgestellt. 
* **Backend:** Node.js (Express) läuft auf Port `5000`
* **Frontend:** React (Vite) ist im Backend integriert und wird direkt über das Backend ausgeliefert.
* **Datenbank:** Dateibasierte Speicherung in `shopfloor_storage.json` im Backend-Verzeichnis.

---

## Bereitstellung auf dem Windows-Server (Leitfaden für die IT)

### 1. Voraussetzungen
* **Node.js** (LTS-Version) muss auf dem Windows-Server installiert sein.
* Ein Tool wie **NSSM** (Non-Sucking Service Manager) wird empfohlen, um die App als Windows-Dienst einzurichten.

### 2. Installation & Start
1. Kopiere das gesamte Repository in ein Verzeichnis auf dem Server (z. B. `C:\Apps\SmartFactory\`).
2. Öffne die Windows-Eingabeaufforderung (**CMD**) als Administrator.
3. Navigiere in den Backend-Ordner:
   ```cmd
   cd C:\Apps\SmartFactory\backend
   ```
4. Installiere die Produktions-Abhängigkeiten:
   ```cmd
   npm install --production
   ```
5. Starte die Anwendung testweise:
   ```cmd
   node server.js
   ```

### 3. Als Windows-Dienst im Hintergrund einrichten
Damit die Anwendung permanent im Hintergrund läuft und nach Server-Neustarts automatisch hochfährt:
1. Öffne CMD als Administrator und führe aus: `nssm install SmartFactory`
2. Konfiguriere das GUI-Fenster wie folgt:
   * **Path:** `C:\Program Files\nodejs\node.exe` (bzw. dein lokaler Node-Pfad)
   * **Startup directory:** `C:\Apps\SmartFactory\backend`
   * **Arguments:** `server.js`
3. Klicke auf **Install service** und starte den Dienst in der Windows-Diensteverwaltung (`services.msc`).

---

## Aufruf im Firmennetzwerk
Die Anwendung ist für alle Mitarbeiter im selben Netzwerk direkt über die IP-Adresse des Servers erreichbar:
`http://<SERVER-IP-ADRESSE>:5000`
