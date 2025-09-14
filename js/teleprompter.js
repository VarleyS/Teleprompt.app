let velocidade = 1; // pixels por frame
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
    log("Rolagem iniciada");
  }
}

function pausar() {
  rodando = false;
  cancelAnimationFrame(frame);
  log("Rolagem pausada");
}

function aumentarVelocidade() {
  velocidade += 0.1;
  log("Velocidade: " + velocidade);
}

function diminuirVelocidade() {
  if (velocidade > 0.1) {
    velocidade -= 0.2;
    log("Velocidade: " + velocidade);
  }
}

function alternarEspelhamento() {
  const app = document.getElementById("app");
  app.classList.toggle("espelhado");
  log("Espelhamento ativado: " + app.classList.contains("espelhado"));
}

