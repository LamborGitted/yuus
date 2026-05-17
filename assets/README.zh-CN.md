<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/yuus-1DB954?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMyA3djEwYTUgNSAwIDAgMCA1IDVoOGE1IDUgMCAwIDAgNS01VjdhNSA1IDAgMCAwLTUtNUg4YTUgNSAwIDAgMC01IDV6Ii8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgMTVhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0eiIvPjwvc3ZnPg==">
    <img src="https://img.shields.io/badge/yuus-1DB954?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMyA3djEwYTUgNSAwIDAgMCA1IDVoOGE1IDUgMCAwIDAgNS01VjdhNSA1IDAgMCAwLTUtNUg4YTUgNSAwIDAgMC01IDV6Ii8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5iIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgMTVhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0eiIvPjwvc3ZnPg==">
  </picture>
</p>

<p align="center">
  <em>图片替换工作站 — 导入、映射、预览、替换。</em>
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

**Yuus** 是一款桌面端批量图片替换工具。导入一个目录，分配替换图片，并排预览，然后提交替换——完整支持撤销/重做和审计追踪。

> 以触感化的文件优先工作流替换图像：导入文件夹，将替换文件映射到哈希会话中，逐一检查每一帧，然后在不离开桌面的情况下完成最终替换。

## 功能特性

- **📂 目录导入** — 扫描文件夹中的图片（png、jpg、jpeg、svg、gif、bmp、webp、ico），支持递归子目录
- **🎯 拖拽映射** — 通过拖放或文件选择器为每张图片分配替换文件
- **👁️ 并排预览** — 原图与替换图一目了然
- **⚡ 单张或批量替换** — 逐一替换或一键全部替换
- **↩️ 撤销 / 重做** — 完整的操作历史，带备份文件
- **📋 审计追踪** — 每次操作均记录时间戳
- **🔍 搜索与过滤** — 按文件名或路径快速定位
- **🌐 国际化** — 支持简体中文和英文
- **⌨️ 快捷键** — `Cmd+Z` 撤销，`Cmd+Shift+Z` 重做

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面容器 | [Tauri v2](https://v2.tauri.app)（Rust） |
| 前端 | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| 样式 | [Tailwind CSS 3](https://tailwindcss.com) |
| 构建工具 | [Vite 5](https://vitejs.dev) |
| 运行时 | [Bun](https://bun.sh) |
| 核心库 | TypeScript（`@yuus/core`） |
| 国际化 | English、简体中文 |

## 环境要求

- [Bun](https://bun.sh) >= 1.x
- [Rust](https://www.rust-lang.org) 工具链（用于 Tauri）
- macOS、Linux 或 Windows

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/<your-org>/yuus.git
cd yuus

# 安装依赖
bun install

# 启动开发模式
cd apps/desktop
bun run tauri dev
```

这将启动 Tauri 桌面应用，Vite HMR 运行在 `1420` 端口。

## 构建生产版本

```bash
cd apps/desktop
bun run tauri build
```

可分发二进制文件位于 `src-tauri/target/release/`。

## 项目结构

```
yuus/
├── packages/
│   └── core/              # @yuus/core — 图片扫描与替换核心逻辑
│       ├── model/
│       │   └── images.ts  # 核心引擎（遍历、哈希、替换、撤销/重做）
│       └── index.ts       # 公开 API
├── apps/
│   ├── desktop/           # @yuus/desktop — Tauri 桌面应用
│   │   ├── src/           # React 前端
│   │   │   ├── App.tsx
│   │   │   ├── components/  # UI 组件
│   │   │   ├── hooks/       # 自定义 React Hooks
│   │   │   └── lib/         # 工具函数、国际化、类型定义
│   │   ├── src-tauri/     # Rust 后端（Tauri 命令）
│   │   │   └── src/
│   │   │       └── main.rs  # ~800 行，全部原生命令
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   └── cli/               # CLI 工具（即将推出）
├── package.json           # 根 monorepo workspace 配置
├── tsconfig.json
└── AGENTS.md              # AI 代理配置说明
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd+Z` | 撤销上一次替换 |
| `Cmd+Shift+Z` | 重做上一次撤销的替换 |

## 开发路线

- [ ] CLI 工具，支持脚本化批量替换
- [ ] 替换时自动转换图片格式
- [ ] 远程/网络目录支持
- [ ] 插件系统，支持自定义处理器
- [ ] 自动化测试

## 贡献指南

欢迎贡献！请提交 Issue 或 Pull Request。

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feat/amazing`）
3. 提交更改（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feat/amazing`）
5. 提交 Pull Request

## 许可证

[MIT](LICENSE)
