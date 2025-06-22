import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Award, Globe, Heart, Target, Zap, User } from "lucide-react"

export default function AboutPage() {
  const stats = [
    { label: "Happy Customers", value: "50K+", icon: Users },
    { label: "Products Sold", value: "1M+", icon: Award },
    { label: "Countries Served", value: "25+", icon: Globe },
    { label: "Team Members", value: "100+", icon: Heart },
  ]

  const values = [
    {
      icon: Target,
      title: "Quality First",
      description: "We carefully curate every product to ensure the highest quality standards for our customers.",
    },
    {
      icon: Heart,
      title: "Customer Focused",
      description: "Your satisfaction is our priority. We go above and beyond to exceed your expectations.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We constantly evolve and innovate to bring you the latest trends and technologies.",
    },
  ]

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge variant="secondary" className="mb-4">
                About Ecommerce
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold">
                Redefining Your
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Shopping Experience
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Since 2020, Ecommerece has been committed to bringing you the finest products with exceptional service. We
                believe shopping should be enjoyable, convenient, and inspiring.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className="text-center">
                    <CardContent className="p-6">
                      <Icon className="h-8 w-8 mx-auto mb-4 text-purple-600" />
                      <div className="text-3xl font-bold mb-2">{stat.value}</div>
                      <div className="text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Our Story</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    E-commerece was born from a simple idea: shopping should be more than just a transaction. It should be
                    an experience that brings joy, discovery, and satisfaction to every customer.
                  </p>
                  <p>
                    Founded by a team of passionate entrepreneurs, we started with a mission to bridge the gap between
                    quality products and exceptional customer service. What began as a small online store has grown into
                    a trusted platform serving customers worldwide.
                  </p>
                  <p>
                    Today, we continue to innovate and expand our offerings while staying true to our core values of
                    quality, integrity, and customer satisfaction.
                  </p>
                </div>
              </div>
              <div className="relative">
                <img src="/ep1.jpg?height=500&width=600" alt="Our Story" className="rounded-2xl shadow-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These core principles guide everything we do and shape the way we serve our customers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <Card key={index} className="text-center group hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The passionate individuals behind ShopVibe who work tirelessly to bring you the best shopping experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { name: "Sarah Johnson", role: "CEO & Founder", image: "/user.png?height=300&width=300" },
                { name: "Michael Chen", role: "CTO", image: "/user.png?height=300&width=300" },
                {
                  name: "Emily Davis",
                  role: "Head of Customer Experience",
                  image: "/user.png?height=300&width=300",
                },
              ].map((member, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <img
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
