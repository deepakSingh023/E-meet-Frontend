import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carousel } from "react-responsive-carousel";
import axios from 'axios';
import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState('');

  // Function to get token from localStorage
  const getAuthToken = () => localStorage.getItem("token");

  // Create Meeting Handler (Using Axios with Authorization)
  const createMeeting = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.post(
        "http://localhost:3000/api/meet/create-meeting",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.data.success) {
        setTimeout(() => {
          navigate(`/meeting/${response.data.meetingId}`); // Ensure navigation happens
        }, 500); // Small delay to let camera setup properly
      } else {
        alert("Failed to create meeting.");
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Server error. Try again later.");
    }
  };

  // Join Meeting Handler (Using Axios with Authorization)
  const joinMeeting = async () => {
    if (!meetingId.trim()) {
      alert('Please enter a valid meeting ID.');
      return;
    }

    try {
      const token = getAuthToken(); // Get the token
      const response = await axios.post(
        'http://localhost:3000/api/meet/join-meeting',
        { meetingId },
        {
          headers: { Authorization: `Bearer ${token}` }, // Include token
        }
      );

      if (response.data.success) {
        navigate(`/meeting/${meetingId}`); // Navigate to meeting page
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
        {/* Left Section */}
        <div className="col-span-6 bg-red-200 flex flex-col justify-center items-center p-8">
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

        {/* Right Section - Carousel */}
        <div className="col-span-6 flex justify-center items-center">
          <Carousel className="w-3/4">
            <div><img src="image1.jpg" alt="Slide 1" /></div>
            <div><img src="image2.jpg" alt="Slide 2" /></div>
            <div><img src="image3.jpg" alt="Slide 3" /></div>
          </Carousel>
        </div>
      </div>
    </div>
  );
}

