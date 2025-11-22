import { app, BrowserWindow, ipcMain, Menu, globalShortcut } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import chokidar from "chokidar";

import { initDatabase } from "./database/init.js";
import { registerAllHandlers } from "./ipc/index.js";

//test
//import { mergeBibleFiles, getAllTextFiles } from "./converter.js";
import {search, displayResult, loadBible} from "./utils/searcher.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const isMac = process.platform === "darwin";

let mainWindow;

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(app.getAppPath(), "electron/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    //Point to Vite's dev server
    const devServerURL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    console.log("Loading Vite dev server:", devServerURL);
    await mainWindow.loadURL(devServerURL);

    mainWindow.webContents.once("dom-ready", () => {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    });
  } else {
    //In production, load the built index.html
    const indexPath = path.join(__dirname, "../dist/index.html");
    console.log("Loading production build:", indexPath);
    await mainWindow.loadFile(indexPath);
  }

  Menu.setApplicationMenu(null);

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (!isMac) app.quit();
  });
}

// Other IPCs
ipcMain.handle("ping", () => "pong from main");

ipcMain.on("custom-event", (event, data) => {
  console.log("Renderer says:", data);
  event.reply("custom-event-reply", { ok: true, msg: "Got your message!" });
});

app.whenReady().then(async () => {
  initDatabase();
  registerAllHandlers();
  // 🔁 Watch for main process changes and restart the app automatically
  if (isDev) {
    const watcher = chokidar.watch([
      path.join(__dirname, "./**/*.js"),
      path.join(__dirname, "../electron/**/*.js"),
    ]);
    watcher.on("change", () => {
      console.log("Restarting Electron due to main process change...");
      app.relaunch();
      app.exit(0);
    });
  }
  await createMainWindow();

  if (isDev) {
    globalShortcut.register("CommandOrControl+Shift+I", () => {
      if (mainWindow) {
        const open = mainWindow.webContents.isDevToolsOpened();
        if (open) mainWindow.webContents.closeDevTools();
        else mainWindow.webContents.openDevTools({ mode: "detach" });
      }
    });
  }
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});


//const inputDir = 'C:/Users/usuario/Documents/bible_files';        // Directory containing .txt files
//const outputFile = 'C:/Users/usuario/Documents/bible_files/bible.json';       // Output JSON file path
//const bibleVersion = "Nueva Reina Valera 2000";
//console.log('Files found:', getAllTextFiles('C:/Users/usuario/Documents/bible_files'));
//mergeBibleFiles(inputDir, outputFile, bibleVersion);
const biblePath = 'C:/Users/usuario/Documents/bible_files/bible.json';
const bible = loadBible(biblePath);

if (bible) {
  // Examples
  console.log('=== SINGLE VERSE SEARCHES ===');
  displayResult(search(bible, 'genesis 1:1'));
  displayResult(search(bible, 'GEneSis        1   :   2'));
  displayResult(search(bible, '1 corintios 1:1'));
  displayResult(search(bible, '1 CORINTIOS 13:4'));

  console.log('\n=== RANGE SEARCHES ===');
  displayResult(search(bible, 'genesis 1:1-3'));
  displayResult(search(bible, 'salmos 23:1-6'));
}