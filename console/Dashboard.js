import Bee from 'bee-queue';
import Arena from 'bull-arena';

const redisConfig = { url: process.env.URL_REDIS };

Arena({
  Bee,
  queues: [
    {
      type: 'bee',
      name: 'Fila:processamento',
      hostId: 'Servidor Redis',
      queue: new Bee('Fila:processamento', { redis: redisConfig }),
    },
    {
      type: 'bee',
      name: 'Fila:erro',
      hostId: 'Servidor Redis',
      queue: new Bee('Fila:erro', { redis: redisConfig }),
    }/*
    {
      type: 'bee',
      name: 'Fila:nifi',
      hostId: 'Servidor Redis',
      queue: new Bee('Fila:nifi', { redis: redisConfig }),
    },*/
  ],
}, {
  basePath: '/arena',
  disableListen: false,
});

console.log('Arena rodando em http://localhost:4567/arena');
