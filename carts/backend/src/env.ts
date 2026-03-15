const defaultProducts = "http://localhost:4001";
export const env = {
  get port() {
    return parseInt(process.env.PORT ?? "4002", 10);
  },
  get productsServiceUrl() {
    return process.env.PRODUCTS_SERVICE_URL ?? defaultProducts;
  },
};
