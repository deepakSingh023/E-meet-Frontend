// webrtc.js
import socket from './sockets';

// Store peer connections
const peers = {};

// Get user media
export async function getLocalStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      }
    });
  } catch (err) {
    console.error("Error accessing media devices:", err);
    alert("Failed to access camera and microphone. Please ensure they are connected and permissions are granted.");
    throw err;
  }
}

// Create a peer connection
export async function createPeerConnection(socket, remoteId, onStreamCallback, localStream) {
  console.log(`Creating peer connection for ${remoteId}`);
  
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };
  
  try {
    const pc = new RTCPeerConnection(configuration);
    
    // Add local tracks to the connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });
    
    // Handle incoming streams
    pc.ontrack = (event) => {
      console.log(`Track received from ${remoteId}`, event.streams[0]);
      if (event.streams && event.streams[0]) {
        onStreamCallback(remoteId, event.streams[0]);
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${remoteId}`);
        socket.emit("ice-candidate", {
          target: remoteId,
          candidate: event.candidate,
        });
      }
    };
    
    // Log connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state change: ${pc.connectionState} with ${remoteId}`);
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state change: ${pc.iceConnectionState} with ${remoteId}`);
    };
    
    return pc;
  } catch (err) {
    console.error("Error creating peer connection:", err);
    throw err;
  }
}

// Get all peer connections
export function getPeers() {
  return peers;
}