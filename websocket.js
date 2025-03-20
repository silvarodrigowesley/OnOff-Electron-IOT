const WebSocket = require("ws");
const { getLocalIP} = require("./utils");
const { publishMessage,setBroadcastStatusFunc,subscribeToTopic } = require("./mqtt");

const localIP = getLocalIP();
const wss = new WebSocket.Server({ port: 8080, host: localIP});

function broadcastStatusIP(ip) {
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(localIP);
           // client.send(JSON.stringify({ type: "ipStatus", ip: localIP }));
        }
    });
}

function broadcastStatus(status) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(status); // Envia o status atualizado para os clientes conectados
        }
    });
}

// Assina o tópico "meu/topico" e imprime as mensagens recebidas
async function main() {
    try {
    subscribeToTopic("v1/meu/topico/callback/rele", (mensagem) => {
    wss.clients.forEach(client => {
         console.log("Mensagem recebida do Broaker:", mensagem);
            if (client.readyState === WebSocket.OPEN) {
                client.send(mensagem); // Envia o status atualizado para os clientes conectados
              }
            });
        });
    }catch (error) {
        console.error("Erro ao enviar mensagem:", error);
    }
}

main();
// Configura o MQTT para usar o WebSocket para envio de status
setBroadcastStatusFunc(broadcastStatus);

wss.on("connection", (ws) => {
    console.log("Novo cliente WebSocket conectado.");
    
    broadcastStatusIP(localIP);
    ws.on("message", async (message) => {
        console.log("Mensagem recebida:", message.toString());
        try {
            await publishMessage("v1/meu/topico", message.toString());
        } catch (error) {
            console.error("Erro ao publicar mensagem MQTT:", error);
        }
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});



broadcastStatusIP(localIP);

// ✅ Agora o setInterval está aqui, evitando importação circular
setInterval(() => {
    console.log("Enviando IP via WebSocket...");
    broadcastStatusIP();
}, 10 * 60 * 1000);




module.exports = { wss, broadcastStatus };
