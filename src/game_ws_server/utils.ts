import { RawMessage, Room, User, WsConnection } from './types';

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

export function checkUserAndRoom(
  indexRoom: number,
  rooms: Room[],
  user?: User
) {
  if (!user) {
    throw new Error('Error when adding user - no user found');
  }

  const room = rooms.find((room) => room.roomId === indexRoom);

  if (!room) {
    throw new Error('Error when adding user - no room found');
  }

  if (room.roomUsers.some((u) => u.index === user.index)) {
    console.log(
      "Do not add yourself to your room. Instead add yourself to somebody's room."
    );
    return;
  }
}
