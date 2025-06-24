export default function ADMIN(req, res, next) {
    const auth = req.headers['authorization'];
    const token = auth?.replace('Bearer ', '');

    if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Acesso não autorizado, privilégios insuficientes' });
    }

    const hora = new Date().getHours();
    if (hora < 7 || hora > 19) {
    return res.status(403).json({ error: 'Acesso permitido apenas em horário comercial (07h às 20h)' });
    }

    next();
}
