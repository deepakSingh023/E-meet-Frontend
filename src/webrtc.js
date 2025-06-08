const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const peers = {};

export const getLocalStream = async () => {
  try {
    return await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: true 
    });
  } catch (error) {
    console.error('Error getting local stream:', error);
    throw error;
  }
};

export const createPeerConnection = async (socket, peerId, onStream, localStream) => {
  const pc = new RTCPeerConnection(peerConnectionConfig);

  // Add local tracks
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // ICE candidate handling
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('ice-candidate', { target: peerId, candidate });
    }
  };

  // Handle remote stream
  pc.ontrack = (event) => {
    if (event.streams[0]) {
      onStream(peerId, event.streams[0]);
    }
  };

  // Clean up on connection failure
  pc.onconnectionstatechange = () => {
    if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
      removePeer(peerId);
    }
  };

  peers[peerId] = pc;
  return pc;
};

export const getPeers = () => peers;

export const removePeer = (peerId) => {
  if (peers[peerId]) {
    peers[peerId].close();
    delete peers[peerId];
  }
};

export const closeAllPeers = () => {
  Object.values(peers).forEach(pc => pc.close());
  Object.keys(peers).forEach(id => delete peers[id]);
};

export const getScreenShareStream = async () => {
  try {
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });
  } catch (error) {
    console.error('Error getting screen share:', error);
    throw error;
  }
};