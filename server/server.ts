import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import http from "http";

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
// The current word to be guessed 
let secretWord:string = "hello";
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

function handleMessage(message: any, userId: any) {
  const dataFromClient = JSON.parse(message.toString());
  const json: any = { type: dataFromClient.type };
  if (dataFromClient.type === typesDef.USER_STATUS) {
    users[userId] = dataFromClient;
    userActivity.push(`${dataFromClient.username} joined to edit the document`);
    json.data = { users, editorContent, userActivity };
  } else if (dataFromClient.type === typesDef.USER_GUESS) {
    editorContent.push(dataFromClient.content);
    if(dataFromClient.content === secretWord){
        userActivity.push(`${users[userId].username} guessed the word!`);
        editorContent = [];
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

    connection.on('message', (message: any) => handleMessage(message, userId));
    // User disconnected
    connection.on('close', () => handleDisconnect(userId));

    // connection.send(`Hello, this is server.ts!`);
})

