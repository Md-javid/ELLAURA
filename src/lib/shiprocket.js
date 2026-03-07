// ── Shiprocket Shipping Integration ─────────────────────────────
// Docs: https://apidocs.shiprocket.in/
//
// Required env vars (server-side / Supabase Edge Function):
//   SHIPROCKET_EMAIL    — Your Shiprocket login email
//   SHIPROCKET_PASSWORD — Your Shiprocket password
//
// Client-side env (for serviceability check):
//   VITE_SHIPROCKET_TOKEN — Optional; if not set, uses demo data
//
// All order creation happens server-side. The frontend only:
//   1. Checks PIN code serviceability
//   2. Shows estimated delivery dates
//   3. Creates shipment after successful payment (via Edge Function)

const SHIPROCKET_TOKEN = import.meta.env.VITE_SHIPROCKET_TOKEN || ''
export const SHIPROCKET_DEMO = !SHIPROCKET_TOKEN

/**
 * Check if a PIN code is serviceable and get estimated delivery.
 * Returns { available, estimatedDays, courierName, codAvailable }
 */
export async function checkPincodeServiceability(pincode, weight = 0.5) {
  if (SHIPROCKET_DEMO) {
    // Demo mode: simulate serviceability
    await new Promise(r => setTimeout(r, 800))
    const pin = String(pincode).trim()
    if (pin.length !== 6) return { available: false, estimatedDays: null, courierName: null, codAvailable: false }
    return {
      available: true,
      estimatedDays: pin.startsWith('6') ? 2 : 4, // Coimbatore-local = faster
      courierName: 'Delhivery Surface',
      codAvailable: true,
    }
  }

  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=641001&delivery_postcode=${pincode}&weight=${weight}&cod=1`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SHIPROCKET_TOKEN}`,
        },
      }
    )
    const data = await res.json()
    if (data?.data?.available_courier_companies?.length > 0) {
      const best = data.data.available_courier_companies[0]
      return {
        available: true,
        estimatedDays: best.estimated_delivery_days || 4,
        courierName: best.courier_name,
        codAvailable: best.cod === 1,
      }
    }
    return { available: false, estimatedDays: null, courierName: null, codAvailable: false }
  } catch (err) {
    console.error('Shiprocket serviceability check failed:', err)
    return { available: true, estimatedDays: 5, courierName: 'Standard', codAvailable: false }
  }
}

/**
 * Create a Shiprocket order (called server-side via Edge Function after payment).
 * This is just the payload shape reference — actual call goes through Edge Function.
 */
export function buildShiprocketOrderPayload({ orderId, orderDate, shipping, items, total, paymentMethod }) {
  return {
    order_id: orderId,
    order_date: orderDate || new Date().toISOString().split('T')[0],
    pickup_location: 'Ellaura Studio',
    billing_customer_name: shipping.name,
    billing_last_name: '',
    billing_address: shipping.line1,
    billing_address_2: shipping.line2 || '',
    billing_city: shipping.city,
    billing_pincode: shipping.pincode,
    billing_state: shipping.state,
    billing_country: 'India',
    billing_email: shipping.email,
    billing_phone: shipping.phone,
    shipping_is_billing: true,
    order_items: items.map(i => ({
      name: i.name,
      sku: i.productId,
      units: i.qty,
      selling_price: i.price,
      discount: 0,
      tax: 0,
      hsn: '6204', // Women's clothing HSN
    })),
    payment_method: paymentMethod || 'Prepaid',
    sub_total: total,
    length: 30,
    breadth: 25,
    height: 5,
    weight: 0.5,
  }
}
