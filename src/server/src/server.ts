import WebSocket from "ws";
import express from "express";
import http, { IncomingMessage } from "http";
import cors from "cors";
import * as url from "url";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

app.use(cors());

app.get("/api/sensor_events", (req, res) => {
  res.json({ message: "Hello from REST API" });
});

server.on("upgrade", (request, socket, head) => {
  const pathname = url.parse(request.url!).pathname;
  const query = url.parse(request.url!, true).query;
  console.log(
    `WebSocket connection request to ${pathname} with query parameters:`,
    query
  );
  console.log("New client connected:");
  console.log(`   param1 Value    : ${query["param1"]}`);
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws, req) => {
  ws.on("message", (message) => {
    console.log("received: %s", message);
    ws.send(`Hello, you sent -> ${message}`);
  });

  ws.send("Hi there, I am a WebSocket server");
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
