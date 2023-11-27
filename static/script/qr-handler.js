// qr-handler.js
const qrcode = require('qrcode');

// Function to generate a custom QR code with the provided data
async function generateCustomQRCode(data) {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(data);
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

module.exports = {
  generateCustomQRCode,
};
