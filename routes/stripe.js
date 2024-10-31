const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


router.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body;

    const cardDetailsTest = {
        number: '4242424242424242', // Número de tarjeta de prueba
        exp_month: 12,              // Mes de expiración
        exp_year: 2024,             // Año de expiración
        cvc: '123',                 // Código CVC
    };

    try {
        // Crear el Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convertir a la unidad más baja (centavos)
            currency: 'mxn',
            payment_method_data: {
                type: 'card',
                card: cardDetailsTest, // Pasar los detalles de la tarjeta
            },
        });

        // Confirmar el Payment Intent
        const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id);

        res.json({ paymentIntent: confirmedIntent });
    } catch (err) {
        console.error('Error al procesar el pago:', err);
        res.status(500).send(err.message);
    }
});


module.exports = router;