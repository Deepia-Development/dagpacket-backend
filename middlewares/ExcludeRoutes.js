const excludeRoutes = [
    "/api/v1/users/login",    
    "/api/v1/users/signup",
    "/api/v1/users/request-reset",
    "/api/v1/users/reset-password",
    "/api/v1/fedex/quote",
    "/labels",
    "/emida/products",
    "/emida/payment-services",
    "/emida/recharge",
    "/emida/bill-payment"
];


module.exports =  { excludeRoutes } 