"use client";

import { useEffect, useRef } from "react";

export interface Message {
    user: string;
    text: string;
    local?: boolean;
    timestamp?: number;
}

interface MessageListProps {
    messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
    /** Scroll to bottom */
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /** 
     * SSR safety: localStorage only exists in browser
     */
    const me =
        typeof window !== "undefined"
            ? localStorage.getItem("userEmail")
            : null;

    if (!Array.isArray(messages)) {
        console.warn("MessageList: messages is NOT an array -> ", messages);
        return (
            <div className="p-4 text-red-500">
                Message format invalid. Expected array.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((m, i) => {
                const isMe = m.local === true || m.user === me;

                return (
                    <div
                        key={i}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`px-3 py-2 rounded-lg max-w-xs shadow ${isMe
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-black"
                                }`}
                        >
                            {!isMe && (
                                <div className="font-semibold mb-0.5">{m.user}</div>
                            )}

                            <div>{m.text}</div>
                        </div>
                    </div>
                );
            })}

            {/* Auto-scroll target */}
            <div ref={bottomRef} />
        </div>
    );
}
