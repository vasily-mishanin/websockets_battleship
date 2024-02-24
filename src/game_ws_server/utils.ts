import {
  Attack,
  HitStatus,
  ProcessedGameShips,
  ProcessedShip,
  RawMessage,
  Room,
  Ship,
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

export function processAttack(
  processedGameShips: ProcessedGameShips[],
  attack: Attack
): { status: HitStatus; updatedShips: ProcessedGameShips[] } {
  let enemyShips = processedGameShips.find(
    (ships) =>
      ships.gameId === attack.gameId && ships.indexPlayer !== attack.indexPlayer
  );

  if (!enemyShips) {
    throw new Error('Error - enemyShips not found');
  }

  const attackedShip = enemyShips.ships.find((ship) =>
    ship.positions.some(
      (position) => position.x === attack.x && position.y === attack.y
    )
  );

  if (!attackedShip) {
    return { status: 'miss', updatedShips: processedGameShips };
  }

  attackedShip.hittings.push({ x: attack.x, y: attack.y });

  const isShipKilled =
    attackedShip.positions.every((position) =>
      attackedShip.hittings.some(
        (hitting) => hitting.x === position.x && hitting.y === position.y
      )
    ) && attackedShip.hittings.length === attackedShip.positions.length;

  if (isShipKilled) {
    return { status: 'killed', updatedShips: processedGameShips };
  }
  return { status: 'shot', updatedShips: processedGameShips };
}
