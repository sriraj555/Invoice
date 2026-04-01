export const env = {
  get port() {
    return parseInt(process.env.PORT ?? "4002", 10);
  },
  get productsServiceUrl() {
    return process.env.PRODUCTS_SERVICE_URL ?? "http://localhost:4001";
  },
  get paymentsServiceUrl() {
    return process.env.PAYMENTS_SERVICE_URL ?? "http://localhost:4004";
  },
  get ordersServiceUrl() {
    return process.env.ORDERS_SERVICE_URL ?? "http://localhost:4003";
  },
};
