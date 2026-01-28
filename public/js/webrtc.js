// webrtc.js
document.addEventListener("DOMContentLoaded", () => {
  let localStream;
  let pc;

  const startBtn = document.getElementById("startCall");
  const muteBtn = document.getElementById("muteBtn");
  const localAudio = document.getElementById("localAudio");

  startBtn.onclick = async () => {
    if (!pc) pc = new RTCPeerConnection();

    // Récupérer le micro
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localAudio.srcObject = localStream;

    // Ajouter pistes locales
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // ICE candidates
    pc.onicecandidate = event => {
      if (event.candidate) socket.emit("webrtc-candidate", event.candidate);
    };

    // Ajouter audio distant
    pc.ontrack = event => {
      const remoteAudio = document.getElementById("remoteAudio");
      if (!remoteAudio.srcObject) remoteAudio.srcObject = event.streams[0];
    };

    // Recevoir offre
    socket.on("webrtc-offer", async offer => {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", answer);
    });

    // Recevoir answer
    socket.on("webrtc-answer", async answer => {
      await pc.setRemoteDescription(answer);
    });

    // Recevoir ICE candidate
    socket.on("webrtc-candidate", async candidate => {
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.error("Erreur ICE candidate", e);
      }
    });

    // Créer offre si c'est le premier
    if (!pc.currentLocalDescription) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", offer);
    }
  };

  // Bouton mute / unmute
  muteBtn.onclick = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
  };
});
