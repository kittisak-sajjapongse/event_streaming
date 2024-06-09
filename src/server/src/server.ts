import Redis from "ioredis";
import WebSocket from "ws";
import cors from "cors";
import express from "express";
import http from "http";
import * as url from "url";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const HISTORICAL_DATA_KEY: string = "region_0:temperature";
const REALTIME_DATA_CHANNEL: string = "region_0:temperature:notify";

app.use(cors());

app.get("/api/sensor_events", (req, res) => {
  const historicalData = new Redis(6379, "localhost");
  var measurements: any[] = [];
  historicalData.xlen(HISTORICAL_DATA_KEY).then((streamLength) => {
    historicalData
      .xrevrange(HISTORICAL_DATA_KEY, "+", "-", "COUNT", streamLength)
      .then((entries) => {
        entries.forEach(([id, fields]) => {
          const entry: any = {};
          for (let i = 0; i < fields.length; i += 2) {
            entry[fields[i]] = fields[i + 1];
          }
          measurements = [...measurements, entry];
          console.log(`ID: ${id}, Fields:`, entry);
        });
      })
      .then(() => {
        console.log(measurements);
        res.json(measurements);
      });
  });
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
  const realtimeData = new Redis(6379, "localhost");
  realtimeData.subscribe(REALTIME_DATA_CHANNEL, (err, count) => {
    if (err) {
      console.error("Failed to subscribe: ", err.message);
    } else {
      console.log(
        `Subscribed successfully! This client is currently subscribed to ${count} channels.`
      );
    }
  });
  const realtimeMsgHandler = async (channel: string, message: string) => {
    console.log(`Received message from ${channel}: ${message}`);
    ws.send(message);
  };
  realtimeData.on("message", realtimeMsgHandler);

  ws.on("close", () => {
    console.log("WebSocket connection closed");
    realtimeData.off("message", realtimeMsgHandler);
    realtimeData.unsubscribe(REALTIME_DATA_CHANNEL, (err, count) => {
      if (err) {
        console.error("Failed to unsubscribe: ", err.message);
      } else {
        console.log(
          `Unsubscribed successfully! This client is currently subscribed to ${count} channels.`
        );
      }
      realtimeData.quit();
    });
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
