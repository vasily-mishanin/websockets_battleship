import { httpServer } from './src/http_server';
import { wss } from './src/game_ws_server';

const HTTP_PORT = 8181;

wss.on('connection', (stream) => {
  console.log('Client connected!');
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`Start static http server on port ${HTTP_PORT}`);
});
