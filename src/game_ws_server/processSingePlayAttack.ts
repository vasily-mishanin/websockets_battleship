import {
  Attack,
  HitStatus,
  Position,
  ProcessedGameShips,
  ProcessedShip,
} from './types';

export function processSingePlayAttack(
  processedPlayerShips: ProcessedGameShips,
  processedBotShips: ProcessedGameShips,
  attackedPosition: Position,
  attacker: number | 'bot'
): {
  status: HitStatus;
  updatedShips: ProcessedGameShips;
  attackedShip: ProcessedShip | undefined;
} {
  let enemyShips =
    attacker === 'bot' ? processedPlayerShips : processedBotShips;

  if (!enemyShips) {
    throw new Error('Error - enemyShips not found');
  }

  const attackedShip = enemyShips.ships.find((ship) =>
    ship.positions.some(
      (position) =>
        position.x === attackedPosition.x && position.y === attackedPosition.y
    )
  );

  if (!attackedShip) {
    return {
      status: 'miss',
      updatedShips: enemyShips,
      attackedShip: undefined,
    };
  }

  attackedShip.hittings.push({ x: attackedPosition.x, y: attackedPosition.y });

  const isShipKilled =
    attackedShip.positions.every((position) =>
      attackedShip.hittings.some(
        (hitting) => hitting.x === position.x && hitting.y === position.y
      )
    ) && attackedShip.hittings.length === attackedShip.positions.length;

  if (isShipKilled) {
    return { status: 'killed', updatedShips: enemyShips, attackedShip };
  }
  return { status: 'shot', updatedShips: enemyShips, attackedShip };
}
