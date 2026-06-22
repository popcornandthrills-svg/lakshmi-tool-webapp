const { app, BrowserWindow } = require("electron");

function createWindow() {
  const targetUrl = process.env.LAKSHMI_APP_URL || "https://your-permanent-domain.example";

  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    backgroundColor: "#f7f3ea",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL(targetUrl);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
