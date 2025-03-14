const { app, BrowserWindow, ipcMain, Menu,shell } = require("electron");
const mqtt = require("mqtt");
const path = require("path");
const express = require("express");
const cors = require("cors");
const app2 = express();
const PORT = 3000;
const WebSocket = require("ws");

let mainWindow;
const wss = new WebSocket.Server({ port: 8080, host: "0.0.0.0" });


// Rota POST para enviar o status a pagina HTML
app2.use(express.json());



let mqttStatus = "desconectado";  // Variável para armazenar o status

// Envia o status para todos os clientes WebSocket conectados
function broadcastStatus() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(mqttStatus);
        }
    });
}
// Configuração do MQTT com reconexão automática
const client = mqtt.connect("mqtt://test.mosquitto.org", {
    reconnectPeriod: 2000, // Tenta reconectar a cada 2 segundos
    keepalive: 10, // Mantém a conexão viva a cada 10 segundos
    connectTimeout: 5000 // Tempo limite para tentar conectar
});

client.on("connect", () => {
    console.log("Conectado ao MQTT!");
    mqttStatus = "conectado";
});

client.on("reconnect", () => {
    console.log("Tentando reconectar ao MQTT...");
    mqttStatus = "reconectando";
});

client.on("close", () => {
    console.log("Conexão com o MQTT foi fechada.");
    mqttStatus = "desconectado";
});

client.on("error", (err) => {
    console.error("Erro no MQTT:", err.message);
    mqttStatus = "erro";
});

// Exemplo: Verificar status a cada 5 segundos
setInterval(() => {
    console.log("Status atual do MQTT:", mqttStatus);
    broadcastStatus();
}, 5000);


function createWindow()  {
    Menu.setApplicationMenu(null);

     mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, "assets", "sara.ico"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"), // Garante que o preload esteja sendo carregado corretamente
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            sandbox: false // 🔹 Desativa o modo sandbox
        }
    });
    mainWindow.loadURL('http://192.168.1.26:3000'); // ou o caminho do seu HTML

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Define CSP para permitir conexões ao servidor backend
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": [
                    "default-src 'self' 'unsafe-inline' ws://192.168.1.26:8080 http://192.168.1.26:3000; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws://192.168.1.26:8080 http://192.168.1.26:3000;"
                ]
            }
        });
    });
    

    mainWindow.loadFile("index.html");
    wss.on("connection", (ws) => {
        console.log("Novo cliente WebSocket conectado.");

        ws.on("message", (message) => {
            console.log("Mensagem recebida:", message.toString());
            
            // Reenviar a todos os clientes (inclusive o navegador)
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        });
    });
    
    
   mainWindow.webContents.openDevTools();

    // Recebe a mensagem do frontend e publica no MQTT
ipcMain.on("botao-clicado", (event, data) => {
    if (typeof data === "object" && data.ssid && data.password) {
        // Se for um objeto com SSID e senha, trata como configuração de WiFi
        console.log(`WiFi recebida: SSID=${data.ssid}, Senha=${data.password}`);
        event.reply("resposta-do-main", `WiFi SSID=${data.ssid} recebido`);
        
        // Publica no MQTT (caso queira enviar essas credenciais para um dispositivo)
        client.publish("v1/meu/topico/wifi", JSON.stringify(data));

    } else {
        // Trata como status do botão
        console.log(`Status do botão: ${data}`);
        event.reply("resposta-do-main", data);
        client.publish("v1/meu/topico", data);
    }
});
};

app.whenReady().then(createWindow);

// Escutando o evento enviado pelo renderer
ipcMain.on('enviar-mensagem', (event, status) => {
    console.log(`Status recebido no main processssss: ${status}`);

   
});

// Fechar o app quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// Servir arquivos da raiz do projeto
app2.use(express.static(__dirname));

// Rota para o index.html
app2.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app2.post('/mensagem', (req, res) => {
    const { status } = req.body;
    console.log(`Recebido status: ${status}`);
    client.publish("v1/meu/topico", status); // Publica no tópico MQTT
   // Verifica se mainWindow está definido antes de tentar enviar a mensagem
   if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('botao-clicado', status);
} else {
    console.error("mainWindow não está disponível!");
}

res.json({ message: `Status '${status}' recebido e enviado ao Electron.` });
});

app2.use(express.json()); // Garante que o Express pode interpretar JSON

app2.post('/wifi', (req, res) => {
    const { ssid, password } = req.body; // Captura os dados corretamente
    console.log(`Recebido WiFi: SSID=${ssid}, Senha=${password}`);

    // Verifica se mainWindow está definido antes de tentar enviar a mensagem
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('botao-clicado', { ssid, password });
    } else {
        console.error("mainWindow não está disponível!");
    }

    res.json({ message: `WiFi '${ssid}' recebido e enviado ao Electron.` });
});


app2.post("/api/comando", (req, res) => {
    console.log("Comando recebido:", req.body);
    res.json({ status: "ok" });
});

app2.use(cors()); // Permite requisições de qualquer origem

app2.listen(3000, () => {
    console.log("Servidor rodando em http://192.168.1.26:3000");
});
// Abre o navegador padrão ao iniciar
shell.openExternal('http://192.168.1.26:3000');