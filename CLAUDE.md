# Reddit Link Opener — CLAUDE.md

## Projektübersicht

Chrome/Chromium Browser Extension, die auf Reddit-Seiten alle Links automatisch in neuen Tabs öffnet. Geforkt von einem ursprünglichen Repo und auf Manifest V3 migriert.

- **Extension-Verzeichnis:** `src/` (dieses Verzeichnis in Chrome laden)
- **Manifest Version:** 3
- **Ziel-Browser:** Chrome / Chromium (kein Firefox-Support)
- **Ziel-Domains:** `https://www.reddit.com/*`, `https://old.reddit.com/*`

## Dateistruktur

```
src/
├── manifest.json          # MV3 Extension-Manifest
├── background.js          # Service Worker (kein DOM-Zugriff!)
├── contentScript.js       # In Reddit-Seiten injiziert
├── optionsScript.js       # Logik der Options-Seite
├── options.html           # Einstellungen-UI
├── changelog.html         # Versionshistorie
├── shortcut.js            # Keyboard-Shortcut-Bibliothek (extern, nicht anfassen)
├── style.css              # Styling für Options-Seite
└── img/                   # Icons
```

## Architektur

### Service Worker (`background.js`)
- Läuft als MV3 Service Worker — **kein `localStorage`, kein DOM, kein `window`**
- Speicher ausschließlich über `chrome.storage.local` (async)
- Kommuniziert mit Content Scripts via `chrome.tabs.sendMessage()`
- Wird durch `chrome.runtime.onInstalled` und `chrome.runtime.onStartup` initialisiert

### Content Script (`contentScript.js`)
- Wird bei `document_idle` injiziert
- Kein jQuery — ausschließlich native DOM APIs
- Dreistufige Layout-Erkennung (siehe unten)
- Kommuniziert mit Background via `chrome.runtime.sendMessage()` / `onMessage`

### Options-Seite (`optionsScript.js`)
- Liest/schreibt Settings über `chrome.storage.local` (async)
- Benachrichtigt den Service Worker via `chrome.runtime.sendMessage({action: 'updateSettingsFromOptions'})`
- Kein direkter Zugriff auf den Background-Worker (MV3: `getBackgroundPage()` nicht verfügbar)

## Reddit Layout-Erkennung

Der Content Script unterstützt drei Layouts — Erkennung in dieser Reihenfolge:

| Priorität | Layout | Erkennungs-Merkmal | Post-Link-Selektor | Kommentar-Selektor |
|---|---|---|---|---|
| 1 | **Shreddit** (www.reddit.com 2024+) | `shreddit-post` Element vorhanden | `shreddit-post a[slot="full-post-link"]` → Fallback: `a[data-click-id="body"]` | `shreddit-post a[data-click-id="comments"]` |
| 2 | **Old Reddit** (old.reddit.com) | `#siteTable` vorhanden | `#siteTable a.title` | `#siteTable a.comments` |
| 3 | **Legacy** (new Reddit 2018) | keines der oberen | `.scrollerItem a[data-click-id="body"]` | `.scrollerItem a[data-click-id="comments"]` |

**Next Page:**
- Old Reddit: `.nextprev a[rel~="next"]` → `window.location`
- Shreddit / Legacy: `window.scrollTo(0, document.body.scrollHeight)` (Infinite Scroll)

## Settings (chrome.storage.local)

| Key | Default | Beschreibung |
|---|---|---|
| `opencomments` | `"false"` | Kommentar-Links mit öffnen |
| `openvisitedlinks` | `"false"` | Bereits besuchte Links öffnen |
| `opennsfwlinks` | `"true"` | NSFW-Links öffnen |
| `openlinksdirectly` | `"false"` | i.redd.it direkt öffnen (UI deaktiviert) |
| `tabslimit` | `25` | Max. Anzahl neuer Tabs |
| `keyboardshortcut` | `"Ctrl+Shift+F"` | Tastenkombination |
| `oldkeyboardshortcut` | — | Vorheriger Shortcut (für remove()) |
| `version` | — | Aktuelle Version (für Install/Update-Detection) |

## Messaging-Protokoll

### Background → Content Script (`chrome.tabs.sendMessage`)

| `action` | Payload | Beschreibung |
|---|---|---|
| `updateSettings` | `keyboardshortcut`, `oldkeyboardshortcut` | Shortcut neu registrieren |
| `openRedditLinks` | `tabid` | Links sammeln und zurückgeben |
| `openNextPage` | — | Nächste Seite laden / scrollen |
| `scrapeInfoCompanionBar` | `index` | fakeClick auf Link an Index |

### Content Script → Background (`chrome.runtime.sendMessage`)

| `action` | Beschreibung |
|---|---|
| `keyboardShortcut` | Shortcut gedrückt → Links öffnen |
| `initKeyboardShortcut` | Beim Laden: aktuellen Shortcut holen |

### Options → Background

| `action` | Beschreibung |
|---|---|
| `updateSettingsFromOptions` | Settings gespeichert → alle Tabs updaten |

## Extension laden (Entwicklung)

1. `chrome://extensions` öffnen
2. **Entwicklermodus** aktivieren
3. **"Entpackte Erweiterung laden"** → `src/` Ordner auswählen
4. Nach Code-Änderungen: Extension-Seite → Reload-Button

## Debugging

```javascript
// Console auf www.reddit.com — Layout prüfen:
document.querySelector('shreddit-post')        // Shreddit?
document.getElementById('siteTable')           // Old Reddit?

// Selektoren testen:
document.querySelectorAll('shreddit-post a[slot="full-post-link"]')
document.querySelectorAll('shreddit-post a[data-click-id="comments"]')

// Storage auslesen (in Extension Service Worker Console):
chrome.storage.local.get(null, console.log)
```

## Wichtige Einschränkungen

- **Service Worker hat kein DOM** — kein `document`, kein `window`, kein `localStorage`
- **`shortcut.js` nicht modifizieren** — externe Bibliothek (BSD-Lizenz, openjs.com)
- **Kein jQuery** — wurde in der MV3-Migration entfernt; nur native DOM APIs verwenden
- **Shreddit-Selektoren** können sich ändern, da Reddit keine stabile public API für das DOM hat → bei Regressions zuerst Selektoren in DevTools verifizieren

## Branch-Konvention

Entwicklung läuft auf `claude/update-web-extension-upnEJ`. Nicht direkt auf `master` pushen.
