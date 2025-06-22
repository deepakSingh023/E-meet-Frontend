"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Heart, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock product data - in real app, this would come from API
const getProduct = (id: string) => {
  const products = {
    "1": {
      id: "1",
      name: "Wireless Headphones Pro",
      price: 299.99,
      originalPrice: 399.99,
      rating: 4.8,
      reviews: 124,
      images: [
        "/ep1.jpg?height=500&width=500",
        "/ep1.jpg?height=500&width=500",
        "/ep1.jpg?height=500&width=500",
        "/ep1.jpg?height=500&width=500",
      ],
      category: "Electronics",
      badge: "Best Seller",
      description:
        "Experience premium sound quality with our latest wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort design.",
      features: [
        "Active Noise Cancellation",
        "30-hour battery life",
        "Premium comfort design",
        "Bluetooth 5.0 connectivity",
        "Quick charge technology",
        "Voice assistant support",
      ],
      specifications: {
        "Driver Size": "40mm",
        "Frequency Response": "20Hz - 20kHz",
        Impedance: "32 ohms",
        "Battery Life": "30 hours",
        "Charging Time": "2 hours",
        Weight: "250g",
      },
      inStock: true,
      stockCount: 15,
    },
    "2": {
      id: "2",
      name: "Smart Watch Series X",
      price: 199.99,
      originalPrice: 249.99,
      rating: 4.9,
      reviews: 89,
      images: [
        "/ep1.jpg?height=500&width=500",
        "/ep1.jpg?height=500&width=500",
        "/ep1.jpg?height=500&width=500",
      ],
      category: "Electronics",
      badge: "New",
      description:
        "Stay connected and track your fitness with our latest smartwatch featuring health monitoring, GPS, and all-day battery life.",
      features: [
        "Health monitoring sensors",
        "Built-in GPS",
        "Water resistant",
        "All-day battery life",
        "Customizable watch faces",
        "Smart notifications",
      ],
      specifications: {
        "Display Size": "1.4 inches",
        "Battery Life": "18 hours",
        "Water Resistance": "50 meters",
        Connectivity: "Bluetooth 5.0, WiFi",
        Sensors: "Heart rate, GPS, Accelerometer",
        Weight: "45g",
      },
      inStock: true,
      stockCount: 8,
    },
    "3": {
      id: "3",
      name: "Premium Laptop Bag",
      price: 79.99,
      originalPrice: 99.99,
      rating: 4.7,
      reviews: 156,
      images: ["/ep1.jpg?height=500&width=500", "/ep1.jpg?height=500&width=500"],
      category: "Accessories",
      badge: "Sale",
      description:
        "Protect your laptop in style with our premium laptop bag featuring padded compartments and durable materials.",
      features: [
        "Padded laptop compartment",
        "Multiple pockets",
        "Durable materials",
        "Comfortable straps",
        "Water-resistant",
        "Professional design",
      ],
      specifications: {
        "Laptop Size": "Up to 15.6 inches",
        Material: "Premium nylon",
        Dimensions: "16 x 12 x 3 inches",
        Weight: "1.2 lbs",
        "Water Resistance": "Yes",
        Warranty: "2 years",
      },
      inStock: true,
      stockCount: 25,
    },
    "4": {
      id: "4",
      name: "Gaming Mechanical Keyboard",
      price: 149.99,
      originalPrice: 199.99,
      rating: 4.6,
      reviews: 203,
      images: [
        "/ep1.jpg?height=500&width=500",
        "/ep1.jpg?height=500&width=500",
        "/ep1.jpg?height=500&width=500",
      ],
      category: "Electronics",
      badge: "Hot",
      description:
        "Enhance your gaming experience with our mechanical keyboard featuring RGB lighting and tactile switches.",
      features: [
        "Mechanical switches",
        "RGB backlighting",
        "Programmable keys",
        "Gaming mode",
        "USB passthrough",
        "Detachable cable",
      ],
      specifications: {
        "Switch Type": "Cherry MX Blue",
        "Key Layout": "Full size (104 keys)",
        Backlighting: "RGB",
        Connection: "USB-C",
        "Polling Rate": "1000Hz",
        Weight: "2.5 lbs",
      },
      inStock: true,
      stockCount: 12,
    },
    "5": {
      id: "5",
      name: "Bluetooth Speaker",
      price: 89.99,
      originalPrice: 109.99,
      rating: 4.5,
      reviews: 78,
      images: ["/ep1.jpg?height=500&width=500", "/ep1.jpg?height=500&width=500"],
      category: "Audio",
      badge: "",
      description: "Enjoy high-quality audio anywhere with our portable Bluetooth speaker featuring 360-degree sound.",
      features: [
        "360-degree sound",
        "Waterproof design",
        "12-hour battery",
        "Voice assistant",
        "Portable design",
        "Quick pairing",
      ],
      specifications: {
        "Battery Life": "12 hours",
        "Water Rating": "IPX7",
        "Bluetooth Version": "5.0",
        Range: "30 feet",
        "Charging Time": "3 hours",
        Weight: "1.5 lbs",
      },
      inStock: true,
      stockCount: 20,
    },
    "6": {
      id: "6",
      name: "Fitness Tracker",
      price: 129.99,
      originalPrice: 149.99,
      rating: 4.4,
      reviews: 92,
      images: ["/ep1.jpg?height=500&width=500", "/ep1.jpg?height=500&width=500"],
      category: "Electronics",
      badge: "",
      description:
        "Track your fitness goals with our advanced fitness tracker featuring heart rate monitoring and sleep tracking.",
      features: [
        "Heart rate monitoring",
        "Sleep tracking",
        "Step counter",
        "Calorie tracking",
        "Water reminder",
        "Long battery life",
      ],
      specifications: {
        Display: "OLED",
        "Battery Life": "7 days",
        "Water Resistance": "5ATM",
        Sensors: "Heart rate, Accelerometer",
        Compatibility: "iOS, Android",
        Weight: "25g",
      },
      inStock: true,
      stockCount: 18,
    },
  }
  return products[id as keyof typeof products]
}

export default function ProductDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)

  const product = getProduct(params.id as string)

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const addToCart = () => {
    toast({
      title: "Added to cart!",
      description: `${quantity} ${product.name} added to your cart.`,
    })
  }

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: isWishlisted ? "Item removed from your wishlist" : "Item added to your wishlist",
    })
  }

  return (
    <div className="min-h-screen">
      <Header/>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <img
                src={product.images[selectedImage] || "/ep1.jpg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img
                    src={image || "/ep1.jpg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.badge && <Badge variant="secondary">{product.badge}</Badge>}
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-medium">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">${product.originalPrice}</span>
                )}
                {product.originalPrice && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground text-lg mb-6">{product.description}</p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${product.inStock ? "bg-green-500" : "bg-red-500"}`} />
              <span className={product.inStock ? "text-green-600" : "text-red-600"}>
                {product.inStock ? `In Stock (${product.stockCount} available)` : "Out of Stock"}
              </span>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    disabled={quantity >= product.stockCount}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={addToCart}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleWishlist}
                  className={isWishlisted ? "text-red-500 border-red-500" : ""}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-b">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-sm font-medium">Free Shipping</div>
                <div className="text-xs text-muted-foreground">On orders over $50</div>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-sm font-medium">2 Year Warranty</div>
                <div className="text-xs text-muted-foreground">Full coverage</div>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-sm font-medium">30-Day Returns</div>
                <div className="text-xs text-muted-foreground">No questions asked</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Key Features</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Technical Specifications</h3>
                  <div className="space-y-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b">
                        <span className="font-medium">{key}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
                  <div className="space-y-6">
                    {[
                      {
                        name: "John D.",
                        rating: 5,
                        date: "2024-01-15",
                        comment: "Excellent sound quality and very comfortable to wear for long periods.",
                      },
                      {
                        name: "Sarah M.",
                        rating: 4,
                        date: "2024-01-10",
                        comment: "Great headphones, battery life is amazing. Only wish they came in more colors.",
                      },
                      {
                        name: "Mike R.",
                        rating: 5,
                        date: "2024-01-05",
                        comment: "Best purchase I've made this year. The noise cancellation is incredible.",
                      },
                    ].map((review, index) => (
                      <div key={index} className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.name}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: "2", name: "Smart Watch Series X", price: 199.99, image: "/ep1.jpg?height=200&width=200" },
              { id: "3", name: "Premium Laptop Bag", price: 79.99, image: "/ep1.jpg?height=200&width=200" },
              { id: "4", name: "Gaming Keyboard", price: 149.99, image: "/ep1.jpg?height=200&width=200" },
              { id: "5", name: "Bluetooth Speaker", price: 89.99, image: "/ep1.jpg?height=200&width=200" },
            ].map((relatedProduct) => (
              <Link key={relatedProduct.id} href={`/products/${relatedProduct.id}`}>
                <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <img
                      src={relatedProduct.image || "/ep1.jpg"}
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform"
                    />
                    <h3 className="font-semibold mb-2">{relatedProduct.name}</h3>
                    <p className="text-lg font-bold">${relatedProduct.price}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
