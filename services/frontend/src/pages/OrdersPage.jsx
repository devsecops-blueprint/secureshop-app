import { useQuery } from '@tanstack/react-query'
import { Package, Clock } from 'lucide-react'
import { gqlClient } from '../graphql/client'
import { GET_MY_ORDERS_QUERY } from '../graphql/queries'

const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export default function OrdersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => gqlClient.request(GET_MY_ORDERS_QUERY),
  })

  const orders = data?.myOrders || []

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )

  if (isError) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">
      Could not load orders. Make sure you are signed in.
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id}
              className="bg-white border border-slate-100 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-slate-400">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
                                  ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={12} />
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-600 py-0.5">
                    <span>{item.productName} × {item.quantity}</span>
                    <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
