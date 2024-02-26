// import { AttackFeedback, GameFinish, SinglePlay } from './types';

// type Props = {
//     singlePlay:SinglePlay;
//     upda
// }

// export function oneMoreBotAttack(){
//     singlePlay.processedGameShips = updatedShips;

//           // respond to attacked user (current client)
//           const attackFeedback: AttackFeedback = {
//             currentPlayer: botId, // attacked
//             position: botAttackedPosition,
//             status: statusBotAttack,
//           };

//           const message: RawMessage = {
//             type: 'attack',
//             data: JSON.stringify(attackFeedback),
//             id: 0,
//           };

//           currentClient.ws.send(JSON.stringify(message));

//           // BOT KILLS A SHIP
//           // killed - hits around the killed ship
//           if (attackedShip && statusBotAttack === 'killed') {
//             const attackedPositions = killHits({
//               attack: {
//                 gameId: singlePlay.processedGameShips.gameId,
//                 indexPlayer: botId,
//                 x: botAttackedPosition.x,
//                 y: botAttackedPosition.y,
//               },
//               clients: [currentClient.ws],
//               attackedShip,
//             }); // bum bum
//             singlePlay.attackedEnemyPositions.push(...attackedPositions);
//             singlePlay.numberOfKilledShipsBot += 1;
//           }

//           // if all ships killed
//           if (singlePlay.numberOfKilledShipsBot === TOTAL_NUMBER_OF_SHIPS) {
//             const finishFeedback: GameFinish = {
//               winPlayer: botId,
//             };

//             finishGame(finishFeedback, [currentClient]);

//             singlePlay.winner = { name: 'BOT', wins: 1 };

//             updateWinners([singlePlay.winner], [currentClient]);
//             return;
//           }
// }
