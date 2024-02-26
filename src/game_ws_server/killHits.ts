import {
  Attack,
  AttackFeedback,
  HitStatus,
  Position,
  ProcessedShip,
  RawMessage,
} from './types';
import WebSocket from 'ws';

type Props = {
  attack: Attack;
  clients: WebSocket[];
  attackedShip: ProcessedShip;
};
export function killHits({ attack, clients, attackedShip }: Props) {
  const { length, direction } = attackedShip;
  const { x, y } = attackedShip.position;
  let positions: Position[] = [];
  if (direction === false) {
    if (length === 4) {
      positions = [
        { x: x - 1, y: y - 1 },
        { x: x, y: y - 1 },
        { x: x + 1, y: y - 1 },
        { x: x + 2, y: y - 1 },
        { x: x + 3, y: y - 1 },
        { x: x + 4, y: y - 1 },
        //
        { x: x - 1, y: y + 1 },
        { x: x, y: y + 1 },
        { x: x + 1, y: y + 1 },
        { x: x + 2, y: y + 1 },
        { x: x + 3, y: y + 1 },
        { x: x + 4, y: y + 1 },
        //
        { x: x - 1, y },
        { x: x + length, y },
      ];
    }

    if (length === 3) {
      positions = [
        { x: x - 1, y: y - 1 },
        { x: x, y: y - 1 },
        { x: x + 1, y: y - 1 },
        { x: x + 2, y: y - 1 },
        { x: x + 3, y: y - 1 },
        //
        { x: x - 1, y: y + 1 },
        { x: x, y: y + 1 },
        { x: x + 1, y: y + 1 },
        { x: x + 2, y: y + 1 },
        { x: x + 3, y: y + 1 },
        //
        { x: x - 1, y },
        { x: x + length, y },
      ];
    }

    if (length === 2) {
      positions = [
        { x: x - 1, y: y - 1 },
        { x: x, y: y - 1 },
        { x: x + 1, y: y - 1 },
        { x: x + 2, y: y - 1 },
        //
        { x: x - 1, y: y + 1 },
        { x: x, y: y + 1 },
        { x: x + 1, y: y + 1 },
        { x: x + 2, y: y + 1 },
        //
        { x: x - 1, y },
        { x: x + length, y },
      ];
    }

    if (length === 1) {
      positions = [
        { x: x - 1, y: y - 1 },
        { x: x, y: y - 1 },
        { x: x + 1, y: y - 1 },
        //
        { x: x - 1, y: y + 1 },
        { x: x, y: y + 1 },
        { x: x + 1, y: y + 1 },
        //
        { x: x - 1, y },
        { x: x + length, y },
      ];
    }
    positions.forEach((position) => {
      clients.forEach((client) =>
        sendAttackFeedback(attack.indexPlayer, position, 'miss', client)
      );
    });
  }
  //vertical
  if (direction === true) {
    if (length === 4) {
      positions = [
        { x: x - 1, y: y - 1 },
        { x: x - 1, y: y },
        { x: x - 1, y: y + 1 },
        { x: x - 1, y: y + 2 },
        { x: x - 1, y: y + 3 },
        { x: x - 1, y: y + 4 },
        //
        { x: x + 1, y: y - 1 },
        { x: x + 1, y: y },
        { x: x + 1, y: y + 1 },
        { x: x + 1, y: y + 2 },
        { x: x + 1, y: y + 3 },
        { x: x + 1, y: y + 4 },
        //
        { x: x, y: y - 1 },
        { x: x, y: y + length },
      ];
    }

    if (length === 3) {
      positions = [
        { x: x - 1, y: y - 1 },
        { x: x - 1, y: y },
        { x: x - 1, y: y + 1 },
        { x: x - 1, y: y + 2 },
        { x: x - 1, y: y + 3 },
        //
        { x: x + 1, y: y - 1 },
        { x: x + 1, y: y },
        { x: x + 1, y: y + 1 },
        { x: x + 1, y: y + 2 },
        { x: x + 1, y: y + 3 },
        //
        { x: x, y: y - 1 },
        { x: x, y: y + length },
      ];
    }

    if (length === 2) {
      positions = [
        { x: x - 1, y: y - 1 },
        { x: x - 1, y: y },
        { x: x - 1, y: y + 1 },
        { x: x - 1, y: y + 2 },
        //
        { x: x + 1, y: y - 1 },
        { x: x + 1, y: y },
        { x: x + 1, y: y + 1 },
        { x: x + 1, y: y + 2 },
        //
        { x: x, y: y - 1 },
        { x: x, y: y + length },
      ];
    }

    if (length === 1) {
      positions = [
        { x: x - 1, y: y - 1 },
        { x: x - 1, y: y },
        { x: x - 1, y: y + 1 },
        //
        { x: x + 1, y: y - 1 },
        { x: x + 1, y: y },
        { x: x + 1, y: y + 1 },
        //
        { x: x, y: y - 1 },
        { x: x, y: y + length },
      ];
    }

    positions.forEach((position) => {
      clients.forEach((client) =>
        sendAttackFeedback(attack.indexPlayer, position, 'miss', client)
      );
    });
  }

  return positions;
}

function sendAttackFeedback(
  playerId: number,
  position: Position,
  status: HitStatus,
  client: WebSocket
) {
  const attackFeedback: AttackFeedback = {
    currentPlayer: playerId, // attacker
    position,
    status,
  };

  const message: RawMessage = {
    type: 'attack',
    data: JSON.stringify(attackFeedback),
    id: 0,
  };

  client.send(JSON.stringify(message));
}
