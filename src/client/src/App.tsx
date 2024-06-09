import React, { useState, useEffect } from "react";

const WebSocketClient: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    // First retrieved the measurements already done from Redis Stream
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/sensor_events");
        const data = await response.json();
        setHistoricalData(data);
      } catch (error) {
        console.error("Error retrieving historical data:", error);
      }
    };
    fetchData();

    // Then, initialize the websocket to get realtime data
    const socket = new WebSocket(
      "ws://localhost:3000/ws/sensor_events?param1=1234"
    );

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (measurement) => {
      console.log("Received from WebSocket:", measurement.data);
      setHistoricalData((prevMeasurement) => [
        JSON.parse(measurement.data),
        ...prevMeasurement,
      ]);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <div>
        <h1>Realtime Temperature</h1>
        <p>
          Temperature measurements from multiple sensors in
          reverse-chronological order
        </p>
      </div>
      <div>
        <table cellSpacing="0" cellPadding="10" border="1" align="center">
          <tr>
            <td align="center">Datetime</td>
            <td align="center">Sensor ID</td>
            <td align="center">Temperature</td>
          </tr>
          {historicalData.map((measurement, index) => (
            <tr key={index}>
              <td align="center">{measurement.timestamp}</td>
              <td align="center">{measurement.sensor_id}</td>
              <td align="center">{measurement.temperature}</td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  );
};

export default WebSocketClient;
