export const env = {
  get port() {
    return parseInt(process.env.PORT ?? "4005", 10);
  },
  get ordersServiceUrl() {
    return process.env.ORDERS_SERVICE_URL ?? "http://localhost:4003";
  },
  get productsServiceUrl() {
    return process.env.PRODUCTS_SERVICE_URL ?? "http://localhost:4001";
  },
};
