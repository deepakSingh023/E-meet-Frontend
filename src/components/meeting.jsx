// Meeting.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  createOrJoinRoom,
  saveOffer,
  listenForOffer,
  saveAnswer,
  listenForAnswer,
  sendIceCandidate,
  listenForIceCandidates,
} from "./firebaseSignaling";

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const Meeting = ({ roomId }) => {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);

  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    const start = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localRef.current.srcObject = localStream;

      pcRef.current = new RTCPeerConnection(servers);
      localStream.getTracks().forEach((track) => pcRef.current.addTrack(track, localStream));

      pcRef.current.ontrack = (event) => {
        remoteRef.current.srcObject = event.streams[0];
      };

      const { isInitiator } = await createOrJoinRoom(roomId);

      const peerType = isInitiator ? "caller" : "callee";

      // ICE handling
      pcRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(roomId, peerType, event.candidate);
        }
      };

      listenForIceCandidates(roomId, isInitiator ? "callee" : "caller", async (remoteCandidate) => {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(remoteCandidate));
        } catch (e) {
          console.error("Error adding remote ICE candidate", e);
        }
      });

      if (isInitiator) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        await saveOffer(roomId, offer);

        listenForAnswer(roomId, async (answer) => {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setStatus("Connected");
        });
      } else {
        listenForOffer(roomId, async (offer) => {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          await saveAnswer(roomId, answer);
          setStatus("Connected");
        });
      }
    };

    start();
  }, [roomId]);

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold">{status}</h2>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <video ref={localRef} autoPlay playsInline muted className="w-full rounded border" />
        <video ref={remoteRef} autoPlay playsInline className="w-full rounded border" />
      </div>
    </div>
  );
};

export default Meeting;
