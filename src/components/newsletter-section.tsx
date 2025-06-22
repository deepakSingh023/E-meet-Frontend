import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Gift, Truck, Shield } from "lucide-react"

export default function NewsletterSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold">Stay Updated with ECommerece</h2>
              <p className="text-purple-100 text-lg">
                Subscribe to our newsletter and get exclusive deals, new product updates, and special offers delivered
                to your inbox.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <Input
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-200"
              />
              <Button variant="secondary" className="bg-white text-purple-600 hover:bg-white/90">
                <Mail className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>

            <p className="text-sm text-purple-200">Join 50,000+ subscribers and never miss an update!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Gift className="h-8 w-8 mx-auto mb-3 text-yellow-300" />
                <h3 className="font-semibold mb-2">Exclusive Deals</h3>
                <p className="text-sm text-purple-100">Get access to member-only discounts</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Truck className="h-8 w-8 mx-auto mb-3 text-green-300" />
                <h3 className="font-semibold mb-2">Free Shipping</h3>
                <p className="text-sm text-purple-100">Free delivery on orders over $50</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                <h3 className="font-semibold mb-2">Secure Shopping</h3>
                <p className="text-sm text-purple-100">100% secure payment processing</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 mx-auto mb-3 text-pink-300" />
                <h3 className="font-semibold mb-2">24/7 Support</h3>
                <p className="text-sm text-purple-100">Round-the-clock customer service</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
