const peers = {};
let localStream = null;
let audioContext = null;
let analyser = null;
let speaking = false;

// --------------------
// Rejoindre le vocal
// --------------------
async function joinVoice() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(localStream);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);

    detectSpeaking();

    socket.emit("joinVoice");

  } catch (e) {
    alert("Micro inaccessible (permission ou HTTPS requis)");
    console.error(e);
  }
}

// --------------------
// Détection parole
// --------------------
function detectSpeaking() {
  const data = new Uint8Array(analyser.fftSize);

  function loop() {
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i] - 128);
    }

    const level = sum / data.length;
    const isSpeaking = level > 5;

    if (isSpeaking !== speaking) {
      speaking = isSpeaking;
      socket.emit("voiceSpeaking", speaking);
    }

    requestAnimationFrame(loop);
  }

  loop();
}

// --------------------
// Créer peer
// --------------------
function createPeer(id) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("webrtc-candidate", { to: id, candidate: e.candidate });
    }
  };

  pc.ontrack = e => {
    const audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  peers[id] = pc;
  return pc;
}

// --------------------
// WebRTC events
// --------------------
socket.on("webrtc-offer", async ({ from, offer }) => {
  const pc = createPeer(from);
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("webrtc-answer", { to: from, answer });
});

socket.on("webrtc-answer", async ({ from, answer }) => {
  await peers[from].setRemoteDescription(answer);
});

socket.on("webrtc-candidate", ({ from, candidate }) => {
  peers[from]?.addIceCandidate(candidate);
});
