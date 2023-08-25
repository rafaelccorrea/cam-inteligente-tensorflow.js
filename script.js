// Obtém a referência para o elemento de vídeo da webcam no HTML.
const video = document.getElementById('webcam');

// Obtém a referência para a área de visualização ao vivo no HTML.
const liveView = document.getElementById('liveView');

// Obtém a referência para a seção de demonstrações no HTML.
const demosSection = document.getElementById('demos');

// Obtém a referência para o botão que ativa a webcam.
const enableWebcamButton = document.getElementById('webcamButton');

// Verifica se o acesso à webcam é suportado pelo navegador.
function getUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Se o acesso à webcam for suportado, adiciona um ouvinte de evento ao botão
// para quando o usuário desejar ativá-lo, chamando a função enableCam, que será
// definida no próximo passo.
if (getUserMediaSupported()) {
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() não é suportado pelo seu navegador');
}

// Ativa a visualização ao vivo da webcam e inicia a classificação.
function enableCam(event) {
    // Continua apenas se o modelo COCO-SSD já tiver sido carregado.
    if (!model) {
        return;
    }

    // Oculta o botão após clicado.
    event.target.classList.add('removed');

    // Parâmetros para obter o fluxo da webcam, permitindo apenas vídeo.
    const constraints = {
        video: true
    };

    // Ativa o fluxo da webcam.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}

// Armazena o modelo resultante no escopo global do aplicativo.
var model = undefined;

// Antes de podermos usar a classe COCO-SSD, devemos esperar que o carregamento seja concluído.
// Modelos de Aprendizado de Máquina podem ser grandes e levar um momento para obter tudo o que é necessário para a execução.
// Nota: cocoSsd é um objeto externo carregado de nossa tag de script no index.html, então ignore qualquer aviso no Glitch.
cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
    // Mostra a seção de demonstrações agora que o modelo está pronto para uso.
    demosSection.classList.remove('invisible');
});

// Array para armazenar elementos de destaque das previsões anteriores.
var children = [];

function predictWebcam() {
    // Começa a classificar um quadro do fluxo.
    model.detect(video).then(function (predictions) {
        // Remove qualquer destaque da quadro anterior.
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        // Percorre as previsões e as desenha na visualização ao vivo se tiverem uma pontuação de confiança alta.
        for (let n = 0; n < predictions.length; n++) {
            // Se estivermos mais de 50% certeza de que classificamos corretamente, desenhe!
            if (predictions[n].score > 0.50) {
                const p = document.createElement('p');
                p.innerText = predictions[n].class + ' - com '
                    + Math.round(parseFloat(predictions[n].score) * 100)
                    + '% de certeza.';
                p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
                    + (predictions[n].bbox[1] - 10) + 'px; width: '
                    + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';

                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
                    + predictions[n].bbox[1] + 'px; width: '
                    + predictions[n].bbox[2] + 'px; height: '
                    + predictions[n].bbox[3] + 'px;';

                liveView.appendChild(highlighter);
                liveView.appendChild(p);
                children.push(highlighter);
                children.push(p);
            }
        }

        // Chama esta função novamente para continuar prevendo quando o navegador estiver pronto.
        window.requestAnimationFrame(predictWebcam);
    });
}
