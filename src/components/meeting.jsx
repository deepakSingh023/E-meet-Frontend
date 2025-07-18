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
  const [connected, setConnected] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    console.log("Meeting component - roomId:", roomId);
    console.log("Meeting component - user:", user);
    console.log("Meeting component - user.uid:", user?.uid);

    if (!roomId) {
      setError("Missing room ID");
      return;
    }

    if (!user) {
      setError("User not authenticated - please wait or refresh the page");
      return;
    }

    if (!user.uid) {
      setError("User ID not available - please refresh the page");
      return;
    }

    console.log("Initializing meeting with:", { roomId, userId: user.uid });

    const init = async () => {
      try {
        setStatus("Setting up peer connection...");
        
        // Create peer connection
        peerConnection.current = new RTCPeerConnection(configuration);

        // Add connection state listeners
        peerConnection.current.onconnectionstatechange = () => {
          const state = peerConnection.current.connectionState;
          console.log("Connection state changed:", state);
          setStatus(`Connection state: ${state}`);
          
          if (state === "connected") {
            setConnected(true);
            setStatus("Connected");
          } else if (state === "failed" || state === "disconnected") {
            setConnected(false);
            setStatus("Connection failed");
          }
        };

        peerConnection.current.oniceconnectionstatechange = () => {
          const state = peerConnection.current.iceConnectionState;
          console.log("ICE connection state:", state);
        };

        setStatus("Requesting camera and microphone...");
        
        // Get user media with better error handling
        try {
          localStream.current = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: true,
          });
          
          console.log("Got local stream:", localStream.current);
          
          // Set local video
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream.current;
            localVideoRef.current.onloadedmetadata = () => {
              console.log("Local video loaded");
              setLocalVideoReady(true);
            };
          }
          
        } catch (mediaError) {
          console.error("Error accessing media devices:", mediaError);
          setError(`Camera/microphone access denied: ${mediaError.message}`);
          return;
        }

        // Add tracks to peer connection
        localStream.current.getTracks().forEach((track) => {
          console.log("Adding track:", track.kind);
          peerConnection.current.addTrack(track, localStream.current);
        });

        // Setup remote stream
        const remoteStream = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.onloadedmetadata = () => {
            console.log("Remote video loaded");
            setRemoteVideoReady(true);
          };
        }

        // Handle incoming tracks
        peerConnection.current.ontrack = (event) => {
          console.log("Received remote track:", event.track.kind);
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          });
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("Sending ICE candidate");
            sendCandidate(roomId, user.uid, event.candidate);
          }
        };

        setStatus("Setting up signaling...");

        // Setup signaling listeners
        const unsubOffer = listenForOffer(roomId, user.uid, async (offer) => {
          if (offer && peerConnection.current) {
            console.log("Received offer, creating answer");
            try {
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(offer)
              );
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);
              await sendAnswer(roomId, user.uid, answer);
              console.log("Answer sent");
            } catch (err) {
              console.error("Error handling offer:", err);
              setError(`Error handling offer: ${err.message}`);
            }
          }
        });

        const unsubAnswer = listenForAnswer(roomId, user.uid, async (answer) => {
          if (answer && peerConnection.current) {
            console.log("Received answer");
            try {
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(answer)
              );
            } catch (err) {
              console.error("Error handling answer:", err);
              setError(`Error handling answer: ${err.message}`);
            }
          }
        });

        const unsubCandidates = listenForCandidates(
          roomId,
          user.uid,
          async (candidate) => {
            if (peerConnection.current) {
              try {
                await peerConnection.current.addIceCandidate(
                  new RTCIceCandidate(candidate)
                );
                console.log("Added ICE candidate");
              } catch (err) {
                console.error("Error adding ICE candidate:", err);
              }
            }
          }
        );

        // Create or join room
        setStatus("Creating/joining room...");
        const { isInitiator } = await createRoom(roomId);
        console.log("Room created/joined. Is initiator:", isInitiator);

        if (isInitiator) {
          setStatus("Creating offer...");
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          await sendOffer(roomId, user.uid, offer);
          console.log("Offer created and sent");
        }

        setStatus("Waiting for peer...");

        // Cleanup function
        return () => {
          console.log("Cleaning up...");
          unsubOffer();
          unsubAnswer();
          unsubCandidates();
          if (peerConnection.current) {
            peerConnection.current.close();
          }
          if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
          }
        };
      } catch (err) {
        console.error("Error initializing meeting:", err);
        setError(`Initialization error: ${err.message}`);
      }
    };

    const cleanup = init();
    
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
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
        Meeting Room: <span className="text-blue-600">{roomId}</span>
      </h2>
      
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">Status: {status}</p>
        {connected && <p className="text-sm text-green-600">✓ Connected</p>}
      </div>

      <div className="flex gap-6 justify-center items-center">
        <div>
          <h3 className="text-center text-sm font-semibold text-gray-700">
            You {localVideoReady ? "✓" : ""}
          </h3>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-64 h-48 rounded-lg border bg-gray-100"
          />
        </div>
        <div>
          <h3 className="text-center text-sm font-semibold text-gray-700">
            Peer {remoteVideoReady ? "✓" : ""}
          </h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-64 h-48 rounded-lg border bg-gray-100"
          />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Local video: {localVideoReady ? "Ready" : "Loading..."}
        </p>
        <p className="text-xs text-gray-500">
          Remote video: {remoteVideoReady ? "Ready" : "Waiting..."}
        </p>
      </div>
    </div>
  );
};

export default Meeting;