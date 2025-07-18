// src/pages/Dashboard.jsx
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../firebaseSignaling";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Debug: Log the user state
  useEffect(() => {
    console.log("Dashboard - Current user state:", user);
    console.log("Dashboard - User uid:", user?.uid);
    console.log("Dashboard - User name:", user?.name);
  }, [user]);

  const handleCreateMeeting = async () => {
    // Check if user is available before creating meeting
    if (!user || !user.uid) {
      console.error("User not available:", user);
      alert("Please wait for authentication to complete or try refreshing the page.");
      return;
    }

    try {
      const roomId = crypto.randomUUID();
      console.log("Creating meeting with roomId:", roomId, "and user:", user.uid);
      
      await createRoom(roomId);
      console.log("Room created successfully, navigating to:", `/meeting/${roomId}`);
      
      // Navigate to meeting
      navigate(`/meeting/${roomId}`);
    } catch (err) {
      console.error("Error creating meeting:", err);
      alert("Couldn't create meeting. Try again.");
    }
  };

  const handleJoinMeeting = () => {
    // Check if user is available before joining meeting
    if (!user || !user.uid) {
      console.error("User not available:", user);
      alert("Please wait for authentication to complete or try refreshing the page.");
      return;
    }

    const roomId = prompt("Enter Meeting Code:");
    if (roomId && roomId.trim()) {
      console.log("Joining meeting with roomId:", roomId, "and user:", user.uid);
      navigate(`/meeting/${roomId.trim()}`);
    }
  };

  // Show loading state if user is not yet available
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p className="text-gray-600">Please wait while we authenticate you.</p>
      </div>
    );
  }

  // Show error if user doesn't have required fields
  if (!user.uid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
        <p className="text-gray-600 mb-4">User information is incomplete.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
        <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
          <p>Debug info:</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
      <h1 className="text-4xl font-bold mb-6">
        Welcome, {user?.name || user?.email || user?.uid || "User"}!
      </h1>
      
      {/* Debug info - remove this in production */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <p>Debug: User ID: {user.uid}</p>
        <p>Debug: User Name: {user.name || "Not set"}</p>
      </div>

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
          Join Meeting
        </button>
      </div>
    </div>
  );
};

export default Dashboard;