import { RawMessage, Room, WsConnection } from './types';
import { broadcast } from './utils';

export function updateRooms(rooms: Room[], connections: WsConnection[]) {
  const message: RawMessage = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  };
  broadcast(connections, message);
}
