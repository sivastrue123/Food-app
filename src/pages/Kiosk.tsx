import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import type { Product, OutletInventory } from '@/types'

interface CartItem {
  product: Product
  quantity: number
  inventory_id: string
}

interface InventoryWithProduct extends OutletInventory {
  product: Product
}

export default function Kiosk() {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [customerMobile, setCustomerMobile] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [processingOrder, setProcessingOrder] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // Hardcoded outlet ID for kiosk (in production, this would be configured per kiosk device)
  const KIOSK_OUTLET_ID = 'default-outlet-id'

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      
      // Get first active outlet for demo purposes
      const { data: outlets } = await supabase
        .from('outlets')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      const outletId = outlets?.[0]?.id || KIOSK_OUTLET_ID

      const { data, error } = await supabase
        .from('outlet_inventory')
        .select(`
          *,
          product:products(*)
        `)
        .eq('outlet_id', outletId)
        .gt('stock_quantity', 0)

      if (error) throw error
      setInventory(data as any || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const categories = Array.from(new Set(inventory.map(i => i.product.category)))

  const filteredInventory = inventory.filter(item =>
    selectedCategory === 'all' || item.product.category === selectedCategory
  )

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

  const placeOrder = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

    setProcessingOrder(true)
    setError('')

    try {
      const { subtotal, gst, total } = calculateTotal()

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          outlet_id: inventory[0]?.outlet_id,
          customer_name: 'Kiosk Customer',
          customer_mobile: customerMobile || null,
          order_date: new Date().toISOString(),
          subtotal,
          gst_amount: gst,
          total_amount: total,
          payment_status: 'pending',
          order_status: 'pending',
          order_source: 'kiosk'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.base_price,
        gst_percentage: item.product.gst_percentage,
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

      // Show success
      setOrderNumber(orderData.id.substring(0, 8).toUpperCase())
      setOrderComplete(true)
      
      // Reset after 5 seconds
      setTimeout(() => {
        setCart([])
        setCustomerMobile('')
        setShowCheckout(false)
        setOrderComplete(false)
        setOrderNumber('')
        fetchInventory()
      }, 5000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingOrder(false)
    }
  }

  const { subtotal, gst, total } = calculateTotal()

  // Order complete screen
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Order Placed Successfully!</h1>
            <p className="text-base text-slate-600 mb-3">Your order number is:</p>
            <p className="text-3xl font-bold text-blue-600 mb-5">{orderNumber}</p>
            <p className="text-lg text-slate-600 mb-4">Total Amount: ₹{total.toFixed(2)}</p>
            <p className="text-slate-500">Please proceed to the counter for payment</p>
            <p className="text-sm text-slate-400 mt-8">Returning to menu in a moment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Checkout screen
  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCheckout(false)}
            className="mb-4"
          >
            ← Back to Menu
          </Button>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-xl font-bold mb-4">Review Your Order</h2>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-3 mb-5">
                {cart.map((item) => (
                  <div key={item.inventory_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.product.name}</h3>
                      <p className="text-slate-600">₹{item.product.base_price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.inventory_id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.inventory_id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <p className="font-bold text-lg w-24 text-right">
                        ₹{(item.product.base_price * item.quantity * (1 + item.product.gst_percentage / 100)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-lg mb-2">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg mb-2">
                  <span>GST:</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Mobile Number (Optional)</label>
                <Input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="text-base p-3"
                />
              </div>

              <Button
                onClick={placeOrder}
                disabled={processingOrder}
                className="w-full text-base py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {processingOrder ? 'Placing Order...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main menu screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Self-Order Kiosk
            </h1>
            <p className="text-slate-600 text-sm mt-0.5">Select items to order</p>
          </div>
          {cart.length > 0 && (
            <Button
              onClick={() => setShowCheckout(true)}
              className="text-base py-3 px-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              View Cart ({cart.length}) - ₹{total.toFixed(2)}
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="text-sm py-3 px-4"
          >
            All Items
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className="text-sm py-3 px-4 whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 text-xl">Loading menu...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map((item) => {
              const cartItem = cart.find(c => c.inventory_id === item.id)
              const finalPrice = item.product.base_price * (1 + item.product.gst_percentage / 100)

              return (
                <Card
                  key={item.id}
                  className="hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-2">{item.product.name}</h3>
                      <p className="text-slate-600 text-sm">{item.product.category}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-blue-600">₹{finalPrice.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">Inc. GST</p>
                      </div>
                      {cartItem ? (
                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                          {cartItem.quantity} in cart
                        </div>
                      ) : (
                        <Button
                          size="lg"
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                          className="text-lg"
                        >
                          Add +
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
