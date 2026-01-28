const callBtn = document.getElementById("callBtn");
const muteBtn = document.getElementById("muteBtn");
const micSelect = document.getElementById("micSelect");

let localStream = null;
let peer = null;
let isMuted = false;

// --------------------
// WebRTC config
// --------------------
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

// --------------------
// Liste micros
// --------------------
async function loadMics() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  micSelect.innerHTML = "";

  devices.forEach(d => {
    if (d.kind === "audioinput") {
      const opt = document.createElement("option");
      opt.value = d.deviceId;
      opt.textContent = d.label || "Micro";
      micSelect.appendChild(opt);
    }
  });
}

// iOS / mobile : labels après permission
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
  stream.getTracks().forEach(t => t.stop());
  loadMics();
});

// --------------------
// Start call
// --------------------
callBtn.onclick = async () => {
  if (peer) return;

  const deviceId = micSelect.value;

  localStream = await navigator.mediaDevices.getUserMedia({
    audio: deviceId ? { deviceId: { exact: deviceId } } : true
  });

  peer = new RTCPeerConnection(rtcConfig);

  // Envoie micro
  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  // Reçoit audio
  peer.ontrack = e => {
    const audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  // ICE
  peer.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("webrtc-candidate", e.candidate);
    }
  };

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("webrtc-offer", offer);
};

// --------------------
// Mute micro
// --------------------
muteBtn.onclick = () => {
  if (!localStream) return;

  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteBtn.textContent = isMuted ? "🔇 Muet" : "🎤 Actif";
};

// --------------------
// SIGNALISATION SOCKET
// --------------------
socket.on("webrtc-offer", async offer => {
  if (peer) return;

  peer = new RTCPeerConnection(rtcConfig);

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  peer.ontrack = e => {
    const audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  peer.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("webrtc-candidate", e.candidate);
    }
  };

  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("webrtc-answer", answer);
});

socket.on("webrtc-answer", answer => {
  peer?.setRemoteDescription(answer);
});

socket.on("webrtc-candidate", candidate => {
  peer?.addIceCandidate(candidate);
});

