const socket = io(); // même socket que chat.js

let localStream = null;
let peers = {}; // { socketId: RTCPeerConnection }
let inVoice = false;
let isMuted = false;
let isSilenced = false;

// --------------------
// Boutons
// --------------------
const voiceBtn = document.getElementById("voice-btn");
const muteBtn = document.getElementById("mute-btn");
const silenceBtn = document.getElementById("silence-btn");

// --------------------
// Rejoindre / quitter vocal
// --------------------
voiceBtn.onclick = async () => {
    if (!inVoice) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            inVoice = true;
            voiceBtn.textContent = "Quitter vocal";
            socket.emit("joinVoice");

            for (let id in peers) {
                localStream.getTracks().forEach(track => peers[id].addTrack(track, localStream));
            }
        } catch (err) {
            alert("Impossible d'accéder au micro. Vérifie les permissions.");
            console.error(err);
        }
    } else {
        // quitter vocal
        inVoice = false;
        voiceBtn.textContent = "Rejoindre vocal";
        socket.emit("leaveVoice");

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
    }
};

// --------------------
// Activer / désactiver micro
// --------------------
muteBtn.onclick = () => {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks()[0].enabled = !isMuted;
    muteBtn.textContent = isMuted ? "🔇 Muet" : "🎤 Actif";
};

// --------------------
// Sourdine (entendre les autres)
/// --------------------
silenceBtn.onclick = () => {
    isSilenced = !isSilenced;
    const audios = document.querySelectorAll("audio.peer");
    audios.forEach(a => a.muted = isSilenced);
    silenceBtn.textContent = isSilenced ? "Sourdine" : "Entendre";
};

// --------------------
// SIGNALING
// --------------------
socket.on("webrtc-offer", async ({ from, offer }) => {
    const pc = createPeer(from);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("webrtc-answer", { to: from, answer });
});

socket.on("webrtc-answer", async ({ from, answer }) => {
    const pc = peers[from];
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("webrtc-candidate", ({ from, candidate }) => {
    const pc = peers[from];
    if (!pc) return;
    pc.addIceCandidate(new RTCIceCandidate(candidate));
});

// --------------------
// Créer un peer
// --------------------
function createPeer(socketId) {
    const pc = new RTCPeerConnection();

    if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("webrtc-candidate", { to: socketId, candidate: event.candidate });
        }
    };

    pc.ontrack = (event) => {
        let audio = document.getElementById(`audio-${socketId}`);
        if (!audio) {
            audio = document.createElement("audio");
            audio.id = `audio-${socketId}`;
            audio.autoplay = true;
            audio.className = "peer";
            document.body.appendChild(audio);
        }
        audio.srcObject = event.streams[0];
        audio.muted = isSilenced;
    };

    peers[socketId] = pc;
    return pc;
}

// --------------------
// Quand un utilisateur rejoint / quitte vocal
// --------------------
socket.on("voiceUsers", list => {
    const usersUl = document.getElementById("users");
    usersUl.querySelectorAll("li").forEach(li => {
        const status = li.querySelector(".status");
        if (!status) return;
        const u = list.find(u => u.pseudo === li.dataset.pseudo);
        if (!u) status.textContent = "🔈"; // hors vocal
        else status.textContent = u.speaking ? "🔊" : "🔈";
    });
});
