import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import type { Employee, Outlet } from '@/types'

interface EmployeeTransferModalProps {
  employee: Employee
  currentOutletName: string
  onClose: () => void
  onSuccess: () => void
}

export function EmployeeTransferModal({ employee, currentOutletName, onClose, onSuccess }: EmployeeTransferModalProps) {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchOutlets()
  }, [])

  const fetchOutlets = async () => {
    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .eq('is_active', true)
        .neq('id', employee.outlet_id)

      if (error) throw error
      setOutlets(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const now = new Date().toISOString()

      // Update employee_history - set end_date for current outlet
      const { error: historyUpdateError } = await supabase
        .from('employee_history')
        .update({
          end_date: now,
          reason: reason || 'Transferred to another outlet'
        })
        .eq('employee_id', employee.id)
        .is('end_date', null)

      if (historyUpdateError) throw historyUpdateError

      // Create new employee_history record for new outlet
      const { error: historyInsertError } = await supabase
        .from('employee_history')
        .insert([{
          employee_id: employee.id,
          outlet_id: selectedOutletId,
          start_date: now,
          end_date: null,
          reason: reason || 'Transferred from another outlet'
        }])

      if (historyInsertError) throw historyInsertError

      // Update employee's current outlet
      const { error: employeeUpdateError } = await supabase
        .from('employees')
        .update({
          outlet_id: selectedOutletId,
          updated_at: now
        })
        .eq('id', employee.id)

      if (employeeUpdateError) throw employeeUpdateError

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Transfer Employee</CardTitle>
          <CardDescription>
            Transfer {employee.name} to a different outlet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Current Outlet:</span> {currentOutletName}
            </p>
          </div>

          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <Label htmlFor="outlet">New Outlet *</Label>
              <select
                id="outlet"
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1"
                required
              >
                <option value="">Select an outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name} - {outlet.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="reason">Transfer Reason (Optional)</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1"
                rows={3}
                placeholder="e.g., Requested transfer, Better opportunity, etc."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Transferring...' : 'Transfer Employee'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
