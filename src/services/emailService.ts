import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } from '../config/env';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
};

export const sendOrderConfirmationEmail = async (
  customerEmail: string,
  orderId: string,
  orderDetails: any
) => {
  try {
    const transporter = createTransporter();

    const orderItemsHtml = orderDetails.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #4CAF50; color: white; padding: 10px; text-align: left; }
            .total { font-size: 18px; font-weight: bold; text-align: right; padding: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <p>Thank you for your purchase!</p>
              <p>Your order has been confirmed and will be processed shortly.</p>
              
              <div class="order-details">
                <h2>Order Details</h2>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Order Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${orderDetails.status}</p>
                
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Price</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItemsHtml}
                  </tbody>
                </table>
                
                <div class="total">
                  <strong>Total Amount: $${orderDetails.totalAmount.toFixed(2)}</strong>
                </div>
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Digital Product Store. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: SMTP_FROM || SMTP_USER,
      to: customerEmail,
      subject: `Order Confirmation - Order #${orderId.substring(0, 8)}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};
