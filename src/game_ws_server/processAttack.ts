import { Attack, HitStatus, ProcessedGameShips, ProcessedShip } from './types';

export function processAttack(
  processedGameShips: ProcessedGameShips[],
  attack: Attack
): {
  status: HitStatus;
  updatedShips: ProcessedGameShips[];
  attackedShip: ProcessedShip | undefined;
} {
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
    return {
      status: 'miss',
      updatedShips: processedGameShips,
      attackedShip: undefined,
    };
  }

  attackedShip.hittings.push({ x: attack.x, y: attack.y });

  const isShipKilled =
    attackedShip.positions.every((position) =>
      attackedShip.hittings.some(
        (hitting) => hitting.x === position.x && hitting.y === position.y
      )
    ) && attackedShip.hittings.length === attackedShip.positions.length;

  if (isShipKilled) {
    return { status: 'killed', updatedShips: processedGameShips, attackedShip };
  }
  return { status: 'shot', updatedShips: processedGameShips, attackedShip };
}
