import { io } from "socket.io-client";

export function createSocket(token: string) {
    return io("http://localhost:3000", {
        transports: ["websocket"],
        auth: { token },
    });
}
