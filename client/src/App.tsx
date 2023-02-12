import React, { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from "react-use-websocket";

import './App.css'

const WS_URL = 'ws://127.0.0.1:8000';

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
        }
    }, [username, sendJsonMessage, readyState]);

    return (
        <div>
            {username ? <p>logged in</p> : <p>not logged in</p>}
        </div>
    )
}

export default App
