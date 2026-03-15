export const env = {
  get port() {
    return parseInt(process.env.PORT ?? "4003", 10);
  },
  get cartsServiceUrl() {
    return process.env.CARTS_SERVICE_URL ?? "http://localhost:4002";
  },
  get productsServiceUrl() {
    return process.env.PRODUCTS_SERVICE_URL ?? "http://localhost:4001";
  },
  get invoicesServiceUrl() {
    return process.env.INVOICES_SERVICE_URL ?? "http://localhost:4005";
  },
};
