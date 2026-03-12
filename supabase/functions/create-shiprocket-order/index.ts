// Supabase Edge Function: create-shiprocket-order
// Deploy:  supabase functions deploy create-shiprocket-order
// Secrets: supabase secrets set SHIPROCKET_EMAIL=you@email.com
//          supabase secrets set SHIPROCKET_PASSWORD=yourpassword
//
// Called by the frontend after a COD or Razorpay order is confirmed.
// Returns { awb, courier, trackingUrl, shiprocketOrderId } on success.

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ellaura.in',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Authenticate and get a bearer token (tokens are valid for ~24h) */
async function getToken(): Promise<string> {
  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: Deno.env.get('SHIPROCKET_EMAIL'),
      password: Deno.env.get('SHIPROCKET_PASSWORD'),
    }),
  })
  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status}`)
  const data = await res.json()
  if (!data.token) throw new Error('No token in Shiprocket auth response')
  return data.token
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      orderId,         // your internal order ID
      orderDate,       // 'YYYY-MM-DD'
      paymentMethod,   // 'COD' | 'Prepaid'
      shipping,        // { name, email, phone, line1, line2, city, state, pincode }
      items,           // [{ name, productId, qty, price }]
      total,           // number in ₹
    } = await req.json()

    if (!orderId || !shipping || !items?.length) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders })
    }

    const token = await getToken()
    const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    // ── Step 1: Create the order in Shiprocket ────────────────
    const orderPayload = {
      order_id: String(orderId),
      order_date: orderDate || new Date().toISOString().split('T')[0],
      pickup_location: 'Primary',           // must match pickup location name in Shiprocket settings
      billing_customer_name: shipping.name,
      billing_last_name: '',
      billing_address: shipping.line1,
      billing_address_2: shipping.line2 || '',
      billing_city: shipping.city,
      billing_pincode: String(shipping.pincode),
      billing_state: shipping.state,
      billing_country: 'India',
      billing_email: shipping.email,
      billing_phone: String(shipping.phone),
      shipping_is_billing: true,
      order_items: items.map((i: any) => ({
        name: i.name || i.product?.name || 'Item',
        sku: String(i.productId || i.product?.id || 'SKU'),
        units: i.qty || 1,
        selling_price: i.price || i.product?.price || 0,
        discount: 0,
        tax: 0,
        hsn: 6204,  // Women's clothing HSN code
      })),
      payment_method: paymentMethod === 'COD' ? 'COD' : 'Prepaid',
      sub_total: total,
      length: 30,
      breadth: 25,
      height: 5,
      weight: 0.5,
    }

    const createRes = await fetch(`${SHIPROCKET_BASE}/orders/create/adhoc`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(orderPayload),
    })
    const createData = await createRes.json()

    if (!createRes.ok || createData.status_code === 422) {
      // Order might already exist (re-try scenario) — check for existing shipment_id
      if (!createData.shipment_id) {
        throw new Error(createData.message || `Shiprocket order creation failed: ${createRes.status}`)
      }
    }

    const shipmentId = createData.shipment_id
    if (!shipmentId) {
      throw new Error('No shipment_id returned by Shiprocket')
    }

    // ── Step 2: Auto-assign best courier & generate AWB ──────
    const assignRes = await fetch(`${SHIPROCKET_BASE}/courier/assign/awb`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ shipment_id: String(shipmentId) }),
    })
    const assignData = await assignRes.json()
    const awb = assignData?.response?.data?.awb_code
    const courierName = assignData?.response?.data?.courier_name

    // ── Step 3: Schedule pickup ───────────────────────────────
    // Fire-and-forget — pickup scheduling can fail silently
    fetch(`${SHIPROCKET_BASE}/courier/generate/pickup`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ shipment_id: [String(shipmentId)] }),
    }).catch(() => {})

    const trackingUrl = awb
      ? `https://shiprocket.co/tracking/${awb}`
      : null

    return Response.json(
      {
        success: true,
        shiprocketOrderId: createData.order_id,
        shipmentId,
        awb: awb || null,
        courier: courierName || null,
        trackingUrl,
      },
      { headers: corsHeaders },
    )
  } catch (err: any) {
    console.error('create-shiprocket-order error:', err.message)
    // Return a non-500 so the frontend can degrade gracefully
    return Response.json(
      { success: false, error: err.message ?? 'Shiprocket error' },
      { status: 200, headers: corsHeaders },
    )
  }
})
