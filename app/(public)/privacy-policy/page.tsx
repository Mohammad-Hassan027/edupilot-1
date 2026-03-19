import { Metadata } from "next"
import { LegalPageLayout } from "@/components/legal-page-layout"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for EduPilot AI - Learn how we collect, use, and protect your data.",
}

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Your Information" },
  { id: "data-sharing", title: "Data Sharing" },
  { id: "data-security", title: "Data Security" },
  { id: "your-rights", title: "Your Rights" },
  { id: "cookies", title: "Cookies" },
  { id: "children", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate="March 1, 2026"
      sections={sections}
    >
      <section id="introduction" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Introduction</h2>
        <p className="text-muted-foreground mb-4">
          Welcome to EduPilot AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered study platform.
        </p>
        <p className="text-muted-foreground">
          By accessing or using EduPilot AI, you agree to the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
        </p>
      </section>

      <section id="information-we-collect" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Information We Collect</h2>
        <p className="text-muted-foreground mb-4">We collect several types of information from and about users of our platform:</p>
        
        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Personal Information</h3>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Name and email address when you create an account</li>
          <li>Profile information you choose to provide</li>
          <li>Payment information when you subscribe to premium plans</li>
          <li>Educational institution and academic level (optional)</li>
        </ul>

        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Usage Information</h3>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Study materials you upload or create</li>
          <li>Notes, flashcards, and quiz responses</li>
          <li>AI tutor conversation history</li>
          <li>Study session data and progress analytics</li>
          <li>Device information and IP address</li>
        </ul>

        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Automatically Collected Information</h3>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>Pages visited and time spent on our platform</li>
          <li>Referring website addresses</li>
        </ul>
      </section>

      <section id="how-we-use" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
        <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Provide, maintain, and improve our AI study platform</li>
          <li>Personalize your learning experience and recommendations</li>
          <li>Train and improve our AI models to better assist with studying</li>
          <li>Process transactions and send related information</li>
          <li>Send you technical notices, updates, and support messages</li>
          <li>Respond to your comments, questions, and customer service requests</li>
          <li>Monitor and analyze trends, usage, and activities</li>
          <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
        </ul>
      </section>

      <section id="data-sharing" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Data Sharing</h2>
        <p className="text-muted-foreground mb-4">We may share your information in the following situations:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong>Service Providers:</strong> We share data with third-party vendors who perform services on our behalf, such as payment processing, data analysis, and cloud hosting.</li>
          <li><strong>AI Processing:</strong> Your study content may be processed by our AI systems and third-party AI providers to deliver personalized tutoring and content generation.</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests.</li>
          <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition of our company.</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          We do not sell your personal information to third parties for marketing purposes.
        </p>
      </section>

      <section id="data-security" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Data Security</h2>
        <p className="text-muted-foreground mb-4">
          We implement appropriate technical and organizational measures to protect your personal information, including:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Encryption of data in transit and at rest</li>
          <li>Regular security assessments and penetration testing</li>
          <li>Access controls and authentication mechanisms</li>
          <li>Employee training on data protection practices</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
        </p>
      </section>

      <section id="your-rights" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Your Rights</h2>
        <p className="text-muted-foreground mb-4">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data</li>
          <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
          <li><strong>Objection:</strong> Object to certain processing of your data</li>
          <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          To exercise these rights, please contact us at support@edupilot.ai.
        </p>
      </section>

      <section id="cookies" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Cookies</h2>
        <p className="text-muted-foreground mb-4">
          We use cookies and similar tracking technologies to collect and store information about your interactions with our platform. For detailed information about our cookie practices, please see our <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
        </p>
      </section>

      <section id="children" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Children&apos;s Privacy</h2>
        <p className="text-muted-foreground">
          Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
        </p>
      </section>

      <section id="changes" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
        </p>
      </section>

      <section id="contact" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
        <p className="text-muted-foreground mb-4">
          If you have any questions about this Privacy Policy, please contact us:
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
