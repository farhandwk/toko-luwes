// components/ProductCard.tsx
import React from 'react';
import { Product } from '@/types';
import { formatRupiah } from '@/utils/currency';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react"; // Opsional: Icon kalau gambar rusak

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 5;

  // URL Placeholder yang valid (mengembalikan gambar, bukan JSON)
  const placeholderImage = "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image";

  const optimizeCloudinaryUrl = (url: string) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/q_auto,f_auto/');
  };

  return (
    <Card className={`flex flex-col justify-between transition-all hover:shadow-lg ${isOutOfStock ? 'opacity-60' : ''} h-full`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
          
          {isOutOfStock ? (
            <Badge variant="destructive" className="text-xs">Habis</Badge>
          ) : isLowStock ? (
            <Badge variant="outline" className="text-xs text-red-500 border-red-200 bg-red-50">
              Sisa {product.stock}
            </Badge>
          ) : (
             <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
          )}
        </div>
        <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[3rem]">
          {product.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 py-0 flex-1">
        {/* WRAPPER GAMBAR: Penting agar rasio gambar konsisten */}
        <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-md overflow-hidden mb-3">
            <img 
                src={optimizeCloudinaryUrl(product.image) || placeholderImage} 
                alt={product.name}
                className="h-full w-full object-cover transition-transform hover:scale-105"
                onError={(e) => {
                    // Fallback jika URL gambar produk ternyata error/404
                    e.currentTarget.src = placeholderImage;
                }}
            />
        </div>

        <p className="font-bold text-lg text-primary">
          {formatRupiah(product.price)}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-2">
        <Button 
          className="w-full" 
          variant={isOutOfStock ? "secondary" : "default"}
          disabled={isOutOfStock}
          onClick={() => onAddToCart(product)}
        >
          {isOutOfStock ? 'Stok Habis' : 'Tambah +'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;