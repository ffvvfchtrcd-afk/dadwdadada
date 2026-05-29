export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(200).json({ error: 'Token MP não configurado' });
  }

  const { transaction_amount, description, pedidoId, email } = req.body;
  if (!transaction_amount || !pedidoId) {
    return res.status(200).json({ error: 'transaction_amount e pedidoId obrigatórios' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        transaction_amount: Number(transaction_amount),
        description: description || `Pedido ${pedidoId}`,
        payment_method_id: 'pix',
        payer: { email: email || 'comprador@email.com' }
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await mpRes.json();
    if (!mpRes.ok) {
      return res.status(200).json({ error: data.message || 'Erro MP' });
    }

    return res.status(200).json({
      id: data.id, status: data.status,
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      chaveCopiaCola: data.point_of_interaction?.transaction_data?.qr_code || '',
      transactionAmount: data.transaction_amount
    });
  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
}
