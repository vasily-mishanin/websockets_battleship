import { WebSocketServer } from 'ws';
import {
  RawMessage,
  RegResponse,
  RoomAddUser,
  Rooms,
  User,
  UserCreds,
  Winners,
} from './types';
import { getId } from './utils';

const WSS_PORT = 3000;

export const wss = new WebSocketServer({ port: WSS_PORT });

const players: User[] = [];
let rooms: Rooms = [];
const winners: Winners = [];

const id = getId();

wss.on('connection', function connection(ws) {
  const clientId = id();
  console.log('client ID - ', clientId);
  ws.on('message', function message(rawData) {
    console.log(`RESEIVED from ${clientId}: %s`, rawData);
    // const player1 = players.player1;
    // const player2 = players.player2;
    const incomingData: RawMessage = JSON.parse(rawData.toString());
    const messageType = incomingData.type;

    console.log(clientId, incomingData);

    // handlers
    // register

    if (messageType === 'reg') {
      const userCreds: UserCreds = JSON.parse(incomingData.data);
      //const userId = id();
      players.push({ index: clientId, name: userCreds.name });
      console.log({ players });

      const userDataForResponse: RegResponse = {
        name: userCreds.name,
        index: clientId,
        error: false,
        errorText: '',
      };

      const response: RawMessage = {
        type: 'reg',
        data: JSON.stringify(userDataForResponse),
        id: 0,
      };
      ws.send(JSON.stringify(response));

      // update room
      const response1: RawMessage = {
        type: 'update_room',
        data: JSON.stringify(rooms),
        id: 0,
      };
      console.log({ rooms });
      ws.send(JSON.stringify(response1));
      // update winners
      const response2: RawMessage = {
        type: 'update_winners',
        data: JSON.stringify(winners),
        id: 0,
      };
      console.log({ winners });
      ws.send(JSON.stringify(response2));
    }

    if (messageType === 'create_room' && players[0]) {
      // Create new room (create game room and add yourself there)
      // update rooms
      const player = players.find((player) => player.index === clientId);
      if (!player) {
        throw new Error('Error when creating room - user not found');
      }
      rooms.push({
        roomId: id(),
        roomUsers: [player],
      });

      const response1: RawMessage = {
        type: 'update_room',
        data: JSON.stringify(rooms),
        id: 0,
      };
      ws.send(JSON.stringify(response1));
      console.log({ rooms });
      //   // update winners
      //   const updateWinnersData: WinnersUpdate = [
      //     { name: players.player1.name, wins: 0 },
      //   ];

      //   const response2: RawMessage = {
      //     type: 'update_winners',
      //     data: JSON.stringify(updateWinnersData),
      //     id: 0,
      //   };
      //   ws.send(JSON.stringify(response2));
    }

    if (messageType === 'add_user_to_room') {
      const { indexRoom }: RoomAddUser = JSON.parse(incomingData.data);
      const user = players.find((player) => player.index === clientId);
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

      const updatedRooms: Rooms = rooms.map((room) =>
        room.roomId === indexRoom
          ? { ...room, roomUsers: [...room.roomUsers, user] }
          : room
      );
      // remove full rooms
      rooms = updatedRooms.filter((room) => room.roomUsers.length < 2);
      // remove my room, because I've joined to another room
      rooms = rooms.filter((room) =>
        room.roomUsers.every((u) => u.index !== user.index)
      );

      const response: RawMessage = {
        type: 'update_room',
        data: JSON.stringify(rooms),
        id: 0,
      };
      ws.send(JSON.stringify(response));
    }
  });
});

console.log(`Websocket Game Server on port  ${WSS_PORT}`);

process.on('exit', () => {
  wss.close();
  console.log('\n Web Socket connection closed');
});
