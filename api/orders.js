import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { start, end, language, plan } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end dates are required' });
  }

  // Build initial URL
  const params = new URLSearchParams({
    status: 'any',
    limit: '250',
    created_at_min: start,
    created_at_max: end,
  });
  let nextPage = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}/orders.json?${params}`;
  let orders = [];

  // Page through results
  while (nextPage) {
    const response = await fetch(nextPage, {
      headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN }
    });
    const json = await response.json();
    orders.push(...(json.orders || []));
    const link = response.headers.get('link') || '';
    const match = link.match(/<([^>]+)>; rel="next"/);
    nextPage = match ? match[1] : null;
  }

  // Aggregate counts
  const tally = {};
  orders.forEach(order => {
    order.line_items.forEach(li => {
      const props = Object.fromEntries((li.properties || []).map(p => [p.name, p.value]));
      if (language && language !== 'All' && props.Language !== language) return;
      if (plan     && plan     !== 'All' && props.Plan     !== plan)     return;

      const langKey = props.Language || 'Unknown';
      const planKey = props.Plan     || 'Unknown';
      tally[langKey] = tally[langKey] || {};
      tally[langKey][planKey] = (tally[langKey][planKey] || 0) + 1;
    });
  });

  res.status(200).json(tally);
}
