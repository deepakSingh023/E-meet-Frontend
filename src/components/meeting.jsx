import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const meetings = () => {
  const { id } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const localVideoRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteVideos, setRemoteVideos] = useState({});
  const peersRef = useRef({});
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io("https://your-server-url", {
      withCredentials: true,
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socketRef.current.emit("join-meeting", {
          meetingId: id,
          videoCallId: currentUser.videoCallId,
        });

        socketRef.current.on("all-users", (users) => {
          users.forEach((user) => {
            const pc = createPeerConnection(user.videoCallId);
            peersRef.current[user.videoCallId] = pc;

            // Add local stream tracks
            stream.getTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });

            pc.createOffer().then((offer) => {
              pc.setLocalDescription(offer);
              socketRef.current.emit("offer", {
                target: user.videoCallId,
                caller: currentUser.videoCallId,
                sdp: offer,
              });
            });
          });
        });

        socketRef.current.on("offer", ({ caller, sdp }) => {
          const pc = createPeerConnection(caller);
          peersRef.current[caller] = pc;

          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });

          pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
            pc.createAnswer().then((answer) => {
              pc.setLocalDescription(answer);
              socketRef.current.emit("answer", {
                target: caller,
                sdp: answer,
              });
            });
          });
        });

        socketRef.current.on("answer", ({ target, sdp }) => {
          const pc = peersRef.current[target];
          if (pc) {
            pc.setRemoteDescription(new RTCSessionDescription(sdp));
          }
        });

        socketRef.current.on("ice-candidate", ({ target, candidate }) => {
          const pc = peersRef.current[target];
          if (pc && candidate) {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });
      });

    return () => {
      socketRef.current.disconnect();
      Object.values(peersRef.current).forEach((pc) => pc.close());
    };
  }, []);

  const createPeerConnection = (remoteVideoCallId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:relay1.expressturn.com:3478",
          username: "ef43f3f6b0a14e398fec7ff66a1cfa7b",
          credential: "5SfVzY9fPxX0Lmk2",
        },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          target: remoteVideoCallId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      console.log("Received remote stream", remoteVideoCallId, remoteStream);
      setRemoteVideos((prev) => ({
        ...prev,
        [remoteVideoCallId]: remoteStream,
      }));
    };

    return pc;
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <div className="col-span-1">
        <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded-xl shadow-md" />
      </div>
      {Object.entries(remoteVideos).map(([id, stream]) => (
        <div key={id} className="col-span-1">
          <video
            autoPlay
            playsInline
            ref={(el) => {
              if (el) {
                el.srcObject = stream;
              }
            }}
            className="w-full rounded-xl shadow-md"
          />
        </div>
      ))}
    </div>
  );
};

export default MeetingRoom;
