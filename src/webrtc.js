let localStream;
const peers = {};

export const getLocalStream = async () => {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }
  return localStream;
};

export const createPeerConnection = async (socket, remoteUserId, onRemoteStream) => {
  const stream = await getLocalStream(); // ensure localStream is initialized

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Add local tracks to peer connection
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", { target: remoteUserId, candidate: event.candidate });
    }
  };

  pc.ontrack = (event) => {
    if (onRemoteStream) onRemoteStream(remoteUserId, event.streams[0]);
  };

  return pc;
};

export const getPeers = () => peers;
