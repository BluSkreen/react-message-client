import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import http from "http";

import fs from 'fs';

let words:any = [];
let secretWord = "";
// Return the contents of 'data.csv' as a string in the variable "data"
// "utf8" encodes the raw buffer data in human-readable format
fs.readFile('corncob_lowercase.txt', 'utf8', (error, data) => {
  error ? console.error(error) : words = data.split("\r\n")
  secretWord = words[Math.floor(Math.random() * words.length-1)];
});
// The current word to be guessed 


const port = 8000;
const server = http.createServer();
const wsServer = new WebSocketServer({ server });

let clients: any = {};

server.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
});

const users: any = {};
// The current editor content is maintained here.
let editorContent: any = [];
// User activity history.
let userActivity: any = [];

// Event types
const typesDef = {
  USER_STATUS: 'userstatus',
  USER_GUESS: 'userguess'
}

function broadcastMessage(json: any) {
  // We are sending the current data to all connected clients
  const data = JSON.stringify(json);
  for(let userId in clients) {
    let client = clients[userId];
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  };
}


function matchingCount(count: any, strA: any, strB: any): any {
    let len = strA.length;

    console.log(strA);
    console.log(strB);
    for(let a = 0; a < len; a++) {
        for(let b = 0; b < len; b++) {
            if (strA[a] == strB[b]) {
                strA.splice(a, 1);
                strB.splice(b, 1)
                // console.log(strA + " " + strB);
                len--;
                if (len == 0) return count;
                return matchingCount((count + 1), strA, strB);
            } else if (b == len-1) {
                return count;
            }
        }
    }
    return count;
};



function handleMessage(message: any, userId: any) {
  const dataFromClient = JSON.parse(message.toString());
  const json: any = { type: dataFromClient.type };
  if (dataFromClient.type === typesDef.USER_STATUS) {
    users[userId] = dataFromClient;
    userActivity.push(`${dataFromClient.username} joined to edit the document`);
    json.data = { users, editorContent, userActivity };
  } else if (dataFromClient.type === typesDef.USER_GUESS) {
    if(dataFromClient.content === secretWord){
        userActivity.push(`${users[userId].username} guessed the word!`);
        secretWord = words[Math.floor(Math.random() * words.length-1)];
        editorContent = [];
    } else {
        // let compare:any = [`${secretWord}`, `${dataFromClient.content}`];
        let count = matchingCount(0, `${secretWord}`.split(""), `${dataFromClient.content}`.split(""));
        editorContent.push(`${dataFromClient.content} - correct letters: ${count}`);
    }
    json.data = { users, editorContent, userActivity };
  } else {
      json.data = { users, editorContent, userActivity };
  }
  broadcastMessage(json);
}

function handleDisconnect(userId: any) {
    console.log(`${userId} disconnected.`);
    const json: any = { type: typesDef.USER_STATUS };
    const username = users[userId]?.username || userId;
    userActivity.push(`${username} left the document`);
    json.data = { users, userActivity };
    delete clients[userId];
    delete users[userId];
    broadcastMessage(json);
}


wsServer.on("connection", function(connection) {
    connection.on("error", console.error);
    const userId = uuidv4();
    clients[userId] = connection;
    console.log(`${userId} connected.`);
    console.log(secretWord);

    connection.on('message', (message: any) => handleMessage(message, userId));
    // User disconnected
    connection.on('close', () => handleDisconnect(userId));

    // connection.send(`Hello, this is server.ts!`);
})

