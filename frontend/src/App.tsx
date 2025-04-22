// frontend/src/App.tsx
import React, { useState } from "react";
import { ChatRoom } from "./components/Chatroom";

function App() {
  const [joined, setJoined] = useState(false);
  const [room, setRoom] = useState("room1");
  const [user, setUser] = useState("");

  if (!joined) {
    return (
      <div style={{ padding: 32 }}>
        <h2>加入聊天</h2>
        <input
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          placeholder="Room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={() => user && setJoined(true)}>进入</button>
      </div>
    );
  }

  return <ChatRoom room={room} user={user} />;
}

export default App;
