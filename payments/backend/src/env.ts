export const env = {
  get port() {
    return parseInt(process.env.PORT ?? "4004", 10);
  },
  get ordersServiceUrl() {
    return process.env.ORDERS_SERVICE_URL ?? "http://localhost:4003";
  },
  get cartsServiceUrl() {
    return process.env.CARTS_SERVICE_URL ?? "http://localhost:4002";
  },
};
