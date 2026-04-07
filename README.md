# Reddit Link Opener

Opens all links on the current Reddit or Subreddit page in new tabs with a single click or keyboard shortcut.

![logo](src/img/icon128.png)

## Features

### Open Comments, Links or Both

Choose whether to open only article links, only comment threads, or both at once.

### Tab Limit

Set a maximum number of tabs opened per trigger (default: 25).

### Skip Visited Links

Optionally skip links you have already visited.

### NSFW Filter

Optionally exclude NSFW-tagged posts.

### Keyboard Shortcut

Fully customizable keyboard shortcut (default: `Ctrl+Shift+F`).

### Reddit Layout Support

Works with all current Reddit layouts:
- **www.reddit.com** — Shreddit (Web Components, 2024+)
- **old.reddit.com** — Classic layout

---

## Installation (from GitHub)

Chrome does not allow installing extensions directly from GitHub — you need to load it manually as an unpacked extension. This takes less than a minute.

### Step 1 — Download the source

**Option A — via Git:**
```bash
git clone https://github.com/ReverseGenius/Reddit-Link-Opener.git
```

**Option B — as ZIP:**
1. Go to the repository on GitHub
2. Click **Code → Download ZIP**
3. Extract the ZIP to a folder of your choice

### Step 2 — Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the **`src/`** folder inside the downloaded/cloned repository
5. The extension icon appears in your toolbar — done

### Step 3 — Pin the extension (optional)

Click the puzzle-piece icon in the Chrome toolbar → click the pin icon next to **Reddit Link Opener** to keep it visible.

### Updating

If you used Git, pull the latest changes and reload the extension on `chrome://extensions` by clicking the refresh icon on the extension card.

---

## Usage

1. Open any Reddit page (`www.reddit.com` or `old.reddit.com`)
2. Click the extension icon in the toolbar **or** press `Ctrl+Shift+F`
3. All unvisited links on the page open in new background tabs
4. If there are no new links, the page automatically scrolls down (or advances to the next page on old Reddit)

Configure behaviour via the extension's **Options** page (right-click the icon → *Options*).

---

## Requirements

- Chrome 88+ or any Chromium-based browser (Edge, Brave, Vivaldi, …)
- Manifest V3 — no legacy browser support required
