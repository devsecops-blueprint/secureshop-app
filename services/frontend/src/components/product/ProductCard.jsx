import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../context/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden
                    hover:shadow-md transition-shadow duration-200 group">

      {/* Product image */}
      <div className="aspect-square bg-slate-50 overflow-hidden">
        <img
          src={product.imageUrl || `https://placehold.co/400x400/f8fafc/94a3b8?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => {
            e.target.src = `https://placehold.co/400x400/f8fafc/94a3b8?text=${encodeURIComponent(product.name)}`
          }}
        />
      </div>

      {/* Product info */}
      <div className="p-4">
        <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
          {product.category}
        </span>
        <h3 className="mt-1 font-semibold text-slate-900 text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700
                       disabled:bg-slate-200 disabled:cursor-not-allowed
                       text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
            <ShoppingCart size={14} />
            {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>

        {/* Stock indicator */}
        {product.stock > 0 && product.stock <= 10 && (
          <p className="mt-2 text-xs text-amber-600 font-medium">
            Only {product.stock} left
          </p>
        )}
      </div>
    </div>
  )
}
