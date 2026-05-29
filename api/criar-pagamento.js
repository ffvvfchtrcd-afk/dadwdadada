const MP_API = 'https://api.mercadopago.com/v1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(200).json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado nas env vars da Vercel.' });
    }

    const { transaction_amount, description, pedidoId, email } = req.body;
    if (!transaction_amount || !pedidoId) {
      return res.status(200).json({ error: 'transaction_amount e pedidoId são obrigatórios' });
    }

    const body = {
      transaction_amount: Number(transaction_amount),
      description: description || `Pedido ${pedidoId}`,
      payment_method_id: 'pix',
      payer: { email: email || 'comprador@email.com' }
    };

    const response = await fetch(`${MP_API}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ error: data.message || data.cause?.[0]?.description || 'Erro ao criar pagamento no Mercado Pago' });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      chaveCopiaCola: data.point_of_interaction?.transaction_data?.qr_code || '',
      transactionAmount: data.transaction_amount,
      expirationDate: data.date_of_expiration
    });
  } catch (err) {
    return res.status(200).json({ error: err.message || 'Erro interno no servidor' });
  }
};
