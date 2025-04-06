// webrtc.js
const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ]
};

// Store all peer connections
const peers = {};

/**
 * Get user's local media stream (audio and video)
 * @param {Object} constraints - Media constraints
 * @returns {Promise<MediaStream>} Local media stream
 */
export const getLocalStream = async (constraints = { audio: true, video: true }) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Local media stream obtained successfully');
    return stream;
  } catch (error) {
    console.error('Error getting local media stream:', error);
    throw error;
  }
};

/**
 * Create a new RTCPeerConnection for a remote peer
 * @param {Object} socket - Socket.io instance
 * @param {string} remotePeerId - ID of the remote peer
 * @param {Function} onStreamCallback - Callback function when remote stream is received
 * @param {MediaStream} localStream - Local media stream to add to the connection
 * @returns {RTCPeerConnection} The created peer connection
 */
export const createPeerConnection = async (socket, remotePeerId, onStreamCallback, localStream) => {
  try {
    // Create a new peer connection
    const peerConnection = new RTCPeerConnection(peerConnectionConfig);
    
    // Add all local tracks to the peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      console.log(`Added ${localStream.getTracks().length} local tracks to connection with ${remotePeerId}`);
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log(`Sending ICE candidate to ${remotePeerId}`);
        socket.emit('ice-candidate', {
          target: remotePeerId,
          candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${remotePeerId} changed to: ${peerConnection.connectionState}`);
      
      // Clean up failed connections
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        if (peers[remotePeerId]) {
          peerConnection.close();
          delete peers[remotePeerId];
          console.log(`Cleaned up connection with ${remotePeerId}`);
        }
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${remotePeerId} changed to: ${peerConnection.iceConnectionState}`);
    };

    // Handle receiving remote tracks
    peerConnection.ontrack = (event) => {
      console.log(`Received tracks from ${remotePeerId}`);
      const remoteStream = event.streams[0];
      if (remoteStream) {
        onStreamCallback(remotePeerId, remoteStream);
      }
    };

    // Log negotiation needed events
    peerConnection.onnegotiationneeded = () => {
      console.log(`Negotiation needed for connection with ${remotePeerId}`);
    };

    return peerConnection;
  } catch (error) {
    console.error(`Error creating peer connection with ${remotePeerId}:`, error);
    throw error;
  }
};

/**
 * Get the object containing all peer connections
 * @returns {Object} Peer connections object
 */
export const getPeers = () => {
  return peers;
};

/**
 * Remove a specific peer connection
 * @param {string} peerId - ID of the peer to remove
 */
export const removePeer = (peerId) => {
  if (peers[peerId]) {
    peers[peerId].close();
    delete peers[peerId];
    console.log(`Removed peer connection: ${peerId}`);
  }
};

/**
 * Close and remove all peer connections
 */
export const closeAllPeers = () => {
  Object.values(peers).forEach(pc => pc.close());
  for (const id in peers) {
    delete peers[id];
  }
  console.log('All peer connections closed and removed');
};

/**
 * Handle media device change (camera/mic switch)
 * @param {MediaStream} newStream - New media stream to use
 */
export const updateLocalStream = (newStream) => {
  // Replace tracks in all peer connections
  Object.values(peers).forEach(pc => {
    const senders = pc.getSenders();
    
    newStream.getTracks().forEach(track => {
      const sender = senders.find(s => s.track && s.track.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track);
      }
    });
  });
  
  console.log('Local stream updated in all peer connections');
};

/**
 * Share screen instead of camera
 * @returns {Promise<MediaStream>} Screen sharing media stream
 */
export const getScreenShareStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });
    console.log('Screen sharing stream obtained successfully');
    return stream;
  } catch (error) {
    console.error('Error getting screen sharing stream:', error);
    throw error;
  }
};

/**
 * Helper function to restart an ICE connection
 * @param {string} peerId - ID of the peer to restart connection with
 */
export const restartIceForPeer = async (peerId) => {
  const pc = peers[peerId];
  if (pc) {
    try {
      await pc.restartIce();
      console.log(`ICE connection restarted for peer: ${peerId}`);
    } catch (error) {
      console.error(`Error restarting ICE for peer ${peerId}:`, error);
    }
  }
};

/**
 * Utility function to check if browser supports WebRTC
 * @returns {boolean} Whether WebRTC is supported
 */
export const isWebRTCSupported = () => {
  return !!(navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia && 
    window.RTCPeerConnection);
};