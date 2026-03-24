import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { SHOP_ITEMS } from '../types'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Shop() {
  const { money, ownedTools, buyTool } = useGameStore()

  return (
    <div className="mx-auto max-w-[900px] p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tool Shop</h1>
        <div className="flex items-center gap-4">
          <span data-testid="money" className="font-mono text-lg font-bold text-green-500">
            ${money}
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link to="/board">Back to Board</Link>
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {SHOP_ITEMS.map((item) => {
          const owned = !item.consumable && ownedTools.includes(item.id)
          const canAfford = money >= item.price

          return (
            <Card
              key={item.id}
              data-testid="shop-card"
              className={`flex flex-col ${owned ? 'border-green-500 opacity-70' : ''}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p data-testid="item-price" className="mt-2 font-mono font-bold text-green-500">
                  ${item.price}{item.consumable ? ' each' : ''}
                </p>
              </CardContent>
              <CardFooter>
                {owned ? (
                  <Badge variant="outline" data-testid="owned-label" className="w-full justify-center py-2 text-green-500">
                    Owned
                  </Badge>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!canAfford}
                    onClick={() => buyTool(item.id, item.price)}
                  >
                    Buy
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
