import { RawMessage, WsConnection } from './types';

export function getId() {
  let id = 0;
  return function () {
    return ++id;
  };
}

// Function to broadcast a message to all connected clients
export function broadcast(connections: WsConnection[], message: RawMessage) {
  connections.forEach((connection) => {
    connection.ws.send(JSON.stringify(message));
  });
}
