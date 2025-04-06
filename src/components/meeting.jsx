import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../sockets";
import { getLocalStream, createPeerConnection, getPeers } from "../webrtc";

export default function Meeting() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef();
  const [localStream, setLocalStream] = useState(null);
  const [remoteVideos, setRemoteVideos] = useState({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState(0);
  const myVideoCallIdRef = useRef(null);
  const connectedPeersRef = useRef(new Set());
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  const handleRemoteStream = useCallback((videoCallId, stream) => {
    console.log("🎥 Remote stream received from:", videoCallId);
    setRemoteVideos((prev) => ({ ...prev, [videoCallId]: stream }));
  }, []);

  // Display connection status
  useEffect(() => {
    const timer = setTimeout(() => {
      if (participants === 0) {
        setConnectionStatus("Waiting for participants...");
      } else if (participants > 0 && Object.keys(remoteVideos).length === 0) {
        setConnectionStatus("Connected. Establishing video connection...");
      } else {
        setConnectionStatus("");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [participants, remoteVideos]);

  // Debug function to request current meeting info
  const debugMeetingInfo = useCallback(() => {
    socket.emit("get-meeting-info", { meetingId });
  }, [meetingId]);

  useEffect(() => {
    let reconnectInterval;
    let localMediaStream = null;

    const setupPeerConnection = async (remoteVideoCallId, initiate = false) => {
      if (
        remoteVideoCallId === myVideoCallIdRef.current ||
        connectedPeersRef.current.has(remoteVideoCallId)
      ) {
        return;
      }

      console.log(`Setting up connection with ${remoteVideoCallId}, initiating: ${initiate}`);
      connectedPeersRef.current.add(remoteVideoCallId);

      try {
        const pc = await createPeerConnection(
          socket,
          remoteVideoCallId,
          handleRemoteStream,
          localMediaStream
        );
        getPeers()[remoteVideoCallId] = pc;

        if (initiate) {
          console.log(`Creating offer for ${remoteVideoCallId}`);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { target: remoteVideoCallId, offer });
            console.log(`Offer sent to ${remoteVideoCallId}`);
          } catch (err) {
            console.error(`Error creating offer for ${remoteVideoCallId}:`, err);
          }
        }
      } catch (err) {
        console.error(`Error setting up peer connection with ${remoteVideoCallId}:`, err);
        connectedPeersRef.current.delete(remoteVideoCallId);
      }
    };

    const init = async () => {
      console.log("Initializing meeting...");
      
      // Get local media stream
      try {
        const stream = await getLocalStream();
        localMediaStream = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        console.log("Local stream obtained successfully");
      } catch (err) {
        console.error("Failed to get local stream:", err);
        setConnectionStatus("Failed to access camera/mic. Please check permissions.");
        return;
      }

      // Connect socket
      socket.connect();
      console.log("Socket connected, joining meeting...");

      // Debug: Check meeting info periodically
      const debugInterval = setInterval(debugMeetingInfo, 10000);

      // Join the meeting
      socket.emit("join-meeting", {
        meetingId,
        token: localStorage.getItem("token"),
      });

      // When a user joins (including yourself)
      socket.on("user-joined", async ({ userId, videoCallId, existingUsers, totalParticipants }) => {
        console.log(`User joined event: ${videoCallId}`, { existingUsers, totalParticipants });
        
        // Store my videoCallId for reference
        if (!myVideoCallIdRef.current) {
          myVideoCallIdRef.current = videoCallId;
          console.log(`Set my videoCallId to ${videoCallId}`);
        }
        
        // Update participant count
        if (totalParticipants) {
          setParticipants(totalParticipants);
        }

        // Handle existing users when you join
        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          console.log("Found existing users:", existingUsers);
          
          // Create connections to all existing users
          for (const remoteId of existingUsers) {
            if (remoteId !== myVideoCallIdRef.current) {
              setupPeerConnection(remoteId, true);
            }
          }
        }
      });

      // Listen for participant updates
      socket.on("participants-update", ({ count, users }) => {
        console.log(`Participant update: ${count} users`, users);
        setParticipants(count);
        
        // Update connections if needed
        if (myVideoCallIdRef.current && Array.isArray(users)) {
          const remoteUsers = users.filter(id => id !== myVideoCallIdRef.current);
          console.log("Remote users from update:", remoteUsers);
          
          // Connect to any users we're not connected to yet
          for (const remoteId of remoteUsers) {
            if (!connectedPeersRef.current.has(remoteId)) {
              setupPeerConnection(remoteId, true);
            }
          }
        }
      });

      // Handle incoming offers
      socket.on("offer", async ({ sender, offer }) => {
        console.log(`Received offer from ${sender}`);
        
        // Don't process offers from myself
        if (sender === myVideoCallIdRef.current) {
          console.log("Ignoring offer from myself");
          return;
        }
        
        // Add to connected peers if not already
        if (!connectedPeersRef.current.has(sender)) {
          connectedPeersRef.current.add(sender);
        }
        
        // Create or get peer connection
        if (!getPeers()[sender]) {
          const pc = await createPeerConnection(
            socket,
            sender,
            handleRemoteStream,
            localMediaStream
          );
          getPeers()[sender] = pc;
        }
        
        const pc = getPeers()[sender];
        
        try {
          // Set the remote description (the offer)
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          
          // Create an answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          // Send the answer back
          socket.emit("answer", { target: sender, answer });
          console.log(`Answer sent to ${sender}`);
        } catch (err) {
          console.error(`Error handling offer from ${sender}:`, err);
        }
      });

      // Handle incoming answers
      socket.on("answer", async ({ sender, answer }) => {
        console.log(`Received answer from ${sender}`);
        
        // Get the peer connection
        const pc = getPeers()[sender];
        if (pc) {
          try {
            // Set the remote description (the answer)
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`Set remote description for ${sender}`);
          } catch (err) {
            console.error(`Error setting remote description for ${sender}:`, err);
          }
        } else {
          console.warn(`Received answer from ${sender} but no peer connection exists`);
        }
      });

      // Handle ICE candidates
      socket.on("ice-candidate", ({ sender, candidate }) => {
        console.log(`Received ICE candidate from ${sender}`);
        
        const pc = getPeers()[sender];
        if (pc && candidate) {
          try {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error(`Error adding ICE candidate from ${sender}:`, err);
          }
        }
      });

      // Handle user leaving
      socket.on("user-left", ({ videoCallId }) => {
        console.log(`User left: ${videoCallId}`);
        
        // Close and clean up the peer connection
        const pc = getPeers()[videoCallId];
        if (pc) {
          pc.close();
          delete getPeers()[videoCallId];
          connectedPeersRef.current.delete(videoCallId);
          
          // Remove the video element
          setRemoteVideos((prev) => {
            const updated = { ...prev };
            delete updated[videoCallId];
            return updated;
          });
        }
      });

      // Handle socket disconnect with reconnection logic
      socket.on("disconnect", () => {
        console.log("Socket disconnected, attempting to reconnect...");
        
        // Clear previous reconnection interval
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
        }
        
        // Attempt to reconnect every 5 seconds
        reconnectInterval = setInterval(() => {
          console.log("Attempting to reconnect socket...");
          socket.connect();
          
          // Once connected, rejoin the meeting
          if (socket.connected) {
            socket.emit("join-meeting", {
              meetingId,
              token: localStorage.getItem("token"),
            });
            clearInterval(reconnectInterval);
          }
        }, 5000);
      });

      return () => {
        clearInterval(debugInterval);
      };
    };

    init();

    // Clean up function
    return () => {
      console.log("Cleaning up meeting resources...");
      
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
      
      socket.emit("leave-meeting", { meetingId });
      socket.disconnect();

      // Close all peer connections
      Object.values(getPeers()).forEach((pc) => pc.close());
      for (const id in getPeers()) delete getPeers()[id];
      connectedPeersRef.current.clear();

      // Stop all local media tracks
      if (localMediaStream) {
        localMediaStream.getTracks().forEach((track) => track.stop());
      }

      // Remove all socket listeners
      socket.off("user-joined");
      socket.off("participants-update");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("disconnect");
      socket.off("meeting-info");

      navigate("/dashboard");
    };
  }, [meetingId, navigate, handleRemoteStream, debugMeetingInfo]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicOn((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn((prev) => !prev);
    }
  };

  const endCall = () => {
    socket.emit("leave-meeting", { meetingId });
    socket.disconnect();

    Object.values(getPeers()).forEach((pc) => pc.close());
    for (const id in getPeers()) delete getPeers()[id];
    connectedPeersRef.current.clear();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    navigate("/dashboard");
  };

  // Force reconnection to all peers
  const reconnectAll = () => {
    console.log("Forcing reconnection to all peers...");
    
    // Close all existing connections
    Object.entries(getPeers()).forEach(([id, pc]) => {
      pc.close();
      delete getPeers()[id];
    });
    
    connectedPeersRef.current.clear();
    
    // Request fresh meeting info
    debugMeetingInfo();
    
    // Re-emit join meeting to trigger connections
    socket.emit("join-meeting", {
      meetingId,
      token: localStorage.getItem("token"),
    });
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-2">Meeting ID: {meetingId}</h1>
      <p className="text-lg mb-2">Participants: {participants}</p>
      
      {connectionStatus && (
        <p className="text-blue-500 mb-4">{connectionStatus}</p>
      )}

      <div className="flex gap-4 flex-wrap justify-center">
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-64 h-40 bg-black border-4 border-green-500 rounded-xl"
          />
          <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white">
            You {!isMicOn && "(Muted)"}
          </span>
        </div>

        {Object.entries(remoteVideos).map(([id, stream]) => (
          <div key={id} className="relative">
            <video
              autoPlay
              playsInline
              className="w-64 h-40 bg-black border-4 border-blue-500 rounded-xl"
              ref={(el) => {
                if (el && stream) el.srcObject = stream;
              }}
            />
            <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white">
              User {id.substring(0, 4)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-4 flex-wrap justify-center">
        <button
          onClick={toggleMic}
          className={`px-4 py-2 rounded ${isMicOn ? "bg-green-500" : "bg-red-500"} text-white`}
        >
          {isMicOn ? "Mute Mic" : "Unmute Mic"}
        </button>
        <button
          onClick={toggleVideo}
          className={`px-4 py-2 rounded ${isVideoOn ? "bg-green-500" : "bg-red-500"} text-white`}
        >
          {isVideoOn ? "Turn Off Video" : "Turn On Video"}
        </button>
        <button
          onClick={reconnectAll}
          className="px-4 py-2 rounded bg-yellow-500 text-white"
        >
          Reconnect
        </button>
        <button
          onClick={endCall}
          className="px-4 py-2 rounded bg-gray-600 text-white"
        >
          End Call
        </button>
      </div>
    </div>
  );
}