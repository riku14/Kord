# ⚡ QuickBar - Command Palette for Chrome

A powerful command palette for Chrome that brings Arc Browser-like search experience to your workflow.

## 🎯 Features

- **⚡ Fast Tab Switching**: Search and switch between tabs instantly with fuzzy search
- **🔖 Bookmark Search**: Find and open bookmarks without digging through folders
- **🕐 History Search**: Access your browsing history with smart filtering
- **⌨️ Browser Commands**: Execute browser actions with keyboard shortcuts
- **🎯 Frecency-based Ranking**: Results ranked by frequency and recency of use
- **🌓 Dark/Light Mode**: Automatically adapts to your system theme

## 🚀 Quick Start

### Installation (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/riku14/QuickBar.git
   cd quickbar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```
   This will open Chrome with the extension loaded automatically.

### Installation (Chrome Web Store)

_Coming soon..._

## 🎮 Usage

### Opening QuickBar

- **Windows/Linux**: `Ctrl+K`
- **Mac**: `Cmd+K`

You can customize this shortcut in Chrome:
1. Go to `chrome://extensions/shortcuts`
2. Find "QuickBar"
3. Set your preferred keyboard shortcut

### Searching

- **Empty query**: Shows all open tabs (sorted by frecency)
- **Text query**: Searches tabs, bookmarks, history, and commands
- **Command prefix (`>`)**: Shows only browser commands
  - Example: `>close` → Shows "Close Tab", "Close Other Tabs", etc.

### Navigation

- `↑↓` or `Arrow Keys`: Navigate through results
- `Enter`: Execute selected result
- `Esc`: Close QuickBar

## 🛠️ Browser Commands

QuickBar includes these built-in commands:

| Command | Description |
|---------|-------------|
| New Tab | Open a new tab |
| Close Tab | Close the current tab |
| Close Other Tabs | Close all other tabs (except pinned) |
| Duplicate Tab | Duplicate the current tab |
| Pin/Unpin Tab | Toggle pin on the current tab |
| Mute/Unmute Tab | Toggle mute on the current tab |
| Clear Cache | Clear browser cache |
| Open Downloads | Go to downloads page |
| Open Extensions | Go to extensions page |
| Open Settings | Go to Chrome settings |
| Open History Page | Go to history page |
| Open Bookmark Manager | Go to bookmark manager |

## 🏗️ Tech Stack

- **Framework**: [WXT](https://wxt.dev/) - Modern Chrome Extension Framework
- **UI**: React 18 + TypeScript
- **Styling**: Custom CSS (Arc Browser-inspired design)
- **Build**: Vite (via WXT)
- **Manifest**: V3

## 📁 Project Structure

```
quickbar/
├── entrypoints/
│   ├── background.ts          # Service Worker
│   ├── content.ts             # Content Script (palette injection)
│   ├── palette/               # Command Palette UI
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── palette.css        # Arc-inspired styling
│   └── popup/                 # Extension icon popup
├── lib/
│   ├── types.ts               # Type definitions
│   ├── constants.ts           # Command definitions
│   ├── fuzzy.ts               # Fuzzy search algorithm
│   └── frecency.ts            # Frecency scoring
└── public/
    └── icon/                  # Extension icons
```

## 🔧 Development

### Build for production

```bash
npm run build
```

Output will be in `.output/chrome-mv3/`

### Load unpacked extension

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `.output/chrome-mv3` folder

### Testing Checklist

- [x] Ctrl+K opens the palette
- [x] Esc closes the palette
- [x] Overlay click closes the palette
- [x] Tab search works
- [x] Bookmark search works
- [x] History search works
- [x] Command prefix `>` filters commands
- [x] Arrow keys navigate results
- [x] Enter executes selected result
- [x] Dark/Light mode switches correctly
- [x] Extension icon shows popup

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Inspired by [Arc Browser](https://arc.net/)'s command palette.

## 🔮 Roadmap

- [ ] Custom command registration
- [ ] Workspace feature (save/restore tab groups)
- [ ] Google search integration
- [ ] Recently closed tabs restoration
- [ ] Cross-browser support (Firefox, Edge)
- [ ] Chrome Web Store publication

---

**Made with ❤️ and [WXT](https://wxt.dev/)**
