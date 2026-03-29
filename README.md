# Kleines 1x1

Eine Progressive Web App zum spielerischen Training des kleinen Einmaleins. Gebaut mit Vue 3 und Vite.

## Starten

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build
npm run preview  # Build lokal vorschauen (PWA-Test)
```

> **Hinweis:** Der Service Worker wird registriert, sobald die App unter `localhost` oder `https` läuft und `/sw.js` erreichbar ist. Für realistische Install-Checks (Lighthouse, Manifest-Checks, Caching) ist `npm run preview` die zuverlässigste Testumgebung.

---

## PWA – wie es funktioniert

### Was eine PWA ausmacht

Eine Progressive Web App ist eine normale Webseite, die drei Bedingungen erfüllt:

1. **HTTPS** (oder `localhost`) — Pflicht, damit der Browser sicherheitsrelevante APIs wie Service Worker erlaubt.
2. **Web App Manifest** — eine JSON-Datei, die dem Browser sagt, wie die App aussehen soll wenn sie installiert wird (Name, Icon, Farbe, Anzeigemodus).
3. **Service Worker** — ein JavaScript-Skript, das der Browser im Hintergrund registriert und das Netzwerkanfragen abfangen und cachen kann.

Sind alle drei Bedingungen erfüllt, zeigt Chrome und Safari (iOS 16.4+) einen Installations-Prompt an und die App lässt sich auf dem Home-Bildschirm ablegen — ohne App Store.

---

### Die drei PWA-Bausteine im Projekt

#### 1. Web App Manifest (`public/manifest.webmanifest`)

```json
{
  "name": "Kleines 1x1",
  "short_name": "1x1",
  "display": "standalone",
  "start_url": "/",
  ...
}
```

- `display: standalone` sorgt dafür, dass die App ohne Browser-Adressleiste öffnet — wie eine native App.
- `theme_color` und `background_color` steuern die Farbe der Status-Bar und des Splash-Screens.
- `icons` listet die PNG-Icons für Installations-Dialog und Home-Bildschirm. Browsers und Betriebssysteme wählen automatisch die passende Größe.
- `screenshots` reduziert Warnungen in Chrome/Lighthouse und verbessert den Install-Dialog auf Desktop und Mobile.
- Das Manifest wird in `index.html` über `<link rel="manifest" href="/manifest.webmanifest" />` eingebunden.

#### 1.1 Screenshots im Manifest (Install-UI)

Chrome zeigt seit neueren Versionen im Install-Dialog zusätzliche App-Vorschauen. Dafür sollten im Manifest Screenshots definiert sein:

```json
"screenshots": [
  {
    "src": "/screenshot-desktop.png",
    "sizes": "1280x800",
    "type": "image/png",
    "form_factor": "wide",
    "label": "Kleines 1x1 – Desktopansicht"
  },
  {
    "src": "/screenshot-mobile.png",
    "sizes": "390x844",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Kleines 1x1 – Mobilansicht"
  }
]
```

Wichtig:

1. `sizes` muss exakt der echten Pixelgröße der Datei entsprechen.
2. Dateien müssen unter den angegebenen Pfaden erreichbar sein (z. B. in `public/`).
3. Für Desktop ein `wide`-Screenshot und für Mobile ein `narrow`-Screenshot verwenden.

#### 2. `apple-touch-icon` in `index.html`

iOS liest das Manifest-Icon **nicht** für den Home-Bildschirm — es braucht einen eigenen Tag:

```html
<link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
```

Apple ignoriert SVGs, deshalb muss es ein PNG sein.

#### 3. Service Worker (`public/sw.js`)

Der Service Worker ist ein separates JavaScript-Skript, das der Browser **außerhalb der Seite** in einem eigenen Thread ausführt. Er läuft weiter, auch wenn der Browser-Tab geschlossen ist, und kann Netzwerkanfragen der App abfangen.

##### Registrierung (in `src/main.js`)

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
```

Der SW wird erst nach dem `load`-Event registriert, damit er den initialen Seitenaufbau nicht verlangsamt.

##### `install`-Event — App Shell cachen

```js
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})
```

Beim ersten Besuch legt der SW die wichtigsten Dateien in den Cache. `skipWaiting()` sorgt dafür, dass der neue SW sofort aktiv wird, ohne auf das Schließen aller Tabs zu warten.

##### `activate`-Event — alten Cache aufräumen

```js
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  )
  self.clients.claim()
})
```

Nach einem Update (erkennbar am neuen Cache-Namen, z. B. `timestables-v2`) löscht der SW alle alten Caches automatisch. `clients.claim()` übernimmt sofort die Kontrolle über alle offenen Tabs.

##### `fetch`-Event — Caching-Strategie

Der SW unterscheidet zwei Fälle:

**Navigations-Anfragen** (HTML-Seite selbst):  
Strategie *Network first* — der SW versucht immer die aktuelle Version vom Server zu laden und cached das Ergebnis. Ist kein Netz vorhanden, liefert er die gecachte `index.html` aus dem Cache → die App funktioniert offline.

**Alle anderen Ressourcen** (JS, CSS, Bilder):  
Strategie *Stale-while-revalidate* — der SW antwortet sofort aus dem Cache (schnell), lädt die neue Version im Hintergrund und aktualisiert den Cache für den nächsten Besuch.

---

### Cache-Version hochzählen

Wenn sich Manifest oder Assets ändern, muss der Cache-Name in `public/sw.js` erhöht werden:

```js
const CACHE_NAME = 'timestables-v3' // war v2
```

Damit erkennt der Browser beim nächsten Besuch den neuen SW, räumt den alten Cache auf und lädt alle Dateien frisch.

---

### Troubleshooting PWA-Install

Wenn „Manifest nicht erkannt" oder „Installierbar: nein" erscheint:

1. Prüfen, ob `manifest.webmanifest` direkt im Browser erreichbar ist.
2. Prüfen, ob alle `icons`- und `screenshots`-Pfade HTTP 200 liefern.
3. Sicherstellen, dass `sizes` im Manifest zur echten Bildgröße passt.
4. Service Worker Cache erneuern: `CACHE_NAME` erhöhen (z. B. `timestables-v3`).
5. Browserdaten löschen (Service Worker unregister + Site Data clear), dann neu laden.
6. Für externen Test (z. B. ngrok) immer dieselbe URL verwenden, damit Scope und SW konsistent bleiben.

---

### Icons

| Datei | Größe | Verwendung |
|---|---|---|
| `public/icon-192.png` | 192×192 | Android Home-Bildschirm, Installations-Dialog |
| `public/icon-512.png` | 512×512 | Splash Screen, hochauflösende Displays |
| `public/icon-maskable-512.png` | 512×512 | Android Adaptive Icons (runde/quadratische Maske) |
| `public/favicon.svg` | skalierbar | Browser-Tab |
