"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ChannelSubscribersPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id;
  
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channel, setChannel] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Dialog states
  const [banDialog, setBanDialog] = useState({ open: false, subscriber: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, subscriber: null });
  const [giftDialog, setGiftDialog] = useState({ open: false, subscriber: null, days: 30 });
  const [priceDialog, setPriceDialog] = useState({ open: false, monthlyFee: 0 });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadSubscribers = useCallback(async (cursor = null) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      
      const isExclusive = channel && Number(channel.exclusive_monthly_fee_ngn || 0) > 0;
      let res;
      if (isExclusive) {
        let path = `/channels/${channelId}/exclusive/subscribers?limit=50`;
        if (cursor) path += `&cursor=${encodeURIComponent(cursor)}`;
        res = await api.get(path);
      } else {
        let path = `/admin/channels/${channelId}/audit/subscriptions?limit=50`;
        if (cursor) path += `&cursor=${encodeURIComponent(cursor)}`;
        res = await api.get(path);
        // Map audit subscriptions format to the same shape as exclusive subscribers
        res = {
          subscribers: (res.subscriptions || []).map((s) => ({
            access_id: s.id,
            user_uid: s.subscriber_uid,
            user_name: s.subscriber_name || 'Unknown',
            user_avatar: s.subscriber_avatar_url || null,
            status: s.status,
            issued_at: s.subscribed_at,
            expires_at: s.next_billing || null,
            monthly_fee_ngn: s.amount || 0,
            is_banned: s.status === 'banned_by_owner',
          })),
          nextCursor: res.next_cursor,
        };
      }
      
      if (cursor) {
        setSubscribers(prev => [...prev, ...res.subscribers]);
      } else {
        setSubscribers(res.subscribers);
      }
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error("Failed to load subscribers:", err);
      setError(err.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [channelId, channel]);

  const loadChannel = useCallback(async () => {
    try {
      const res = await api.get(`/channels/${channelId}`);
      setChannel(res.channel);
    } catch (err) {
      console.error("Failed to load channel:", err);
    }
  }, [channelId]);

  useEffect(() => {
    loadChannel();
  }, [loadChannel]);

  useEffect(() => {
    if (channel) loadSubscribers();
  }, [channel, loadSubscribers]);

  const handleBan = async () => {
    if (!banDialog.subscriber) return;
    setActionLoading(true);
    setActionError(null);
    
    try {
      await api.post(`/channels/${channelId}/exclusive/ban-subscriber`, {
        userUid: banDialog.subscriber.user_uid
      });
      
      setSubscribers(prev => 
        prev.map(s => 
          s.access_id === banDialog.subscriber.access_id 
            ? { ...s, status: 'banned', is_banned: true }
            : s
        )
      );
      setBanDialog({ open: false, subscriber: null });
    } catch (err) {
      console.error("Failed to ban subscriber:", err);
      setActionError(err.message || "Failed to ban subscriber");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelDialog.subscriber) return;
    setActionLoading(true);
    setActionError(null);
    
    try {
      await api.post(`/channels/${channelId}/exclusive/cancel-subscription`, {
        userUid: cancelDialog.subscriber.user_uid
      });
      
      setSubscribers(prev => 
        prev.map(s => 
          s.access_id === cancelDialog.subscriber.access_id 
            ? { ...s, status: 'cancelled' }
            : s
        )
      );
      setCancelDialog({ open: false, subscriber: null });
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      setActionError(err.message || "Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGift = async () => {
    if (!giftDialog.subscriber) return;
    setActionLoading(true);
    setActionError(null);
    
    try {
      const res = await api.post(`/channels/${channelId}/exclusive/gift-subscription`, {
        userUid: giftDialog.subscriber.user_uid,
        days: giftDialog.days
      });
      
      setSubscribers(prev => 
        prev.map(s => 
          s.access_id === giftDialog.subscriber.access_id 
            ? { ...s, expires_at: res.new_expires_at }
            : s
        )
      );
      setGiftDialog({ open: false, subscriber: null, days: 30 });
    } catch (err) {
      console.error("Failed to gift subscription:", err);
      setActionError(err.message || "Failed to gift subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      const res = await api.patch(`/channels/${channelId}/exclusive-settings`, {
        monthly_fee_ngn: priceDialog.monthlyFee
      });
      
      setChannel(prev => ({ ...prev, ...res.channel }));
      setPriceDialog({ open: false, monthlyFee: 0 });
    } catch (err) {
      console.error("Failed to update price:", err);
      setActionError(err.message || "Failed to update price");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₦0';
    return `₦${Number(amount).toLocaleString()}`;
  };

  const columns = [
    {
      key: 'user',
      header: 'Subscriber',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.user_avatar ? (
            <img 
              src={row.user_avatar} 
              alt={row.user_name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/50">
              {row.user_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <a
              href={`https://afrovision.online/u/${encodeURIComponent(row.user_uid)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky-300 hover:text-sky-200 hover:underline transition-colors"
            >
              {row.user_name}
            </a>
            <div className="text-xs text-white/50">{row.user_uid}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const statusConfig = {
          active: { label: 'Active', cls: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
          expired: { label: 'Expired', cls: 'border-red-400/30 bg-red-500/10 text-red-300' },
          cancelled: { label: 'Cancelled', cls: 'border-amber-400/30 bg-amber-500/10 text-amber-300' },
          banned: { label: 'Banned', cls: 'border-red-400/30 bg-red-500/10 text-red-300' },
        }[row.status] || { label: row.status, cls: 'border-white/10 bg-white/6 text-white/50' };
        
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.cls}`}>
            {statusConfig.label}
          </span>
        );
      },
    },
    {
      key: 'issued_at',
      header: 'Subscribed On',
      render: (row) => (
        <span className="text-sm text-white/70">{formatDate(row.issued_at)}</span>
      ),
    },
    {
      key: 'expires_at',
      header: 'Expires On',
      render: (row) => (
        <span className="text-sm text-white/70">{formatDate(row.expires_at)}</span>
      ),
    },
    {
      key: 'monthly_fee_ngn',
      header: 'Amount Paid',
      render: (row) => (
        <span className="text-sm text-white/70">{formatCurrency(row.monthly_fee_ngn)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'active' && !row.is_banned && (
            <>
              <button
                onClick={() => setGiftDialog({ open: true, subscriber: row, days: 30 })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                Gift
              </button>
              <button
                onClick={() => setCancelDialog({ open: true, subscriber: row })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setBanDialog({ open: true, subscriber: row })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-colors"
              >
                Ban
              </button>
            </>
          )}
          {row.is_banned && (
            <span className="text-xs text-red-400">Banned</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
            </svg>
            Back to Channels
          </button>
          <h1 className="text-3xl font-semibold text-white">
            {channel?.name || 'Channel'} Subscribers
          </h1>
          <p className="mt-2 text-sm text-white/58">
            {channel && Number(channel.exclusive_monthly_fee_ngn || 0) > 0
              ? 'Manage exclusive channel subscribers'
              : 'Manage channel subscribers'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
          </span>
          {channel && Number(channel.exclusive_monthly_fee_ngn || 0) > 0 && (
            <button
              onClick={() => setPriceDialog({ open: true, monthlyFee: channel?.exclusive_monthly_fee_ngn || 0 })}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 hover:text-violet-200 hover:bg-violet-500/15 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10 3.75a2 2 0 10-4 0 3 3 0 00-3 3.75h14A3 3 0 0010 3.75zM15.75 9H4.25a.75.75 0 00-.75.75v9c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75v-9a.75.75 0 00-.75-.75z" />
              </svg>
              Update Price
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-12 w-12 text-white/20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <p className="mt-4 text-white/50">No subscribers yet</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={subscribers}
              keyField="access_id"
            />
            {nextCursor && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => loadSubscribers(nextCursor)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                      Loading more...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ban Dialog */}
      <ConfirmDialog
        open={banDialog.open}
        onClose={() => setBanDialog({ open: false, subscriber: null })}
        onConfirm={handleBan}
        loading={actionLoading}
        error={actionError}
        title="Ban Subscriber"
        message={`Are you sure you want to ban ${banDialog.subscriber?.user_name}? This will revoke their access to the exclusive channel.`}
        confirmText="Ban"
        confirmClassName="bg-red-500 hover:bg-red-600 text-white"
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, subscriber: null })}
        onConfirm={handleCancel}
        loading={actionLoading}
        error={actionError}
        title="Cancel Subscription"
        message={`Are you sure you want to cancel ${cancelDialog.subscriber?.user_name}'s subscription? They will lose access when their current period ends.`}
        confirmText="Cancel"
        confirmClassName="bg-amber-500 hover:bg-amber-600 text-white"
      />

      {/* Gift Dialog */}
      <ConfirmDialog
        open={giftDialog.open}
        onClose={() => setGiftDialog({ open: false, subscriber: null, days: 30 })}
        onConfirm={handleGift}
        loading={actionLoading}
        error={actionError}
        title="Gift Subscription Extension"
        message={
          <div className="space-y-4">
            <p>Extend {giftDialog.subscriber?.user_name}'s subscription by:</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="365"
                value={giftDialog.days}
                onChange={(e) => setGiftDialog(prev => ({ ...prev, days: parseInt(e.target.value) || 30 }))}
                className="w-24 rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-white outline-none"
              />
              <span className="text-white/70">days</span>
            </div>
          </div>
        }
        confirmText="Gift"
        confirmClassName="bg-emerald-500 hover:bg-emerald-600 text-white"
      />

      {/* Price Update Dialog */}
      <ConfirmDialog
        open={priceDialog.open}
        onClose={() => setPriceDialog({ open: false, monthlyFee: 0 })}
        onConfirm={handleUpdatePrice}
        loading={actionLoading}
        error={actionError}
        title="Update Subscription Price"
        message={
          <div className="space-y-4">
            <p>Update the monthly subscription price for this exclusive channel:</p>
            <div className="flex items-center gap-3">
              <span className="text-white/70">₦</span>
              <input
                type="number"
                min="1"
                value={priceDialog.monthlyFee}
                onChange={(e) => setPriceDialog(prev => ({ ...prev, monthlyFee: parseInt(e.target.value) || 0 }))}
                className="w-32 rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-white outline-none"
              />
            </div>
          </div>
        }
        confirmText="Update"
        confirmClassName="bg-violet-500 hover:bg-violet-600 text-white"
      />
    </div>
  );
}
