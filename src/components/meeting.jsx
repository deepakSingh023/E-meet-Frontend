import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getLocalStream, createPeerConnection } from "../webrtc";
import {
  createRoom,
  saveOffer,
  listenForOffer,
  saveAnswer,
  listenForAnswer,
  sendIceCandidate,
  listenToRemoteCandidates,
} from "../webrtc.js";

export default function Meeting() {
  const { id: meetingId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const peersRef = useRef({});
  const [participantCount, setParticipantCount] = useState(1);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        await createRoom(meetingId);
        const stream = await getLocalStream();
        if (!mounted) return;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peerId = currentUser.id;

        listenForOffer(meetingId, peerId, async (offer) => {
          if (peersRef.current[offer.from]) return;

          const pc = await createPeerConnection(
            offer.from,
            stream,
            (remoteStream) => handleRemoteStream(offer.from, remoteStream),
            async (candidate) => sendIceCandidate(meetingId, offer.from, peerId, candidate)
          );

          peersRef.current[offer.from] = pc;

          await pc.setRemoteDescription(new RTCSessionDescription(offer.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await saveAnswer(meetingId, offer.from, peerId, answer);

          listenToRemoteCandidates(meetingId, offer.from, peerId, async (candidate) => {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          });
        });

        listenForAnswer(meetingId, peerId, async (answerData) => {
          const pc = peersRef.current[answerData.from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answerData.answer));
          }
        });

        // You can define how to detect and create peers for other users.
        // For demo, wait 2s and create one peer connection (mocking another user).
        setTimeout(() => {
          const otherUser = "user_" + Math.floor(Math.random() * 1000);
          createPeer(otherUser);
        }, 2000);

      } catch (e) {
        console.error("Meeting init error:", e);
        navigate("/dashboard");
      }
    };

    const createPeer = async (userId) => {
      if (!localStream || peersRef.current[userId]) return;

      const pc = await createPeerConnection(
        userId,
        localStream,
        (remoteStream) => handleRemoteStream(userId, remoteStream),
        async (candidate) => sendIceCandidate(meetingId, currentUser.id, userId, candidate)
      );

      peersRef.current[userId] = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await saveOffer(meetingId, currentUser.id, userId, offer);

      listenToRemoteCandidates(meetingId, currentUser.id, userId, async (candidate) => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      setParticipantCount((prev) => prev + 1);
    };

    init();
    return () => {
      mounted = false;
      leaveMeeting();
    };
  }, [currentUser, meetingId]);

  const handleRemoteStream = (userId, stream) => {
    setRemoteStreams((prev) => ({ ...prev, [userId]: stream }));
  };

  const toggleAudio = () => {
    if (localStream) {
      const newState = !isAudioEnabled;
      localStream.getAudioTracks().forEach((t) => (t.enabled = newState));
      setIsAudioEnabled(newState);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const newState = !isVideoEnabled;
      localStream.getVideoTracks().forEach((t) => (t.enabled = newState));
      setIsVideoEnabled(newState);
    }
  };

  const leaveMeeting = () => {
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    navigate("/dashboard");
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    alert("Meeting ID copied!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Meeting: {meetingId}</h2>
          <div className="flex items-center mt-1">
            <span className="text-sm bg-blue-600 px-2 py-1 rounded">
              {participantCount} {participantCount === 1 ? "participant" : "participants"}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 flex-grow">
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
              {currentUser?.name || "You"} {!isVideoEnabled && "(Camera off)"}
            </p>
          </div>
        </div>

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

      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full ${
            isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <span className="text-2xl">{isAudioEnabled ? "🎤" : "🔇"}</span>
          <span className="text-xs mt-1">{isAudioEnabled ? "Mute" : "Unmute"}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full ${
            isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <span className="text-2xl">{isVideoEnabled ? "📹" : "📷"}</span>
          <span className="text-xs mt-1">{isVideoEnabled ? "Stop Video" : "Start Video"}</span>
        </button>
      </div>
    </div>
  );
}
