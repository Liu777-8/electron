// main.js

// 控制应用生命周期和创建原生浏览器窗口的模块
import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  // 创建浏览器窗口。
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 加载 index.html
  // 在开发模式下，加载 Vite 开发服务器的地址
  // Vite dev server URL
  const devServerURL = "http://localhost:5173";

  // and load the index.html of the app.
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(devServerURL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  // 打开开发工具
  mainWindow.webContents.openDevTools();
}

// 这段程序将会在 Electron 完成初始化后并准备
// 创建浏览器窗口时被调用。
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // 在 macOS 系统内, 如果没有已开启的应用窗口
    // 点击托盘图标时通常会重新创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。
// 因此, 通常对应用程序和它们的菜单栏来说应该时刻保持激活状态,
// 直到用户使用 Cmd + Q 明确退出
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// 在这个文件中，你可以包含应用程序剩余的所有部分的主进程代码。
// 你也可以将它们放在不同的文件中，并在这里导入。
