import React, { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from "react-use-websocket";

import './App.css'

const WS_URL = 'ws://127.0.0.1:8000';

function isUserStatus(message) {
    let evt = JSON.parse(message.data);
    return evt.type === "userstatus";
}

function isGuess(message) {
    let evt = JSON.parse(message.data);
    return evt.type === "userguess";
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
                type: "userstatus"
            });
        }
    }, [username, sendJsonMessage, readyState]);

    return (
        <div className='w-screen h-screen bg-gray-800 text-gray-200'>
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

            }} className="text-black" />
      </label>
      <button type="button" onClick={() => logInUser()} className="">Join</button>
    </div>
  );
}

function Users() {
    const { lastJsonMessage } = useWebSocket(WS_URL, {
        share:true,
        filter: isUserStatus
    });
    const users = Object.values(lastJsonMessage?.data.users || {});
    return (
        <div className='row-span-1'>
            {users.map(user => (
            <span key={user.username} className="mx-3">
                {user.username}
            </span>))}
        </div>
    );
}

function Document() {
    const [guess, setGuess] = useState('');
    const { lastJsonMessage, sendJsonMessage } = useWebSocket(WS_URL, {
        share: true,
    });
    let allGuesses = Object.values(lastJsonMessage?.data.editorContent || []);

    function handleGuess(e) {
        e.preventDefault;
        sendJsonMessage({
            type: "userguess",
            content: guess
        });
        console.log("guess sent");
    }

    return (
        <div className='border border-gray-100 row-span-4'>
            <div className="">
              <label>
                Guess:
                <input type="text" name="username"  onInput={(e) => {
                    e.preventDefault;
                    setGuess(e.target.value);
                }} className="text-black" />
              </label>
              <button type="button" onClick={(e) => handleGuess(e.target.value)} 
                className="">Guess
              </button>
            </div>
            <ul>
                {allGuesses.map(g => (<li>{g}</li>))}
            </ul>
        </div>
    );
}

function History() {
    const { lastJsonMessage } = useWebSocket(WS_URL, {
        share: true,
    });

    let history = Object.values(lastJsonMessage?.data.userActivity || []);

    return (
        <div className='row-span-1 mx-2 flex flex-col overflow-hidden'>
            {history.map(event => (<span className=''>{event}</span>)).reverse()}
        </div>
    );
}

function EditorSection() {
  useWebSocket(WS_URL, {
    share: true,
    filter: () => false
  });
    return (
        <div className='w-screen h-screen grid grid-rows-6'>
            <Users/>
            <Document/>
            <History/>
        </div>
    );
}

export default App
