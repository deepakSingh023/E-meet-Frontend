import Link from "next/link"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Package, Mail, Download } from "lucide-react"

export default function CheckoutSuccessPage() {
  const orderNumber =
    "ORD-2024-" +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")

  return (
    <div className="min-h-screen">
      <Header/>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Order Confirmed!</h1>
            <p className="text-xl text-muted-foreground">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Order Details</h2>
                <p className="text-2xl font-bold text-primary">{orderNumber}</p>
                <p className="text-sm text-muted-foreground">Confirmation email sent to your inbox</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 pt-6">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Processing</h3>
                  <p className="text-sm text-muted-foreground">1-2 business days</p>
                </div>
                <div className="text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Shipping Updates</h3>
                  <p className="text-sm text-muted-foreground">Via email & SMS</p>
                </div>
                <div className="text-center">
                  <Download className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Receipt</h3>
                  <p className="text-sm text-muted-foreground">Available in account</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/orders">
              <Button variant="outline" size="lg">
                Track Your Order
              </Button>
            </Link>
            <Link href="/products">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Need help? Contact our support team at support@ecommerece.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
