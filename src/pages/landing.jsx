import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-20 bg-green-300 flex justify-between items-center px-8 shadow-md">
        <h1 className="text-2xl font-bold text-white">E-Meet</h1>
        <div className="space-x-4">
          <button
            className="bg-white text-green-600 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-full hover:bg-green-700 transition"
            onClick={() => navigate("/register")}
          >
            Registe
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center text-center px-4">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
            Connect with people, anytime, anywhere.
          </h2>
          <p className="text-gray-600 mb-6">
            E-Meet is your ultimate online platform to schedule meetings, chat,
            and collaborate seamlessly. Join us and revolutionize your virtual
            connections.
          </p>
          <div className="space-x-4">
            <button
              className="bg-green-600 text-white px-6 py-3 rounded-full text-lg hover:bg-green-700 transition"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>
            <button
              className="border border-green-600 text-green-600 px-6 py-3 rounded-full text-lg hover:bg-green-100 transition"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
