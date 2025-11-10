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

> 快速创建美观高效的windows应用安装程序，基于[Tauri2](https://tauri.app/)

---

## 🧩 使用前准备

### 安装NodeJs
访问[NodeJs](https://nodejs.org/en/download/)官方网站，安装版本需大于22.12.0。

### 安装Rust
访问[Rust](https://rust-lang.org/)官方网站，按照提示进行安装。

### 配置国内镜像
**参照[Rust配置国内源](https://juejin.cn/post/7528393617641013263)**

---

## 🔨 使用方法

### Npx
```sh
npx create-setuply
```

### Git Fork
1. Fork create-setuply 仓库

2. 增加上游远程地址
```sh
git remote add upstream https://github.com/phaoer/create-setuply
```

3. 创建自己的分支
```sh
git checkout -b your-branch
```

4. 执行脚手架
```sh
npm run create-setuply
```

5. 开始开发 🚀

---

## 🧱 模板

**支持React和Vue开发界面**

### 组件

```tsx
<Header />
```

实现可拖拽导航栏

### Hooks

```ts
function useInstallProgress ():{progress:number; reset: () => void} 
```

返回实时安装进度和重置安装进度函数

```ts
function useInstallError ():{error:string; reset: () => void} 
```

返回安装错误信息和重置安装错误函数

### Api

```ts
export function appQuit(): Promise<any>
```

程序退出

```ts
export function openUrl(url: string): Promise<any>
```

执行本机shell

```ts
export function changePath(): Promise<string | null>
```

更改安装路径

```ts
type InstallationParams = {
	packageDownloadUrl: string;     // 安装包链接，目前仅支持线上包安装
	packageFilename: string;        // 下载的安装包保存名称
	installPath: string;            // 安装路径
	setting?: {
		reg?: {     				// 注册表相关设置
			displayName: string;
			displayVersion: string;
			publisher: string;
			installLocation: string;
			uninstallString: string;
		};
		shortCut?: {        		// 桌面快捷方式相关设置
			targetPath: string;
			shortcutName: string;
			workingDir: string;
			description: string;
		};
	};
}
export function installation(params: InstallationParams): Promise<string>
```

开始安装

```ts
type LaunchParams = {
	exePath: string;        //可执行文件的地址
}
export function launch(params: LaunchParams): Promise<string>
```

启动安装后的应用程序

---

## 📜 License

[MIT](https://github.com/phaoer/create-setuply/blob/master/LICENSE)
