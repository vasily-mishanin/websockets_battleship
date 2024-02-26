import { GameFinish, RawMessage, WsConnection } from './types';
import { broadcast } from './utils';

export function finishGame(
  finishFeedback: GameFinish,
  connections: WsConnection[]
) {
  const message: RawMessage = {
    type: 'finish',
    data: JSON.stringify(finishFeedback),
    id: 0,
  };

  broadcast(connections, message);
}
