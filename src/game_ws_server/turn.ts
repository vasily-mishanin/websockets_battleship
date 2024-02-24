import { GameShips, GameTurn, RawMessage } from './types';

export function turn(gameShipsData: GameShips[]) {
  console.log(turn.name);
  gameShipsData.forEach((gameShips) => {
    const turn: GameTurn = {
      currentPlayer: gameShips.ships.indexPlayer,
    };
    const message: RawMessage = {
      type: 'turn',
      data: JSON.stringify(turn),
      id: 0,
    };

    gameShips.connection.send(JSON.stringify(message));
  });
}
