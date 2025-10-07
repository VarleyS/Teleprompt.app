let velocidade = 0.05; // pixels por frame (mais suave)
let rodando = false;
let frame;

function rolarTexto() {
  if (rodando) {
    window.scrollBy(0, velocidade);
    frame = requestAnimationFrame(rolarTexto);
  }
}

function iniciar() {
  if (!rodando) {
    rodando = true;
    rolarTexto();
  }
}

function pausar() {
  rodando = false;
  cancelAnimationFrame(frame);
}

function aumentarVelocidade() {
  velocidade += 0.2;
  log("Velocidade aumentada: " + velocidade.toFixed(3));
}

function diminuirVelocidade() {
  if (velocidade > 0.1) {
    velocidade -= 0.2;
    log("Velocidade reduzida: " + velocidade.toFixed(3));
  }
}

function alternarEspelhamento() {
  const app = document.getElementById("app");
  app.classList.toggle("espelhado");
}
