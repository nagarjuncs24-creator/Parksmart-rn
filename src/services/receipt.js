import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getBookingAreaName, getBookingSlotName } from '../utils/profileStats';
import { formatDateTime, getBookingStartTime } from '../utils/bookingHelpers';

export function buildReceiptHtml({ booking, payment, userName }) {
  const area = getBookingAreaName(booking);
  const slot = getBookingSlotName(booking);
  const paidAt = formatDateTime(getBookingStartTime(booking));
  const amount = booking?.totalPrice ?? payment?.amount ?? 0;
  const method = payment?.method || booking?.paymentProvider || 'Test Payment';
  const bookingId = booking?.bookingId || booking?.id || '—';
  const paymentId = payment?.paymentId || payment?.transactionId || booking?.paymentReference || '—';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 32px; color: #15291B; }
          .header { text-align: center; margin-bottom: 28px; }
          .logo { font-size: 28px; font-weight: 800; color: #1F8A4C; }
          .tagline { color: #596B58; font-size: 13px; margin-top: 4px; }
          .card { border: 1px solid #DCE8DC; border-radius: 16px; padding: 20px; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
          .label { color: #596B58; }
          .value { font-weight: 700; text-align: right; max-width: 60%; }
          .total { font-size: 22px; color: #1F8A4C; font-weight: 800; margin-top: 18px; text-align: center; }
          .footer { text-align: center; margin-top: 24px; color: #596B58; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ParkSmart</div>
          <div class="tagline">Digital parking receipt</div>
        </div>
        <div class="card">
          <div class="row"><span class="label">Customer</span><span class="value">${userName || 'Guest'}</span></div>
          <div class="row"><span class="label">Booking ID</span><span class="value">${bookingId}</span></div>
          <div class="row"><span class="label">Payment ID</span><span class="value">${paymentId}</span></div>
          <div class="row"><span class="label">Area</span><span class="value">${area}</span></div>
          <div class="row"><span class="label">Slot</span><span class="value">${slot}</span></div>
          <div class="row"><span class="label">Date & time</span><span class="value">${paidAt}</span></div>
          <div class="row"><span class="label">Payment method</span><span class="value">${method}</span></div>
          <div class="total">₹${amount} paid</div>
        </div>
        <div class="footer">Thank you for parking with ParkSmart.</div>
      </body>
    </html>
  `;
}

export async function generateReceiptPdf({ booking, payment, userName }) {
  const html = buildReceiptHtml({ booking, payment, userName });
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function shareReceiptPdf(pdfUri) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(pdfUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share ParkSmart receipt',
  });
}

export async function shareReceiptText({ booking, payment, userName }) {
  const area = getBookingAreaName(booking);
  const slot = getBookingSlotName(booking);
  const amount = booking?.totalPrice ?? payment?.amount ?? 0;
  const message = `ParkSmart Receipt
Customer: ${userName || 'Guest'}
Booking: ${booking?.bookingId || booking?.id}
Area: ${area}
Slot: ${slot}
Amount: ₹${amount}
Payment: ${payment?.method || 'Test Payment'}`;

  return message;
}

export async function saveReceiptToDownloads(pdfUri, bookingId) {
  const fileName = `ParkSmart-Receipt-${bookingId || Date.now()}.pdf`;
  const destination = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: pdfUri, to: destination });
  return destination;
}
