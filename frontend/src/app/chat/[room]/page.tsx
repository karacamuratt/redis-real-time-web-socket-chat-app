"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createSocket } from "@/lib/socket";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import router from "next/router";

type ChatMessage = {
    user: string;
    text: string;
};

export default function ChatRoom() {
    const { room } = useParams();
    const [token, setToken] = useState<string | null>(null);
    const [socket, setSocket] = useState<any>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        const t = localStorage.getItem("token");
        if (!t) {
            router.push("/login");
            return;
        }
        setToken(t);
    }, []);

    useEffect(() => {
        if (!room) return;

        async function loadHistory() {
            try {
                const res = await fetch(`http://localhost:3000/chat/history/${room}?count=50`);
                const data = await res.json();

                if (Array.isArray(data.history)) {
                    setMessages(data.history);
                } else {
                    console.warn("Invalid history format", data);
                    setMessages([]);
                }
            } catch (err) {
                console.error("History fetch error:", err);
            }
        }

        loadHistory();
    }, [room]);

    useEffect(() => {
        if (!room) {
            console.log("room is not existing...");
            return;
        }

        const token = localStorage.getItem("token");
        const s = createSocket(token!);
        setSocket(s);

        s.on("connect", () => {
            console.log("WS CONNECTED");
            s.emit("join", room);
        });

        s.on("message", (m: ChatMessage) => {
            console.log("RECEIVED FROM WS:", m);
            setMessages((prev) => [...prev, m]);
        });

        s.on("message:local", (m) => {
            console.log("LOCAL MESSAGE:", m);
            setMessages((prev) => [...prev, m]);
        });

        return () => {
            s.disconnect(); // cleanup is NOW valid
        };
    }, [token, room]);

    if (!token) return <div className="p-10">Loading...</div>;

    return (
        <div className="flex flex-col h-screen">
            <MessageList messages={messages} />
            <ChatInput socket={socket} room={room as string} />
        </div>
    );
}
