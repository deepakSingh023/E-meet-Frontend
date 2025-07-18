import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../redux/store'; // adjust path based on your store location
import { v4 as uuidv4 } from 'uuid';

const Dashboard = () => {
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user); // Assumes Redux slice `auth.user`

  const handleCreateMeeting = () => {
    const meetingId = uuidv4();
    navigate(`/meeting/${meetingId}`);
  };

  const handleJoinMeeting = () => {
    const meetingId = prompt('Enter meeting ID to join:');
    if (meetingId) {
      navigate(`/meeting/${meetingId}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">Welcome, {user?.name || 'Guest'}!</h1>
      <div className="flex gap-4">
        <button
          onClick={handleCreateMeeting}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl text-lg font-semibold shadow"
        >
          Create Meeting
        </button>
        <button
          onClick={handleJoinMeeting}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl text-lg font-semibold shadow"
        >
          Join Meeting
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
