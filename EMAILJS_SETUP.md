# EmailJS Setup Guide for ZenHotels

## Overview
ZenHotels uses EmailJS for sending email notifications and invoices. Follow these steps to set up EmailJS for your application.

---

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

---

## Step 2: Add Email Service

1. Go to **Email Services** in the dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the instructions to connect your email
5. Copy the **Service ID** (e.g., `service_abc123`)

---

## Step 3: Create Email Templates

### Template 1: Expiry Notification

1. Go to **Email Templates**
2. Click "Create New Template"
3. Template Name: `Product Expiry Alert`
4. Template Content:

```html
Subject: [ZenHotels] Product Expiry Alert - {{product_name}}

Dear {{to_name}},

This is a reminder that the following product will expire soon:

Product: {{product_name}}
Outlet: {{outlet_name}}
Current Stock: {{stock_quantity}} units
Expiry Date: {{expiry_date}}
Days Remaining: {{days_remaining}} days

Please take necessary action to minimize waste.

Best regards,
ZenHotels Team
Serenity in Management
```

5. Save and copy the **Template ID** (e.g., `template_xyz789`)

### Template 2: Invoice Email

1. Create another new template
2. Template Name: `Order Invoice`
3. Template Content:

```html
Subject: [ZenHotels] Your Invoice - Order #{{order_number}}

Dear {{customer_name}},

Thank you for your order at {{outlet_name}}!

Order Details:
- Order Number: {{order_number}}
- Date: {{order_date}}
- Total Amount: ₹{{total_amount}}

Your invoice is attached to this email.

We appreciate your business!

Best regards,
ZenHotels Team
Serenity in Management
```

4. Save and copy the **Template ID**

---

## Step 4: Get Public Key

1. Go to **Account** → **General**
2. Find your **Public Key** (e.g., `user_abc123xyz`)
3. Copy this key

---

## Step 5: Update Environment Variables

Create or update your `.env` file in the project root:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_EXPIRY=template_xyz789
VITE_EMAILJS_TEMPLATE_INVOICE=template_abc456
VITE_EMAILJS_PUBLIC_KEY=user_abc123xyz
```

Replace the values with your actual IDs from EmailJS.

---

## Step 6: Test Email Sending

### Test Expiry Notification

1. Go to Inventory page
2. Add a product with expiry date within 7 days
3. Click "Send Expiry Notifications" button (if available)
4. Check your email inbox

### Test Invoice Email

1. Create an order
2. After order completion, click "Send Email" button
3. Enter customer email
4. Check the customer's email inbox

---

## Email Sending Limits

### Free Plan:
- 200 emails per month
- 2 email services
- 2 email templates

### Paid Plans:
- More emails per month
- More services and templates
- Better deliverability

---

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**: Ensure all IDs are correct in `.env`
2. **Check EmailJS Dashboard**: Verify service is connected
3. **Check Browser Console**: Look for error messages
4. **Check Spam Folder**: Emails might be in spam
5. **Verify Email Service**: Ensure your email service (Gmail, etc.) is properly connected

### Common Errors

**Error: "Service ID not found"**
- Solution: Double-check `VITE_EMAILJS_SERVICE_ID` in `.env`

**Error: "Template ID not found"**
- Solution: Verify template IDs match your EmailJS templates

**Error: "Public key is invalid"**
- Solution: Ensure `VITE_EMAILJS_PUBLIC_KEY` is correct

---

## Production Deployment

### Vercel/Netlify

1. Go to your deployment platform
2. Navigate to Environment Variables
3. Add all `VITE_EMAILJS_*` variables
4. Redeploy your application

### Security Notes

- ✅ Public key is safe to expose (it's meant to be public)
- ✅ Service and Template IDs are safe to expose
- ❌ Never expose your EmailJS private key (if you have one)
- ✅ EmailJS handles email authentication securely

---

## Alternative: Resend

If you prefer better deliverability and more features, consider using **Resend**:

1. Sign up at [https://resend.com/](https://resend.com/)
2. Get API key
3. Update `emailService.ts` to use Resend API
4. Better for production use

---

## Features Implemented

### 1. Expiry Notifications
- Automatically checks for products expiring within 7 days
- Sends email alerts to managers
- Creates in-app notifications
- Can be triggered manually or via cron job

### 2. Invoice Email Delivery
- Sends order invoice via email
- Includes order details
- PDF attachment support (optional)
- Updates `bill_sent` status in database

---

## Next Steps

1. ✅ Set up EmailJS account
2. ✅ Create email service
3. ✅ Create email templates
4. ✅ Add environment variables
5. ✅ Test email sending
6. ✅ Deploy to production

---

*Last Updated: February 15, 2026*  
*ZenHotels - Serenity in Management*
