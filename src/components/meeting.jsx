import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getLocalStream,
  createPeerConnection,
  getPeers,
  removePeer,
  closeAllPeers
} from "../webrtc"; // adjust the path if needed
import socket from "../sockets"; // your socket connection instance

const Meeting = () => {
  const { id: meetingId } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const localVideoRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    // 1. Get local stream
    getLocalStream()
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Join the meeting
        socket.emit("join-meeting", {
          meetingId,
          videoCallId: currentUser.videoCallId,
        });

        // 3. Handle "all-users" event
        socket.on("all-users", async (users) => {
          for (const user of users) {
            const pc = await createPeerConnection(
              socket,
              user.videoCallId,
              handleRemoteStream,
              stream
            );

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("offer", {
              target: user.videoCallId,
              caller: currentUser.videoCallId,
              sdp: offer,
            });

            getPeers()[user.videoCallId] = pc;
          }
        });

        // 4. Handle "offer"
        socket.on("offer", async ({ caller, sdp }) => {
          const pc = await createPeerConnection(
            socket,
            caller,
            handleRemoteStream,
            stream
          );
          getPeers()[caller] = pc;

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("answer", {
            target: caller,
            sdp: answer,
          });
        });

        // 5. Handle "answer"
        socket.on("answer", async ({ target, sdp }) => {
          const pc = getPeers()[target];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          }
        });

        // 6. Handle "ice-candidate"
        socket.on("ice-candidate", ({ target, candidate }) => {
          const pc = getPeers()[target];
          if (pc && candidate) {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
      });

    // Cleanup
    return () => {
      socket.emit("leave-meeting", { meetingId, videoCallId: currentUser.videoCallId });
      closeAllPeers();
      socket.off("all-users");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [currentUser]);

  const handleRemoteStream = (peerId, stream) => {
    setRemoteStreams((prev) => ({
      ...prev,
      [peerId]: stream,
    }));
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <div className="col-span-1">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-xl shadow-md"
        />
      </div>
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <div key={peerId} className="col-span-1">
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

export default Meeting;
