import { WebSocketServer, WebSocket } from 'ws';
import {
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
import { getId } from './utils';
import { registerUser } from './registerUser';
import { updateRooms } from './updateRooms';
import { updateWinners } from './updateWinners';
import { createGame } from './createGame';
import { startGame } from './startGame';

const WSS_PORT = 3000;

export const wss = new WebSocketServer({ port: WSS_PORT });

const players: User[] = [];
let rooms: Rooms = [];
const winners: Winner[] = [];
const games: { room: Room; game: Game; players: [User, User] }[] = [];
const shipsAddedToGames: GameShips[] = [];

const id = getId();
const connections: WsConnection[] = [];

wss.on('connection', function connection(ws) {
  const clientId = id();
  connections.push({ id: clientId, ws });

  console.log('client ID - ', clientId);
  ws.on('message', function message(rawData) {
    console.log(`RESEIVED from ${clientId}: %s`, rawData);
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
      // remove my (user) room, because I've joined to another room
      rooms = rooms.filter((room) =>
        room.roomUsers.every((u) => u.index !== user.index)
      );

      updateRooms(rooms, connections);
      // create game - send for both players in the room
      const game: Game = {
        idGame: id(),
        idPlayer: clientId,
      };

      games.push({
        room: room,
        game,
        players: [room.roomUsers[0], room.roomUsers[1]],
      });

      console.log('games - ', games);
      createGame(game, connections);
    }

    if (messageType === 'add_ships') {
      const receivedShips: ShipsAdd = JSON.parse(incomingData.data);
      shipsAddedToGames.push({ ships: receivedShips, connection: ws });
      // ships with their connections
      const shipsOfOneGame = shipsAddedToGames.filter(
        (ship) => ship.ships.gameId === receivedShips.gameId
      );
      if (shipsOfOneGame.length > 1) {
        console.log('start_game');
        startGame(shipsOfOneGame);
      }
    }
  });
});

console.log(`Websocket Game Server on port  ${WSS_PORT}`);

process.on('exit', () => {
  wss.close();
  console.log('\n Web Socket connection closed');
});
