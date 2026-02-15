import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/Sidebar'
import { useSidebarState } from '@/hooks/useSidebarState'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_values: any
  new_values: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: {
    username: string
    email: string
  }
}

export default function AuditLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    // Set default dates (last 7 days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchAuditLogs()
    }
  }, [startDate, endDate, filterAction])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(username, email)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (filterAction !== 'all') {
        query = query.eq('action', filterAction)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getActionConfig = (action: string) => {
    switch (action.toUpperCase()) {
      case 'INSERT':
        return {
          color: 'from-green-500 to-emerald-500',
          bg: 'bg-green-100',
          text: 'text-green-700',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          )
        }
      case 'UPDATE':
        return {
          color: 'from-blue-500 to-cyan-500',
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          )
        }
      case 'DELETE':
        return {
          color: 'from-red-500 to-rose-500',
          bg: 'bg-red-100',
          text: 'text-red-700',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          )
        }
      case 'LOGIN':
        return {
          color: 'from-purple-500 to-violet-500',
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          )
        }
      default:
        return {
          color: 'from-slate-500 to-gray-500',
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )
        }
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center max-w-md">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' }}
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">Only administrators can view audit logs.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main 
        className="transition-all duration-300 ease-in-out"
        style={{ marginLeft: 'var(--sidebar-width, 16rem)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-slate-600 mt-1">Track all system activities and changes</p>
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
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Search
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    id="search"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-2 border-slate-200 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="action" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Action Type
                </Label>
                <select
                  id="action"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full h-11 px-3 rounded-md border-2 border-slate-200 bg-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Actions</option>
                  <option value="INSERT">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                </select>
              </div>
              <div>
                <Label htmlFor="start_date" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Start Date
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 border-2 border-slate-200 focus:border-indigo-500"
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-sm font-semibold text-slate-900 mb-2 block">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 border-2 border-slate-200 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchAuditLogs}
                  className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Logs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div 
                className="h-2"
                style={{ background: 'linear-gradient(90deg, #6366F1 0%, #818CF8 100%)' }}
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Logs</p>
                <p className="text-3xl font-bold text-slate-900">{filteredLogs.length}</p>
              </div>
            </div>

            {/* Creates */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div 
                className="h-2"
                style={{ background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' }}
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">Creates</p>
                <p className="text-3xl font-bold text-slate-900">
                  {filteredLogs.filter(l => l.action === 'INSERT').length}
                </p>
              </div>
            </div>

            {/* Updates */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div 
                className="h-2"
                style={{ background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)' }}
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">Updates</p>
                <p className="text-3xl font-bold text-slate-900">
                  {filteredLogs.filter(l => l.action === 'UPDATE').length}
                </p>
              </div>
            </div>

            {/* Deletes */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div 
                className="h-2"
                style={{ background: 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)' }}
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">Deletes</p>
                <p className="text-3xl font-bold text-slate-900">
                  {filteredLogs.filter(l => l.action === 'DELETE').length}
                </p>
              </div>
            </div>
          </div>

          {/* Logs Timeline */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 font-medium">Loading audit logs...</p>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
              >
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No logs found</h3>
              <p className="text-slate-600">Try adjusting your filters</p>
            </div>
          ) : (
            /* Logs List */
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const config = getActionConfig(log.action)
                const isExpanded = expandedLog === log.id
                
                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Action Icon */}
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${config.color})` }}
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {config.icon}
                          </svg>
                        </div>

                        {/* Log Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                                  {log.action}
                                </span>
                                <span className="text-sm font-bold text-slate-900">{log.table_name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {log.user?.username || 'System'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {new Date(log.created_at).toLocaleString('en-IN', { 
                                    dateStyle: 'medium', 
                                    timeStyle: 'short' 
                                  })}
                                </span>
                              </div>
                            </div>
                            {log.record_id && (
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {log.record_id.substring(0, 8)}
                              </span>
                            )}
                          </div>

                          {/* Expandable Details */}
                          {(log.old_values || log.new_values || log.ip_address) && (
                            <div className="mt-4">
                              {isExpanded ? (
                                <div className="space-y-4">
                                  {(log.old_values || log.new_values) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {log.old_values && (
                                        <div>
                                          <p className="text-xs font-semibold text-slate-600 mb-2">Old Values:</p>
                                          <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto border border-slate-200">
                                            {JSON.stringify(log.old_values, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                      {log.new_values && (
                                        <div>
                                          <p className="text-xs font-semibold text-slate-600 mb-2">New Values:</p>
                                          <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto border border-slate-200">
                                            {JSON.stringify(log.new_values, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {(log.ip_address || log.user_agent) && (
                                    <div className="pt-3 border-t border-gray-200">
                                      <div className="space-y-1 text-xs text-slate-600">
                                        {log.ip_address && (
                                          <p className="flex items-center gap-2">
                                            <span className="font-semibold">IP:</span>
                                            <span className="font-mono">{log.ip_address}</span>
                                          </p>
                                        )}
                                        {log.user_agent && (
                                          <p className="flex items-center gap-2">
                                            <span className="font-semibold">User Agent:</span>
                                            <span className="truncate">{log.user_agent}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => setExpandedLog(null)}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                  >
                                    Hide Details
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setExpandedLog(log.id)}
                                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
