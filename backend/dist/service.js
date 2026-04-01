"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrder = fetchOrder;
exports.enrichOrderItemsWithProductInfo = enrichOrderItemsWithProductInfo;
const httpClient_1 = require("./httpClient");
const env_1 = require("./env");
const productClient_1 = require("./productClient");
async function fetchOrder(orderId) {
    try {
        const url = `${env_1.env.ordersServiceUrl}/orders/${encodeURIComponent(orderId)}`;
        return await (0, httpClient_1.get)(url);
    }
    catch {
        return null;
    }
}
async function enrichOrderItemsWithProductInfo(items) {
    const result = [];
    for (const item of items) {
        const product = await (0, productClient_1.getProduct)(item.productId);
        result.push({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            sku: product?.sku,
        });
    }
    return result;
}
