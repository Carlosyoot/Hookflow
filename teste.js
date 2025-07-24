import autocannon from "autocannon";

const INSTANCE = autocannon({
    url: 'http://localhost:4545/webhook',
    method: 'POST',
    connections: 100,     
    duration: 30,        
    pipelining: 10,
    headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer --------------------------'
    },
    body: JSON.stringify({
    evento: 'BENCHMARK_EVENT',
    data: { payload: 'teste' }
    })
}, (err, result) => {
    if (err) {
    console.error('Erro no Autocannon:', err);
    } 
});

autocannon.track(INSTANCE);

