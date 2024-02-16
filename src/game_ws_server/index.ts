import { WebSocketServer } from 'ws';
import { RawMessage, RegResponse, UserCreds } from './types';

const WSS_PORT = 3000;

export const wss = new WebSocketServer({ port: WSS_PORT });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(rawData) {
    console.log('RESEIVED: %s', rawData);
    const data: RawMessage = JSON.parse(rawData.toString());
    const messageType = data.type;
    if (messageType === 'reg') {
      const userCreds: UserCreds = JSON.parse(data.data);
      console.log({ userCreds });
      const userDataForResponse: RegResponse = {
        name: userCreds.name,
        index: 0,
        error: false,
        errorText: '',
      };

      const response: RawMessage = {
        type: 'reg',
        data: JSON.stringify(userDataForResponse),
      };
      ws.send(JSON.stringify(response));
    }
  });
});

console.log(`Websocket Game Server on port  ${WSS_PORT}`);

process.on('exit', () => {
  wss.close();
  console.log('\n Web Socket connection closed');
});
