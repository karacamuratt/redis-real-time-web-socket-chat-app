# Realtime Collaboration Chat App

This project is a full-stack real-time collaboration chat application built with:

- **NestJS** (WebSockets + REST API + Redis Streams + MongoDB)
- **Next.js (App Router)** as the frontend UI
- **Redis** for presence tracking & real-time message streaming
- **MongoDB** for persistent message storage
- **Socket.IO** for bidirectional communication



## Project Structure

/backend → NestJS WebSocket server + REST API
/frontend → Next.js frontend (client-side chat interface)


## 🚀 Getting Started

### 1. Start Redis & MongoDB

Use Docker:

docker-compose up -d



### 2. Start Backend

cd backend
npm install
npm run start:dev


### 3. Start Frontend

cd frontend
npm install
npm run dev





Authentication Flow

Login returns { accessToken, refreshToken, user }
Tokens are stored in localStorage
Frontend sends the token during WebSocket handshake



💬 Real-Time Features

Join room (general)
Send & receive messages instantly
Messages stored in MongoDB + Redis Stream
Presence tracking via Redis (online/offline)
Local echo UX (your own messages instantly shown)



✨ Future Work (Backlog)

Chat history fetch API (GET /history/:room)
Pagination (infinite scroll)
Typing indicators
Online status badges
BullMQ workers for analytics