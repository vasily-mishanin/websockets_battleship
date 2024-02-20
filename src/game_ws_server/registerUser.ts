import { RawMessage, RegResponse, UserCreds } from './types';
import WebSocket from 'ws';

type Props = {
  userCreds: UserCreds;
  clientId: number;
  ws: WebSocket;
};

export function registerUser({ userCreds, clientId, ws }: Props) {
  const userDataForResponse: RegResponse = {
    name: userCreds.name,
    index: clientId,
    error: false,
    errorText: '',
  };

  const message: RawMessage = {
    type: 'reg',
    data: JSON.stringify(userDataForResponse),
    id: 0,
  };
  ws.send(JSON.stringify(message));
}
