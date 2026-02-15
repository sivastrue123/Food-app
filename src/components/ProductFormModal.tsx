import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'

interface ProductFormModalProps {
  product?: Product | null
  onClose: () => void
  onSuccess: () => void
}

export function ProductFormModal({ product, onClose, onSuccess }: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    base_price: product?.base_price?.toString() || '',
    gst_percentage: product?.gst_percentage?.toString() || '',
    has_expiry: product?.has_expiry || false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        base_price: parseFloat(formData.base_price),
        gst_percentage: parseFloat(formData.gst_percentage),
        has_expiry: formData.has_expiry,
        status: 'active' as const
      }

      if (product) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)

        if (updateError) throw updateError
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData])

        if (insertError) throw insertError
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Gradient */}
        <div 
          className="px-8 py-6 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' }}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-white/10" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-white/80 text-sm">
                {product ? 'Update product information' : 'Add a new product to the catalog'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <Label htmlFor="name" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-11 border-2 border-slate-200 focus:border-amber-500"
                    placeholder="e.g., Cappuccino"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Category <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="pl-10 h-11 border-2 border-slate-200 focus:border-amber-500"
                    placeholder="e.g., Beverages, Food, Snacks"
                    required
                  />
                </div>
              </div>

              {/* Base Price */}
              <div>
                <Label htmlFor="base_price" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Base Price (₹) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="pl-10 h-11 border-2 border-slate-200 focus:border-amber-500"
                    placeholder="e.g., 150.00"
                    required
                  />
                </div>
              </div>

              {/* GST Percentage */}
              <div>
                <Label htmlFor="gst_percentage" className="text-sm font-semibold text-slate-900 mb-2 block">
                  GST Percentage <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <Input
                    id="gst_percentage"
                    type="number"
                    step="0.01"
                    value={formData.gst_percentage}
                    onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                    className="pl-10 h-11 border-2 border-slate-200 focus:border-amber-500"
                    placeholder="e.g., 5, 12, 18"
                    required
                  />
                </div>
              </div>

              {/* Has Expiry Checkbox */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <input
                    type="checkbox"
                    id="has_expiry"
                    checked={formData.has_expiry}
                    onChange={(e) => setFormData({ ...formData, has_expiry: e.target.checked })}
                    className="w-5 h-5 text-amber-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <Label htmlFor="has_expiry" className="text-sm font-semibold text-orange-900 cursor-pointer">
                      Product has expiry date
                    </Label>
                    <p className="text-xs text-orange-700 mt-0.5">
                      Enable this for perishable items that require expiry tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  product ? 'Update Product' : 'Add Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
