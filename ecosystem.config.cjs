module.exports = {
  apps: [
    {
      name: 'Webhook - Express',
      script: 'dist/Redis.js',
      instances: 4,
      exec_mode: 'fork',
      watch: false
    },
    {
      name: 'Painel - Webhook',
      script: 'dist/BullBoard.js',
      exec_mode: 'fork',
      watch: false,
      autorestart: true
    },
    {
      name: 'Worker/Envio',
      script: 'dist/src/queue/Bull-Queue.js',
      watch: false
    },
    {
      name: 'Worker/Retry',
      script: 'dist/src/queue/Retry-Queue.js', 
      watch: false
    }
  ]
};
