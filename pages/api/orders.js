// pages/api/orders.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { start, end, language = 'All', plan = 'All' } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end dates are required' });
  }

  // Build the first page URL
  const params = new URLSearchParams({
    status: 'any',
    limit: '250',
    created_at_min: start,
    created_at_max: end,
  });
  let nextPage = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}/orders.json?${params}`;
  const orders = [];

  // Page through all results
  while (nextPage) {
    const response = await fetch(nextPage, {
      headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN }
    });
    const { orders: batch = [] } = await response.json();
    orders.push(...batch);
    const link = response.headers.get('link') || '';
    const m = link.match(/<([^>]+)>; rel="next"/);
    nextPage = m ? m[1] : null;
  }

  // Tally counts by Language & Plan
  const tally = {};
  for (const order of orders) {
    for (const li of order.line_items) {
      // collect properties into an object
      const props = Object.fromEntries(
        (li.properties || []).map(p => [p.name, p.value])
      );

      // filter by language
      if (language !== 'All' && props.Language !== language) continue;

      // determine planKey from whichever exists
      const planKey =
        props.Plan ||
        props['Song Type'] ||
        li.variant_title ||
        'Unknown';

      if (plan !== 'All' && planKey !== plan) continue;

      const langKey = props.Language || 'Unknown';
      tally[langKey] = tally[langKey] || {};
      tally[langKey][planKey] = (tally[langKey][planKey] || 0) + 1;
    }
  }

  return res.status(200).json(tally);
}
