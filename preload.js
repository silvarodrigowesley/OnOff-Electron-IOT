const { contextBridge, ipcRenderer } = require("electron");

// Expor uma API segura para o renderer process (frontend)
contextBridge.exposeInMainWorld("api", {
    enviarMensagem: (mensagem) => ipcRenderer.send("botao-clicado", mensagem),
        receberResposta: (callback) => {
        if (typeof callback !== "function") {
            console.error("Erro: callback não é uma função! Tipo recebido:", typeof callback, callback);
            return;
        }
        ipcRenderer.on("resposta-do-main", (_event, resposta) => callback(resposta));
    }
});
