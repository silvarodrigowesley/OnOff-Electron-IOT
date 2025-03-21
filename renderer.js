document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado!");
  
       
    // Verifica se está rodando dentro do Electron
    const isElectron = window.api !== undefined;

    if (!isElectron) {
        console.warn("A página está rodando no navegador e não tem acesso à API do Electron.");
    }

    // Pegue os botões pelos seus IDs
    const botao1 = document.getElementById("btn1");
    const botao2 = document.getElementById("btn2");
 // Função para obter o IP local e inicializar o WebSocket
 function obterIPLocalEConectar() {
    if (isElectron) {
        window.api.obterIPLocal((ip) => {
            
            inicializarWebSocket(ip);
        });
    } 
}

// Chama a função para conectar ao WebSocket com o IP local
obterIPLocalEConectar();

    // Variável para o WebSocket
    let socket;
let message;
    // Função para inicializar WebSocket
    function inicializarWebSocket(ip) {
        socket = new WebSocket(`ws://${ip}:8080`);

        socket.onopen = () => {
            console.log("Conectado ao WebSocket!");
        };

        socket.onerror = (error) => {
            console.error("Erro no WebSocket:", error);
        };

        socket.onmessage = (event) => {
            if (typeof event.data === "string") {
                message = String(event.data).toUpperCase(); // Converte para string e para minúsculas
                console.log("Mensagem recebidaaaa:", message.toUpperCase());
                const mensagensPermitidas = ["CONECTADO", "RECONECTADO", "DESCONECTADO", "ERRO"];
                
                if (mensagensPermitidas.includes(message.toUpperCase())) {
                    document.getElementById("status").innerText = message.toUpperCase();
                }else if(message.startsWith("RELE")){
                    document.getElementById("statusReles").innerText = message.toUpperCase();
                }else{
                    document.getElementById("statusIp").innerText = message.toUpperCase();
                }
            } else if (event.data instanceof Blob) {
                // Se for um Blob, convertemos para string
                event.data.text().then(text => {
                    console.log("Mensagem recebida é Blob via WebSocket:", text);
                    atualizarBotao(text);
                }).catch(error => {
                    console.error("Erro ao converter Blob para texto:", error);
                });
            } else {
                console.error("Formato de mensagem WebSocket desconhecido:", event.data);
            }
        };
    }

   

    // Atualiza o status do botão
    function atualizarBotao(status) {
        let botao;
        let labelOn, labelOff;
        console.log("atualiza status", status);
        if (status.includes("1")) {
            botao = botao1;
            labelOn = "ON-1";
            labelOff = "OFF-1";
        } else if (status.includes("2")) {
            botao = botao2;
            labelOn = "ON-2";
            labelOff = "OFF-2";
        } else {
            return; // Ignora status desconhecido
        }

        botao.classList.toggle("liga", status.includes("ON"));
        botao.classList.toggle("desliga", status.includes("OFF"));
        botao.textContent = botao.classList.contains("desliga") ? labelOff : labelOn;
    }

    botao1.addEventListener("click", () => {
        const status = botao1.classList.contains("desliga") ? "ON-1" : "OFF-1";
        enviarStatus(status);
        //socket.send(status);
    });

    botao2.addEventListener("click", () => {
        const status = botao2.classList.contains("desliga") ? "ON-2" : "OFF-2";
        enviarStatus(status);
        //socket.send(status);
    });

    function enviarStatus(status) {
        if (isElectron) {
            window.api.enviarMensagem(status);
            socket.send(status);
        } else if (socket.readyState === WebSocket.OPEN) {
            socket.send(status);
        } else {
            console.error("WebSocket não está conectado!");
            const msg = "O Aplicativo Foi fechado!!! :<"
            document.getElementById("status").innerText = msg.toUpperCase();
        }
    }
    

    // Recebe resposta do Electron e atualiza o botão
    if (isElectron) {
        window.api.receberResposta(atualizarBotao);
    }
});
