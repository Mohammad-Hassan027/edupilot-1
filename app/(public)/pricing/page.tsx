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
    badge: null,
    description: "Best for getting started",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Unlimited AI Tutor",
      "Unlimited Notes",
    ],
    limitations: [
      "No Study Planner",
      "No Analytics",
      "No Voice Assistant",
      "No AI Flashcards",
      "No AI Quiz",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    badge: "14-Day Free Trial",
    description: "Everything unlimited, except Study Planner",
    price: { monthly: 199, yearly: 1990 },
    features: [
      "Unlimited AI Tutor",
      "Unlimited Notes",
      "Unlimited Flashcards",
      "Unlimited Quiz",
      "Unlimited AI Voice",
      "Analytics included",
    ],
    limitations: ["Study Planner not available"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Premium",
    badge: "14-Day Free Trial",
    description: "Everything included",
    price: { monthly: 499, yearly: 4990 },
    features: [
      "Unlimited AI Tutor",
      "Unlimited Notes",
      "Unlimited Flashcards",
      "Unlimited Quiz",
      "Unlimited AI Voice",
      "Study Planner included",
      "Analytics included",
    ],
    limitations: [],
    cta: "Start Free Trial",
    popular: false,
  },
]

const faqs = [
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade or downgrade your plan later.",
  },
  {
    question: "Do Pro and Premium include a free trial?",
    answer: "Yes. Both paid plans start with a 14-day free trial in the current test setup.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Razorpay-supported test payments including cards, UPI, and net banking in test mode.",
  },
  {
    question: "Is the current payment flow live?",
    answer: "No. It is currently configured in Razorpay test mode for development and testing.",
  },
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Choose Your Learning Plan</h2>
          <p className="text-muted-foreground">
            Free users get unlimited AI Tutor and Notes. Upgrade to Pro or Premium to unlock Flashcards, AI Voice, and Quiz with a 14-day free trial.
          </p>
        </div>

        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Pricing for every learner
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Pro and Premium are currently available in Razorpay test mode with a 14-day free trial.
          </p>

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
                <div className="flex items-center gap-2 flex-wrap">
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
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price[billingPeriod] === 0 ? "Free" : `₹${plan.price[billingPeriod]}`}
                    </span>
                    {plan.price[billingPeriod] > 0 && (
                      <span className="text-muted-foreground">/{billingPeriod === "monthly" ? "mo" : "yr"}</span>
                    )}
                  </div>
                  {billingPeriod === "yearly" && plan.price.yearly > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Billed annually (₹{Math.round(plan.price.yearly / 12)}/mo)
                    </p>
                  )}
                </div>

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

                <Button
                  asChild
                  className={cn(
                    "w-full",
                    plan.popular ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground" : ""
                  )}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Flashcards, AI Voice, and Quiz are premium features. AI Tutor and Notes stay free.
          </p>
          <p className="text-xs text-muted-foreground">
            Current checkout is in Razorpay test mode. Use Razorpay test cards while testing the payment flow.
          </p>
        </div>

        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-2 font-semibold text-foreground">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <p className="mb-4 text-muted-foreground">Have questions? We&apos;re here to help.</p>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
