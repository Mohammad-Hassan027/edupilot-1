import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getBlogPost, getAllBlogPosts, BlogSection } from "@/lib/blog-data"

export function generateStaticParams() {
  const posts = getAllBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

function renderSection(section: BlogSection, index: number) {
  switch (section.type) {
    case "heading":
      return (
        <h2 key={index} className="mb-4 mt-8 text-2xl font-bold text-foreground">
          {section.content}
        </h2>
      )
    case "paragraph":
      return (
        <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
          {section.content}
        </p>
      )
    case "list":
      return (
        <ul key={index} className="mb-6 space-y-2 pl-6">
          {section.items?.map((item, i) => (
            <li key={i} className="text-muted-foreground list-disc">
              {item}
            </li>
          ))}
        </ul>
      )
    case "quote":
      return (
        <blockquote
          key={index}
          className="my-6 border-l-4 border-primary bg-primary/5 py-4 pl-6 pr-4 italic text-foreground"
        >
          {section.content}
        </blockquote>
      )
    case "code":
      return (
        <pre
          key={index}
          className="my-6 overflow-x-auto rounded-lg bg-secondary p-4 text-sm text-foreground"
        >
          <code>{section.content}</code>
        </pre>
      )
    default:
      return null
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  // Generate table of contents from headings
  const tableOfContents = post.content
    .filter((section) => section.type === "heading")
    .map((section) => section.content)

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Back Link */}
          <Link
            href="/blogs"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All
          </Link>

          {/* Hero */}
          <div className="mb-12">
            {/* Title */}
            <h1 className="mb-6 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl text-balance">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-12 overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-muted">
            <Image
              src={post.image}
              alt={post.title}
              width={1200}
              height={800}
              priority
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Content Grid */}
          <div className="grid gap-12 lg:grid-cols-4">
            {/* Table of Contents */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  Table of Contents
                </h3>
                <nav className="space-y-2">
                  {tableOfContents.map((heading, index) => (
                    <a
                      key={index}
                      href={`#${heading.toLowerCase().replace(/\s+/g, "-")}`}
                      className="block text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {heading}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Article Content */}
            <article className="lg:col-span-3">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {post.content.map((section, index) => renderSection(section, index))}
              </div>

              {/* Share & CTA */}
              <div className="mt-12 rounded-2xl border border-border bg-card p-8">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Ready to transform your learning?
                </h3>
                <p className="mb-6 text-muted-foreground">
                  Join thousands of students who are already studying smarter with EduPilot.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
                    <Link href="/register">Start for Free</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/features">Explore Features</Link>
                  </Button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
