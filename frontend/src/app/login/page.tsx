"use client";

import { useState } from "react";
import { login } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit() {
        const data = await login(email, password);
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("userEmail", data.user.email);

        console.log("LOGIN SUCCESSFUL");
        console.log("Saved userEmail:", data.user.email);
        console.log("accessToken : " + data.accessToken)
        const token = localStorage.getItem("token");

        if (!token) return;
        router.push("/chat/general");
    }

    return (
        <div className="flex flex-col items-center mt-20">
            <h1 className="text-2xl font-bold mb-6">Login</h1>
            <input
                className="p-2 border mb-2"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                className="p-2 border mb-2"
                placeholder="Password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
            />
            <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleSubmit}
            >
                Login
            </button>
        </div>
    );
}
