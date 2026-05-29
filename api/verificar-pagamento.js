const MP_API = 'https://api.mercadopago.com/v1';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'Mercado Pago não configurado.' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID do pagamento é obrigatório' });
  }

  try {
    const response = await fetch(`${MP_API}/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Erro ao verificar pagamento' });
    }

    res.json({
      id: data.id,
      status: data.status,
      statusDetail: data.status_detail,
      approved: data.status === 'approved'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
