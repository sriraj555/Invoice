"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePdfBuffer = generateInvoicePdfBuffer;
const pdfkit_1 = __importDefault(require("pdfkit"));
function generateInvoicePdfBuffer(invoice) {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF with explicit options
            const doc = new pdfkit_1.default({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });
            const buffers = [];
            doc.on('data', (buffer) => {
                buffers.push(buffer);
            });
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log('PDF generated successfully, buffer size:', pdfBuffer.length);
                resolve(pdfBuffer);
            });
            doc.on('error', (err) => {
                console.error('PDF generation error:', err);
                reject(err);
            });
            // Start writing content immediately
            console.log('Starting PDF content generation...');
            // Title
            doc.font('Helvetica-Bold')
                .fontSize(24)
                .text('INVOICE', {
                align: 'center'
            });
            doc.moveDown(2);
            // Company info
            doc.font('Helvetica')
                .fontSize(12)
                .text('E-Commerce Company', {
                align: 'left'
            })
                .text('123 Business Street')
                .text('City, State 12345')
                .text('Phone: (555) 123-4567');
            doc.moveDown(1);
            // Invoice details
            doc.font('Helvetica-Bold')
                .fontSize(14)
                .text('Invoice Details:', {
                underline: true
            });
            doc.moveDown(0.5);
            doc.font('Helvetica')
                .fontSize(11)
                .text(`Invoice Number: ${invoice.id || 'N/A'}`)
                .text(`Order ID: ${invoice.orderId || 'N/A'}`)
                .text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`)
                .text(`Bill To: Customer ${invoice.userId || 'Unknown'}`);
            doc.moveDown(1);
            // Items section
            doc.font('Helvetica-Bold')
                .fontSize(14)
                .text('Items:', {
                underline: true
            });
            doc.moveDown(0.5);
            const items = Array.isArray(invoice.items) ? invoice.items : [];
            let subtotal = 0;
            if (items.length === 0) {
                doc.font('Helvetica')
                    .fontSize(11)
                    .text('No items in this invoice');
            }
            else {
                // Table header
                doc.font('Helvetica-Bold')
                    .fontSize(10)
                    .text('Description', 50, doc.y, { width: 200, continued: true })
                    .text('Qty', 250, doc.y, { width: 50, continued: true })
                    .text('Price', 300, doc.y, { width: 80, continued: true })
                    .text('Total', 380, doc.y, { width: 80 });
                doc.moveDown(0.3);
                // Draw line under header
                doc.moveTo(50, doc.y)
                    .lineTo(450, doc.y)
                    .stroke();
                doc.moveDown(0.3);
                // Items
                items.forEach((item) => {
                    const name = String(item?.name || 'Item');
                    const qty = Number(item?.quantity) || 0;
                    const price = Number(item?.price) || 0;
                    const total = qty * price;
                    subtotal += total;
                    doc.font('Helvetica')
                        .fontSize(10)
                        .text(name, 50, doc.y, { width: 200, continued: true })
                        .text(qty.toString(), 250, doc.y, { width: 50, continued: true })
                        .text(`$${price.toFixed(2)}`, 300, doc.y, { width: 80, continued: true })
                        .text(`$${total.toFixed(2)}`, 380, doc.y, { width: 80 });
                    doc.moveDown(0.5);
                });
            }
            doc.moveDown(1);
            // Total section
            doc.moveTo(300, doc.y)
                .lineTo(450, doc.y)
                .stroke();
            doc.moveDown(0.3);
            const finalTotal = Number(invoice.amount) || subtotal;
            const currency = String(invoice.currency || 'USD');
            doc.font('Helvetica-Bold')
                .fontSize(12)
                .text(`TOTAL: ${currency} ${finalTotal.toFixed(2)}`, 300, doc.y, {
                width: 150,
                align: 'right'
            });
            doc.moveDown(2);
            // Footer
            doc.font('Helvetica')
                .fontSize(10)
                .text('Thank you for your business!', {
                align: 'center'
            })
                .moveDown(0.5)
                .text('This is a computer-generated invoice.', {
                align: 'center'
            });
            console.log('PDF content written, calling end()...');
            doc.end();
        }
        catch (error) {
            console.error('PDF creation error:', error);
            reject(error);
        }
    });
}
