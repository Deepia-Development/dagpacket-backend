const excludeRoutes = [
    "/api/v1/users/login",    
    "/api/v1/users/signup",
    "/api/v1/users/request-reset",
    "/api/v1/users/reset-password",
    "/api/v1/fedex/quote",
    "/labels",
    "/api/v1/emida/products",
    "/api/v1/emida/payment-services",
    "/api/v1/emida/recharge",
    "/api/v1/emida/bill-payment",
    "/api/v1/shipping/quote",
    "/api/v1/customer/register",
    "/api/v1/customer/login"
];


module.exports =  { excludeRoutes } 