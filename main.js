// main.js

// 控制应用生命周期和创建原生浏览器窗口的模块
import { app, BrowserWindow, Menu, dialog } from "electron";
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
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(devServerURL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  // 打开开发工具
}

// 创建中文菜单
function createMenu() {
  const template = [
    // {
    //   label: '文件',
    //   submenu: [
    //     {
    //       label: '新建',
    //       accelerator: 'CmdOrCtrl+N',
    //       click: () => {
    //         // 新建功能
    //       }
    //     },
    //     {
    //       label: '打开',
    //       accelerator: 'CmdOrCtrl+O',
    //       click: () => {
    //         // 打开功能
    //       }
    //     },
    //     {
    //       label: '保存',
    //       accelerator: 'CmdOrCtrl+S',
    //       click: () => {
    //         // 保存功能
    //       }
    //     },
    //     { type: 'separator' },
    //     {
    //       label: '退出',
    //       accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
    //       click: () => {
    //         app.quit();
    //       }
    //     }
    //   ]
    // },
    // {
    //   label: '编辑',
    //   submenu: [
    //     {
    //       label: '撤销',
    //       accelerator: 'CmdOrCtrl+Z',
    //       role: 'undo'
    //     },
    //     {
    //       label: '重做',
    //       accelerator: 'Shift+CmdOrCtrl+Z',
    //       role: 'redo'
    //     },
    //     { type: 'separator' },
    //     {
    //       label: '剪切',
    //       accelerator: 'CmdOrCtrl+X',
    //       role: 'cut'
    //     },
    //     {
    //       label: '复制',
    //       accelerator: 'CmdOrCtrl+C',
    //       role: 'copy'
    //     },
    //     {
    //       label: '粘贴',
    //       accelerator: 'CmdOrCtrl+V',
    //       role: 'paste'
    //     },
    //     {
    //       label: '全选',
    //       accelerator: 'CmdOrCtrl+A',
    //       role: 'selectall'
    //     }
    //   ]
    // },
    {
      label: "查看",
      submenu: [
        {
          label: "重新加载",
          accelerator: "CmdOrCtrl+R",
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          },
        },
        {
          label: "强制重新加载",
          accelerator: "CmdOrCtrl+Shift+R",
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.reloadIgnoringCache();
          },
        },
        {
          label: "切换开发者工具",
          accelerator:
            process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          },
        },
        { type: "separator" },
        {
          label: "实际大小",
          accelerator: "CmdOrCtrl+0",
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.zoomLevel = 0;
          },
        },
        // {
        //   label: "放大",
        //   accelerator: "CmdOrCtrl+Plus",
        //   click: (item, focusedWindow) => {
        //     if (focusedWindow) {
        //       const currentZoom = focusedWindow.webContents.zoomLevel;
        //       focusedWindow.webContents.zoomLevel = currentZoom + 1;
        //     }
        //   },
        // },
        // {
        //   label: "缩小",
        //   accelerator: "CmdOrCtrl+-",
        //   click: (item, focusedWindow) => {
        //     if (focusedWindow) {
        //       const currentZoom = focusedWindow.webContents.zoomLevel;
        //       focusedWindow.webContents.zoomLevel = currentZoom - 1;
        //     }
        //   },
        // },
        { type: "separator" },
        {
          label: "切换全屏",
          accelerator: process.platform === "darwin" ? "Ctrl+Command+F" : "F11",
          click: (item, focusedWindow) => {
            if (focusedWindow)
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
          },
        },
      ],
    },
    // {
    //   label: "窗口",
    //   submenu: [
    //     {
    //       label: "最小化",
    //       accelerator: "CmdOrCtrl+M",
    //       role: "minimize",
    //     },
    //     {
    //       label: "关闭",
    //       accelerator: "CmdOrCtrl+W",
    //       role: "close",
    //     },
    //   ],
    // },
    {
      label: "帮助",
      submenu: [
        {
          label: "关于",
          click: () => {
            // 显示关于对话框
            dialog.showMessageBox({
              type: "info",
              title: "关于应用",
              message: "健康提醒助手",
              detail:
                "版本: 1.0.0\n\n这是一个基于 Electron + Vue 3 开发的健康提醒应用，\n帮助您养成良好的生活习惯。\n\n功能特色：\n• 智能饮水提醒\n• 个性化提醒设置\n• 数据统计分析\n• 美观的用户界面\n\n开发技术栈：\n• Electron - 跨平台桌面应用框架\n• Vue 3 - 现代化前端框架\n• Vite - 快速构建工具\n\n© 2024 健康提醒助手. 保留所有权利.",
              buttons: ["确定"],
              defaultId: 0,
              icon: null, // 可以添加应用图标路径
            });
          },
        },
        {
          label: "检查更新",
          click: () => {
            // 检查更新功能
            dialog.showMessageBox({
              type: "info",
              title: "检查更新",
              message: "当前已是最新版本",
              detail:
                "版本 1.0.0\n\n您当前使用的是最新版本，无需更新。\n\n如需获取最新功能和修复，请关注我们的更新通知。",
              buttons: ["确定"],
              defaultId: 0,
            });
          },
        },
        { type: "separator" },
        {
          label: "用户手册",
          click: () => {
            // 用户手册功能
            dialog.showMessageBox({
              type: "info",
              title: "用户手册",
              message: "使用指南",
              detail:
                '快速上手指南：\n\n1. 饮水提醒\n   • 设置提醒间隔时间\n   • 点击"开始提醒"启动定时提醒\n   • 收到提醒后点击"记录饮水"\n\n2. 统计功能\n   • 查看今日饮水次数和总量\n   • 追踪饮水习惯趋势\n\n3. 个性化设置\n   • 自定义提醒间隔\n   • 调整提醒音效\n   • 设置每日目标\n\n4. 快捷操作\n   • 使用快捷键快速记录\n   • 一键重置统计数据\n\n如需更多帮助，请查看应用内的详细说明。',
              buttons: ["确定"],
              defaultId: 0,
            });
          },
        },
        {
          label: "反馈建议",
          click: () => {
            // 反馈建议功能
            dialog.showMessageBox({
              type: "info",
              title: "反馈建议",
              message: "我们重视您的意见",
              detail:
                "感谢您使用健康提醒助手！\n\n如果您有任何建议、问题或功能需求，\n欢迎通过以下方式联系我们：\n\n📧 邮箱反馈\n💬 在线客服\n🐛 问题报告\n⭐ 功能建议\n\n您的反馈将帮助我们不断改进产品，\n为您提供更好的使用体验。",
              buttons: ["确定"],
              defaultId: 0,
            });
          },
        },
      ],
    },
  ];

  // 在 macOS 上，第一个菜单项通常是应用程序名称
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: "关于 " + app.getName(),
          role: "about",
        },
        { type: "separator" },
        {
          label: "服务",
          role: "services",
          submenu: [],
        },
        { type: "separator" },
        {
          label: "隐藏 " + app.getName(),
          accelerator: "Command+H",
          role: "hide",
        },
        {
          label: "隐藏其他",
          accelerator: "Command+Shift+H",
          role: "hideothers",
        },
        {
          label: "显示全部",
          role: "unhide",
        },
        { type: "separator" },
        {
          label: "退出",
          accelerator: "Command+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 这段程序将会在 Electron 完成初始化后并准备
// 创建浏览器窗口时被调用。
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createMenu();
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
