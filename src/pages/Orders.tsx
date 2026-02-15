import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { PageHeader } from '@/components/PageHeader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import type { Product, OutletInventory, Order } from '@/types'
import jsPDF from 'jspdf'

interface CartItem {
  product: Product
  quantity: number
  inventory_id: string
}

interface InventoryWithProduct extends OutletInventory {
  product: Product
}

export default function Orders() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [processingOrder, setProcessingOrder] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      
      // Get user's outlet (for staff/manager) or all outlets (for admin)
      let outletId = null
      if (user?.role !== 'admin') {
        const { data: empData } = await supabase
          .from('employees')
          .select('outlet_id')
          .eq('user_id', user?.id)
          .single()
        
        outletId = empData?.outlet_id
      }

      const query = supabase
        .from('outlet_inventory')
        .select(`
          *,
          product:products(*)
        `)
        .gt('stock_quantity', 0)

      if (outletId) {
        query.eq('outlet_id', outletId)
      }

      const { data, error } = await query

      if (error) throw error
      setInventory(data as any || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item: InventoryWithProduct) => {
    const existingItem = cart.find(c => c.inventory_id === item.id)
    
    if (existingItem) {
      if (existingItem.quantity < item.stock_quantity) {
        setCart(cart.map(c => 
          c.inventory_id === item.id 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        ))
      } else {
        setError(`Only ${item.stock_quantity} units available`)
        setTimeout(() => setError(''), 3000)
      }
    } else {
      setCart([...cart, {
        product: item.product,
        quantity: 1,
        inventory_id: item.id
      }])
    }
  }

  const updateCartQuantity = (inventory_id: string, quantity: number) => {
    const inventoryItem = inventory.find(i => i.id === inventory_id)
    
    if (quantity <= 0) {
      setCart(cart.filter(c => c.inventory_id !== inventory_id))
    } else if (inventoryItem && quantity <= inventoryItem.stock_quantity) {
      setCart(cart.map(c => 
        c.inventory_id === inventory_id 
          ? { ...c, quantity }
          : c
      ))
    } else {
      setError(`Only ${inventoryItem?.stock_quantity} units available`)
      setTimeout(() => setError(''), 3000)
    }
  }

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      return sum + (item.product.base_price * item.quantity)
    }, 0)
    
    const gst = cart.reduce((sum, item) => {
      return sum + (item.product.base_price * item.quantity * item.product.gst_percentage / 100)
    }, 0)
    
    return { subtotal, gst, total: subtotal + gst }
  }

  const generatePDF = (order: Order, orderItems: any[]) => {
    const doc = new jsPDF()
    const { subtotal, gst, total } = calculateTotal()

    // Header
    doc.setFontSize(20)
    doc.text('INVOICE', 105, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(`Order Number: ${order.order_number}`, 20, 35)
    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 20, 42)
    
    if (customerMobile) {
      doc.text(`Mobile: ${customerMobile}`, 20, 49)
    }
    if (customerEmail) {
      doc.text(`Email: ${customerEmail}`, 20, 56)
    }

    // Table header
    let y = 70
    doc.setFontSize(12)
    doc.text('Item', 20, y)
    doc.text('Qty', 120, y)
    doc.text('Price', 145, y)
    doc.text('Total', 170, y)
    
    y += 7
    doc.line(20, y, 190, y)
    
    // Items
    y += 7
    doc.setFontSize(10)
    orderItems.forEach(item => {
      const product = cart.find(c => c.product.id === item.product_id)?.product
      if (product) {
        doc.text(product.name, 20, y)
        doc.text(item.quantity.toString(), 120, y)
        doc.text(`₹${product.base_price.toFixed(2)}`, 145, y)
        doc.text(`₹${(product.base_price * item.quantity).toFixed(2)}`, 170, y)
        y += 7
      }
    })

    // Totals
    y += 10
    doc.line(20, y, 190, y)
    y += 7
    doc.text('Subtotal:', 145, y)
    doc.text(`₹${subtotal.toFixed(2)}`, 170, y)
    y += 7
    doc.text('GST:', 145, y)
    doc.text(`₹${gst.toFixed(2)}`, 170, y)
    y += 7
    doc.setFontSize(12)
    doc.text('Total:', 145, y)
    doc.text(`₹${total.toFixed(2)}`, 170, y)

    // Footer
    doc.setFontSize(8)
    doc.text('Thank you for your business!', 105, 280, { align: 'center' })

    return doc
  }

  const processOrder = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

    setProcessingOrder(true)
    setError('')

    try {
      const { subtotal, gst, total } = calculateTotal()

      // Create order
      const orderNumber = `ORD-${Date.now()}`
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          outlet_id: inventory[0]?.outlet_id,
          customer_mobile: customerMobile || null,
          customer_email: customerEmail || null,
          subtotal,
          total_gst: gst,
          grand_total: total,
          order_source: 'pos',
          created_by: user?.id
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items and update inventory
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.base_price,
        gst_percentage: item.product.gst_percentage,
        gst_amount: (item.product.base_price * item.quantity * item.product.gst_percentage / 100),
        total_price: item.product.base_price * item.quantity * (1 + item.product.gst_percentage / 100)
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Update inventory stock
      for (const item of cart) {
        const inventoryItem = inventory.find(i => i.id === item.inventory_id)
        if (inventoryItem) {
          const { error: updateError } = await supabase
            .from('outlet_inventory')
            .update({
              stock_quantity: inventoryItem.stock_quantity - item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.inventory_id)

          if (updateError) throw updateError
        }
      }

      // Generate PDF
      const pdf = generatePDF(orderData, orderItems)
      pdf.save(`invoice-${orderData.order_number}.pdf`)

      // Reset
      setCart([])
      setCustomerMobile('')
      setCustomerEmail('')
      fetchInventory()
      
      alert('Order completed successfully! Invoice downloaded.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingOrder(false)
    }
  }

  const filteredInventory = inventory.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const { subtotal, gst, total } = calculateTotal()

  if (!user) return null

  return (
    <Layout>
      <PageHeader title="Point of Sale" description="Create orders and generate invoices" />

        <div className="p-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Products Section */}
            <div className="lg:col-span-2">
              {/* Search */}
              <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
                <label className="text-sm font-semibold text-slate-900 mb-2 block">Search Products</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    placeholder="Search by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-2 border-slate-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-600 font-medium">Loading products...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInventory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                          >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Stock: {item.stock_quantity}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{item.product.name}</h3>
                        <p className="text-sm text-slate-600 mb-3">{item.product.category}</p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500">Price (incl. GST)</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              ₹{(item.product.base_price * (1 + item.product.gst_percentage / 100)).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all hover:scale-110"
                            style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Section */}
            <div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-4">
                {/* Cart Header */}
                <div 
                  className="px-4 py-3 text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                >
                  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                  <div className="relative z-10">
                    <h2 className="text-xl font-bold">Cart ({cart.length})</h2>
                    <p className="text-white/80 text-sm">Review and checkout</p>
                  </div>
                </div>

                <div className="p-4">
                  {/* Customer Info */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <Label htmlFor="customer_mobile" className="text-sm font-semibold text-slate-900 mb-2 block">
                        Customer Mobile
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <Input
                          id="customer_mobile"
                          type="tel"
                          value={customerMobile}
                          onChange={(e) => setCustomerMobile(e.target.value)}
                          className="pl-10 h-11 border-2 border-slate-200 focus:border-emerald-500"
                          placeholder="e.g., +91 98765 43210"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="customer_email" className="text-sm font-semibold text-slate-900 mb-2 block">
                        Customer Email
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <Input
                          id="customer_email"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="pl-10 h-11 border-2 border-slate-200 focus:border-emerald-500"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="border-t border-gray-200 pt-4 mb-4 max-h-64 overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                          style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                        >
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-slate-500 text-sm">Cart is empty</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.inventory_id} className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-900">{item.product.name}</p>
                            <p className="text-xs text-slate-600">₹{item.product.base_price} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.inventory_id, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.inventory_id, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">GST:</span>
                      <span className="font-semibold">₹{gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="text-emerald-600">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={processOrder}
                    disabled={cart.length === 0 || processingOrder}
                    className="w-full px-4 py-3 rounded-lg text-sm font-bold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                  >
                    {processingOrder ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Complete Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </Layout>
  )
}
