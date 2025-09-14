// Conecta botões com funções
document.getElementById("play").addEventListener("click", iniciar);
document.getElementById("pause").addEventListener("click", pausar);
document.getElementById("maisVelocidade").addEventListener("click", aumentarVelocidade);
document.getElementById("menosVelocidade").addEventListener("click", diminuirVelocidade);
document.getElementById("espelhar").addEventListener("click", alternarEspelhamento);

log("Teleprompter carregado!");
