document.addEventListener("DOMContentLoaded", async () => {
  const voiceBtn = document.getElementById("voice-btn");
  const muteBtn = document.getElementById("mute-btn");

  if (!voiceBtn || !muteBtn) {
    console.warn("Boutons micro absents");
    return;
  }

  let stream = null;
  let muted = false;

  voiceBtn.onclick = async () => {
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        voiceBtn.textContent = "🎤 Activé";
      } catch (e) {
        alert("Micro refusé");
      }
    } else {
      stopStream();
    }
  };

  muteBtn.onclick = () => {
    if (!stream) return;

    muted = !muted;
    stream.getAudioTracks().forEach(t => (t.enabled = !muted));
    muteBtn.textContent = muted ? "🔊 Son coupé" : "🔇 Muet";
  };

  function stopStream() {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    muted = false;
    voiceBtn.textContent = "🎤 Activer";
    muteBtn.textContent = "🔇 Muet";
  }
});
