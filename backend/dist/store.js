"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoice = getInvoice;
exports.getInvoiceByOrderId = getInvoiceByOrderId;
exports.createInvoice = createInvoice;
exports.setInvoicePdfUrl = setInvoicePdfUrl;
const uuid_1 = require("uuid");
const invoices = new Map();
function getInvoice(invoiceId) {
    return invoices.get(invoiceId);
}
function getInvoiceByOrderId(orderId) {
    return Array.from(invoices.values()).find((i) => i.orderId === orderId);
}
function createInvoice(input) {
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    const invoice = {
        ...input,
        id,
        createdAt: now,
    };
    invoices.set(id, invoice);
    return invoice;
}
function setInvoicePdfUrl(invoiceId, pdfUrl) {
    const inv = invoices.get(invoiceId);
    if (!inv)
        return undefined;
    inv.pdfUrl = pdfUrl;
    return inv;
}
