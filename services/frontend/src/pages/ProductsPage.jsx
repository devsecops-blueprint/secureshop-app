import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import { gqlClient } from '../graphql/client'
import { GET_PRODUCTS_QUERY, SEARCH_PRODUCTS_QUERY } from '../graphql/queries'
import ProductCard from '../components/product/ProductCard'

const CATEGORIES = ['All', 'electronics', 'footwear', 'bags', 'kitchen', 'furniture', 'fitness']

export default function ProductsPage() {
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage]         = useState(1)

  const isSearching = search.length > 1

  const { data, isLoading, isError } = useQuery({
    queryKey: isSearching ? ['search', search] : ['products', category, page],
    queryFn: () => isSearching
      ? gqlClient.request(SEARCH_PRODUCTS_QUERY, { query: search })
      : gqlClient.request(GET_PRODUCTS_QUERY, { page, pageSize: 12, category: category || null }),
    staleTime: 1000 * 30,
  })

  const result   = isSearching ? data?.searchProducts : data?.products
  const products = result?.products || []
  const total    = result?.total || 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <p className="mt-1 text-sm text-slate-500">{total} items available</p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-slate-400" />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat === 'All' ? '' : cat); setPage(1) }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors
                  ${(cat === 'All' && !category) || cat === category
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-medium">Could not load products</p>
          <p className="text-sm mt-1">Make sure the api-gateway is running</p>
        </div>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-medium">No products found</p>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  )
}
