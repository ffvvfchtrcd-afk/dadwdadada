const MP_API = 'https://api.mercadopago.com/v1';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'Mercado Pago não configurado. Defina MERCADO_PAGO_ACCESS_TOKEN.' });
  }

  const { transaction_amount, description, pedidoId, email } = req.body;

  if (!transaction_amount || !pedidoId) {
    return res.status(400).json({ error: 'transaction_amount e pedidoId são obrigatórios' });
  }

  try {
    const response = await fetch(`${MP_API}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        transaction_amount: Number(transaction_amount),
        description: description || `Pedido ${pedidoId}`,
        payment_method_id: 'pix',
        payer: { email: email || 'comprador@email.com' },
        notification_url: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}/api/webhook-mercado-pago`
          : undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP erro:', data);
      return res.status(500).json({ error: data.message || 'Erro ao criar pagamento' });
    }

    res.json({
      id: data.id,
      status: data.status,
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      chaveCopiaCola: data.point_of_interaction?.transaction_data?.qr_code || '',
      transactionAmount: data.transaction_amount,
      expirationDate: data.date_of_expiration
    });
  } catch (err) {
    console.error('Erro MP:', err);
    res.status(500).json({ error: err.message });
  }
}
