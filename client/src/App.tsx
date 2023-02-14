import React, { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from "react-use-websocket";

import './App.css'

const WS_URL = 'ws://127.0.0.1:8000';

function isUserEvent(message) {
    let evt = JSON.parse(message.data);
    return evt.type === "userevent";
}

function isDocumentEvent(message) {
    let evt = JSON.parse(message.data);
    return evt.type === "contentchange";
}

function App() {
    const [count, setCount] = useState(0)
    const [username, setUsername] = useState('');
    const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
        onOpen: () => {
            console.log(`WebSocket connection established.`);
        },
        share: true,
        filter: () => false,
        retryOnError: true,
        shouldReconnect: () => true
    });

    useEffect(() => {
        if(username && readyState === ReadyState.OPEN) {
            sendJsonMessage({
                username,
                type: "userevent"
            });
            console.log("json sent");
        }
    }, [username, sendJsonMessage, readyState]);

    return (
        <div>
            {username ? <EditorSection/> : <LoginSection onLogin={setUsername}/>}
        </div>
    )
}

function LoginSection({ onLogin }) {
  const [username, setUsername] = useState('');
  useWebSocket(WS_URL, {
    share: true,
    filter: () => false
  });
  function logInUser() {
    if(!username.trim()) {
      return;
    }
    onLogin && onLogin(username);
  }

  return (
    <div className="">
      <label>
        Name:
        <input type="text" name="username"  onInput={(e) => {
            e.preventDefault;
            setUsername(e.target.value)

            }} className="" />
      </label>
          <button
            type="button"
            onClick={() => logInUser()}
            className="">Join</button>
    </div>
  );
}

function Users() {
    const { lastJsonMessage } = useWebSocket(WS_URL, {
        share:true,
        filter: isUserEvent
    });
    const users = Object.values(lastJsonMessage?.data.users || {});
    return (
        <div className=' row-span-1'>
            {users.map(user => (
            <span key={user.username} className="mx-3">
                {user.username}
            </span>))}
        </div>
    );
}

function Document() {
    const { lastJsonMessage, sendJsonMessage } = useWebSocket(WS_URL, {
        share: true,
        filter: isDocumentEvent
    });

    let html = lastJsonMessage?.data.editorContent ||"";

    function handleHtmlChange(e) {
        e.preventDefault;
        sendJsonMessage({
            type: "contentchange",
            content: e.target.value
        });
    }

    return (
        <div className='  border border-gray-100 bg-grey-800 row-span-5'>
            <input type="text" value={html} onChange={handleHtmlChange}></input>
        </div>
    );
}

function EditorSection() {
    return (
        <div className='w-screen h-screen bg-gray-800 grid grid-rows-6'>
            <Users/>
            <Document/>
        </div>
    );
}

export default App
