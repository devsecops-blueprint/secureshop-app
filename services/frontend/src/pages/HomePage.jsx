import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Lock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-navy text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-500/30
                          text-primary-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Shield size={14} />
            Zero-Trust DevSecOps Platform
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Shop with confidence.<br />
            <span className="text-primary-400">Security built in.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            SecureShop is a fully auditable e-commerce platform secured by
            Istio mTLS, SPIFFE/SPIRE workload identity, and a complete
            DevSecOps pipeline — from commit to production.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/products"
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700
                         text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Browse Products
              <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="text-slate-300 hover:text-white font-medium px-6 py-3
                         border border-slate-600 hover:border-slate-400 rounded-lg transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-b border-slate-100 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Lock className="text-primary-600" size={22} />,
              title: 'Zero-Trust Security',
              desc: 'Every service-to-service call is encrypted and verified with mutual TLS via Istio and SPIFFE/SPIRE.'
            },
            {
              icon: <Shield className="text-primary-600" size={22} />,
              title: 'Supply Chain Integrity',
              desc: 'Every container image is signed with Cosign. SLSA Level 3 attestation on every build.'
            },
            {
              icon: <Zap className="text-primary-600" size={22} />,
              title: 'Policy as Code',
              desc: 'Kyverno enforces security policies on every Kubernetes admission. No manual review gaps.'
            },
          ].map((f, i) => (
            <div key={i} className="flex gap-4">
              <div className="mt-0.5 flex-shrink-0">{f.icon}</div>
              <div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
