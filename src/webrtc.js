let localStream;
const peers = {};

export const getLocalStream = async () => {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }
  return localStream;
};

export const createPeerConnection = async (socket, remoteUserId, onRemoteStream, localStream) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  // Add local audio/video tracks to the peer connection
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // Send ICE candidates to remote peer
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        target: remoteUserId,
        candidate: event.candidate,
      });
    }
  };

  // Receive remote stream
  pc.ontrack = (event) => {
    console.log("Received remote track from:", remoteUserId);
    const remoteStream = event.streams[0];
    if (onRemoteStream) {
      onRemoteStream(remoteUserId, remoteStream);
    }
  };

  return pc;
};

export const getPeers = () => peers;
