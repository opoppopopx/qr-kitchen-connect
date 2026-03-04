import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'ว่าง', color: 'bg-green-100 text-green-800 border-green-300' },
  occupied: { label: 'เปิดอยู่', color: 'bg-primary/10 text-primary border-primary/30' },
  reserved: { label: 'จอง', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
};

export default function TablesPage() {
  const { tables, openTable, closeTable } = useRestaurant();

  const zones = [...new Set(tables.map(t => t.zone))];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">โต๊ะอาหาร</h2>

      {zones.map(zone => (
        <div key={zone}>
          <h3 className="text-lg font-semibold mb-3">โซน {zone}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tables.filter(t => t.zone === zone).map(table => {
              const config = statusConfig[table.status];
              return (
                <Card key={table.id} className={`transition-all hover:shadow-md ${table.status === 'occupied' ? 'ring-2 ring-primary/30' : ''}`}>
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="text-3xl font-bold">{table.number}</div>
                    <Badge className={config.color}>{config.label}</Badge>
                    <p className="text-xs text-muted-foreground">{table.seats} ที่นั่ง</p>
                    <div>
                      {table.status === 'available' && (
                        <Button size="sm" className="w-full" onClick={() => openTable(table.id)}>
                          เปิดโต๊ะ
                        </Button>
                      )}
                      {table.status === 'occupied' && (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => closeTable(table.id)}>
                          ปิดโต๊ะ
                        </Button>
                      )}
                      {table.status === 'reserved' && (
                        <Button size="sm" variant="secondary" className="w-full" onClick={() => openTable(table.id)}>
                          เปิดโต๊ะ
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
