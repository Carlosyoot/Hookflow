export const apps = [
    {
        name: 'Webhook - Express',
        script: 'Redis.js',
        instanes: "4",
        exec_mode: "fork",
        watch: false,
    } ,
    {
        name: 'Painel - Webhook',
        script: 'BullBoard.js',
        exec_mode: "fork",
        watch: false,
        autorestart: true
    },
    {
        name: 'Worker/Envio',
        script: 'src/queue/Bull-Queue.js',
        watch: false,
    },
    {
        name: 'Worker/Retry',
        script: 'src/queue/Retry-Queue.js',
        watch: false,
    }
];
