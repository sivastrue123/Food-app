import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
// import { PageHeader } from '@/components/PageHeader'
import { InventoryFormModal } from '@/components/InventoryFormModal'
import { supabase } from '@/lib/supabase'
import type { Product, Outlet, OutletInventory } from '@/types'

interface InventoryWithProduct extends OutletInventory {
  product: Product
}

export default function Inventory() {
  const { user } = useAuth()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOutlets()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedOutletId) {
      fetchInventory()
    }
  }, [selectedOutletId])

  const fetchOutlets = async () => {
    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setOutlets(data || [])
      if (data && data.length > 0 && !selectedOutletId) {
        setSelectedOutletId(data[0].id)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('outlet_inventory')
        .select(`
          *,
          product:products(*)
        `)
        .eq('outlet_id', selectedOutletId)
        .order('added_date', { ascending: false })

      if (error) throw error
      setInventory(data as any || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async (inventoryId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('outlet_inventory')
        .update({
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryId)

      if (error) throw error
      fetchInventory()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null
    const days = Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getStockLevelColor = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-700'
    if (quantity < 10) return 'bg-amber-100 text-amber-700'
    if (quantity < 50) return 'bg-cyan-100 text-cyan-700'
    return 'bg-green-100 text-green-700'
  }

  if (!user) return null

  return (
    <Layout>
      {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
              <p className="text-slate-600 text-sm mt-0.5">Track stock levels and expiry dates</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Stock
            </button>
          </div>
        </div>

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

          {/* Outlet Selector */}
          <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm font-semibold text-slate-900 mb-2 block">Select Outlet</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="w-full pl-10 pr-4 h-11 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-colors bg-white"
              >
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name} - {outlet.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-9 w-9 text-pink-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 font-medium">Loading inventory...</p>
              </div>
            </div>
          ) : inventory.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' }}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No inventory items</h3>
              <p className="text-slate-600 text-sm mb-4">Add products to this outlet's inventory</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' }}
              >
                Add Your First Item
              </button>
            </div>
          ) : (
            /* Inventory Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((item) => {
                const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date)

                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 7
                const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                      isExpired ? 'border-red-300' : isExpiringSoon ? 'border-orange-300' : 'border-gray-200'
                    }`}
                  >
                    {/* Card Header */}
                    <div className={`p-4 border-b ${
                      isExpired ? 'bg-red-50 border-red-100' : isExpiringSoon ? 'bg-orange-50 border-orange-100' : 'border-gray-100'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' }}
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockLevelColor(item.stock_quantity)}`}>
                          {item.stock_quantity === 0 ? 'Out of Stock' : item.stock_quantity < 10 ? 'Low Stock' : item.stock_quantity < 50 ? 'Medium Stock' : 'In Stock'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{item.product.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          {item.product.category}
                        </span>
                        {isExpired && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Expired
                          </span>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      {/* Stock Quantity Display */}
                      <div 
                        className="p-3 rounded-lg mb-3"
                        style={{
                          background: item.stock_quantity === 0
                            ? 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)'
                            : item.stock_quantity < 10
                            ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                            : 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)'
                        }}
                      >
                        <div className="flex items-center justify-between text-white">
                          <div>
                            <p className="text-sm font-medium opacity-90">Stock Quantity</p>
                            <p className="text-4xl font-bold">{item.stock_quantity}</p>
                          </div>
                          <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-gray-50">
                          <p className="text-xs font-medium text-slate-600 mb-1">Price</p>
                          <p className="text-sm font-bold text-slate-900">₹{item.product.base_price.toFixed(2)}</p>
                        </div>
                        {item.expiry_date && (
                          <div className="p-3 rounded-lg bg-gray-50">
                            <p className="text-xs font-medium text-slate-600 mb-1">Expiry</p>
                            <p className="text-sm font-bold text-slate-900">
                              {new Date(item.expiry_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Days Until Expiry */}
                      {daysUntilExpiry !== null && (
                        <div className={`p-3 rounded-lg mb-4 ${
                          isExpired ? 'bg-red-50 border border-red-200' : isExpiringSoon ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
                        }`}>
                          <p className={`text-xs font-medium mb-1 ${
                            isExpired ? 'text-red-700' : isExpiringSoon ? 'text-orange-700' : 'text-green-700'
                          }`}>
                            {isExpired ? 'Expired' : 'Days Until Expiry'}
                          </p>
                          <p className={`text-lg font-bold ${
                            isExpired ? 'text-red-900' : isExpiringSoon ? 'text-orange-900' : 'text-green-900'
                          }`}>
                            {daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)} days ago` : `${daysUntilExpiry} days`}
                          </p>
                        </div>
                      )}

                      {/* Update Stock Button */}
                      <button
                        onClick={() => {
                          const newQty = prompt('Enter new quantity:', item.stock_quantity.toString())
                          if (newQty && !isNaN(parseInt(newQty))) {
                            updateStock(item.id, parseInt(newQty))
                          }
                        }}
                        className="w-full px-4 py-2 rounded-lg text-sm font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Update Stock
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>


      {/* Modal */}
      {showModal && (
        <InventoryFormModal
          outletId={selectedOutletId}
          products={products}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchInventory()
          }}
        />
      )}
    </Layout>
  )
}
