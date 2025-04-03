const router = require('express').Router();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Wallet = require('../models/WalletsModel')

router.post('/create-checkout-session', async (req, res) => {
  try{
    const {  user_id } = req.body; // Asegúrate de enviar estos datos desde el frontend
    
    const session = await stripe.checkout.sessions.create({
        line_items:[
            {
                price: 'price_1QG1v7KI87ETN1ciIjrrBR4V',
                quantity: 1,
            }
        ],
        mode: 'payment',
        success_url: `https://www.dagpacket.cloud`,
        cancel_url: `https://www.dagpacket.cloud/home`,
        // Añade la metadata necesaria para el webhook
        metadata: {
            user_id: user_id,
        }
    });

    res.json({url: session.url});
  }catch(error){
    console.log(error);
    res.status(500).send({error: error.message});
  }
});

// El webhook se mantiene igual
router.post('/webhook', express.json(), async (req, res) => {
    const event = req.body; // Directly access the parsed JSON body

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Checkout session completed:', session);
            console.log('Checkout session completed:', session.id);
            console.log('Checkout session metadata:', session.metadata);
            console.log('Payment status:', session.payment_status);
            console.log('Payment intent ID:', session.payment_intent);
            console.log('Payment method types:', session.payment_method_types);

            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
            console.log('Payment intent details:', paymentIntent.amount);


            const saldo = paymentIntent.amount / 100;

            console.log('Saldo:', saldo);

            // Update the wallet balance
            const wallet = await Wallet.findOne({ user: session.metadata.user_id });
            if (wallet) {

                wallet.rechargeBalance = Number(wallet.rechargeBalance) + (saldo);
                console.log('Wallet balance:', wallet.rechargeBalance);
                

                await wallet.save();
                console.log(`Wallet balance updated for user ${session.metadata.user_id}`);
            } else {
                console.log(`No wallet found for user ${session.metadata.user_id}`);
            }
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

module.exports = router;