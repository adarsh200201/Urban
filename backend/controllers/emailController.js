const sendEmail = require('../utils/sendEmail');

// @desc    Send booking confirmation email
// @route   POST /api/booking/send-confirmation
// @access  Public
exports.sendBookingConfirmation = async (req, res) => {
  try {
    const { bookingId, email, bookingDetails } = req.body;
    
    if (!bookingId || !email || !bookingDetails) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID, email and booking details'
      });
    }

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .container {
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .booking-details {
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 0 0 5px 5px;
          }
          .detail-row {
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Booking Confirmation</h2>
          </div>
          <div class="booking-details">
            <p>Dear Customer,</p>
            <p>Thank you for booking with UrbanRide. Your booking has been confirmed.</p>
            
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span> 
              <span>${bookingId}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">From:</span> 
              <span>${bookingDetails.from}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">To:</span> 
              <span>${bookingDetails.to}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Cab Type:</span> 
              <span>${bookingDetails.cabType}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Travel Date:</span> 
              <span>${bookingDetails.travelDate}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Travel Time:</span> 
              <span>${bookingDetails.travelTime}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Fare:</span> 
              <span>₹${bookingDetails.fare}</span>
            </div>
            
            <p>If you have any questions or need assistance, please contact our customer support.</p>
            
            <a href="http://localhost:3000/booking/${bookingId}" class="button">View Booking Details</a>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>© 2025 UrbanRide. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      email,
      subject: `UrbanRide Booking Confirmation - ${bookingId}`,
      html: htmlContent
    });

    return res.status(200).json({
      success: true,
      message: 'Booking confirmation email sent successfully'
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending email',
      error: error.message
    });
  }
};

// @desc    Send invoice email
// @route   POST /api/booking/send-invoice
// @access  Public
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { bookingId, email, invoiceDetails } = req.body;
    
    if (!bookingId || !email || !invoiceDetails) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID, email and invoice details'
      });
    }

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .container {
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .invoice-details {
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 0 0 5px 5px;
          }
          .detail-row {
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: bold;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .invoice-table th, .invoice-table td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: left;
          }
          .invoice-table th {
            background-color: #f2f2f2;
          }
          .total-row {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Booking Invoice</h2>
          </div>
          <div class="invoice-details">
            <p>Dear Customer,</p>
            <p>Thank you for choosing UrbanRide. Here's your invoice.</p>
            
            <div class="detail-row">
              <span class="detail-label">Invoice #:</span> 
              <span>INV-${bookingId}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span> 
              <span>${bookingId}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">From:</span> 
              <span>${invoiceDetails.from}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">To:</span> 
              <span>${invoiceDetails.to}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Travel Date:</span> 
              <span>${invoiceDetails.travelDate}</span>
            </div>
            
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoiceDetails.cabType}</td>
                  <td>₹${invoiceDetails.baseFare}</td>
                </tr>
                <tr>
                  <td>GST (5%)</td>
                  <td>₹${Math.round(invoiceDetails.baseFare * 0.05)}</td>
                </tr>
                <tr class="total-row">
                  <td>Total</td>
                  <td>₹${invoiceDetails.fare}</td>
                </tr>
              </tbody>
            </table>
            
            <p>Payment has been received. Thank you for your business!</p>
            
            <a href="http://localhost:3000/booking/${bookingId}/invoice" class="button">View Full Invoice</a>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>© 2025 UrbanRide. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      email,
      subject: `UrbanRide Invoice - ${bookingId}`,
      html: htmlContent
    });

    return res.status(200).json({
      success: true,
      message: 'Invoice email sent successfully'
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending invoice email',
      error: error.message
    });
  }
};
