/* =========================================================
   TELEPROMPTER: rolagem do texto
   ========================================================= */
let velocidade = 40;        // pixels por SEGUNDO (independe da taxa de quadros)
const VEL_MIN = 5;
const VEL_PASSO = 10;

let rodando = false;
let frame = null;
let ultimoTempo = 0;
let pos = 0;                // posição em decimal; o iOS arredonda o scroll real

function rolarTexto(t) {
  if (!rodando) return;
  if (ultimoTempo) pos += velocidade * (t - ultimoTempo) / 1000;
  ultimoTempo = t;
  window.scrollTo(0, pos);

  const fim = document.documentElement.scrollHeight - window.innerHeight;
  if (pos >= fim) {
    pausar();
    return;
  }
  frame = requestAnimationFrame(rolarTexto);
}

function iniciar() {
  if (rodando) return;
  rodando = true;
  pos = window.scrollY;     // continua de onde o usuário parou
  ultimoTempo = 0;
  frame = requestAnimationFrame(rolarTexto);
}

function pausar() {
  rodando = false;
  if (frame) cancelAnimationFrame(frame);
}

function aumentarVelocidade() {
  velocidade += VEL_PASSO;
  mostrarStatus("Velocidade: " + velocidade, 1200);
}

function diminuirVelocidade() {
  velocidade = Math.max(VEL_MIN, velocidade - VEL_PASSO);
  mostrarStatus("Velocidade: " + velocidade, 1200);
}

function alternarEspelhamento() {
  document.getElementById("app").classList.toggle("espelhado");
}

/* =========================================================
   MENSAGENS NA TELA
   ========================================================= */
let statusTimer = null;

function mostrarStatus(msg, ms = 0, erro = false) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.classList.toggle("erro", erro);
  el.classList.add("ativo");
  clearTimeout(statusTimer);
  if (ms) statusTimer = setTimeout(() => el.classList.remove("ativo"), ms);
}

/* =========================================================
   CÂMERA E GRAVAÇÃO
   ========================================================= */
let stream = null;
let facing = "user";        // "user" = frontal, "environment" = traseira
let recorder = null;
let chunks = [];
let gravando = false;
let arquivoGravado = null;
let cronometro = null;
let wakeLock = null;

async function iniciarCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    mostrarStatus("Este navegador não permite acesso à câmera. Abra a página por HTTPS no Safari.", 0, true);
    return false;
  }

  if (stream) stream.getTracks().forEach(t => t.stop());

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: true
    });
  } catch (e) {
    const negado = e.name === "NotAllowedError";
    mostrarStatus(
      negado
        ? "Permissão negada. Em Ajustes > Safari > Câmera e Microfone, escolha Perguntar ou Permitir e recarregue."
        : "Não foi possível abrir a câmera: " + e.message,
      0, true
    );
    return false;
  }

  const video = document.getElementById("preview");
  video.srcObject = stream;
  video.classList.toggle("frontal", facing === "user");
  return true;
}

function escolherFormato() {
  const candidatos = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm"
  ];
  return candidatos.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";
}

function contagemRegressiva(segundos) {
  const el = document.getElementById("contagem");
  return new Promise(resolve => {
    let n = segundos;
    el.textContent = n;
    el.classList.add("ativo");
    const id = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(id);
        el.classList.remove("ativo");
        resolve();
      } else {
        el.textContent = n;
      }
    }, 1000);
  });
}

async function pedirWakeLock() {
  try {
    if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
  } catch (_) { /* não é crítico */ }
}

function liberarWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

// O iOS libera o wake lock ao trocar de aba; pede de novo ao voltar
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && gravando) pedirWakeLock();
});

function atualizarTempo(inicio) {
  const s = Math.floor((Date.now() - inicio) / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  document.getElementById("tempo").textContent = `${mm}:${ss}`;
}

async function iniciarGravacao() {
  if (!stream || !stream.active) {
    const ok = await iniciarCamera();
    if (!ok) return;
  }
  if (!window.MediaRecorder) {
    mostrarStatus("Este navegador não suporta gravação. Atualize o iOS (14.3 ou superior).", 0, true);
    return;
  }

  const btnGravar = document.getElementById("gravar");
  btnGravar.disabled = true;
  document.getElementById("salvar").hidden = true;
  arquivoGravado = null;

  window.scrollTo(0, 0);
  await contagemRegressiva(3);

  chunks = [];
  const mime = escolherFormato();
  recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = finalizarGravacao;
  recorder.start(1000);     // entrega pedaços a cada 1s (mais seguro para vídeos longos)

  gravando = true;
  pedirWakeLock();

  const inicio = Date.now();
  atualizarTempo(inicio);
  cronometro = setInterval(() => atualizarTempo(inicio), 500);
  document.getElementById("indicador").classList.add("ativo");
  document.getElementById("trocarCamera").disabled = true;
  btnGravar.textContent = "⏹ Parar";
  btnGravar.disabled = false;

  iniciar();                // o texto começa a rolar junto com a gravação
}

function pararGravacao() {
  if (recorder && recorder.state !== "inactive") recorder.stop();
}

function finalizarGravacao() {
  gravando = false;
  clearInterval(cronometro);
  liberarWakeLock();
  pausar();

  document.getElementById("indicador").classList.remove("ativo");
  document.getElementById("trocarCamera").disabled = false;
  document.getElementById("gravar").textContent = "⏺ Gravar";

  const tipo = (recorder.mimeType || "video/mp4").split(";")[0];
  const ext = tipo.includes("mp4") ? "mp4" : "webm";
  const blob = new Blob(chunks, { type: tipo });
  arquivoGravado = new File([blob], `gravacao-${Date.now()}.${ext}`, { type: tipo });

  document.getElementById("salvar").hidden = false;
  mostrarStatus("Gravação pronta. Toque em Salvar vídeo.", 6000);
}

// Precisa ser chamado por um toque do usuário (exigência do iOS para compartilhar arquivos)
async function salvarVideo() {
  if (!arquivoGravado) return;

  if (navigator.canShare && navigator.canShare({ files: [arquivoGravado] })) {
    try {
      await navigator.share({ files: [arquivoGravado] });   // escolha "Salvar Vídeo" para ir ao app Fotos
      return;
    } catch (e) {
      if (e.name === "AbortError") return;                  // usuário cancelou
    }
  }

  // Alternativa: download normal (vai para o app Arquivos)
  const url = URL.createObjectURL(arquivoGravado);
  const a = document.createElement("a");
  a.href = url;
  a.download = arquivoGravado.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function trocarCamera() {
  facing = facing === "user" ? "environment" : "user";
  await iniciarCamera();
}

/* =========================================================
   LIGAÇÃO DOS BOTÕES
   ========================================================= */
document.getElementById("play").addEventListener("click", iniciar);
document.getElementById("pause").addEventListener("click", pausar);
document.getElementById("maisVelocidade").addEventListener("click", aumentarVelocidade);
document.getElementById("menosVelocidade").addEventListener("click", diminuirVelocidade);
document.getElementById("espelhar").addEventListener("click", alternarEspelhamento);
document.getElementById("trocarCamera").addEventListener("click", trocarCamera);
document.getElementById("salvar").addEventListener("click", salvarVideo);
document.getElementById("gravar").addEventListener("click", () => {
  gravando ? pararGravacao() : iniciarGravacao();
});

iniciarCamera();
