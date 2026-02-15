import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface DashboardMetrics {
  totalRevenue: number
  ordersToday: number
  activeOutlets: number
  totalEmployees: number
  revenueGrowth: number
  ordersGrowth: number
}

interface TopProduct {
  product_name: string
  total_quantity: number
  total_revenue: number
}

interface RecentOrder {
  id: string
  customer_name: string
  total_amount: number
  order_date: string
  order_status: string
}

interface SalesTrend {
  date: string
  revenue: number
  orders: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    ordersToday: 0,
    activeOutlets: 0,
    totalEmployees: 0,
    revenueGrowth: 0,
    ordersGrowth: 0
  })
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([])
  const [, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get date ranges
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Fetch all orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })

      // Calculate metrics
      const totalRevenue = allOrders?.reduce((sum, order) => sum + (order.total_amount || order.grand_total || 0), 0) || 0
      
      const todayOrders = allOrders?.filter(o => new Date(o.order_date || o.created_at) >= today) || []
      const ordersToday = todayOrders.length
      
      const yesterdayOrders = allOrders?.filter(o => {
        const orderDate = new Date(o.order_date || o.created_at)
        return orderDate >= yesterday && orderDate < today
      }) || []

      // Calculate growth
      const revenueGrowth = yesterdayOrders.length > 0 
        ? ((todayOrders.reduce((sum, o) => sum + (o.total_amount || o.grand_total || 0), 0) - 
            yesterdayOrders.reduce((sum, o) => sum + (o.total_amount || o.grand_total || 0), 0)) / 
            yesterdayOrders.reduce((sum, o) => sum + (o.total_amount || o.grand_total || 0), 0)) * 100
        : 0

      const ordersGrowth = yesterdayOrders.length > 0
        ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
        : 0

      // Fetch active outlets
      const { data: outlets } = await supabase
        .from('outlets')
        .select('*')
        .eq('is_active', true)

      // Fetch total employees
      const { data: employees } = await supabase
        .from('employees')
        .select('*')

      // Fetch top products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          products (name)
        `)

      const productMap = new Map()
      orderItems?.forEach(item => {
        const name = item.products?.[0]?.name || 'Unknown'
        if (!productMap.has(name)) {
          productMap.set(name, { product_name: name, total_quantity: 0, total_revenue: 0 })
        }
        const product = productMap.get(name)
        product.total_quantity += item.quantity
        product.total_revenue += item.quantity * item.price
      })

      const topProds = Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5)

      // Fetch recent orders
      const recentOrds = allOrders?.slice(0, 5).map(order => ({
        id: order.id,
        customer_name: order.customer_name || 'Guest',
        total_amount: order.total_amount || order.grand_total || 0,
        order_date: order.order_date || order.created_at,
        order_status: order.order_status || 'completed'
      })) || []

      // Calculate 7-day sales trend
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayOrders = allOrders?.filter(o => {
          const orderDate = new Date(o.order_date || o.created_at).toISOString().split('T')[0]
          return orderDate === dateStr
        }) || []

        last7Days.push({
          date: dateStr,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || o.grand_total || 0), 0),
          orders: dayOrders.length
        })
      }

      setMetrics({
        totalRevenue,
        ordersToday,
        activeOutlets: outlets?.length || 0,
        totalEmployees: employees?.length || 0,
        revenueGrowth,
        ordersGrowth
      })
      setTopProducts(topProds)
      setRecentOrders(recentOrds)
      setSalesTrend(last7Days)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Layout>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome back, {user?.username}</p>
            </div>
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue Card */}
            <div 
              className="rounded-xl p-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {metrics.revenueGrowth !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${metrics.revenueGrowth > 0 ? 'text-green-100' : 'text-red-100'}`}>
                      {metrics.revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(metrics.revenueGrowth).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold mb-1">{formatCurrency(metrics.totalRevenue)}</div>
                <div className="text-sm text-white/80">Total Revenue</div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
            </div>

            {/* Orders Today Card */}
            <div 
              className="rounded-xl p-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  {metrics.ordersGrowth !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${metrics.ordersGrowth > 0 ? 'text-green-100' : 'text-red-100'}`}>
                      {metrics.ordersGrowth > 0 ? '↑' : '↓'} {Math.abs(metrics.ordersGrowth).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold mb-1">{metrics.ordersToday}</div>
                <div className="text-sm text-white/80">Orders Today</div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
            </div>

            {/* Active Outlets Card */}
            <div 
              className="rounded-xl p-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-green-100">All operational</div>
                </div>
                <div className="text-3xl font-bold mb-1">{metrics.activeOutlets}</div>
                <div className="text-sm text-white/80">Active Outlets</div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
            </div>

            {/* Total Employees Card */}
            <div 
              className="rounded-xl p-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-green-100">Active staff</div>
                </div>
                <div className="text-3xl font-bold mb-1">{metrics.totalEmployees}</div>
                <div className="text-sm text-white/80">Total Employees</div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Charts and Data Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Top 5 Products</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="product_name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="total_revenue" fill="#0891B2" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    No product data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{order.customer_name}</p>
                          <p className="text-xs text-slate-500">{formatDate(order.order_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-cyan-600">{formatCurrency(order.total_amount)}</p>
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            order.order_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.order_status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      No recent orders
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sales Trend */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">7-Day Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {salesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-IN')}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    No sales trend data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => window.location.href = '/orders'}
                  className="p-4 rounded-lg border-2 border-cyan-200 bg-cyan-50 hover:bg-cyan-100 transition-colors text-center group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">New Order</p>
                </button>

                <button 
                  onClick={() => window.location.href = '/products'}
                  className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors text-center group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Add Product</p>
                </button>

                <button 
                  onClick={() => window.location.href = '/inventory'}
                  className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-center group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Manage Inventory</p>
                </button>

                <button 
                  onClick={() => window.location.href = '/reports'}
                  className="p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-center group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">View Reports</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
    </Layout>

  )
}
