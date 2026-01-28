const peers = {};
const localVideo = document.createElement("audio"); // juste audio

function addLocalStream(stream) {
  localVideo.srcObject = stream;
  localVideo.autoplay = true;
}

// Quand quelqu’un rejoint / offre un flux
socket.on("webrtc-offer", async ({ from, offer }) => {
  const pc = createPeerConnection(from);
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("webrtc-answer", { to: from, answer });
});

// Quand on reçoit un answer
socket.on("webrtc-answer", async ({ from, answer }) => {
  const pc = peers[from];
  if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
});

// ICE candidates
socket.on("webrtc-candidate", ({ from, candidate }) => {
  const pc = peers[from];
  if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate));
});

function createPeerConnection(id) {
  const pc = new RTCPeerConnection();
  if (localStream) localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = event => {
    let audio = document.getElementById("audio-" + id);
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "audio-" + id;
      audio.autoplay = true;
      document.body.appendChild(audio);
    }
    audio.srcObject = event.streams[0];
  };

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("webrtc-candidate", { to: id, candidate: e.candidate });
    }
  };

  peers[id] = pc;
  return pc;
}

// Quand quelqu’un rejoint le vocal, crée un offer
socket.on("voiceUsers", list => {
  list.forEach(u => {
    if (u.pseudo !== myPseudo && !peers[u.socketId]) {
      const pc = createPeerConnection(u.socketId);
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: u.socketId, offer });
      });
    }
  });
});
