import { RawMessage, Room, Winner, WsConnection } from './types';
import { broadcast } from './utils';

export function updateWinners(winners: Winner[], connections: WsConnection[]) {
  const message: RawMessage = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };
  console.log({ winners });

  broadcast(connections, message);
}
