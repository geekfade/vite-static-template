// 如果项目出现 `global is not defined` 的错误，可以在这里添加 polyfill 代码
if (typeof (window as any).global === "undefined") {
  (window as any).global = window;
}

// 如果global is function的错误，可以在这里添加 polyfill 代码
if (typeof (window as any).global === "function") {
  (window as any).global = window;
}

export {};
