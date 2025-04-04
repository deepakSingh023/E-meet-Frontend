import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Meeting() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  useEffect(() => {
    async function getUserMedia() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    }
    getUserMedia();

    // Cleanup function to stop camera when leaving
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle Mic
  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
      setIsMicOn(prev => !prev);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
      setIsVideoOn(prev => !prev);
    }
  };

  // End Call - Stop Camera and Navigate Back
  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate("/dashboard"); // Go back to the dashboard
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Meeting Room</h1>

      {/* Video Display */}
      <div className="w-96 h-64 bg-black flex items-center justify-center">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full"></video>
        ) : (
          <p className="text-white">Waiting for video...</p>
        )}
      </div>

      {/* Meeting ID Display */}
      <p className="mt-4 text-lg font-semibold">Meeting ID: {meetingId}</p>

      {/* Controls */}
      <div className="mt-4 flex space-x-4">
        <button
          onClick={toggleMic}
          className={`px-6 py-2 rounded-lg ${isMicOn ? "bg-green-500" : "bg-red-500"} text-white`}
        >
          {isMicOn ? "Mute Mic" : "Unmute Mic"}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`px-6 py-2 rounded-lg ${isVideoOn ? "bg-green-500" : "bg-red-500"} text-white`}
        >
          {isVideoOn ? "Turn Off Video" : "Turn On Video"}
        </button>

        <button
          onClick={endCall}
          className="px-6 py-2 rounded-lg bg-gray-500 text-white"
        >
          End Call
        </button>
      </div>
    </div>
  );
}
