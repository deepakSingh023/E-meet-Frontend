import React, { useEffect, useRef, useState } from "react";
import {
  createRoom,
  sendOffer,
  listenForOffer,
  sendAnswer,
  listenForAnswer,
  sendCandidate,
  listenForCandidates,
} from "../firebaseSignaling"; // Updated signaling code
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const Meeting = () => {
  const { roomId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    const init = async () => {
      try {
        peerConnection.current = new RTCPeerConnection(configuration);

        // Get media
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Show self view
        localVideoRef.current.srcObject = localStream.current;

        // Add tracks to peer
        localStream.current.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, localStream.current);
        });

        // Receive remote stream
        const remoteStream = new MediaStream();
        remoteVideoRef.current.srcObject = remoteStream;

        peerConnection.current.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          });
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            sendCandidate(roomId, user.uid, event.candidate);
          }
        };

        // Firestore listeners
        const unsubOffer = listenForOffer(roomId, user.uid, async (offer) => {
          if (offer) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(offer)
            );
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            await sendAnswer(roomId, user.uid, answer);
          }
        });

        const unsubAnswer = listenForAnswer(roomId, user.uid, async (answer) => {
          if (answer) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          }
        });

        const unsubCandidates = listenForCandidates(
          roomId,
          user.uid,
          async (candidate) => {
            try {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            } catch (err) {
              console.error("Error adding remote ICE candidate:", err);
            }
          }
        );

        // Are we initiator?
        const { isInitiator } = await createRoom(roomId);

        if (isInitiator) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          await sendOffer(roomId, user.uid, offer);
        }

        setConnected(true);

        // Cleanup
        return () => {
          unsubOffer();
          unsubAnswer();
          unsubCandidates();
          peerConnection.current?.close();
          localStream.current?.getTracks().forEach((t) => t.stop());
        };
      } catch (err) {
        console.error("Error initializing meeting:", err);
      }
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
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-64 h-48 rounded-lg border"
          />
        </div>
        <div>
          <h3 className="text-center text-sm font-semibold text-gray-700">Peer</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-64 h-48 rounded-lg border"
          />
        </div>
      </div>
      {!connected && <p className="mt-6 text-gray-600">Connecting...</p>}
    </div>
  );
};

export default Meeting;
