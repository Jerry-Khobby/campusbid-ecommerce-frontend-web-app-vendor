"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptimizedImage } from "@/components/optimized-image"
import { useNotification } from "@/lib/notification-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  image: string
  status: "active" | "inactive"
  sales: number
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Coffee & Pastry Bundle",
    category: "Food",
    price: 8.99,
    stock: 45,
    image: "/coffee-and-pastry.jpg",
    status: "active",
    sales: 234,
  },
  {
    id: 2,
    name: "Protein Shake",
    category: "Food",
    price: 6.99,
    stock: 32,
    image: "/protein-shake.jpg",
    status: "active",
    sales: 189,
  },
  {
    id: 3,
    name: "Fresh Sushi Platter",
    category: "Food",
    price: 24.99,
    stock: 12,
    image: "/sushi-platter.png",
    status: "active",
    sales: 156,
  },
  {
    id: 4,
    name: "Sandwich & Drink Combo",
    category: "Food",
    price: 14.99,
    stock: 0,
    image: "/sandwich-combo.jpg",
    status: "inactive",
    sales: 98,
  },
]

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { addNotification } = useNotification()

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Food",
    price: 0,
    stock: 0,
    image: "",
  })

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddProduct = () => {
    const product: Product = {
      id: products.length + 1,
      ...newProduct,
      status: "active",
      sales: 0,
    }
    setProducts([...products, product])
    setIsAddDialogOpen(false)
    setNewProduct({ name: "", category: "Food", price: 0, stock: 0, image: "" })
    addNotification("Product added successfully", "success")
  }

  const handleEditProduct = () => {
    if (!editingProduct) return
    setProducts(products.map((p) => (p.id === editingProduct.id ? editingProduct : p)))
    setEditingProduct(null)
    addNotification("Product updated successfully", "success")
  }

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter((p) => p.id !== id))
    addNotification("Product deleted successfully", "success")
  }

  const toggleProductStatus = (id: number) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p)),
    )
    addNotification("Product status updated", "info")
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product inventory</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <span>➕</span>
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Fill in the details to add a new product to your inventory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Coffee & Pastry Bundle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price || ""}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value ? Number.parseFloat(e.target.value) : 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock || ""}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value ? Number.parseInt(e.target.value) : 0 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="/product-image.jpg"
                />
              </div>
              <Button onClick={handleAddProduct} className="w-full">
                Add Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xl">🔍</span>
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <OptimizedImage src={product.image} alt={product.name} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-semibold">${product.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stock</p>
                    <p className={`font-semibold ${product.stock === 0 ? "text-red-600" : ""}`}>
                      {product.stock} units
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sales</p>
                    <p className="font-semibold">{product.sales} sold</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleProductStatus(product.id)}
                  className="flex items-center gap-2"
                >
                  <span>{product.status === "active" ? "👁️" : "👁️‍🗨️"}</span>
                  {product.status === "active" ? "Deactivate" : "Activate"}
                </Button>
                <Dialog
                  open={editingProduct?.id === product.id}
                  onOpenChange={(open) => !open && setEditingProduct(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                      className="flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Product</DialogTitle>
                      <DialogDescription>Update product details</DialogDescription>
                    </DialogHeader>
                    {editingProduct && (
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Product Name</Label>
                          <Input
                            id="edit-name"
                            value={editingProduct.name}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-price">Price ($)</Label>
                            <Input
                              id="edit-price"
                              type="number"
                              step="0.01"
                              value={editingProduct.price || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  price: e.target.value ? Number.parseFloat(e.target.value) : 0,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-stock">Stock</Label>
                            <Input
                              id="edit-stock"
                              type="number"
                              value={editingProduct.stock || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  stock: e.target.value ? Number.parseInt(e.target.value) : 0,
                                })
                              }
                            />
                          </div>
                        </div>
                        <Button onClick={handleEditProduct} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <span>🗑️</span>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No products found</p>
        </Card>
      )}
    </div>
  )
}
