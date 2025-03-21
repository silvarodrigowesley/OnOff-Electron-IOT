document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado!");
   
    /*function obterIPLocal() {
        fetch(`http://${window.location.hostname}:3000/getLocalIP`)
            .then(response => response.json())
            .then(data => {
                console.log("IP Local recebido:", data.ip);
                document.getElementById("ipLocal").innerText = `IP Local: ${data.ip}`;
            })
            .catch(error => console.error("Erro ao obter IP:", error));
            return data.ip
    }
 // Chamar a função ao carregar a página
 window.onload = obterIPLocal;*/
   
    // Pegue os botões pelos seus IDs
    const botao1 = document.getElementById("btn1");
    const botao2 = document.getElementById("btn2");

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

    // Função para obter o IP local e inicializar o WebSocket
    function obterIPLocalEConectar() {
       
            const ip = window.location.hostname; // IP estático para o navegador
            inicializarWebSocket(ip);
        
    }

    // Chama a função para conectar ao WebSocket com o IP local
    obterIPLocalEConectar();

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
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(status);
        } else {
             console.error("WebSocket não está conectado!");
             alert("O Aplicativo Foi fechado!!! :< Abra o APP Novamente");
            const msg = "O Aplicativo Foi fechado!!! :< Abra o APP Novamente"
            document.getElementById("status").innerText = msg.toUpperCase();
        }
    }
    document.getElementById('openWifiForm').addEventListener('click', () => {
        const form = document.getElementById('wifiForm');
        const overlay = document.getElementById('overlay');
        form.style.display = 'block';
       overlay.style.display = 'block';
    });
    
    window.enviarWifi = function () {
        const ssid = document.getElementById('wifiSSID').value;
        const password = document.getElementById('wifiPassword').value;
        obterIPLocalEConectar();
        if (!ssid || !password) {
            alert("Por favor, preencha ambos os campos!");
            return;
        }

            console.log("WiFi Salvo:", { ssid, password });
    
        fetch(`http://${window.location.hostname}:3000/wifi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ssid, password })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
    
            // Limpar os campos após o envio
            document.getElementById('wifiSSID').value = "";
            document.getElementById('wifiPassword').value = "";
    
            // Fechar o formulário e o fundo escuro
            document.getElementById('wifiForm').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
        })
        .catch(error => console.error("Erro ao enviar WiFi:", error));
    };
        
        
    
    // Para fechar o formulário ao clicar fora
       document.getElementById('overlay').addEventListener('click', () => {
        document.getElementById('wifiForm').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    });
    
    

   
});
