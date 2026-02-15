import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { PageHeader } from '@/components/PageHeader'
import { OutletFormModal } from '@/components/OutletFormModal'
import { supabase } from '@/lib/supabase'
import type { Outlet } from '@/types'

export default function Outlets() {
  const { user } = useAuth()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOutlets()
  }, [])

  const fetchOutlets = async () => {
    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOutlets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch outlets')
    } finally {
      setLoading(false)
    }
  }

  const toggleOutletStatus = async (outletId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('outlets')
        .update({ 
          is_active: !currentStatus,
          status: !currentStatus ? 'active' : 'inactive'
        })
        .eq('id', outletId)

      if (error) throw error
      fetchOutlets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update outlet status')
    }
  }

  const handleEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingOutlet(null)
  }

  if (!user) return null

  return (
    <Layout>
      <PageHeader
          title="Outlets"
          description="Manage all your hotel locations"
          actions={
            user.role === 'admin' ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Outlet
              </button>
            ) : undefined
          }
        />

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

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-cyan-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 font-medium">Loading outlets...</p>
              </div>
            </div>
          ) : outlets.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #0891B2 0%, #A78BFA 100%)' }}
              >
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No outlets yet</h3>
              <p className="text-slate-600 text-sm mb-4">Get started by adding your first outlet location</p>
              {user.role === 'admin' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }}
                >
                  Add Your First Outlet
                </button>
              )}
            </div>
          ) : (
            /* Outlets Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  {/* Card Header with Gradient */}
                  <div 
                    className="h-32 relative overflow-hidden"
                    style={{
                      background: outlet.is_active 
                        ? 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)'
                        : 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)'
                    }}
                  >
                    {/* Decorative circles */}
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        outlet.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {outlet.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Outlet Icon */}
                    <div className="absolute bottom-4 left-4">
                      <div className="w-16 h-16 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{outlet.name}</h3>
                    
                    {/* Location */}
                    <div className="flex items-start gap-2 mb-3">
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-slate-600">{outlet.location}</p>
                        {outlet.address && (
                          <p className="text-xs text-slate-500 mt-1">{outlet.address}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    {outlet.phone && (
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-sm text-slate-600">{outlet.phone}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      {user.role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleEdit(outlet)}
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => toggleOutletStatus(outlet.id, outlet.is_active)}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              outlet.is_active
                                ? 'text-red-700 bg-red-50 hover:bg-red-100'
                                : 'text-green-700 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {outlet.is_active ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                            {outlet.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      {/* Modal */}
      {showModal && (
        <OutletFormModal
          outlet={editingOutlet}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose()
            fetchOutlets()
          }}
        />
      )}
    </Layout>
  )
}
