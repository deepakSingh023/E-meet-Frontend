// src/pages/Dashboard.jsx
import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../webrtc"; // your function to create a room

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user); // From Redux

  const handleCreateMeeting = async () => {
    try {
      const roomId = crypto.randomUUID(); // or shortid() if you want short IDs
      await createRoom(roomId);
      navigate(`/meeting/${roomId}`);
    } catch (err) {
      console.error("Error creating meeting:", err);
      alert("Couldn't create meeting. Try again.");
    }
  };

  const handleJoinMeeting = () => {
    const roomId = prompt("Enter Meeting Code:");
    if (roomId) {
      navigate(`/meeting/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
      <h1 className="text-4xl font-bold mb-6">Welcome, {user?.name || "User"}!</h1>

      <div className="flex gap-4">
        <button
          onClick={handleCreateMeeting}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
        >
          Create Meeting
        </button>
        <button
          onClick={handleJoinMeeting}
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700"
        >
          Join Meeting
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
