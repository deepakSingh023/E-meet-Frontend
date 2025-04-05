import socket from "./sockets";

const peers = {};

export const getPeers = () => peers;

export const getLocalStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    return stream;
  } catch (err) {
    console.error("Error accessing media devices.", err);
    throw err;
  }
};

export const createPeerConnection = (socket, peerId, onRemoteStream, localStream) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  // Add local tracks
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle incoming ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        target: peerId,
        candidate: event.candidate,
      });
    }
  };

  // When remote stream arrives
  peerConnection.ontrack = (event) => {
    onRemoteStream(peerId, event.streams[0]);
  };

  // Answer incoming offers
  socket.on("offer", async ({ sender, offer }) => {
    if (sender !== peerId) return;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", {
      target: sender,
      answer,
    });
  });

  return peerConnection;
};
