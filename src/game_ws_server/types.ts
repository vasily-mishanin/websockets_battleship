import WebSocket from 'ws';

export type WsConnection = { id: number; ws: WebSocket };

export type MessageType =
  | 'reg'
  | 'update_room'
  | 'update_winners'
  | 'create_game'
  | 'start_game'
  | 'turn'
  | 'attack'
  | 'finish'
  | 'create_room'
  | 'add_user_to_room'
  | 'add_ships'
  | 'randomAttack'
  | 'single_play';

export type ShipType = 'small' | 'medium' | 'large' | 'huge';

export type HitStatus = 'miss' | 'killed' | 'shot';

export type Position = {
  x: number;
  y: number;
};

export type Ship = {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
};

export interface RawMessage {
  type: MessageType;
  data: string;
  id: 0;
}

export interface User {
  name: string;
  index: number;
}

export interface Room {
  roomId: number;
  roomUsers: User[];
}

// types for "data" object
export interface UserCreds {
  name: string;
  password: string;
}

export interface RegResponse {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export type Winner = { name: string; wins: number };

export type RoomAddUser = {
  indexRoom: number;
};

export type Rooms = Room[];

export type Game = {
  idGame: number;
  idPlayer: number; // id for player in the game session, who have sent add_user_to_room request, not enemy
};

export type ShipsAdd = {
  gameId: number;
  indexPlayer: number; // id of the player in the current game session
  ships: Ship[];
};

export type GameStart = {
  currentPlayerIndex: number; // id of the player in the current game session, who have sent his ships
  ships: Ship[];
};

export type GameFinish = {
  winPlayer: number /* id of the player in the current game session */;
};

export type Attack = {
  gameId: number;
  x: number;
  y: number;
  indexPlayer: number; // id of the player in the current game session
};

//should be sent after every shot, miss and after kill sent miss for all cells around ship too
export type AttackFeedback = {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: number /* id of the player in the current game session */;
  status: HitStatus;
};

export type AttackRandom = {
  gameId: number;
  indexPlayer: number /* id of the player in the current game session */;
};

export type GameTurn = {
  currentPlayer: number /* id of the player in the current game session */;
};

export type GameShips = { ships: ShipsAdd; connection: WebSocket }; // for one player

export type ProcessedShip = Ship & {
  positions: { x: number; y: number }[];
  hittings: { x: number; y: number }[];
};

export type ProcessedGameShips = {
  gameId: number;
  indexPlayer: number;
  ships: ProcessedShip[];
  connection: WebSocket;
};

//
export type SinglePlay = {
  active: boolean;
  shipsAddedToGame: GameShips | null;
  processedGameShips: ProcessedGameShips | null;
  currentAttacker: number | 'bot';
  botShips: ProcessedGameShips | null;
  attackedEnemyPositions: Position[];
  numberOfKilledShipsBot: number;
  winner: Winner | null;
};
