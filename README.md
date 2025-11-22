# 🔥 KOKOMO Heating Dashboard

Next.js 16 Dashboard zur Visualisierung von Holzofen-Daten aus der CMI JSON API.

## Features

- 🌡️ Live-Temperaturanzeigen mit Gauge-Charts (Tremor UI)
- 🔥 Feuer-Event Tracking und Statistiken
- 📊 Monatliche Auswertungen mit Charts
- 📱 Responsive Design (Mobile-First)
- ⚡ Server-Side Rendering mit ISR (Incremental Static Regeneration)
- 🎨 Modernes Design mit Tremor UI (keine generischen shadcn Components)

## Tech Stack

- **Next.js 16** mit App Router und React 19
- **TypeScript**
- **Tremor UI** für Dashboard-Komponenten
- **Tailwind CSS** für Styling
- **Vercel Blob Storage** für Datenspeicherung
- **date-fns** für Datumsformatierung

## Setup

### 1. Vercel Blob Storage einrichten

1. Gehe zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Erstelle einen neuen Blob Store (Storage → Blob)
3. Kopiere den `BLOB_READ_WRITE_TOKEN`

### 2. Environment Variables

Erstelle eine `.env.local` Datei:

```bash
cp .env.example .env.local
```

Füge deinen Token ein:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxx
```

### 3. Installation

```bash
npm install
```

### 4. Development Server starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

## Deployment auf Vercel

### 1. GitHub Repository erstellen

```bash
cd /Users/michaelmauch/Documents/Development/cmi-dashboard-next
git init
git add .
git commit -m "Initial commit: KOKOMO Heating Dashboard"
git branch -M main
git remote add origin https://github.com/DEIN_USERNAME/cmi-dashboard-next.git
git push -u origin main
```

### 2. Mit Vercel verbinden

1. Gehe zu [Vercel Dashboard](https://vercel.com/new)
2. Importiere dein GitHub Repository
3. Vercel erkennt automatisch Next.js
4. Füge Environment Variable hinzu:
   - `BLOB_READ_WRITE_TOKEN`: Dein Blob Storage Token
5. Deploy!

### 3. Automatisches Deployment

Bei jedem Push zu `main` deployed Vercel automatisch die neue Version.

## Raspberry Pi Setup

Siehe [Raspberry Pi Setup Anleitung](./RASPBERRY_PI_SETUP.md) für die Einrichtung des Daten-Exports.

## Datenstruktur

Die Dashboard-Daten werden als JSON im Vercel Blob Storage gespeichert:

```typescript
interface DashboardData {
  current_temps: CurrentTemperature[];
  oven_state: OvenState;
  fire_events: FireEvent[];
  temperature_history: TemperatureReading[];
  monthly_stats: MonthlyStats[];
  last_updated: string;
}
```

## Konfiguration

### Revalidierung

Standardmäßig werden die Daten alle 60 Minuten neu validiert. Anpassbar in `app/page.tsx`:

```typescript
export const revalidate = 3600; // Sekunden
```

### Anzahl der angezeigten Events

In `components/fire-stats-table.tsx`:

```typescript
<FireStatsTable events={data.fire_events} limit={10} />
```

## Troubleshooting

### "Dashboard data not found in blob storage"

- Stelle sicher, dass der Raspberry Pi das Export-Script erfolgreich ausgeführt hat
- Prüfe den `BLOB_READ_WRITE_TOKEN`
- Checke Vercel Blob Dashboard für hochgeladene Dateien

### Tremor Components werden nicht angezeigt

- Überprüfe die Installation: `npm list @tremor/react`
- Falls Peer-Dependency Warnung: Normal bei React 19, funktioniert trotzdem

### Daten werden nicht aktualisiert

- Prüfe Raspberry Pi Cron-Job Status
- Checke Vercel Deployment Logs
- ISR Cache könnte noch aktiv sein (max. 60 Min)

## License

MIT
