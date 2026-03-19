"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free",
    badge: "Free Trial",
    description: "Perfect for trying out EduPilot",
    price: { monthly: 0, yearly: 0 },
    features: [
      "5 AI notes per month",
      "Basic AI Tutor (10 queries/day)",
      "Basic flashcards (50 cards)",
      "Limited quiz generation",
      "Community support",
    ],
    limitations: [
      "No study planner",
      "No analytics",
      "No voice assistant",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    badge: null,
    description: "For serious learners",
    price: { monthly: 199, yearly: 1990 },
    features: [
      "Unlimited AI notes",
      "Full AI Tutor access",
      "Unlimited flashcards",
      "Quiz generator with analytics",
      "Smart study planner",
      "Learning analytics",
      "Priority support",
      "Export to PDF/Notion",
    ],
    limitations: [],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Premium",
    badge: null,
    description: "For power learners",
    price: { monthly: 499, yearly: 4990 },
    features: [
      "Everything in Pro",
      "AI Voice Assistant",
      "AI Learning Twin",
      "Priority AI processing",
      "Advanced analytics & insights",
      "Custom study paths",
      "API access",
      "Dedicated support",
      "Early access to new features",
    ],
    limitations: [],
    cta: "Start Free Trial",
    popular: false,
  },
]

const faqs = [
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
  },
  {
    question: "Is there a student discount?",
    answer: "Yes! Students with a valid .edu email get 20% off all paid plans. Contact support to apply the discount.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, UPI, net banking, and popular digital wallets in India.",
  },
  {
    question: "Can I get a refund?",
    answer: "We offer a 7-day money-back guarantee on all paid plans. No questions asked.",
  },
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Trial Banner */}
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Simple Trial Based Pricing</h2>
          <p className="text-muted-foreground">
            All users can explore EduPilot for free with limited usage. Upgrade anytime to unlock unlimited AI learning tools.
          </p>
        </div>

        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Choose Your Learning Plan
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Start free, upgrade when you&apos;re ready. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                billingPeriod === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <span className="ml-1.5 text-xs text-emerald-500">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative flex flex-col border-border bg-card transition-all",
                plan.popular && "border-primary shadow-lg shadow-primary/10"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-medium text-primary-foreground">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.badge && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col">
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price[billingPeriod] === 0
                        ? "Free"
                        : `₹${plan.price[billingPeriod]}`}
                    </span>
                    {plan.price[billingPeriod] > 0 && (
                      <span className="text-muted-foreground">
                        /{billingPeriod === "monthly" ? "mo" : "yr"}
                      </span>
                    )}
                  </div>
                  {billingPeriod === "yearly" && plan.price.yearly > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Billed annually (₹{Math.round(plan.price.yearly / 12)}/mo)
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 h-4 w-4 shrink-0 text-center">-</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  asChild
                  className={cn(
                    "w-full",
                    plan.popular
                      ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                      : ""
                  )}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trial Notes */}
        <div className="mx-auto mt-12 max-w-3xl space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a free trial. You can explore features before upgrading.
          </p>
          <p className="text-xs text-muted-foreground">
            This is an early access pricing model. Features and pricing may evolve.
          </p>
        </div>

        {/* FAQs */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-2 font-semibold text-foreground">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <p className="mb-4 text-muted-foreground">
            Have questions? We&apos;re here to help.
          </p>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
