import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { advanceService } from '@/services/advanceService';
import { addNotification } from '@/lib/notifications';

interface Advance {
  id: number;
  amount: number;
  reason: string;
  forMonth: string;
  status: string;
  rejectionReason?: string;
  reviewedAt?: string;
}

export default function SecurityOfficerAdvances() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ amount: '', reason: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [maxAmount, setMaxAmount] = useState(0);

  // Load advances on mount and calculate max amount based on designation
  useEffect(() => {
    loadAdvances();
    const calculatedMax = advanceService.getMaxAdvanceAmount(user);
    setMaxAmount(calculatedMax);
  }, []);

  const loadAdvances = async () => {
    setLoading(true);
    try {
      const data = await advanceService.getMyAdvances();
      setAdvances(data);
    } catch (error: any) {
      addNotification(
        user.userId,
        error.message || 'Failed to load advances'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.reason) {
      addNotification(
        user.userId,
        'Please fill in all fields'
      );
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount > maxAmount) {
      addNotification(
        user.userId,
        `Advance cannot exceed Rs. ${maxAmount.toFixed(2)} for your designation`
      );
      return;
    }

    setSubmitting(true);
    try {
      const newAdvance = await advanceService.submitAdvance(amount, formData.reason);
      setAdvances([newAdvance, ...advances]);
      setFormData({ amount: '', reason: '' });
      addNotification(
        user.userId,
        'Advance request submitted successfully'
      );
    } catch (error: any) {
      addNotification(
        user.userId,
        error.message || 'Failed to submit advance request'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED_BY_AREA_MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED_BY_AREA_MANAGER':
        return 'Approved by Area Manager';
      case 'APPROVED':
        return 'Approved';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <div className="w-full p-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Request Form */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-2xl">Request Advance</CardTitle>
              <CardDescription>Submit a new advance request (Max: Rs. {maxAmount.toFixed(2)})</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (Rs.)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={maxAmount}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum allowed: Rs. {maxAmount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Enter reason for advance request..."
                    rows={4}
                    disabled={submitting}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Advance History */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-2xl">Your Advances</CardTitle>
              <CardDescription>{advances.length} request(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : advances.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No advance requests yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {advances.map((advance) => (
                    <div key={advance.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-lg">Rs. {advance.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{advance.reason}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(advance.status)}`}>
                          {getStatusLabel(advance.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{advance.forMonth}</p>
                      {advance.rejectionReason && (
                        <p className="text-xs text-red-600 mt-2">
                          <strong>Reason:</strong> {advance.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
