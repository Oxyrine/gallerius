// Electron shell for DesignVault. Spawns the local Flask server (from this
// same live project folder — nothing is bundled/frozen, so edits to
// designs.json or static/assets show up next launch with zero rebuild) and
// opens a window pointed at it.
const { app, BrowserWindow } = require("electron");
const { spawn, execSync } = require("child_process");
const path = require("path");
const http = require("http");

const PORT = 5000;
let flaskProcess = null;
let mainWindow = null;

// Force the port free before we start — handles a stale process left over
// from a previous run that didn't shut down cleanly.
function killProcessOnPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr ":${port} "`, { encoding: "utf8" });
    const pids = new Set();
    for (const line of result.trim().split("\n")) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[1].endsWith(`:${port}`)) pids.add(parts[4]);
    }
    for (const pid of pids) {
      try { execSync(`taskkill /PID ${pid} /F`); } catch {}
    }
  } catch {
    // findstr exits non-zero when nothing matches — port's already free.
  }
}

function waitForServer(url, timeoutMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      http.get(url, () => resolve())
        .on("error", () => {
          if (Date.now() - start > timeoutMs) reject(new Error("Flask server did not start in time"));
          else setTimeout(poll, 200);
        });
    })();
  });
}

async function createWindow() {
  killProcessOnPort(PORT);

  flaskProcess = spawn("py", ["app.py"], { cwd: __dirname, stdio: "ignore" });

  await waitForServer(`http://localhost:${PORT}`);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "DesignVault",
    show: false,
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(`http://localhost:${PORT}`);
}

function cleanup() {
  if (flaskProcess) flaskProcess.kill();
  killProcessOnPort(PORT);
}

app.whenReady().then(() => {
  createWindow();

  // Auto-launch at Windows login only for the real installed/portable case —
  // in a plain dev run (`npm start`) this would register bare electron.exe
  // with no app to load, so skip it unless actually packaged.
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true });
  }
});

app.on("window-all-closed", () => {
  cleanup();
  app.quit();
});

app.on("before-quit", cleanup);
