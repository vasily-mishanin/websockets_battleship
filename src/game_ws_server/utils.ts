import {
  Attack,
  HitStatus,
  Position,
  ProcessedGameShips,
  ProcessedShip,
  RawMessage,
  Room,
  Ship,
  ShipsAdd,
  SinglePlay,
  User,
  WsConnection,
} from './types';

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

export function processShip(ship: Ship): ProcessedShip {
  const { x, y } = ship.position;
  // 2 cells, vertical up
  if (ship.type === 'medium' && ship.direction === true) {
    return {
      ...ship,
      positions: [
        { x, y },
        { x, y: y + 1 },
      ],
      hittings: [],
    };
  }
  // 2 cells, horizonal right
  else if (ship.type === 'medium' && ship.direction === false) {
    return {
      ...ship,
      positions: [
        { x, y },
        { x: x + 1, y },
      ],
      hittings: [],
    };
  }

  // 3 cells, vertical up
  else if (ship.type === 'large' && ship.direction === true) {
    return {
      ...ship,
      positions: [
        { x, y },
        { x, y: y + 1 },
        { x, y: y + 2 },
      ],
      hittings: [],
    };
  }

  // 3 cells, horizonal right
  else if (ship.type === 'large' && ship.direction === false) {
    return {
      ...ship,
      positions: [
        { x, y },
        { x: x + 1, y },
        { x: x + 2, y },
      ],
      hittings: [],
    };
  }

  // 4 cells, vertical up
  else if (ship.type === 'huge' && ship.direction === true) {
    return {
      ...ship,
      positions: [
        { x, y },
        { x, y: y + 1 },
        { x, y: y + 2 },
        { x, y: y + 3 },
      ],
      hittings: [],
    };
  }

  // 4 cells, horizonal right
  else if (ship.type === 'huge' && ship.direction === false) {
    return {
      ...ship,
      positions: [
        { x, y },
        { x: x + 1, y },
        { x: x + 2, y },
        { x: x + 3, y },
      ],
      hittings: [],
    };
  }

  // for small
  else {
    return { ...ship, positions: [{ x, y }], hittings: [] };
  }
}

// get random number
export function getRandom(m: number, n: number) {
  return m + Math.floor(Math.random() * (n + 1));
}

// getRandomPositionToAttack
export function getRandomPositionToAttack(): Position {
  return { x: getRandom(0, 9), y: getRandom(0, 9) };
}

export function hasAlreadyAttacked(
  attackedEnemyPositions: Position[],
  position: Position
) {
  return attackedEnemyPositions.some(
    (attackedPosition) =>
      attackedPosition.x === position.x && attackedPosition.y === position.y
  );
}

// to add delay somewhere
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getInitialSingleGame(clientId: number): SinglePlay {
  return {
    active: false,
    shipsAddedToGame: null,
    playerShips: null,
    botShips: null,
    currentAttacker: clientId || 'bot',
    attackedBotPositions: [],
    attackedPlayerPositions: [],
    numberOfBotKilledShips: 0,
    numberOfPlayerKilledShips: 0,
    winner: null,
    botId: 0,
  };
}

export const botShipsJSON =
  '{"gameId":6,"ships":[{"position":{"x":1,"y":8},"direction":false,"type":"huge","length":4},{"position":{"x":5,"y":2},"direction":true,"type":"large","length":3},{"position":{"x":3,"y":2},"direction":true,"type":"large","length":3},{"position":{"x":0,"y":2},"direction":true,"type":"medium","length":2},{"position":{"x":7,"y":3},"direction":false,"type":"medium","length":2},{"position":{"x":6,"y":7},"direction":false,"type":"medium","length":2},{"position":{"x":9,"y":7},"direction":false,"type":"small","length":1},{"position":{"x":4,"y":0},"direction":true,"type":"small","length":1},{"position":{"x":1,"y":6},"direction":false,"type":"small","length":1},{"position":{"x":6,"y":0},"direction":true,"type":"small","length":1}],"indexPlayer":4}';
export const botShips: ShipsAdd = JSON.parse(botShipsJSON);
