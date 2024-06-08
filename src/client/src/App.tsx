import React, { useState, useEffect } from 'react';

const WebSocketClient: React.FC = () => {
  const [apiData, setApiData] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Fetch data from the REST API
    fetch('http://localhost:3000/api/sensor_events')
      .then(response => response.json())
      .then(data => {
        setApiData(data.message);

        // Initialize WebSocket connection
        const socket = new WebSocket('ws://localhost:3000/ws/sensor_events?param1=1234');
        setWs(socket);

        socket.onopen = () => {
          console.log('WebSocket connection established');
          socket.send('Hello Server');
        };

        socket.onmessage = (event) => {
          console.log('Received from WebSocket:', event.data);
          setMessages(prevMessages => [...prevMessages, event.data]);
        };

        socket.onclose = () => {
          console.log('WebSocket connection closed');
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        return () => {
          socket.close();
        };
      })
      .catch(error => console.error('Error fetching API data:', error));
  }, []);

  return (
    <div>
      <h1>WebSocket Client</h1>
      {apiData && <p>Received from REST API: {apiData}</p>}
      <div>
        <h2>WebSocket Messages</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketClient;
