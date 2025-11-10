<p align="center">
  <img src="https://raw.githubusercontent.com/phaoer/create-setuply/master/images/logo.png" alt="Setuply">
  <br />
  <a href="https://github.com/phaoer/create-setuply/stargazers">
  <img src="https://img.shields.io/github/stars/phaoer/create-setuply?style=flat-square" alt="GitHub Stars">
  </a>
  <a href="https://github.com/phaoer/create-setuply/blob/master/LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License: MIT">
  </a>
  <a href="https://tauri.app/">
  <img src="https://img.shields.io/badge/Built%20with-Tauri%202-blue?style=flat-square" alt="Built with Tauri">
  </a>
  <a href="https://nodejs.org/">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.12.0-brightgreen?style=flat-square" alt="Node.js version">
  </a>
  <p align="center">
  <a href="./README.zh-CN.md">中文</a>
  |
  <a href="./README.md">English</a>
  </p>
</p>

> Quickly create beautiful and efficient Windows application installers — powered by [Tauri 2](https://tauri.app/)

---

## 🧩 Prerequisites

### Install Node.js
Visit the [Node.js official website](https://nodejs.org/en/download/) and install version **22.12.0 or higher**.

### Install Rust
Go to the [Rust official website](https://rust-lang.org/) and follow the installation guide.

---

## 🔨 Usage

### Npx
```sh
npx create-setuply
```

### Git Fork
1. Fork this repository.

2. Add the upstream remote:
```sh
git remote add upstream https://github.com/phaoer/create-setuply
```

3. Create your own branch:
```sh
git checkout -b your-branch
```

4. Run the scaffolding tool:
```sh
npm run create-setuply
```

5. Start development 🚀

---

## 🧱 Templates

**Supports React and Vue for building custom UI installers.**

### Components

```tsx
<Header />
```

provides a draggable navigation/header bar suitable for installer windows.

### Hooks

```ts
function useInstallProgress ():{progress:number; reset: () => void} 
```

Returns the real-time installation progress (0-100) and a reset function to clear progress.

```ts
function useInstallError ():{error:string; reset: () => void} 
```

Returns the installation error message (or null) and a reset function to clear errors.

### Methods / API

```ts
export function appQuit(): Promise<any>
```

Quit the installer application gracefully.

```ts
export function openUrl(url: string): Promise<any>
```

Open a URL or run a shell command on the host system (depending on implementation).

```ts
export function changePath(): Promise<string | null>
```

Open a folder picker to change the installation path. Returns the selected path or null if cancelled.

```ts
type InstallationParams = {
  packageDownloadUrl: string;     // Installation package URL (supports online packages)
  packageFilename: string;        // Saved filename for downloaded package
  installPath: string;            // Installation directory path
  setting?: {
    reg?: {                       // Windows registry settings (optional)
      displayName: string;
      displayVersion: string;
      publisher: string;
      installLocation: string;
      uninstallString: string;
    };
    shortCut?: {                  // Desktop shortcut settings (optional)
      targetPath: string;
      shortcutName: string;
      workingDir: string;
      description: string;
    };
  };
}
export function installation(params: InstallationParams): Promise<string>
```

Begin the installation process with the provided parameters.

```ts
type LaunchParams = {
  exePath: string;        // Path to the executable file you want to launch
}
export function launch(params: LaunchParams): Promise<string>
```

Launch the installed application executable.

---

## 📜 License

[MIT](https://github.com/phaoer/create-setuply/blob/master/LICENSE)
