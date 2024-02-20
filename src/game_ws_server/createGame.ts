import { Game, RawMessage, WsConnection } from './types';
import { broadcast } from './utils';

export function createGame(game: Game, connections: WsConnection[]) {
  const message: RawMessage = {
    type: 'create_game',
    data: JSON.stringify(game),
    id: 0,
  };
  broadcast(connections, message);
}
