import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import { getLocalStream, createPeerConnection, getPeers } from "../webrtc";

export default function Meeting() {
  const { meetingId } = useParams();
  const localVideoRef = useRef();
  const [remoteVideos, setRemoteVideos] = useState({});

  useEffect(() => {
    const init = async () => {
      const stream = await getLocalStream();
      localVideoRef.current.srcObject = stream;

      socket.emit("join-room", meetingId);

      socket.on("user-joined", async ({ userId }) => {
        const pc = createPeerConnection(socket, userId, localVideoRef, handleRemoteStream);
        getPeers()[userId] = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("offer", { target: userId, offer });
      });

      socket.on("offer", async ({ sender, offer }) => {
        const pc = createPeerConnection(socket, sender, localVideoRef, handleRemoteStream);
        getPeers()[sender] = pc;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", { target: sender, answer });
      });

      socket.on("answer", async ({ sender, answer }) => {
        const pc = getPeers()[sender];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice-candidate", ({ sender, candidate }) => {
        const pc = getPeers()[sender];
        if (pc) pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on("user-left", ({ userId }) => {
        if (getPeers()[userId]) {
          getPeers()[userId].close();
          delete getPeers()[userId];
          setRemoteVideos((prev) => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
        }
      });
    };

    const handleRemoteStream = (userId, stream) => {
      setRemoteVideos((prev) => ({ ...prev, [userId]: stream }));
    };

    init();

    return () => {
      socket.emit("leave-room", meetingId);
      socket.disconnect();
    };
  }, [meetingId]);

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
            ref={(el) => { if (el) el.srcObject = stream; }}
          />
        ))}
      </div>
    </div>
  );
}
