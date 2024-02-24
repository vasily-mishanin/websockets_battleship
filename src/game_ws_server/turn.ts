import {
  GameShips,
  GameTurn,
  HitStatus,
  ProcessedGameShips,
  RawMessage,
} from './types';
import { WebSocket } from 'ws';

export function turn(playerId: number, connections: WebSocket[]) {
  connections.forEach((connection) => {
    const turn: GameTurn = {
      currentPlayer: playerId,
    };
    const message: RawMessage = {
      type: 'turn',
      data: JSON.stringify(turn),
      id: 0,
    };

    connection.send(JSON.stringify(message));
  });
}

export function makeTurn(
  status: HitStatus,
  attackerId: number,
  gameData: ProcessedGameShips[]
) {
  const anotherPlayerId = gameData.find(
    (data) => data.indexPlayer !== attackerId
  )?.indexPlayer;
  if (status === 'miss' && anotherPlayerId) {
    turn(
      anotherPlayerId,
      gameData.map((data) => data.connection)
    );
  } else if (status === 'shot') {
    turn(
      attackerId,
      gameData.map((data) => data.connection)
    );
  } else {
    // killed
    // TODO: logic for killed - send state for all cells around killed ship
    turn(
      attackerId,
      gameData.map((data) => data.connection)
    );
  }
}
