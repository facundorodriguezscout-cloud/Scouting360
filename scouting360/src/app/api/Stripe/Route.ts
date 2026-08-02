import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-07-29.dahlia',
})

export async function POST(req: Request) {
  try {
    const { plan, email } = await req.json()

    // Ponés los IDs de los precios creados en tu panel de Stripe
    const priceId = plan === 'Plan Trimestral' ? 'price_TRIMESTRAL_ID' : 'price_MENSUAL_ID'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://tusitio.com/?pago=exito',
      cancel_url: 'https://tusitio.com/',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}