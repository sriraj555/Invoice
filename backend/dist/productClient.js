"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProduct = getProduct;
const httpClient_1 = require("./httpClient");
const env_1 = require("./env");
async function getProduct(productId) {
    try {
        const url = `${env_1.env.productsServiceUrl}/products/${encodeURIComponent(productId)}`;
        const p = await (0, httpClient_1.get)(url);
        return p;
    }
    catch {
        return null;
    }
}
