import React, { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const handleRemoteStream = (videoCallId, stream) => {
      console.log("🎥 Remote stream received from:", videoCallId);
      setRemoteVideos((prev) => ({ ...prev, [videoCallId]: stream }));
    };

    const init = async () => {
      // Get local media stream
      const stream = await getLocalStream();
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect socket
      socket.connect();

      // Join the meeting
      socket.emit("join-meeting", {
        meetingId,
        token: localStorage.getItem("token"),
      });

      // When a user joins (including yourself)
      socket.on("user-joined", async ({ userId, videoCallId, existingUsers }) => {
        console.log(`User joined: ${videoCallId}`, { existingUsers });
        
        // Store my videoCallId for reference
        myVideoCallIdRef.current = videoCallId;
        
        // Update participant count including yourself
        setParticipants(prev => {
          const newCount = existingUsers ? existingUsers.length + 1 : 1;
          return Math.max(prev, newCount);
        });

        // Handle existing users when you join
        if (existingUsers && existingUsers.length > 0) {
          console.log("Creating connections to existing users:", existingUsers);
          for (const remoteVideoCallId of existingUsers) {
            // Create peer connection for each existing user
            const pc = await createPeerConnection(
              socket,
              remoteVideoCallId,
              handleRemoteStream,
              stream
            );
            getPeers()[remoteVideoCallId] = pc;
            
            // Create and send offer
            try {
              console.log(`Creating offer for ${remoteVideoCallId}`);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit("offer", { target: remoteVideoCallId, offer });
            } catch (err) {
              console.error("Error creating offer:", err);
            }
          }
        }
      });

      // Handle incoming offers
      socket.on("offer", async ({ sender, offer }) => {
        console.log(`Received offer from ${sender}`);
        
        // Don't process offers if they're from myself (shouldn't happen)
        if (sender === myVideoCallIdRef.current) return;
        
        // Create peer connection if it doesn't exist
        if (!getPeers()[sender]) {
          const pc = await createPeerConnection(socket, sender, handleRemoteStream, stream);
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
        } catch (err) {
          console.error("Error handling offer:", err);
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
          } catch (err) {
            console.error("Error setting remote description:", err);
          }
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
            console.error("Error adding ICE candidate:", err);
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
          
          // Remove the video element
          setRemoteVideos((prev) => {
            const updated = { ...prev };
            delete updated[videoCallId];
            return updated;
          });
          
          // Update participant count
          setParticipants(prev => Math.max(0, prev - 1));
        }
      });
    };

    init();

    // Clean up function
    return () => {
      socket.emit("leave-meeting", { meetingId });
      socket.disconnect();

      // Close all peer connections
      Object.values(getPeers()).forEach((pc) => pc.close());
      for (const id in getPeers()) delete getPeers()[id];

      // Stop all local media tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Remove all socket listeners
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");

      navigate("/dashboard");
    };
  }, [meetingId, navigate]);

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

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Meeting ID: {meetingId}</h1>
      <p className="text-lg mb-4">Participants: {participants}</p>

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

      <div className="mt-6 flex gap-4">
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
          onClick={endCall}
          className="px-4 py-2 rounded bg-gray-600 text-white"
        >
          End Call
        </button>
      </div>
    </div>
  );
}