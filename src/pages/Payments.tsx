import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types'

interface EmployeeWithPayments extends Employee {
  unpaidAmount: number
  lastPaymentDate: string | null
  outlets?: {
    name: string
  } | null
}

export default function Payments() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithPayments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  useEffect(() => {
    fetchEmployeesWithPayments()
  }, [])

  const fetchEmployeesWithPayments = async () => {
    try {
      setLoading(true)

      // Fetch all active employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*, outlets(name)')
        .eq('status', 'active')
        .order('name')

      if (employeesError) throw employeesError

      // For each employee, calculate unpaid amount
      const employeesWithPayments = await Promise.all(
        (employeesData || []).map(async (emp) => {
          // Get payment records
          const { data: payments } = await supabase
            .from('payment_records')
            .select('*')
            .eq('employee_id', emp.id)
            .order('payment_date', { ascending: false })

          const lastPayment = payments?.[0]
          
          // Calculate days worked since last payment or join date
          const startDate = lastPayment?.payment_date || emp.join_date
          const daysSinceLastPayment = Math.floor(
            (new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
          )

          // Calculate unpaid amount based on salary
          const unpaidAmount = (emp.salary || 0) * (daysSinceLastPayment / 30)

          return {
            ...emp,
            unpaidAmount: Math.max(0, unpaidAmount),
            lastPaymentDate: lastPayment?.payment_date || null
          }
        })
      )

      setEmployees(employeesWithPayments)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (employeeId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('payment_records')
        .insert([{
          employee_id: employeeId,
          payment_date: new Date().toISOString(),
          amount: amount,
          period_type: 'monthly',
          period_value: new Date().toISOString().split('T')[0],
          is_paid: true,
          marked_by: user?.id
        }])

      if (error) throw error
      
      // Refresh data
      await fetchEmployeesWithPayments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    if (filter === 'pending') return emp.unpaidAmount > 100
    if (filter === 'paid') return emp.unpaidAmount <= 100
    return true
  })

  const totalPending = employees.reduce((sum, emp) => sum + emp.unpaidAmount, 0)

  if (!user) return null

  return (
    <Layout>
      {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
              <p className="text-slate-600 mt-1">Track and manage employee salary payments</p>
            </div>
            {/* Total Pending Badge */}
            <div 
              className="px-6 py-3 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
            >
              <p className="text-sm font-medium opacity-90">Total Pending</p>
              <p className="text-2xl font-bold">₹{totalPending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
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

          {/* Filters */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Employees ({employees.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'pending'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Pending Payments ({employees.filter(e => e.unpaidAmount > 100).length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'paid'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Up to Date ({employees.filter(e => e.unpaidAmount <= 100).length})
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 font-medium">Loading payment data...</p>
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
              >
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No employees found</h3>
              <p className="text-slate-600">Try adjusting your filters or add employees first</p>
            </div>
          ) : (
            /* Payment Cards */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                        >
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{employee.name}</h3>
                          <p className="text-sm text-slate-600">{employee.position}</p>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        employee.unpaidAmount > 100
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {employee.unpaidAmount > 100 ? 'Pending' : 'Up to Date'}
                      </span>
                    </div>

                    {/* Outlet Info */}
                    {employee.outlets?.name && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{employee.outlets.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Payment Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs font-medium text-slate-600 mb-1">Monthly Salary</p>
                        <p className="text-lg font-bold text-slate-900">
                          ₹{(employee.salary || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs font-medium text-slate-600 mb-1">Last Payment</p>
                        <p className="text-lg font-bold text-slate-900">
                          {employee.lastPaymentDate 
                            ? new Date(employee.lastPaymentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                            : 'Never'}
                        </p>
                      </div>
                    </div>

                    {/* Unpaid Amount */}
                    <div 
                      className="p-4 rounded-xl mb-4"
                      style={{
                        background: employee.unpaidAmount > 100
                          ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                          : 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
                      }}
                    >
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <p className="text-sm font-medium opacity-90">Unpaid Amount</p>
                          <p className="text-3xl font-bold">
                            ₹{employee.unpaidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Mark as Paid Button */}
                    {employee.unpaidAmount > 100 && (
                      <button
                        onClick={() => markAsPaid(employee.id, employee.unpaidAmount)}
                        className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </Layout>
  )
}
