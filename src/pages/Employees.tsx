import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { EmployeeFormModal } from '@/components/EmployeeFormModal'
import { supabase } from '@/lib/supabase'
import type { Employee, Outlet } from '@/types'

// Define a new type that extends Employee to include the nested outlet name
type EmployeeWithOutlet = Employee & {
  outlets: { name: string } | null;
}

export default function Employees() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithOutlet[]>([])
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [employeesRes, outletsRes] = await Promise.all([
        supabase.from('employees').select('*, outlets(name)').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('outlets').select('*').eq('is_active', true)
      ])

      if (employeesRes.error) throw employeesRes.error
      if (outletsRes.error) throw outletsRes.error

      setEmployees(employeesRes.data || [])
      setOutlets(outletsRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingEmployee(null)
  }

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) return

    try {
      const { error } = await supabase
        .from('employees')
        .update({ status: 'inactive' })
        .eq('id', employeeId)

      if (error) throw error
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove employee')
    }
  }

  const getRoleBadgeColor = (position: string) => {
    const pos = position.toLowerCase()
    if (pos.includes('manager') || pos.includes('admin')) return 'bg-purple-100 text-purple-700'
    if (pos.includes('chef') || pos.includes('cook')) return 'bg-amber-100 text-amber-700'
    if (pos.includes('waiter') || pos.includes('server')) return 'bg-cyan-100 text-cyan-700'
    if (pos.includes('cashier')) return 'bg-green-100 text-green-700'
    return 'bg-slate-100 text-slate-700'
  }

  if (!user) return null

  return (
    <Layout>
      {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
              <p className="text-slate-600 mt-1">Manage staff across all outlets</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Employee
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Error Message */}
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

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 font-medium">Loading employees...</p>
              </div>
            </div>
          ) : employees.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}
              >
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No employees yet</h3>
              <p className="text-slate-600 mb-6">Get started by adding your first employee</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}
              >
                Add Your First Employee
              </button>
            </div>
          ) : (
            /* Employees Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Card Header with Gradient */}
                  <div 
                    className="h-24 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}
                  >
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
                  </div>

                  {/* Avatar */}
                  <div className="px-6 -mt-12 relative z-10">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' }}
                    >
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="px-6 pb-6 pt-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{employee.name}</h3>
                    
                    {/* Position Badge */}
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(employee.position)}`}>
                        {employee.position}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {employee.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      {employee.outlets?.name && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{employee.outlets.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Salary */}
                    {employee.salary && (
                      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-green-700">Monthly Salary</span>
                          <span className="text-lg font-bold text-green-700">
                            ₹{employee.salary.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      {/* Modal */}
      {showModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          outlets={outlets}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose()
            fetchData()
          }}
        />
      )}
    </Layout>
  )
}
