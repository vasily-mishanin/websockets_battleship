export function getId() {
  let id = 0;
  return function () {
    return ++id;
  };
}

// // Function to broadcast a message to all connected clients
// export function broadcast(message) {
//   clients.forEach(client => {
//     client.ws.send(message);
//   });
