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
  const remoteStream = useRef(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);
  const listeners = useRef([]);

  useEffect(() => {
    if (!roomId || !user?.uid) {
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

        // Create remote stream
        remoteStream.current = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream.current;
        }

        // Create peer connection
        peerConnection.current = new RTCPeerConnection(configuration);

        // Add local tracks
        localStream.current.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, localStream.current);
        });

        // Handle remote tracks
        peerConnection.current.ontrack = (event) => {
          event.streams[0].getTracks().forEach(track => {
            remoteStream.current.addTrack(track);
          });
        };

        // ICE candidate handling
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            sendCandidate(roomId, user.uid, event.candidate);
          }
        };

        // Connection state handling
        peerConnection.current.onconnectionstatechange = () => {
          const state = peerConnection.current.connectionState;
          setStatus(`Connection state: ${state}`);
          setConnected(state === "connected");
        };

        // Create or join room first
        setStatus("Joining room...");
        const { isInitiator } = await createRoom(roomId);

        // Set up signaling listeners
        listeners.current.push(
          listenForOffer(roomId, user.uid, async (offer) => {
            setStatus("Received offer...");
            await peerConnection.current.setRemoteDescription(offer);
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            await sendAnswer(roomId, user.uid, answer);
            setStatus("Sent answer");
          })
        );

        listeners.current.push(
          listenForAnswer(roomId, user.uid, async (answer) => {
            setStatus("Received answer...");
            await peerConnection.current.setRemoteDescription(answer);
          })
        );

        listeners.current.push(
          listenForCandidates(roomId, user.uid, async (candidate) => {
            try {
              await peerConnection.current.addIceCandidate(candidate);
            } catch (e) {
              console.error("Error adding ICE candidate:", e);
            }
          })
        );

        // If initiator, create and send offer
        if (isInitiator) {
          setStatus("Creating offer...");
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          await sendOffer(roomId, user.uid, offer);
          setStatus("Offer sent, waiting for peer...");
        } else {
          setStatus("Waiting for offer...");
        }

      } catch (err) {
        console.error("Error initializing meeting:", err);
        setError(err.message || "Failed to start meeting");
      }
    };

    init();

    // Cleanup function
    return () => {
      // Unsubscribe all listeners
      listeners.current.forEach(unsub => unsub());
      listeners.current = [];
      
      // Close peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      
      // Stop media tracks
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
    };
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
