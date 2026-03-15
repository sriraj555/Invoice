const PORT = process.env.PORT ?? "4001";
export const env = {
  get port() {
    return parseInt(process.env.PORT ?? "4001", 10);
  },
};
