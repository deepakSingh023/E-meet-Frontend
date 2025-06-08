import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getLocalStream, createPeerConnection, closeAllPeers } from "../webrtc";
import socket from "../sockets";

export default function Meeting() {
  const { id: meetingId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const localVideoRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);
  const peersRef = useRef({});

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    let mounted = true;

    const initializeMeeting = async () => {
      try {
        // Get local media stream
        const stream = await getLocalStream();
        if (!mounted) return;
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join the meeting room
        socket.emit("join-meeting", { meetingId });

        // Setup socket event handlers
        setupSocketHandlers(stream);

      } catch (err) {
        console.error("Failed to initialize meeting:", err);
        alert("Could not access camera/microphone. Please check permissions.");
        navigate('/dashboard');
      }
    };

    const setupSocketHandlers = (stream) => {
      // Handle new participants joining
      socket.on("user-joined", async ({ userId, existingUsers }) => {
        console.log(`User ${userId} joined the meeting`);
        
        // Create peer connection for each existing user
        if (existingUsers && existingUsers.length > 0) {
          for (const existingUserId of existingUsers) {
            await createPeerForUser(existingUserId, stream);
          }
        }
        
        setParticipantCount(prev => prev + 1);
      });

      // Handle incoming offers
      socket.on("offer", async ({ sender, offer }) => {
        console.log("Received offer from:", sender);
        const pc = await createPeerConnection(
          sender,
          stream,
          (remoteStream) => handleRemoteStream(sender, remoteStream)
        );
        
        peersRef.current[sender] = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit("answer", { target: sender, answer });
      });

      // Handle incoming answers
      socket.on("answer", async ({ sender, answer }) => {
        console.log("Received answer from:", sender);
        const pc = peersRef.current[sender];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // Handle ICE candidates
      socket.on("ice-candidate", async ({ sender, candidate }) => {
        const pc = peersRef.current[sender];
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        }
      });

      // Handle participants leaving
      socket.on("user-left", ({ userId }) => {
        console.log(`User ${userId} left the meeting`);
        removePeer(userId);
        setParticipantCount(prev => Math.max(1, prev - 1));
      });

      // Handle meeting errors
      socket.on("meeting-error", ({ message }) => {
        alert(`Meeting error: ${message}`);
        leaveMeeting();
      });
    };

    const createPeerForUser = async (userId, stream) => {
      if (peersRef.current[userId]) return; // Already connected
      
      const pc = await createPeerConnection(
        userId,
        stream,
        (remoteStream) => handleRemoteStream(userId, remoteStream)
      );
      
      peersRef.current[userId] = pc;
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit("offer", {
        target: userId,
        offer: offer
      });
    };

    initializeMeeting();

    return () => {
      mounted = false;
      leaveMeeting();
    };
  }, [currentUser, meetingId, navigate]);

  const handleRemoteStream = (userId, stream) => {
    setRemoteStreams(prev => ({
      ...prev,
      [userId]: stream
    }));
  };

  const removePeer = (userId) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].close();
      delete peersRef.current[userId];
    }
    
    setRemoteStreams(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      const newState = !isAudioEnabled;
      localStream.getAudioTracks().forEach(track => (track.enabled = newState));
      setIsAudioEnabled(newState);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const newState = !isVideoEnabled;
      localStream.getVideoTracks().forEach(track => (track.enabled = newState));
      setIsVideoEnabled(newState);
    }
  };

  const leaveMeeting = () => {
    // Clean up media streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    
    // Notify server we're leaving
    socket.emit("leave-meeting", { meetingId });
    
    // Remove socket listeners
    socket.off("user-joined");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    socket.off("user-left");
    socket.off("meeting-error");
    
    // Navigate back to dashboard
    navigate("/dashboard");
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    alert("Meeting ID copied to clipboard!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Meeting header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Meeting: {meetingId}</h2>
          <div className="flex items-center mt-1">
            <span className="text-sm bg-blue-600 px-2 py-1 rounded">
              {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
            </span>
            <button 
              onClick={copyMeetingId}
              className="ml-2 bg-gray-700 hover:bg-gray-600 text-sm px-2 py-1 rounded"
            >
              Copy ID
            </button>
          </div>
        </div>
        <button 
          onClick={leaveMeeting}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-medium"
        >
          Leave Meeting
        </button>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 flex-grow">
        {/* Local video */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-sm font-medium">
              {currentUser?.name || 'You'} {!isVideoEnabled && '(Camera off)'}
            </p>
          </div>
        </div>

        {/* Remote videos */}
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <div key={userId} className="relative bg-black rounded-lg overflow-hidden">
            <video
              autoPlay
              playsInline
              ref={(el) => el && (el.srcObject = stream)}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-sm font-medium">Participant</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls toolbar */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full ${
            isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <span className="text-2xl">
            {isAudioEnabled ? '🎤' : '🔇'}
          </span>
          <span className="text-xs mt-1">
            {isAudioEnabled ? 'Mute' : 'Unmute'}
          </span>
        </button>
        
        <button
          onClick={toggleVideo}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full ${
            isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <span className="text-2xl">
            {isVideoEnabled ? '📹' : '📷'}
          </span>
          <span className="text-xs mt-1">
            {isVideoEnabled ? 'Stop Video' : 'Start Video'}
          </span>
        </button>
      </div>
    </div>
  );
}