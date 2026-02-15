
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import bcrypt from 'bcryptjs'

export default function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'staff' as 'admin' | 'manager' | 'staff'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Generate temporary password
      const tempPass = generateTempPassword()
      const hashedPassword = await bcrypt.hash(tempPass, 10)

      // Create user
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          username: formData.username,
          email: formData.email,
          password_hash: hashedPassword,
          role: formData.role,
          is_temp_password: true
        }])

      if (insertError) throw insertError

      // Show temp password to admin
      setTempPassword(tempPass)
      
      // Refresh users list
      await fetchUsers()
      
      // Reset form
      setFormData({ username: '', email: '', role: 'staff' })
      setShowModal(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      await fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === 'admin') return 'bg-purple-100 text-purple-700'
    if (role === 'manager') return 'bg-cyan-100 text-cyan-700'
    return 'bg-slate-100 text-slate-700'
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' }}
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">This page is only accessible to administrators</p>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Users</h1>
              <p className="text-slate-600 mt-1">Manage system users and permissions</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New User
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

          {/* Temp Password Display */}
          {tempPassword && (
            <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-1">User Created Successfully!</h3>
                  <p className="text-sm text-green-700 mb-4">
                    Please share this temporary password with the user. They will be required to change it on first login.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-xs font-semibold text-green-900 mb-1 block">Temporary Password</Label>
                      <div className="p-3 bg-white rounded-lg border-2 border-green-300 font-mono text-xl font-bold text-green-900">
                        {tempPassword}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tempPassword)
                        alert('Password copied to clipboard!')
                      }}
                      className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
                      style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                    >
                      Copy
                    </button>
                  </div>
                  <button
                    onClick={() => setTempPassword('')}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-green-700 bg-white border border-green-300 hover:bg-green-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 font-medium">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
              >
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No users yet</h3>
              <p className="text-slate-600 mb-6">Get started by adding your first user</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
              >
                Add Your First User
              </button>
            </div>
          ) : (
            /* Users Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Card Header with Gradient */}
                  <div 
                    className="h-24 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
                  >
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
                  </div>

                  {/* Avatar */}
                  <div className="px-6 -mt-12 relative z-10">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg"
                      style={{ 
                        background: u.role === 'admin' 
                          ? 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
                          : u.role === 'manager'
                          ? 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)'
                          : 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)'
                      }}
                    >
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="px-6 pb-6 pt-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{u.username}</h3>
                    
                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{u.email}</span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                      {u.is_temp_password && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          Temp Password
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="p-3 rounded-lg bg-gray-50 mb-4">
                      <p className="text-xs font-medium text-slate-600 mb-1">Created</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(u.created_at).toLocaleDateString('en-IN', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => toggleUserStatus(u.id, u.is_active)}
                      disabled={u.id === user.id}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        u.id === user.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : u.is_active
                          ? 'text-red-700 bg-red-50 hover:bg-red-100'
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {u.is_active ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Deactivate
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      {/* Create User Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="px-8 py-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10" />
              <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-white/10" />
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Create New User</h2>
                  <p className="text-white/80 text-sm">Add a new user to the system</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <Label htmlFor="username" className="text-sm font-semibold text-slate-900 mb-2 block">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="pl-10 h-11 border-2 border-slate-200 focus:border-indigo-500"
                      placeholder="e.g., john_doe"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-900 mb-2 block">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-11 border-2 border-slate-200 focus:border-indigo-500"
                      placeholder="e.g., john@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <Label htmlFor="role" className="text-sm font-semibold text-slate-900 mb-2 block">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full pl-10 pr-4 h-11 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors bg-white"
                      required
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
