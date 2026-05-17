<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/yuus-1DB954?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMyA3djEwYTUgNSAwIDAgMCA1IDVoOGE1IDUgMCAwIDAgNS01VjdhNSA1IDAgMCAwLTUtNUg4YTUgNSAwIDAgMC01IDV6Ii8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgMTVhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0eiIvPjwvc3ZnPg==">
    <img src="https://img.shields.io/badge/yuus-1DB954?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMyA3djEwYTUgNSAwIDAgMCA1IDVoOGE1IDUgMCAwIDAgNS01VjdhNSA1IDAgMCAwLTUtNUg4YTUgNSAwIDAgMC01IDV6Ii8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgMTVhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0eiIvPjwvc3ZnPg==">
  </picture>
</p>

<p align="center">
  <em>Image replacement workstation — import, map, preview, replace.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/rust-%23000000.svg?style=flat&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB" alt="React">
  <img src="https://img.shields.io/badge/tauri-%2324C8DB.svg?style=flat&logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/bun-%23000000.svg?style=flat&logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat" alt="License">
</p>

---

**Yuus** is a desktop application for batch image replacement. Import a directory, assign replacement images, preview side-by-side, then commit swaps with full undo/redo and audit trail.

> Replace imagery with a tactile, file-first workflow. Import a directory, map replacement files into a hashed session, inspect each frame, then commit the final swap without leaving the desk.

## Features

- **📂 Directory import** — Scan folders for images (png, jpg, jpeg, svg, gif, bmp, webp, ico) with recursive support
- **🎯 Drag-and-drop mapping** — Assign replacement images via drag-drop or file picker
- **👁️ Side-by-side preview** — Original vs. replacement at a glance
- **⚡ Batch or single apply** — Replace one-by-one or all at once
- **↩️ Undo / Redo** — Full history with backup files
- **📋 Audit trail** — Every action logged with timestamps
- **🔍 Search & filter** — Quickly find images by name or path
- **🌐 i18n** — English and Simplified Chinese
- **⌨️ Keyboard shortcuts** — `Cmd+Z` undo, `Cmd+Shift+Z` redo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri v2](https://v2.tauri.app) (Rust) |
| Frontend | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| Bundler | [Vite 5](https://vitejs.dev) |
| Runtime | [Bun](https://bun.sh) |
| Core lib | TypeScript (`@yuus/core`) |
| i18n | English, 简体中文 |

## Prerequisites

- [Bun](https://bun.sh) >= 1.x
- [Rust](https://www.rust-lang.org) toolchain (for Tauri)
- macOS, Linux, or Windows

## Getting Started

```bash
# Clone the repository
git clone https://github.com/<your-org>/yuus.git
cd yuus

# Install dependencies
bun install

# Start development
cd apps/desktop
bun run tauri dev
```

This launches the Tauri desktop app with Vite HMR on port `1420`.

## Build for Production

```bash
cd apps/desktop
bun run tauri build
```

The distributable binaries will be in `src-tauri/target/release/`.

## Project Structure

```
yuus/
├── packages/
│   └── core/              # @yuus/core — image scanning & replacement logic
│       ├── model/
│       │   └── images.ts  # Core engine (walk, hash, replace, undo/redo)
│       └── index.ts       # Public API
├── apps/
│   ├── desktop/           # @yuus/desktop — Tauri desktop application
│   │   ├── src/           # React frontend
│   │   │   ├── App.tsx
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── lib/         # Utilities, i18n, types
│   │   ├── src-tauri/     # Rust backend (Tauri commands)
│   │   │   └── src/
│   │   │       └── main.rs  # ~800 lines, all native commands
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   └── cli/               # CLI app (coming soon)
├── package.json           # Monorepo workspace root
├── tsconfig.json
└── AGENTS.md              # AI agent instructions
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Z` | Undo last replacement |
| `Cmd+Shift+Z` | Redo last undone replacement |

## Roadmap

- [ ] CLI tool for scripted batch replacements
- [ ] Image format conversion on replace
- [ ] Remote / network directory support
- [ ] Plugin system for custom processors
- [ ] Automated tests

## Contributing

Contributions are welcome! Please open an issue or submit a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing`)
5. Open a Pull Request

## License

[MIT](LICENSE)