import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getLocalStream,
  createPeerConnection,
  getPeers,
  removePeer,
  closeAllPeers
} from "../webrtc"; // adjust the path if needed
import socket from "../sockets"; // your socket connection instance

export default function Meeting () {
  const { id: meetingId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const localVideoRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Get local stream
    getLocalStream()
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Join the meeting
        socket.emit("join-meeting", {
          meetingId,
          videoCallId: currentUser.videoCallId,
        });

        // 3. Handle "all-users" event
        socket.on("all-users", async (users) => {
          for (const user of users) {
            const pc = await createPeerConnection(
              socket,
              user.videoCallId,
              handleRemoteStream,
              stream
            );

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("offer", {
              target: user.videoCallId,
              caller: currentUser.videoCallId,
              sdp: offer,
            });

            getPeers()[user.videoCallId] = pc;
          }
        });

        // 4. Handle "offer"
        socket.on("offer", async ({ caller, sdp }) => {
          const pc = await createPeerConnection(
            socket,
            caller,
            handleRemoteStream,
            stream
          );
          getPeers()[caller] = pc;

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("answer", {
            target: caller,
            sdp: answer,
          });
        });

        // 5. Handle "answer"
        socket.on("answer", async ({ target, sdp }) => {
          const pc = getPeers()[target];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          }
        });

        // 6. Handle "ice-candidate"
        socket.on("ice-candidate", ({ target, candidate }) => {
          const pc = getPeers()[target];
          if (pc && candidate) {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        // 7. Handle "user-left"
        socket.on("user-left", ({ videoCallId }) => {
          setRemoteStreams((prev) => {
            const newStreams = { ...prev };
            delete newStreams[videoCallId];
            return newStreams;
          });
          removePeer(videoCallId);
        });
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
      });

    // Cleanup
    return () => {
      leaveMeeting();
    };
  }, [currentUser, meetingId]);

  const handleRemoteStream = (peerId, stream) => {
    setRemoteStreams((prev) => ({
      ...prev,
      [peerId]: stream,
    }));
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const leaveMeeting = () => {
    if (currentUser && meetingId) {
      socket.emit("leave-meeting", { meetingId, videoCallId: currentUser.videoCallId });
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    closeAllPeers();
    socket.off("all-users");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    socket.off("user-left");
    
    navigate("/dashboard"); // Adjust this to your application's route structure
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    alert("Meeting ID copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Meeting Info */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Meeting in progress</h2>
          <div className="flex items-center mt-2">
            <p className="text-sm">Meeting ID: <span className="font-mono">{meetingId}</span></p>
            <button 
              onClick={copyMeetingId}
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
            >
              Copy
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

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 flex-grow">
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full rounded-xl shadow-md object-cover"
          />
          <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            You (Local)
          </p>
        </div>
        
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <div key={peerId} className="relative">
            <video
              autoPlay
              playsInline
              ref={(el) => {
                if (el) {
                  el.srcObject = stream;
                }
              }}
              className="w-full h-full rounded-xl shadow-md object-cover"
            />
            <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              Participant
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`px-4 py-2 rounded-full ${
            isAudioEnabled ? "bg-gray-600 hover:bg-gray-700" : "bg-red-600 hover:bg-red-700"
          } text-white font-medium`}
        >
          {isAudioEnabled ? "Mute Audio" : "Unmute Audio"}
        </button>
        <button
          onClick={toggleVideo}
          className={`px-4 py-2 rounded-full ${
            isVideoEnabled ? "bg-gray-600 hover:bg-gray-700" : "bg-red-600 hover:bg-red-700"
          } text-white font-medium`}
        >
          {isVideoEnabled ? "Stop Video" : "Start Video"}
        </button>
      </div>
    </div>
  );
};

