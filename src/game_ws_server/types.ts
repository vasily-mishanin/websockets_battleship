export interface RawMessage {
  type: 'reg' | 'update_winners';
  data: string;
}

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
