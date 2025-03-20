const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://test.mosquitto.org", {
    reconnectPeriod: 2000, // Reconexão automática a cada 2 segundos
    keepalive: 10, // Mantém a conexão ativa enviando pacotes a cada 10s
    connectTimeout: 5000 // Tempo limite para tentar conectar
});

let mqttStatus = "desconectado"; // Estado inicial do MQTT
let broadcastStatus = null; // Função que será usada pelo WebSocket para enviar status

// Define a função de broadcast do WebSocket
function setBroadcastStatusFunc(func) {
    broadcastStatus = func;
}

// Função assíncrona para publicar mensagens
async function publishMessage(topic, message) {
    if (!client.connected) {
        console.error("Nao conectado ao MQTT. Mensagem nao enviada.");
        return;
    }

    return new Promise((resolve, reject) => {
        client.publish(topic, message.toString(), (err) => {
            if (err) {
                console.error("❌ Erro ao publicar mensagem:", err);
                reject(err);
            } else {
                console.log(`Mensagem publicada no topico ${topic}: ${message}`);
                resolve();
            }
        });
    });
}

// Função assíncrona para assinar um tópico e receber mensagens
async function subscribeToTopic(topic, callback) {
    return new Promise((resolve, reject) => {
        client.subscribe(topic, (err) => {
            if (err) {
                console.error(`Erro ao se inscrever no topico ${topic}:`, err);
                reject(err);
            } else {
                console.log(`Inscrito no topico: ${topic}`);
                resolve();
            }
            client.on("message", (receivedTopic, message) => {
                if (receivedTopic === topic) {
                    console.log(`Mensagem recebida no Broaker ${topic}: ${message.toString()}`);
                    if (callback) {
                        callback(message.toString());
                    }
                }
            });
        });
    });

    
}



// Função assíncrona para verificar o status do MQTT
async function checkMQTTStatus() {
    try {
        if (client.connected) {
            mqttStatus = "conectado";
        } else {
            mqttStatus = "desconectado";
        }

        console.log("Status atual do MQTT:", mqttStatus);

        // Se houver um WebSocket ativo, envia o status atualizado
        if (broadcastStatus) {
            await broadcastStatus(mqttStatus);
        }
    } catch (error) {
        console.error("Erro ao verificar o status do MQTT:", error);
    }
}

// Eventos do MQTT
client.on("connect", () => {
    console.log("Conectado ao MQTT!");
    mqttStatus = "conectado";
    if (broadcastStatus) broadcastStatus(mqttStatus);
});

client.on("reconnect", () => {
    console.log("Reconectando ao MQTT...");
    mqttStatus = "reconectando";
    if (broadcastStatus) broadcastStatus(mqttStatus);
});

client.on("close", () => {
    console.log("Conexão com MQTT fechada.");
    mqttStatus = "desconectado";
    if (broadcastStatus) broadcastStatus(mqttStatus);
});

client.on("error", (err) => {
    console.error("Erro no MQTT:", err.message);
    mqttStatus = "erro";
    if (broadcastStatus) broadcastStatus(mqttStatus);
});

// Função assíncrona para rodar o intervalo corretamente
async function startMQTTStatusCheck() {
    while (true) {
        await checkMQTTStatus();
        await new Promise(resolve => setTimeout(resolve, 10000)); // Aguarda 10s antes de repetir
    }
}
startMQTTStatusCheck();
// Exporta funções
module.exports = {
    publishMessage,
    subscribeToTopic,
    mqttStatus,
    setBroadcastStatusFunc,
};
