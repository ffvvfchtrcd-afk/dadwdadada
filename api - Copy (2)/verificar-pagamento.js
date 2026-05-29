export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return res.status(200).json({ error: 'Token não configurado' });
  if (!req.query.id) return res.status(200).json({ error: 'ID obrigatório' });

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${req.query.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await mpRes.json();
    return res.status(200).json({ id: data.id, status: data.status, approved: data.status === 'approved' });
  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
}
