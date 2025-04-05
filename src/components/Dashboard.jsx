import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState('');

  const getAuthToken = () => localStorage.getItem("token");

  const createMeeting = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.post(
        `https://videochatapp-backend-wx80.onrender.com/api/meet/create-meeting`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTimeout(() => {
          navigate(`/meeting/${response.data.meetingId}`);
        }, 500);
      } else {
        alert("Failed to create meeting.");
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Server error. Try again later.");
    }
  };

  const joinMeeting = async () => {
    if (!meetingId.trim()) {
      alert('Please enter a valid meeting ID.');
      return;
    }

    try {
      const token = getAuthToken();
      const response = await axios.post(
        `https://videochatapp-backend-wx80.onrender.com/api/meet/join-meeting`,
        { meetingId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        navigate(`/meeting/${meetingId}`);
      } else {
        alert('Invalid meeting ID. Please check and try again.');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      alert('Server error. Try again later.');
    }
  };

  return (
    <div>
      <header className="bg-blue-300 h-20 flex justify-center items-center">
        <h1 className="text-4xl italic">Dashboard</h1>
      </header>

      <div className="grid grid-cols-12 h-screen">
        {/* Full Width Section (was left section) */}
        <div className="col-span-12 flex flex-col justify-center items-center p-8">
          <h1 className="text-2xl font-bold">Video call and meeting for everyone</h1>
          <h2 className="text-lg">Connect, collaborate, and create together</h2>

          {/* Buttons */}
          <div className="mt-6">
            <button
              onClick={createMeeting}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg mr-4"
            >
              Create Meeting
            </button>

            <input
              type="text"
              placeholder="Enter Meeting ID"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              onClick={joinMeeting}
              className="bg-green-500 text-white px-6 py-2 rounded-lg ml-2"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
