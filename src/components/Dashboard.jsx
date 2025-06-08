import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState('');
  const [socket, setSocket] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('https://videochatapp-backend-wx80.onrender.com');
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      // Handle socket authentication response
      socket.on('authenticated', (data) => {
        if (data.success) {
          setIsAuthenticated(true);
          console.log('Socket authenticated successfully');
        } else {
          console.error('Socket authentication failed:', data.message);
          localStorage.removeItem('token');
          navigate('/login');
        }
      });

      // Handle errors
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });
    }
  }, [socket, navigate]);

  const authenticateSocket = () => {
    const token = localStorage.getItem('token');
    if (token && socket) {
      socket.emit('authenticate', { token });
    } else {
      navigate('/login');
    }
  };

  const createMeeting = async () => {
    try {
      authenticateSocket();
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://videochatapp-backend-wx80.onrender.com/api/meet/create-meeting`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        navigate(`/meeting/${response.data.meetingId}`);
      } else {
        alert('Failed to create meeting.');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Server error. Try again later.');
    }
  };

  const joinMeeting = () => {
    if (!meetingId.trim()) {
      alert('Please enter a valid meeting ID.');
      return;
    }

    authenticateSocket();
    navigate(`/meeting/${meetingId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Video Meeting App</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Start or join a meeting
          </h2>
          
          <div className="space-y-6">
            <div className="text-center">
              <button
                onClick={createMeeting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Create New Meeting
              </button>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <div className="border-t border-gray-300 flex-grow"></div>
              <span className="text-gray-500 px-2">OR</span>
              <div className="border-t border-gray-300 flex-grow"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="meeting-id" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Meeting ID
                </label>
                <input
                  id="meeting-id"
                  type="text"
                  placeholder="e.g. abc-defg-hij"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={joinMeeting}
                disabled={!meetingId.trim()}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  meetingId.trim()
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}