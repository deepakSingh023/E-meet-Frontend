let localStream;
const peers = {};

export const getLocalStream = async () => {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }
  return localStream;
};

export const createPeerConnection = (socket, remoteUserId, localVideoRef, onRemoteStream) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

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
