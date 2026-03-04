import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function MenuManagementPage() {
  const { categories, products, toggleProductAvailability } = useRestaurant();
  const [selectedCat, setSelectedCat] = useState<string>("all");

  const filtered = selectedCat === "all" ? products : products.filter(p => p.categoryId === selectedCat);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">จัดการเมนูอาหาร</h2>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCat === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCat("all")}
        >
          ทั้งหมด
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCat === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCat(cat.id)}
          >
            {cat.icon} {cat.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(product => (
          <Card key={product.id} className={`transition-all ${!product.available ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{product.image}</span>
                  <div>
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    <p className="text-primary font-bold mt-1">฿{product.price}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={product.available ? "default" : "destructive"}>
                    {product.available ? 'มีของ' : 'หมด'}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">เปิดขาย</span>
                    <Switch
                      checked={product.available}
                      onCheckedChange={() => toggleProductAvailability(product.id)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
