"use client"

import { useEffect, useState } from "react"
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
import { ApiError } from "@/lib/api/client"
import { fetchCategories, type Category } from "@/lib/api/categories"
import {
  createProduct,
  deleteProduct,
  fetchVendorProducts,
  updateProduct,
  updateProductAvailability,
} from "@/lib/api/products"
import type { Product } from "@/lib/api/types"

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

const emptyNewProduct = { name: "", category: "", price: 0, stock: 0, image: "" }

export default function VendorProductsPage() {
  const { addNotification } = useNotification()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newProduct, setNewProduct] = useState(emptyNewProduct)

  useEffect(() => {
    let isCancelled = false

    Promise.all([fetchVendorProducts(), fetchCategories()])
      .then(([productData, categoryData]) => {
        if (!isCancelled) {
          setProducts(productData)
          setCategories(categoryData)
          setNewProduct((current) => ({ ...current, category: categoryData[0]?.name ?? "" }))
        }
      })
      .catch((error) => {
        if (!isCancelled) addNotification(getErrorMessage(error), "error")
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [addNotification])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || newProduct.price <= 0) {
      addNotification("Enter a product name and a price greater than $0", "error")
      return
    }

    setIsSubmitting(true)
    try {
      const product = await createProduct({
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        stock: newProduct.stock,
        images: newProduct.image ? [newProduct.image] : undefined,
      })
      setProducts((current) => [...current, product])
      setIsAddDialogOpen(false)
      setNewProduct({ ...emptyNewProduct, category: categories[0]?.name ?? "" })
      addNotification("Product added successfully", "success")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    if (!editingProduct.name.trim() || editingProduct.price <= 0) {
      addNotification("Enter a product name and a price greater than $0", "error")
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await updateProduct(editingProduct._id, {
        name: editingProduct.name,
        price: editingProduct.price,
        stock: editingProduct.stock,
      })
      setProducts((current) => current.map((p) => (p._id === updated._id ? updated : p)))
      setEditingProduct(null)
      addNotification("Product updated successfully", "success")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id)
      setProducts((current) => current.filter((p) => p._id !== id))
      addNotification("Product deleted successfully", "success")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    }
  }

  const toggleProductStatus = async (product: Product) => {
    try {
      const updated = await updateProductAvailability(product._id, !product.isAvailable)
      setProducts((current) => current.map((p) => (p._id === updated._id ? updated : p)))
      addNotification("Product status updated", "info")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    }
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
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
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
                <Label htmlFor="image">Image URL (optional)</Label>
                <Input
                  id="image"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={handleAddProduct} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Product"}
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

      {isLoading && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading products...</p>
        </Card>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product._id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <OptimizedImage src={product.images?.[0] ?? ""} alt={product.name} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.isAvailable ? "active" : "inactive"}
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
                      <p className="font-semibold">{product.soldCount ?? 0} sold</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProductStatus(product)}
                    className="flex items-center gap-2"
                  >
                    <span>{product.isAvailable ? "👁️" : "👁️‍🗨️"}</span>
                    {product.isAvailable ? "Deactivate" : "Activate"}
                  </Button>
                  <Dialog
                    open={editingProduct?._id === product._id}
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
                          <Button onClick={handleEditProduct} className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product._id)}
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
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No products found</p>
        </Card>
      )}
    </div>
  )
}
