import React, { useEffect, useRef, useState } from "react";
import {
  createRoom,
  sendOffer,
  listenForOffer,
  sendAnswer,
  listenForAnswer,
  sendCandidate,
  listenForCandidates,
} from "../firebaseSignaling";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const Meeting = () => {
  const { roomId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId || !user?.username) {
      setError("Invalid room or user");
      return;
    }

    const init = async () => {
      try {
        setStatus("Setting up connection...");
        
        // Get user media
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }

        // Create peer connection
        peerConnection.current = new RTCPeerConnection(configuration);

        // Add local tracks
        localStream.current.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, localStream.current);
        });

        // Set up remote stream
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream.current;
        }

        // Handle remote tracks
        peerConnection.current.ontrack = (event) => {
          remoteStream.current.addTrack(event.track);
        };

        // ICE candidate handling
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            sendCandidate(roomId, user.username, event.candidate);
          }
        };

        // Connection state handling
        peerConnection.current.onconnectionstatechange = () => {
          const state = peerConnection.current.connectionState;
          setStatus(`Connection state: ${state}`);
          setConnected(state === "connected");
        };

        // Set up signaling listeners
        const unsubOffer = listenForOffer(roomId, user.username, async (offer) => {
          await peerConnection.current.setRemoteDescription(offer);
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          await sendAnswer(roomId, user.username, answer);
        });

        const unsubAnswer = listenForAnswer(roomId, user.username, async (answer) => {
          await peerConnection.current.setRemoteDescription(answer);
        });

        const unsubCandidates = listenForCandidates(
          roomId,
          user.username,
          async (candidate) => {
            await peerConnection.current.addIceCandidate(candidate);
          }
        );

        // Create or join room
        const { isInitiator } = await createRoom(roomId);
        if (isInitiator) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          await sendOffer(roomId, user.username, offer);
        }

        setStatus("Waiting for peer...");

        return () => {
          unsubOffer();
          unsubAnswer();
          unsubCandidates();
          if (peerConnection.current) {
            peerConnection.current.close();
          }
          if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
          }
        };
      } catch (err) {
        console.error("Error initializing meeting:", err);
        setError(err.message);
      }
    };

    init();
  }, [roomId, user]);

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-white">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
        Meeting Room: {roomId}
      </h2>
      
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">Status: {status}</p>
        {connected && <p className="text-sm text-green-600">✓ Connected</p>}
      </div>

      <div className="flex gap-6 justify-center items-center">
        <div>
          <h3 className="text-center text-sm font-semibold text-gray-700">You</h3>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-64 h-48 rounded-lg border bg-gray-100"
          />
        </div>
        <div>
          <h3 className="text-center text-sm font-semibold text-gray-700">Peer</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-64 h-48 rounded-lg border bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
};

export default Meeting;