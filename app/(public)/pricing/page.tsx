import { Suspense } from "react"
import PricingPageClient from "./pricing-page-client"

function PricingPageFallback() {
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto h-40 max-w-5xl animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageFallback />}>
      <PricingPageClient />
    </Suspense>
  )
}
