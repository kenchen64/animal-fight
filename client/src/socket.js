import { io } from "socket.io-client";

const socket = io(
  "https://animal-fight.onrender.com"
);

export default socket;
