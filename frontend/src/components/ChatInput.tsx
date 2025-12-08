"use client";

import { useState } from "react";
import { Socket } from "socket.io-client";

interface ChatInputProps {
    socket: Socket | null;
    room: string;
}

export default function ChatInput({ socket, room }: ChatInputProps) {
    const [text, setText] = useState("");

    function send() {
        if (!socket || !text.trim()) return;

        const user = localStorage.getItem("userEmail") || "Me";

        socket.emit("message", { room, text });
        socket.emit("message:local", {
            user,
            text,
            local: true,
            timestamp: Date.now(),
        });

        setText("");
    }

    return (
        <div className="p-4 border-t flex gap-2">
            <input
                className="flex-1 p-2 border rounded"
                placeholder="Write a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">
                Send
            </button>
        </div>
    );
}
