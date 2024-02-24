import { GameShips, GameStart, RawMessage } from './types';

export function startGame(gameShipsData: GameShips[]) {
  gameShipsData.forEach((gameShips) => {
    const game: GameStart = {
      currentPlayerIndex: gameShips.ships.indexPlayer,
      ships: gameShips.ships.ships,
    };
    console.log('startGame --- ', game);
    const message: RawMessage = {
      type: 'start_game',
      data: JSON.stringify(game),
      id: 0,
    };

    gameShips.connection.send(JSON.stringify(message));
  });
}
