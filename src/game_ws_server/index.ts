import { WebSocketServer, WebSocket } from 'ws';
import {
  Attack,
  AttackFeedback,
  Game,
  GameShips,
  RawMessage,
  RegResponse,
  Room,
  RoomAddUser,
  Rooms,
  ShipsAdd,
  User,
  UserCreds,
  Winner,
  WsConnection,
} from './types';
import { checkUserAndRoom, getId } from './utils';
import { registerUser } from './registerUser';
import { updateRooms } from './updateRooms';
import { updateWinners } from './updateWinners';
import { createGame } from './createGame';
import { startGame } from './startGame';
import { turn } from './turn';

const WSS_PORT = 3000;

export const wss = new WebSocketServer({ port: WSS_PORT });

const players: User[] = [];
let rooms: Rooms = [];
const winners: Winner[] = [];
const games: { room: Room; gameId: number }[] = [];
const shipsAddedToGames: GameShips[] = [];

const id = getId();
const connections: WsConnection[] = [];

wss.on('connection', function connection(ws) {
  const clientId = id();
  const currentClient = { id: clientId, ws };
  connections.push(currentClient);

  console.log('client ID - ', clientId);
  ws.on('message', function message(rawData) {
    console.log(`RESEIVED from client ${clientId}: %s`, rawData);
    const incomingData: RawMessage = JSON.parse(rawData.toString());
    const messageType = incomingData.type;

    console.log(clientId, incomingData);

    // HANDLERS
    // register
    if (messageType === 'reg') {
      const userCreds: UserCreds = JSON.parse(incomingData.data);
      players.push({ index: clientId, name: userCreds.name });
      console.log({ players });
      registerUser({ userCreds, clientId, ws });
      updateRooms(rooms, connections);
      updateWinners(winners, connections);
    }

    // Create new room (create game room and add yourself there)
    if (messageType === 'create_room' && players[0]) {
      // update rooms
      const player = players.find((player) => player.index === clientId);
      if (!player) {
        throw new Error('Error when creating room - user not found');
      }
      rooms.push({
        roomId: id(),
        roomUsers: [player],
      });

      updateRooms(rooms, connections);
    }

    // Add youself (user) to somebodys room, then remove the room from available rooms list
    if (messageType === 'add_user_to_room') {
      const { indexRoom }: RoomAddUser = JSON.parse(incomingData.data);
      // player in the game session, who have sent add_user_to_room request
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
      // add user to room
      const updatedRooms: Rooms = rooms.map((room) =>
        room.roomId === indexRoom
          ? { ...room, roomUsers: [...room.roomUsers, user] }
          : room
      );

      // remove full rooms (where 2 players are)
      rooms = updatedRooms.filter((room) => room.roomUsers.length < 2);
      // remove my (user's) room, because user has joined to another room
      rooms = rooms.filter((room) =>
        //left only rooms without user who joined to another room
        room.roomUsers.every((u) => u.index !== user.index)
      );

      updateRooms(rooms, connections); // rooms where only 1 player inside
      // create game - send for both players in the room

      const completedRoom = updatedRooms.find(
        (room) => room.roomId === indexRoom
      );

      console.log('DEBUG - roomUsers', completedRoom?.roomUsers);
      if (!completedRoom) {
        console.log('Error - no completedRoom');
        throw Error('Error - no completedRoom');
      }
      const gameId = id();

      games.push({
        gameId,
        room: completedRoom,
      });

      createGame({ gameId, completedRoom, connections });
    }

    if (messageType === 'add_ships') {
      const receivedShips: ShipsAdd = JSON.parse(incomingData.data);
      shipsAddedToGames.push({ ships: receivedShips, connection: ws });
      // game ships with their connections (clients)
      const shipsOfOneGame = shipsAddedToGames.filter(
        (ship) => ship.ships.gameId === receivedShips.gameId
      );
      if (shipsOfOneGame.length > 1) {
        console.log('start_game');
        startGame(shipsOfOneGame);
        console.log('turn');
        turn(shipsOfOneGame);
      }
    }

    if (messageType === 'attack') {
      const attack: Attack = JSON.parse(incomingData.data);
      console.log({ attack });
      const attackFeedback: AttackFeedback = {
        currentPlayer: clientId,
        position: { x: attack.x, y: attack.y },
        status: 'miss',
      };

      const message: RawMessage = {
        type: 'attack',
        data: JSON.stringify(attackFeedback),
        id: 0,
      };

      currentClient.ws.send(JSON.stringify(message));
    }
  });
});

console.log(`Websocket Game Server on port  ${WSS_PORT}`);

process.on('exit', () => {
  wss.close();
  console.log('\n Web Socket connection closed');
});
