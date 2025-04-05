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

  useEffect(() => {
    const handleRemoteStream = (videoCallId, stream) => {
      setRemoteVideos((prev) => ({ ...prev, [videoCallId]: stream }));
    };

    const init = async () => {
      const stream = await getLocalStream();
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit("join-meeting", {
        meetingId,
        token: localStorage.getItem("token"),
      });

      socket.on("existing-users", async ({ existingUsers }) => {
        for (const otherId of existingUsers) {
          const pc = await createPeerConnection(socket, otherId, handleRemoteStream, stream);
          getPeers()[otherId] = pc;

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { target: otherId, offer });
        }
      });

      socket.on("user-joined", async ({ userId, videoCallId }) => {
        const pc = await createPeerConnection(socket, videoCallId, handleRemoteStream, stream);
        getPeers()[videoCallId] = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { target: videoCallId, offer });
      });

      socket.on("answer", async ({ sender, answer }) => {
        const pc = getPeers()[sender];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on("ice-candidate", ({ sender, candidate }) => {
        const pc = getPeers()[sender];
        if (pc && candidate) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on("user-left", ({ videoCallId }) => {
        const pc = getPeers()[videoCallId];
        if (pc) {
          pc.close();
          delete getPeers()[videoCallId];
          setRemoteVideos((prev) => {
            const updated = { ...prev };
            delete updated[videoCallId];
            return updated;
          });
        }
      });
    };

    init();

    return () => {
      endCall();
    };
  }, [meetingId]);

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
    socket.emit("leave-room", meetingId);
    socket.disconnect();

    Object.values(getPeers()).forEach((pc) => pc.close());
    for (const key in getPeers()) delete getPeers()[key];

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mt-4">Meeting ID: {meetingId}</h1>

      <video ref={localVideoRef} autoPlay playsInline muted className="w-64 h-40 bg-black m-2" />

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(remoteVideos).map(([userId, stream]) => (
          <video
            key={userId}
            autoPlay
            playsInline
            className="w-64 h-40 bg-black"
            ref={(el) => {
              if (el && stream) el.srcObject = stream;
            }}
          />
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
