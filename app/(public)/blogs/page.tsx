import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getAllBlogPosts } from "@/lib/blog-data"

export default function BlogsPage() {
  const posts = getAllBlogPosts()

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Insight
          </h1>
          <p className="text-lg text-muted-foreground">
            Tips, guides, and insights to help you learn smarter and achieve your goals.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="group"
            >
              <Card className="h-full overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                {/* Image */}
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-secondary to-muted">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={600}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <CardContent className="p-5">
                  {/* Title */}
                  <h2 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                    {post.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {post.readTime}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Read more
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
