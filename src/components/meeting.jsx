import React, { useEffect, useRef, useState } from "react";
import {
  createRoom,
  saveOffer,
  listenForOffer,
  saveAnswer,
  listenForAnswer,
  sendIceCandidate,
  listenToRemoteCandidates,
} from "../firebaseSignaling"; // Your signaling code
import { useParams } from "react-router-dom"; // Assuming you're using react-router
import { useSelector } from "react-redux";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // Optional: Add TURN server here for production
  ],
};

const Meeting = () => {
  const { roomId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();
  const localStream = useRef();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    const init = async () => {
      peerConnection.current = new RTCPeerConnection(configuration);

      // Get user media
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      localVideoRef.current.srcObject = localStream.current;

      // Show remote video
      peerConnection.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        remoteVideoRef.current.srcObject = remoteStream;
      };

      // ICE Candidate sending
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(roomId, user.uid, event.candidate);
        }
      };

      // Step 1: Check if this user is the first to join
      const offerListener = listenForOffer(roomId, user.uid, async (offer) => {
        if (offer) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          await saveAnswer(roomId, user.uid, answer);
        }
      });

      const answerListener = listenForAnswer(roomId, user.uid, async (answer) => {
        if (answer) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      const remoteCandidateUnsub = listenToRemoteCandidates(roomId, user.uid, async (candidate) => {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add remote candidate", err);
        }
      });

      // Step 2: Determine if user is initiator or joiner
      const isInitiator = user.isInitiator; // Optional: Use redux or context
      if (isInitiator) {
        await createRoom(roomId);
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        await saveOffer(roomId, user.uid, offer);
      }

      setConnected(true);

      // Cleanup
      return () => {
        offerListener();
        answerListener();
        remoteCandidateUnsub();
        peerConnection.current.close();
        localStream.current.getTracks().forEach((t) => t.stop());
      };
    };

    init();
  }, [roomId, user]);

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-white">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
        Meeting Room: <span className="text-blue-600">{roomId}</span>
      </h2>
      <div className="flex gap-6 justify-center items-center">
        <div>
          <h3 className="text-center text-sm font-semibold text-gray-700">You</h3>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-64 h-48 rounded-lg border" />
        </div>
        <div>
          <h3 className="text-center text-sm font-semibold text-gray-700">Peer</h3>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-64 h-48 rounded-lg border" />
        </div>
      </div>
      {!connected && <p className="mt-6 text-gray-600">Connecting...</p>}
    </div>
  );
};

export default Meeting;
