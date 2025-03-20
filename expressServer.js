const express = require("express");
const cors = require("cors");
const path = require("path");
const { client,publishMessage } = require("./mqtt");
const { getLocalIP } = require("./utils");

const app2 = express();
const localIP = getLocalIP();

app2.use(express.json());
app2.use(cors({ origin: "*" }));



// Servir arquivos estáticos (HTML, CSS, JS)
app2.use(express.static(path.join(__dirname, "public")));

// Rota para servir o arquivo HTML
app2.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Servir arquivos da raiz do projeto do Electron
/*app2.use(express.static(__dirname));
app2.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});*/

// Rota POST para envio de credenciais WiFi via MQTT
app2.post('/wifi', (req, res) => {
    const { ssid, password } = req.body;
    console.log(`Recebido WiFi: SSID= ${ssid}, Senha= ${password}`);
    
    publishMessage("v1/meu/topico/wifi", JSON.stringify({ ssid, password }));

    res.json({ message: `WiFi '${ssid}' recebido e enviado ao MQTT.` });
});

/*app2.get("/getLocalIP", (req, res) => {
    res.json({ ip: localIP });
});*/

app2.listen(3000, () => {
    console.log(`Servidor rodando em http://${localIP}:3000`);
     
});

module.exports = app2;
