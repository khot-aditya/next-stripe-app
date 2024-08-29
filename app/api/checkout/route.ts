import { stripe } from '../../utils/stripe';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {

    const { priceId, email } = await (request as Request).json() as { priceId: string, email: string };


    try {

        const customer = await stripe.customers.create({
            email: email,
            payment_method: 'pm_card_visa',
            invoice_settings: {
                default_payment_method: 'pm_card_visa',
            },
        })

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
                {
                    price: priceId
                }
            ],
            payment_settings: {
                save_default_payment_method: "on_subscription",
                payment_method_options: {
                    card: {
                        request_three_d_secure: 'any'
                    }
                }
            }
        })

        const session = await stripe.checkout.sessions.create({
            customer: subscription.customer as string,
            payment_method_types: ['card'],
            line_items: subscription.items.data.map(item => ({
                price: item.price.id,
                quantity: item.quantity
            })),
            mode: 'subscription',
            success_url: `http://localhost:3000/success`,
            cancel_url: `http://localhost:3000/cancel`,
        });

        return NextResponse.json({ statusCode: 200, message: 'Session created successfully', session });
    } catch (error) {
        return NextResponse.json({ statusCode: 500, message: (error as Error).message });
    }
}
