import { io } from "socket.io-client";


const socket = io("https://videochatapp-backend-wx80.onrender.com", {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;
