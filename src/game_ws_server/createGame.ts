import { Game, RawMessage, Room, WsConnection } from './types';

type Props = {
  gameId: number;
  completedRoom: Room;
  connections: WsConnection[];
};

export function createGame({ gameId, completedRoom, connections }: Props) {
  completedRoom.roomUsers.forEach((roomUser) => {
    const game: Game = {
      idGame: gameId,
      idPlayer: roomUser.index,
    };

    const message: RawMessage = {
      type: 'create_game',
      data: JSON.stringify(game),
      id: 0,
    };

    connections
      .find((c) => c.id === roomUser.index)
      ?.ws.send(JSON.stringify(message));
  });
}
