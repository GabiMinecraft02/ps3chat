const startBtn = document.getElementById("voice-btn");
const muteBtn = document.getElementById("mute-btn");

let localStream;
let muted = false;

startBtn.addEventListener("click", async () => {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // ici tu peux brancher à WebRTC peer connection
  }
  localStream.getAudioTracks()[0].enabled = true;
});

muteBtn.addEventListener("click", () => {
  if (!localStream) return;
  muted = !muted;
  localStream.getAudioTracks()[0].enabled = !muted;
  muteBtn.textContent = muted ? "🔇 Muet" : "🎤 Activer";
});



