let velocidade = 0.3; // pixels por frame (mais suave)
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
  velocidade += 0.1;
  log("Velocidade aumentada: " + velocidade.toFixed(2));
}

function diminuirVelocidade() {
  if (velocidade > 0.1) {
    velocidade -= 0.1;
    log("Velocidade reduzida: " + velocidade.toFixed(2));
  }
}

function alternarEspelhamento() {
  const app = document.getElementById("app");
  app.classList.toggle("espelhado");
}
