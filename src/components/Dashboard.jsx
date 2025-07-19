import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../firebaseSignaling";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    console.log("Dashboard - Current user state:", user);
  }, [user]);

  const handleCreateMeeting = async () => {
    if (!user || !user.username) {
      console.error("User not available:", user);
      alert("Please wait for authentication to complete or try refreshing the page.");
      return;
    }

    try {
      const roomId = crypto.randomUUID();
      console.log("Creating meeting with roomId:", roomId);
      
      await createRoom(roomId);
      console.log("Room created successfully");
      
      navigate(`/meeting/${roomId}`);
    } catch (err) {
      console.error("Error creating meeting:", err);
      alert("Couldn't create meeting. Try again.");
    }
  };

  const handleJoinMeeting = () => {
    if (!user || !user.username) {
      console.error("User not available:", user);
      alert("Please wait for authentication to complete or try refreshing the page.");
      return;
    }

    const roomId = prompt("Enter Meeting Code:");
    if (roomId && roomId.trim()) {
      navigate(`/meeting/${roomId.trim()}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  if (!user.username) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
      <h1 className="text-4xl font-bold mb-6">
        Welcome, {user.username}!
      </h1>
      
      <div className="flex gap-4">
        <button
          onClick={handleCreateMeeting}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Create Meeting
        </button>
        <button
          onClick={handleJoinMeeting}
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
        >
          Join Meetin
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
