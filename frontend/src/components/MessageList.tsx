interface Message {
    user: string;
    text: string;
    local?: boolean;
    timestamp?: number;
}

export default function MessageList({ messages }: { messages: Message[] }) {
    const me = localStorage.getItem("userEmail");

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {messages.map((m, i) => {
                const isMe = m.user === me || m.local === true;

                return (
                    <div
                        key={i}
                        className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`px-3 py-2 rounded-lg max-w-xs ${
                                isMe
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-black"
                            }`}
                        >
                            {!isMe && <div className="font-bold">{m.user}</div>}
                            <div>{m.text}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
