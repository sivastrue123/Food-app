import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

/**
 * Generate a random temporary password
 */
export const generateTempPassword = (): string => {
  return Math.random().toString(36).slice(-8).toUpperCase()
}

/**
 * Log an audit entry
 */
export const logAudit = async (
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValue?: any,
  newValue?: any
): Promise<void> => {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue || null,
    new_value: newValue || null,
  })
}

/**
 * Generate a unique order number
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `ORD-${timestamp}-${random}`
}

/**
 * Calculate cart totals with GST
 */
export const calculateCartTotals = (
  items: Array<{
    unit_price: number
    quantity: number
    gst_percentage: number
  }>
) => {
  let subtotal = 0
  let totalGST = 0

  const itemsWithTotals = items.map((item) => {
    const itemTotal = item.unit_price * item.quantity
    const gstAmount = (itemTotal * item.gst_percentage) / 100
    const totalPrice = itemTotal + gstAmount

    subtotal += itemTotal
    totalGST += gstAmount

    return {
      ...item,
      gst_amount: gstAmount,
      total_price: totalPrice,
    }
  })

  return {
    items: itemsWithTotals,
    subtotal,
    totalGST,
    grandTotal: subtotal + totalGST,
  }
}

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

/**
 * Format date
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format datetime
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
