# 🥧 Raspberry Pi Setup für Daten-Export

Anleitung zur Einrichtung des automatischen Daten-Exports vom Raspberry Pi zu Vercel Blob Storage.

## Voraussetzungen

- Raspberry Pi läuft und ist erreichbar
- `cmi-dashboard` Projekt ist installiert (mit `fire_monitor.py`)
- `fire_events.db` wird bereits befüllt
- SSH-Zugang zum Raspberry Pi

## Setup-Schritte

### 1. Export-Script auf Raspberry Pi kopieren

Das Script `export_to_vercel.py` muss ins `cmi-dashboard` Verzeichnis auf dem Raspberry Pi:

```bash
# Von deinem Mac aus
scp export_to_vercel.py raspberry:/home/michi/cmi-dashboard/
```

Oder manuell kopieren und auf dem Pi erstellen.

### 2. Environment Variable auf Raspberry Pi setzen

SSH zum Raspberry Pi:

```bash
ssh raspberry
```

Füge den Vercel Blob Token zur `.env` Datei hinzu:

```bash
cd ~/cmi-dashboard
echo "BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxx" >> .env
```

**Wichtig:** Ersetze `vercel_blob_rw_xxxxxxxxxxxxxx` mit deinem echten Token!

### 3. Script ausführbar machen

```bash
chmod +x export_to_vercel.py
```

### 4. Manueller Test

Teste das Export-Script einmal manuell:

```bash
cd ~/cmi-dashboard
python3 export_to_vercel.py
```

Erwartete Ausgabe:
```
======================================================================
📦 Exporting Dashboard Data to Vercel Blob Storage
======================================================================

📊 Collecting data from database...
  ✓ 42 fire events
  ✓ 1523 temperature readings
  ✓ 6 current temperatures
  ✓ 3 monthly stats
📤 Uploading to Vercel Blob Storage (15234 bytes)...
✅ Successfully uploaded to Vercel Blob!
  Blob URL: https://xxxxx.public.blob.vercel-storage.com/dashboard-data.json

======================================================================
✅ Export completed successfully!
======================================================================
```

### 5. Cron-Job einrichten (stündlicher Export)

Öffne crontab:

```bash
crontab -e
```

Füge folgende Zeile hinzu (läuft jede Stunde zur vollen Stunde):

```cron
0 * * * * cd /home/michi/cmi-dashboard && /home/michi/cmi-dashboard/.venv/bin/python3 /home/michi/cmi-dashboard/export_to_vercel.py >> /home/michi/cmi-dashboard/export.log 2>&1
```

**Oder** für 2-stündlich:

```cron
0 */2 * * * cd /home/michi/cmi-dashboard && /home/michi/cmi-dashboard/.venv/bin/python3 /home/michi/cmi-dashboard/export_to_vercel.py >> /home/michi/cmi-dashboard/export.log 2>&1
```

Speichern und beenden (`:wq` in vim).

### 6. Cron-Job verifizieren

Prüfe, ob der Cron-Job registriert ist:

```bash
crontab -l
```

Warte eine Stunde und prüfe das Log:

```bash
tail -f ~/cmi-dashboard/export.log
```

## Alternative: Systemd Service

Falls du statt Cron einen systemd Service bevorzugst:

### Timer erstellen

```bash
sudo nano /etc/systemd/system/cmi-export.service
```

Inhalt:

```ini
[Unit]
Description=Export CMI Dashboard Data to Vercel
After=network.target

[Service]
Type=oneshot
User=michi
WorkingDirectory=/home/michi/cmi-dashboard
Environment="PYTHONUNBUFFERED=1"
ExecStart=/home/michi/cmi-dashboard/.venv/bin/python3 /home/michi/cmi-dashboard/export_to_vercel.py
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cmi-export
```

Timer erstellen:

```bash
sudo nano /etc/systemd/system/cmi-export.timer
```

Inhalt (stündlich):

```ini
[Unit]
Description=Run CMI Export hourly
Requires=cmi-export.service

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
```

Aktivieren:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cmi-export.timer
sudo systemctl start cmi-export.timer
```

Status prüfen:

```bash
sudo systemctl status cmi-export.timer
sudo journalctl -u cmi-export -f
```

## Logs und Debugging

### Cron-Job Logs ansehen

```bash
tail -f ~/cmi-dashboard/export.log
```

### Manuell Export ausführen

```bash
cd ~/cmi-dashboard
python3 export_to_vercel.py
```

### Häufige Probleme

#### "BLOB_READ_WRITE_TOKEN not found"

- Prüfe `.env` Datei: `cat ~/cmi-dashboard/.env`
- Stelle sicher, dass die Variable richtig gesetzt ist

#### "Upload failed: 401"

- Token ist ungültig oder abgelaufen
- Generiere neuen Token in Vercel Dashboard

#### "Error fetching current temperatures"

- CMI API nicht erreichbar
- Prüfe `.env` Einstellungen für `CMI_HOST`, `CMI_USER`, `CMI_PASS`

## Vercel Blob Dashboard

Gehe zu [Vercel Blob Dashboard](https://vercel.com/dashboard/stores) um hochgeladene Dateien zu sehen:

- `dashboard-data.json` sollte regelmäßig aktualisiert werden
- Timestamp im JSON zeigt letzte Aktualisierung

## Nächste Schritte

Nach erfolgreichem Setup:

1. ✅ Raspberry Pi exportiert stündlich Daten
2. ✅ Vercel Blob Storage enthält aktuelle Daten
3. ✅ Next.js Dashboard zeigt die Daten an
4. 🎉 Dashboard ist von überall erreichbar!
