const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron");
const path = require("path");
const { getLocalIP } = require("./utils");
require("./expressServer"); // Inicia o Servidor Express
require("./mqtt"); // Inicia o MQTT
require("./websocket"); // Inicia o WebSocket


const localIP = getLocalIP();
let mainWindow;

function createWindow() {
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, "assets", "sara.ico"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    
    mainWindow.loadFile("index.html");

    shell.openExternal(`http://${localIP}:3000`);

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('local-ip', localIP);
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    mainWindow.webContents.openDevTools();
}


app.whenReady().then(createWindow);

ipcMain.on('enviar-mensagem', (event, status) => {
    console.log(`Status recebido no main process: ${status}`);
});
