import { Metadata } from "next"
import { LegalPageLayout } from "@/components/legal-page-layout"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for EduPilot AI - Learn how we use cookies and similar technologies.",
}

const sections = [
  { id: "what-are-cookies", title: "What Are Cookies" },
  { id: "how-we-use", title: "How We Use Cookies" },
  { id: "types-of-cookies", title: "Types of Cookies" },
  { id: "third-party", title: "Third-Party Cookies" },
  { id: "managing-cookies", title: "Managing Cookies" },
  { id: "do-not-track", title: "Do Not Track" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
]

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      effectiveDate="March 1, 2026"
      sections={sections}
    >
      <section id="what-are-cookies" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">What Are Cookies</h2>
        <p className="text-muted-foreground mb-4">
          Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
        </p>
        <p className="text-muted-foreground mb-4">
          Cookies enable websites to remember your preferences, login information, and other details to enhance your experience. They can also be used to track your browsing behavior across different websites.
        </p>
        <p className="text-muted-foreground">
          Similar technologies include web beacons, pixels, and local storage, which function in comparable ways to cookies.
        </p>
      </section>

      <section id="how-we-use" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">How We Use Cookies</h2>
        <p className="text-muted-foreground mb-4">
          EduPilot AI uses cookies and similar technologies to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Keep you signed in to your account</li>
          <li>Remember your preferences and settings</li>
          <li>Understand how you use our platform</li>
          <li>Improve our services based on usage patterns</li>
          <li>Provide personalized learning recommendations</li>
          <li>Measure the effectiveness of our features</li>
          <li>Ensure security and prevent fraud</li>
          <li>Deliver relevant communications</li>
        </ul>
      </section>

      <section id="types-of-cookies" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Types of Cookies We Use</h2>
        
        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Essential Cookies</h3>
        <p className="text-muted-foreground mb-4">
          These cookies are necessary for the Service to function properly. They enable core functionality such as security, authentication, and accessibility. You cannot opt out of these cookies.
        </p>
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-foreground">Cookie</th>
                <th className="text-left py-2 text-foreground">Purpose</th>
                <th className="text-left py-2 text-foreground">Duration</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2">session_id</td>
                <td className="py-2">Maintains user session</td>
                <td className="py-2">Session</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2">csrf_token</td>
                <td className="py-2">Security protection</td>
                <td className="py-2">Session</td>
              </tr>
              <tr>
                <td className="py-2">auth_token</td>
                <td className="py-2">Authentication</td>
                <td className="py-2">30 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Functional Cookies</h3>
        <p className="text-muted-foreground mb-4">
          These cookies enable enhanced functionality and personalization, such as remembering your language preferences and theme settings.
        </p>
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-foreground">Cookie</th>
                <th className="text-left py-2 text-foreground">Purpose</th>
                <th className="text-left py-2 text-foreground">Duration</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2">theme</td>
                <td className="py-2">Dark/light mode preference</td>
                <td className="py-2">1 year</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2">language</td>
                <td className="py-2">Language preference</td>
                <td className="py-2">1 year</td>
              </tr>
              <tr>
                <td className="py-2">sidebar_state</td>
                <td className="py-2">UI preferences</td>
                <td className="py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Analytics Cookies</h3>
        <p className="text-muted-foreground mb-4">
          These cookies help us understand how visitors interact with our platform by collecting and reporting information anonymously.
        </p>
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-foreground">Cookie</th>
                <th className="text-left py-2 text-foreground">Purpose</th>
                <th className="text-left py-2 text-foreground">Duration</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2">_ga</td>
                <td className="py-2">Google Analytics visitor ID</td>
                <td className="py-2">2 years</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2">_gid</td>
                <td className="py-2">Google Analytics session ID</td>
                <td className="py-2">24 hours</td>
              </tr>
              <tr>
                <td className="py-2">_vercel_insights</td>
                <td className="py-2">Vercel Analytics</td>
                <td className="py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Marketing Cookies</h3>
        <p className="text-muted-foreground">
          We currently do not use marketing or advertising cookies. If this changes in the future, we will update this policy and provide appropriate opt-out mechanisms.
        </p>
      </section>

      <section id="third-party" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Third-Party Cookies</h2>
        <p className="text-muted-foreground mb-4">
          Some cookies on our platform are set by third-party services that we use:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong>Google Analytics:</strong> For understanding platform usage and improving our services</li>
          <li><strong>Vercel Analytics:</strong> For performance monitoring and optimization</li>
          <li><strong>Stripe:</strong> For secure payment processing (only when making purchases)</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          These third parties have their own privacy and cookie policies. We encourage you to review their policies for more information.
        </p>
      </section>

      <section id="managing-cookies" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Managing Cookies</h2>
        <p className="text-muted-foreground mb-4">
          You can control and manage cookies in several ways:
        </p>
        
        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Browser Settings</h3>
        <p className="text-muted-foreground mb-4">
          Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites. Here are links to manage cookies in popular browsers:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
        </ul>

        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Opt-Out Tools</h3>
        <p className="text-muted-foreground">
          You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-out Browser Add-on</a>.
        </p>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
          <p className="text-sm text-foreground">
            <strong>Note:</strong> Blocking certain cookies may impact your experience on our platform. Essential cookies cannot be disabled as they are necessary for the Service to function.
          </p>
        </div>
      </section>

      <section id="do-not-track" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Do Not Track</h2>
        <p className="text-muted-foreground">
          Some browsers include a &quot;Do Not Track&quot; (DNT) feature that signals to websites that you do not want your online activity tracked. Currently, there is no uniform standard for how websites should respond to DNT signals. We do not currently respond to DNT signals, but we will continue to monitor developments in this area.
        </p>
      </section>

      <section id="changes" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page with a new &quot;Last updated&quot; date. We encourage you to review this policy periodically.
        </p>
      </section>

      <section id="contact" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
        <p className="text-muted-foreground mb-4">
          If you have any questions about our use of cookies or this Cookie Policy, please contact us:
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
