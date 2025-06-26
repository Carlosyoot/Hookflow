export async function AddEvent(req, res, next){
    
    const requiredFields = ['evento', 'data'];

    const missing = requiredFields.filter(field => {
        const val = req.body[field];
        return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
    });

    if(missing.length > 0){
        return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }

    const { evento, data } = req.body;
    const { client } = req; 

    return res.status(200).json({
    sucesso: true,
    mensagem: `Evento recebido com sucesso.`,
    cliente: client?.nome || 'Desconhecido',
    evento,
    dados: data
  });
}