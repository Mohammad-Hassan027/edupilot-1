import { Metadata } from "next"
import { LegalPageLayout } from "@/components/legal-page-layout"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for EduPilot AI - Read our terms and conditions for using the platform.",
}

const sections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "description", title: "Description of Service" },
  { id: "accounts", title: "User Accounts" },
  { id: "subscriptions", title: "Subscriptions & Payments" },
  { id: "user-content", title: "User Content" },
  { id: "ai-services", title: "AI Services" },
  { id: "prohibited", title: "Prohibited Uses" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "limitation", title: "Limitation of Liability" },
  { id: "termination", title: "Termination" },
  { id: "governing-law", title: "Governing Law" },
  { id: "contact", title: "Contact Us" },
]

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      effectiveDate="March 1, 2026"
      sections={sections}
    >
      <section id="acceptance" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Acceptance of Terms</h2>
        <p className="text-muted-foreground mb-4">
          Welcome to EduPilot AI. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our AI-powered study platform, including our website, applications, and services (collectively, the &quot;Service&quot;).
        </p>
        <p className="text-muted-foreground mb-4">
          By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
        </p>
        <p className="text-muted-foreground">
          We may modify these Terms at any time. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
        </p>
      </section>

      <section id="description" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Description of Service</h2>
        <p className="text-muted-foreground mb-4">
          EduPilot AI provides an AI-powered study platform that includes:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>AI tutoring and personalized learning assistance</li>
          <li>Automated note generation from study materials</li>
          <li>Flashcard creation and spaced repetition learning</li>
          <li>Quiz generation and adaptive testing</li>
          <li>Study planning and time tracking tools</li>
          <li>Progress analytics and performance insights</li>
        </ul>
      </section>

      <section id="accounts" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">User Accounts</h2>
        <p className="text-muted-foreground mb-4">
          To access certain features of the Service, you must create an account. When creating an account, you agree to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and promptly update your account information</li>
          <li>Maintain the security of your password and account</li>
          <li>Accept responsibility for all activities under your account</li>
          <li>Notify us immediately of any unauthorized access or use</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          You must be at least 13 years old to create an account. If you are under 18, you must have parental or guardian consent.
        </p>
      </section>

      <section id="subscriptions" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Subscriptions & Payments</h2>
        <p className="text-muted-foreground mb-4">
          EduPilot AI offers both free and paid subscription plans. For paid subscriptions:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong>Billing:</strong> Subscriptions are billed in advance on a monthly or annual basis</li>
          <li><strong>Automatic Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date</li>
          <li><strong>Price Changes:</strong> We may change subscription prices with 30 days&apos; notice</li>
          <li><strong>Refunds:</strong> We offer a 7-day money-back guarantee for new subscribers</li>
          <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your account settings</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes.
        </p>
      </section>

      <section id="user-content" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">User Content</h2>
        <p className="text-muted-foreground mb-4">
          You retain ownership of any content you upload, create, or share through the Service (&quot;User Content&quot;). By uploading User Content, you grant us a non-exclusive, worldwide, royalty-free license to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Store, process, and display your content to provide the Service</li>
          <li>Use your content to train and improve our AI models</li>
          <li>Create anonymized and aggregated datasets for research purposes</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          You are solely responsible for your User Content and represent that you have all necessary rights to upload and share it.
        </p>
      </section>

      <section id="ai-services" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">AI Services</h2>
        <p className="text-muted-foreground mb-4">
          Our AI-powered features are designed to assist with learning but are not a substitute for professional educational guidance. Please note:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>AI-generated content may contain errors or inaccuracies</li>
          <li>You should verify important information independently</li>
          <li>AI responses are not professional advice (medical, legal, financial, etc.)</li>
          <li>AI capabilities and availability may change without notice</li>
        </ul>
      </section>

      <section id="prohibited" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Prohibited Uses</h2>
        <p className="text-muted-foreground mb-4">
          You agree not to use the Service to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on intellectual property rights of others</li>
          <li>Upload malicious code, viruses, or harmful content</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Use the Service for academic dishonesty or plagiarism</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Create fake accounts or impersonate others</li>
          <li>Scrape, mine, or collect data from the Service</li>
          <li>Resell or redistribute the Service without authorization</li>
        </ul>
      </section>

      <section id="intellectual-property" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Intellectual Property</h2>
        <p className="text-muted-foreground mb-4">
          The Service, including its original content, features, and functionality, is owned by EduPilot AI and protected by international copyright, trademark, patent, and other intellectual property laws.
        </p>
        <p className="text-muted-foreground">
          Our trademarks, logos, and service marks may not be used without our prior written consent.
        </p>
      </section>

      <section id="disclaimers" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Disclaimers</h2>
        <p className="text-muted-foreground mb-4">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>IMPLIED WARRANTIES OF MERCHANTABILITY</li>
          <li>FITNESS FOR A PARTICULAR PURPOSE</li>
          <li>NON-INFRINGEMENT</li>
          <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF CONTENT</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          We do not warrant that the Service will be uninterrupted, secure, or error-free.
        </p>
      </section>

      <section id="limitation" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
        <p className="text-muted-foreground mb-4">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, EDUPILOT AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Loss of profits, data, or goodwill</li>
          <li>Service interruption or computer damage</li>
          <li>Cost of substitute services</li>
          <li>Any damages arising from your use of the Service</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
        </p>
      </section>

      <section id="termination" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Termination</h2>
        <p className="text-muted-foreground mb-4">
          We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms.
        </p>
        <p className="text-muted-foreground">
          Upon termination, your right to use the Service will cease immediately. Provisions that should survive termination will remain in effect.
        </p>
      </section>

      <section id="governing-law" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Governing Law</h2>
        <p className="text-muted-foreground">
          These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in India.
        </p>
      </section>

      <section id="contact" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
        <p className="text-muted-foreground mb-4">
          If you have any questions about these Terms, please contact us:
        </p>
        <ul className="list-none space-y-2 text-muted-foreground">
          <li><strong>Email:</strong> support@edupilot.ai</li>
          <li><strong>Company:</strong> EduPilot AI</li>
          <li><strong>Location:</strong> India</li>
        </ul>
      </section>
    </LegalPageLayout>
  )
}
