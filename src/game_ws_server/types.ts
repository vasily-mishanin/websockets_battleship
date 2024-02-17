export type GameResponseType =
  | 'reg'
  | 'create_game'
  | 'start_game'
  | 'turn'
  | 'attack'
  | 'finish'
  | 'update_room'
  | 'update_winners'
  | 'create_room'
  | 'add_user_to_room'
  | 'randomAttack';

export type ShipType = 'small' | 'medium' | 'large' | 'huge';

export type Ship = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: ShipType;
};

export interface RawMessage {
  type: GameResponseType;
  data: string;
  id: 0;
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

export type WinnersUpdate = { name: string; wins: number }[];

export type RoomAddUser = {
  indexRoom: number;
};

export type RoomUpdate = {
  roomId: number;
  roomUsers: { name: string; index: number }[];
}[];

export type GameCreate = {
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
  status: 'miss' | 'killed' | 'shot';
};

export type AttackRandom = {
  gameId: number;
  indexPlayer: number /* id of the player in the current game session */;
};

export type InfoCurrentTurn = {
  currentPlayer: number /* id of the player in the current game session */;
};
