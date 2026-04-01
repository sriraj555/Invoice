"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrder = fetchOrder;
const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL ?? "http://localhost:4003";
async function fetchOrder(orderId) {
    try {
        const url = `${ORDERS_SERVICE_URL}/orders/${encodeURIComponent(orderId)}`;
        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok)
            return null;
        return (await res.json());
    }
    catch {
        return null;
    }
}
