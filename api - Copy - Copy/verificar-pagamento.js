const MP_API = 'https://api.mercadopago.com/v1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(200).json({ error: 'Token não configurado' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(200).json({ error: 'ID do pagamento é obrigatório' });
    }

    const response = await fetch(`${MP_API}/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ error: data.message || 'Erro ao verificar pagamento' });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      statusDetail: data.status_detail,
      approved: data.status === 'approved'
    });
  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
};
