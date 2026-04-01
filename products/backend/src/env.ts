export const env = {
  get port() {
    return parseInt(process.env.PORT ?? "4001", 10);
  },
  get cartsServiceUrl() {
    return process.env.CARTS_SERVICE_URL ?? "http://localhost:4002";
  },
  get ordersServiceUrl() {
    return process.env.ORDERS_SERVICE_URL ?? "http://localhost:4003";
  },
};
