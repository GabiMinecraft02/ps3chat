let localStream = null;
let peers = {};

const micBtn = document.getElementById("micBtn");
const muteBtn = document.getElementById("muteBtn");

// --------------------
// ACTIVER MICRO
// --------------------
micBtn.onclick = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    socket.emit("joinVoice");
  } catch (e) {
    alert("Micro refusé ou introuvable");
    console.error(e);
  }
};

// --------------------
// MUTE
// --------------------
muteBtn.onclick = () => {
  if (!localStream) return;

  const track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;

  muteBtn.textContent = track.enabled ? "🔇 Mute" : "🎤 Actif";

  if (!track.enabled) socket.emit("leaveVoice");
  else socket.emit("joinVoice");
};

// --------------------
// WEBRTC SIGNALING
// --------------------
socket.on("webrtc-offer", async offer => {
  const pc = createPeer();
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("webrtc-answer", answer);
});

socket.on("webrtc-answer", answer => {
  Object.values(peers).forEach(pc => pc.setRemoteDescription(answer));
});

socket.on("webrtc-candidate", candidate => {
  Object.values(peers).forEach(pc => pc.addIceCandidate(candidate));
});

function createPeer() {
  const pc = new RTCPeerConnection();

  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  pc.onicecandidate = e => {
    if (e.candidate) socket.emit("webrtc-candidate", e.candidate);
  };

  pc.ontrack = e => {
    const audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
  };

  peers[Math.random()] = pc;
  return pc;
}
