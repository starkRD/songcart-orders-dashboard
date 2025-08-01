// pages/api/orders.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { start, end, language, plan } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end dates are required' });
  }

  // build our first page URL
  const params = new URLSearchParams({
    status: 'any',
    limit:  '250',
    created_at_min: start,
    created_at_max: end,
  });
  let nextPage = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}/orders.json?${params}`;
  const orders = [];

  // page through Shopify
  while (nextPage) {
    const response = await fetch(nextPage, {
      headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN }
    });
    const { orders: batch = [] } = await response.json();
    orders.push(...batch);

    const link = response.headers.get('link') || '';
    const match = link.match(/<([^>]+)>; rel="next"/);
    nextPage = match ? match[1] : null;
  }

  // tally counts by Language & Plan
  const tally = {};
  for (const order of orders) {
    for (const li of order.line_items) {
      const props = Object.fromEntries((li.properties || []).map(p => [p.name, p.value]));
      if (language !== 'All' && props.Language !== language) continue;
      if (plan     !== 'All' && props.Plan     !== plan)     continue;

      const langKey = props.Language || 'Unknown';
      const planKey = props.Plan     || 'Unknown';
      tally[langKey]        = tally[langKey]        || {};
      tally[langKey][planKey] = (tally[langKey][planKey] || 0) + 1;
    }
  }

  res.status(200).json(tally);
};
