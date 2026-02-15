import emailjs from '@emailjs/browser'

// EmailJS Configuration
// Sign up at https://www.emailjs.com/ and get your credentials
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID'
const EMAILJS_TEMPLATE_ID_EXPIRY = import.meta.env.VITE_EMAILJS_TEMPLATE_EXPIRY || 'YOUR_TEMPLATE_ID'
const EMAILJS_TEMPLATE_ID_INVOICE = import.meta.env.VITE_EMAILJS_TEMPLATE_INVOICE || 'YOUR_TEMPLATE_ID'
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY'

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY)

/**
 * Send expiry notification email
 */
export async function sendExpiryNotification(params: {
  to_email: string
  to_name: string
  product_name: string
  outlet_name: string
  stock_quantity: number
  expiry_date: string
  days_remaining: number
}) {
  try {
    const templateParams = {
      to_email: params.to_email,
      to_name: params.to_name,
      product_name: params.product_name,
      outlet_name: params.outlet_name,
      stock_quantity: params.stock_quantity,
      expiry_date: params.expiry_date,
      days_remaining: params.days_remaining,
      app_name: 'ZenHotels',
      subject: `[ZenHotels] Product Expiry Alert - ${params.product_name}`,
    }

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_EXPIRY,
      templateParams
    )

    console.log('Expiry notification sent successfully:', response)
    return { success: true, response }
  } catch (error) {
    console.error('Failed to send expiry notification:', error)
    return { success: false, error }
  }
}

/**
 * Send invoice email with PDF attachment
 */
export async function sendInvoiceEmail(params: {
  to_email: string
  customer_name: string
  order_number: string
  order_date: string
  total_amount: number
  outlet_name: string
  pdf_base64?: string
}) {
  try {
    const templateParams = {
      to_email: params.to_email,
      customer_name: params.customer_name,
      order_number: params.order_number,
      order_date: params.order_date,
      total_amount: params.total_amount,
      outlet_name: params.outlet_name,
      app_name: 'ZenHotels',
      subject: `[ZenHotels] Your Invoice - Order #${params.order_number}`,
      pdf_attachment: params.pdf_base64 || '',
    }

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_INVOICE,
      templateParams
    )

    console.log('Invoice email sent successfully:', response)
    return { success: true, response }
  } catch (error) {
    console.error('Failed to send invoice email:', error)
    return { success: false, error }
  }
}

/**
 * Check for expiring products and send notifications
 * This should be called daily (can be triggered manually or via cron job)
 */
export async function checkAndNotifyExpiringProducts(
  supabase: any,
  userId: string
) {
  try {
    const today = new Date()
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)

    // Get expiring products
    const { data: expiringProducts, error } = await supabase
      .from('outlet_inventory')
      .select(`
        *,
        product:products(*),
        outlet:outlets(*)
      `)
      .lte('expiry_date', sevenDaysFromNow.toISOString().split('T')[0])
      .gte('expiry_date', today.toISOString().split('T')[0])
      .gt('stock_quantity', 0)

    if (error) throw error

    if (!expiringProducts || expiringProducts.length === 0) {
      console.log('No expiring products found')
      return { success: true, count: 0 }
    }

    // Get user email for notifications
    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (!user || !user.email) {
      console.log('User email not found')
      return { success: false, error: 'User email not found' }
    }

    // Send notifications for each expiring product
    const notifications = []
    for (const item of expiringProducts) {
      const expiryDate = new Date(item.expiry_date)
      const daysRemaining = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      const result = await sendExpiryNotification({
        to_email: user.email,
        to_name: user.name || 'Manager',
        product_name: item.product.name,
        outlet_name: item.outlet.name,
        stock_quantity: item.stock_quantity,
        expiry_date: item.expiry_date,
        days_remaining: daysRemaining,
      })

      notifications.push(result)

      // Also create in-app notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'expiry_alert',
        title: `Product Expiring Soon: ${item.product.name}`,
        message: `${item.product.name} at ${item.outlet.name} will expire in ${daysRemaining} days. Stock: ${item.stock_quantity} units.`,
        data: {
          product_id: item.product_id,
          outlet_id: item.outlet_id,
          expiry_date: item.expiry_date,
          days_remaining: daysRemaining,
        },
      })
    }

    const successCount = notifications.filter((n) => n.success).length
    console.log(`Sent ${successCount}/${notifications.length} expiry notifications`)

    return {
      success: true,
      count: notifications.length,
      successCount,
    }
  } catch (error) {
    console.error('Error checking expiring products:', error)
    return { success: false, error }
  }
}
