import { NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST(req: Request) {
  try {
    const { email, plan } = await req.json()

    // Definir montos en Pesos
    const monto = plan === 'Plan Trimestral' ? 38000 : 15000 

    const preapproval = new PreApproval(client)
    const response = await preapproval.create({
      body: {
        reason: `Suscripción Scouting 360 - ${plan}`,
        auto_recurring: {
          frequency: plan === 'Plan Trimestral' ? 3 : 1,
          frequency_type: 'months',
          transaction_amount: monto,
          currency_id: 'ARS',
        },
        payer_email: email,
        back_url: 'https://tusitio.com/', // URL a la que vuelve el usuario tras pagar
        status: 'authorized',
      },
    })

    return NextResponse.json({ init_point: response.init_point })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}