import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Shirt, Home, Gamepad2, Watch, Headphones } from "lucide-react"

const categories = [
  {
    name: "Electronics",
    icon: Smartphone,
    href: "/products?category=electronics",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Fashion",
    icon: Shirt,
    href: "/products?category=fashion",
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "Home & Garden",
    icon: Home,
    href: "/products?category=home",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Gaming",
    icon: Gamepad2,
    href: "/products?category=gaming",
    color: "from-purple-500 to-violet-500",
  },
  {
    name: "Accessories",
    icon: Watch,
    href: "/products?category=accessories",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Audio",
    icon: Headphones,
    href: "/products?category=audio",
    color: "from-red-500 to-pink-500",
  },
]

export default function CategorySection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our wide range of categories and find exactly what you're looking for
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link key={category.name} href={category.href}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
