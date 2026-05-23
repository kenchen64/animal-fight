import { io } from "socket.io-client";

const socket = io(
  "https://animal-fight.onrender.com", {
    transports: ['polling', 'websocket']}
);

export default socket;
