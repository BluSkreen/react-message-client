import { WebSocketServer } from "ws";
import http from "http";
import { v4 as uuidv4 } from "uuid";

const port = 8000;
const server = http.createServer();
const wsServer = new WebSocketServer({ server });

server.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
});

wsServer.on("conneciton", (connection) => {

    console.log("Recieved a new connection.");

    connection.on("message", (data: String) => {
        console.log(`Recieved message from client: ${data}`);
    })

    connection.send(`Hello, this is server.ts! Here is a uuid: ${uuidv4()}`);
})

