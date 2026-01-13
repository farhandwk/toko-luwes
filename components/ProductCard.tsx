// components/ProductCard.tsx
import React from 'react';
import { Product } from '@/types';
import { formatRupiah } from '@/utils/currency';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 5;

  return (
    <Card className={`flex flex-col justify-between transition-all hover:shadow-lg ${isOutOfStock ? 'opacity-60' : ''} gap-0`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
          {/* Logika Badge Stok */}
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
      
      <CardContent className="p-4 py-0 ">
        <img src={product.image || "https://picsum.photos/id/237/200/300"}
        className='w-48 h-40 object-cover py-2 rounded-[20]'
        ></img>
        <p className="font-bold text-lg text-primary">
          {formatRupiah(product.price)}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-4">
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