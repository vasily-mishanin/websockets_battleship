import { WebSocketServer, WebSocket } from 'ws';
import {
  Attack,
  AttackFeedback,
  Game,
  GameFinish,
  GameShips,
  GameStart,
  HitStatus,
  Position,
  ProcessedGameShips,
  RawMessage,
  RegResponse,
  Room,
  RoomAddUser,
  Rooms,
  ShipsAdd,
  SinglePlay,
  User,
  UserCreds,
  Winner,
  WsConnection,
} from './types';
import {
  checkUserAndRoom,
  delay,
  getId,
  getRandomPositionToAttack,
  hasAlreadyAttacked,
  processShip,
} from './utils';
import { registerUser } from './registerUser';
import { updateRooms } from './updateRooms';
import { updateWinners } from './updateWinners';
import { createGame } from './createGame';
import { startGame } from './startGame';
import { makeTurn, turn } from './turn';
import { processAttack } from './processAttack';
import { killHits } from './killHits';
import { finishGame } from './finishGame';
import { processSingePlayAttack } from './processSingePlayAttack';

const WSS_PORT = 3000;

export const wss = new WebSocketServer({ port: WSS_PORT });

const players: User[] = [];
let rooms: Rooms = [];
let winners: Winner[] = [];
const games: { room: Room; gameId: number }[] = [];
const shipsAddedToGames: GameShips[] = [];
let processedGameShips: ProcessedGameShips[] = []; // ships with additional props
let currentAttacker = 0;

const id = getId();
const connections: WsConnection[] = [];

const TOTAL_NUMBER_OF_SHIPS = 10;

wss.on('connection', function connection(ws) {
  const clientId = id();
  const currentClient = { id: clientId, ws };
  connections.push(currentClient);
  const attackedEnemyPositions: Position[] = [];
  let numberOfKilledShips = 0;

  // single_play data
  const singlePlay: SinglePlay = {
    active: false,
    shipsAddedToGame: null,
    processedGameShips: null,
    botShips: null,
    currentAttacker: clientId || 'bot',
    attackedEnemyPositions: [],
    numberOfKilledShipsBot: 0,
    winner: null,
  };

  console.log('Connection - client ID - ', clientId);
  ws.on('message', async function message(rawData) {
    console.log(`RESEIVED from client ${clientId}: %s`, rawData);
    const incomingData: RawMessage = JSON.parse(rawData.toString());
    const messageType = incomingData.type;

    console.log(`client ${clientId}`, incomingData);

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
    if (messageType === 'add_user_to_room' && !singlePlay.active) {
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

    if (messageType === 'add_ships' && !singlePlay.active) {
      const receivedShips: ShipsAdd = JSON.parse(incomingData.data);
      shipsAddedToGames.push({ ships: receivedShips, connection: ws });
      //processed ships
      processedGameShips.push({
        gameId: receivedShips.gameId,
        indexPlayer: receivedShips.indexPlayer,
        connection: ws,
        ships: receivedShips.ships.map((ship) => processShip(ship)),
      });
      // game ships with their connections (clients)
      const shipsOfOneGame = shipsAddedToGames.filter(
        (shipData) => shipData.ships.gameId === receivedShips.gameId
      );
      // if both players send their ships (not single play)
      if (shipsOfOneGame.length > 1) {
        console.log('start_game', shipsOfOneGame);
        startGame(shipsOfOneGame);
        console.log('turn');
        const gameConnections = shipsOfOneGame.map((item) => item.connection);
        turn(currentClient.id, gameConnections);
        currentAttacker = currentClient.id;
      }
    }

    if (
      (messageType === 'attack' || messageType === 'randomAttack') &&
      !singlePlay.active
    ) {
      let attack: Attack = JSON.parse(incomingData.data);

      // if not user's turn
      if (attack.indexPlayer !== currentAttacker) {
        return;
      }

      const gameData = processedGameShips.filter(
        (data) => data.gameId === attack.gameId
      );
      const gameConnections = gameData.map((data) => data.connection);
      const anotherPlayerId = gameData.find(
        (data) => data.indexPlayer !== attack.indexPlayer
      )?.indexPlayer;

      if (!anotherPlayerId) {
        console.log('Error - another player not found');
        return;
      }

      if (messageType === 'attack') {
        if (
          hasAlreadyAttacked(attackedEnemyPositions, {
            x: attack.x,
            y: attack.y,
          })
        ) {
          console.log('You have already attacked this position!');
          turn(attack.indexPlayer, gameConnections);
          return;
        }

        attackedEnemyPositions.push({ x: attack.x, y: attack.y });
      }

      console.log({ attack });

      if (messageType === 'randomAttack') {
        attack = JSON.parse(incomingData.data);
        let randomPosition = getRandomPositionToAttack();
        while (hasAlreadyAttacked(attackedEnemyPositions, randomPosition)) {
          randomPosition = getRandomPositionToAttack();
        }
        attack.x = randomPosition.x;
        attack.y = randomPosition.y;
        attackedEnemyPositions.push(randomPosition);
      }

      const { status, updatedShips, attackedShip } = processAttack(
        processedGameShips,
        attack
      );

      processedGameShips = updatedShips;

      // respond to attacker
      const attackFeedback: AttackFeedback = {
        currentPlayer: attack.indexPlayer, // attacker
        position: { x: attack.x, y: attack.y },
        status,
      };

      const message: RawMessage = {
        type: 'attack',
        data: JSON.stringify(attackFeedback),
        id: 0,
      };

      currentClient.ws.send(JSON.stringify(message));

      // respond to attacked
      const attackedFeedback: AttackFeedback = {
        currentPlayer: anotherPlayerId, // attacker
        position: { x: attack.x, y: attack.y },
        status,
      };

      const messageToAttacked: RawMessage = {
        type: 'attack',
        data: JSON.stringify(attackFeedback),
        id: 0,
      };

      const attackedConnection = connections.find(
        (connection) => connection.id === anotherPlayerId
      );

      if (!attackedConnection) {
        console.log('Error - attacked connection not found');
        return;
      }

      attackedConnection.ws.send(JSON.stringify(message));

      // killed - hits around the ship
      if (attackedShip && status === 'killed') {
        const attackedPositions = killHits({
          attack,
          clients: [currentClient.ws, attackedConnection.ws],
          attackedShip,
        }); // bum bum
        attackedEnemyPositions.push(...attackedPositions);
        numberOfKilledShips += 1;
      }

      // if all ships killed
      if (numberOfKilledShips === TOTAL_NUMBER_OF_SHIPS) {
        const finishFeedback: GameFinish = {
          winPlayer: attack.indexPlayer,
        };

        finishGame(finishFeedback, connections);

        const attacker = players.find(
          (player) => player.index === attack.indexPlayer
        );

        if (attacker && winners.some((w) => w.name === attacker.name)) {
          winners = winners.map((winner) =>
            winner.name === attacker?.name
              ? { ...winner, wins: winner.wins + 1 }
              : winner
          );
        } else if (attacker) {
          winners.push({ name: attacker?.name, wins: 1 });
        }

        updateWinners(winners, connections);
        return;
      }

      // else define whose next turn is
      if (status === 'miss' && anotherPlayerId) {
        turn(anotherPlayerId, gameConnections);
        currentAttacker = anotherPlayerId;
      } else if (status === 'shot') {
        turn(attack.indexPlayer, gameConnections);
      } else {
        turn(attack.indexPlayer, gameConnections);
      }
    }

    // SINGLE PLAY

    if (messageType === 'single_play') {
      const game: Game = {
        idGame: id(),
        idPlayer: clientId,
      };

      const message: RawMessage = {
        type: 'create_game',
        data: JSON.stringify(game),
        id: 0,
      };

      currentClient.ws.send(JSON.stringify(message));
      singlePlay.active = true;
    }

    if (singlePlay.active && messageType === 'add_ships') {
      const receivedShips: ShipsAdd = JSON.parse(incomingData.data);
      //singlePlay.receivedShips.push(receivedShips);
      singlePlay.shipsAddedToGame = { ships: receivedShips, connection: ws };
      //processed ships
      singlePlay.processedGameShips = {
        gameId: receivedShips.gameId,
        indexPlayer: receivedShips.indexPlayer,
        connection: ws,
        ships: receivedShips.ships.map((ship) => processShip(ship)),
      };

      //// bot adds its ships
      singlePlay.botShips = singlePlay.processedGameShips;
      /// start single play

      const singleGame: GameStart = {
        currentPlayerIndex: clientId,
        ships: singlePlay.shipsAddedToGame.ships.ships,
      };
      console.log('Start Single Play --- ', singleGame);
      const message: RawMessage = {
        type: 'start_game',
        data: JSON.stringify(singleGame),
        id: 0,
      };

      currentClient.ws.send(JSON.stringify(message));
      console.log('turn');

      turn(currentClient.id, [currentClient.ws]);
      singlePlay.currentAttacker = currentClient.id;
    }

    // process attacks
    if (
      singlePlay.active &&
      (messageType === 'attack' || messageType === 'randomAttack')
    ) {
      let attack: Attack = JSON.parse(incomingData.data);

      // if not user's turn
      if (attack.indexPlayer !== singlePlay.currentAttacker) {
        return;
      }

      const gameConnections = [currentClient.ws];

      const attackedPosition = {
        x: attack.x,
        y: attack.y,
      };

      if (messageType === 'attack') {
        if (
          hasAlreadyAttacked(
            singlePlay.attackedEnemyPositions,
            attackedPosition
          )
        ) {
          console.log('You have already attacked this position!');
          turn(attack.indexPlayer, gameConnections);
          return;
        }

        singlePlay.attackedEnemyPositions.push(attackedPosition);
      }

      if (messageType === 'randomAttack') {
        attack = JSON.parse(incomingData.data);
        let randomPosition = getRandomPositionToAttack();
        while (
          hasAlreadyAttacked(singlePlay.attackedEnemyPositions, randomPosition)
        ) {
          randomPosition = getRandomPositionToAttack();
        }
        attack.x = randomPosition.x;
        attack.y = randomPosition.y;
        singlePlay.attackedEnemyPositions.push(randomPosition);
      }

      console.log('Single Play', { attack });

      if (singlePlay.processedGameShips && singlePlay.botShips) {
        const { status, updatedShips, attackedShip } = processSingePlayAttack(
          singlePlay.processedGameShips,
          singlePlay.botShips,
          attackedPosition,
          attack.indexPlayer
        );

        singlePlay.botShips = updatedShips;

        // respond to attacker
        const attackFeedback: AttackFeedback = {
          currentPlayer: attack.indexPlayer, // attacker
          position: { x: attack.x, y: attack.y },
          status,
        };

        const message: RawMessage = {
          type: 'attack',
          data: JSON.stringify(attackFeedback),
          id: 0,
        };

        currentClient.ws.send(JSON.stringify(message));

        // killed - hits around the killed ship
        if (attackedShip && status === 'killed') {
          const attackedPositions = killHits({
            attack,
            clients: [currentClient.ws],
            attackedShip,
          }); // bum bum
          attackedEnemyPositions.push(...attackedPositions);
          numberOfKilledShips += 1;
        }

        // if all ships killed
        if (numberOfKilledShips === TOTAL_NUMBER_OF_SHIPS) {
          const finishFeedback: GameFinish = {
            winPlayer: attack.indexPlayer,
          };

          finishGame(finishFeedback, [currentClient]);

          const attacker = players.find(
            (player) => player.index === attack.indexPlayer
          );

          if (!attacker) {
            console.log('Error - attrtacker not found');
            return;
          }

          singlePlay.winner = { name: attacker?.name, wins: 1 };

          updateWinners([singlePlay.winner], [currentClient]);
          return;
        }

        // else define whose next turn is
        // if player miss - bot attacks
        if (status === 'miss') {
          // BOT ATTACKS
          let botAttackResult: HitStatus;
          do {
            await delay(1500);
            const botId = 0;
            turn(botId, [currentClient.ws]);
            let botAttackedPosition = getRandomPositionToAttack();
            while (
              hasAlreadyAttacked(
                singlePlay.attackedEnemyPositions,
                botAttackedPosition
              )
            ) {
              botAttackedPosition = getRandomPositionToAttack();
            }
            const {
              status: statusBotAttack,
              updatedShips,
              attackedShip,
            } = processSingePlayAttack(
              singlePlay.processedGameShips,
              singlePlay.botShips,
              botAttackedPosition,
              'bot'
            );

            singlePlay.processedGameShips = updatedShips;

            // respond to attacked user (current client)
            const attackFeedback: AttackFeedback = {
              currentPlayer: botId, // attacked
              position: botAttackedPosition,
              status: statusBotAttack,
            };

            const message: RawMessage = {
              type: 'attack',
              data: JSON.stringify(attackFeedback),
              id: 0,
            };

            currentClient.ws.send(JSON.stringify(message));

            // BOT KILLS A SHIP
            // killed - hits around the killed ship
            if (attackedShip && statusBotAttack === 'killed') {
              const attackedPositions = killHits({
                attack: {
                  gameId: singlePlay.processedGameShips.gameId,
                  indexPlayer: botId,
                  x: botAttackedPosition.x,
                  y: botAttackedPosition.y,
                },
                clients: [currentClient.ws],
                attackedShip,
              }); // bum bum
              singlePlay.attackedEnemyPositions.push(...attackedPositions);
              singlePlay.numberOfKilledShipsBot += 1;
            }

            // if all ships killed
            if (singlePlay.numberOfKilledShipsBot === TOTAL_NUMBER_OF_SHIPS) {
              const finishFeedback: GameFinish = {
                winPlayer: botId,
              };

              finishGame(finishFeedback, [currentClient]);

              singlePlay.winner = { name: 'BOT', wins: 1 };

              updateWinners([singlePlay.winner], [currentClient]);
              return;
            }
            botAttackResult = statusBotAttack;
          } while (botAttackResult !== 'miss');

          turn(currentClient.id, gameConnections);
          // currentAttacker = anotherPlayerId;
        } else if (status === 'shot') {
          turn(attack.indexPlayer, gameConnections);
        } else {
          turn(attack.indexPlayer, gameConnections);
        }
      }
    }
  });
});

console.log(`Websocket Game Server on port  ${WSS_PORT}`);

process.on('exit', () => {
  wss.close();
  console.log('\n Web Socket connection closed');
});
