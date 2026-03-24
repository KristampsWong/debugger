import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { SHOP_ITEMS } from '../types'

export function Shop() {
  const { money, ownedTools, buyTool } = useGameStore()

  return (
    <div className="shop-screen">
      <header className="shop-header">
        <h1>Tool Shop</h1>
        <div className="shop-actions">
          <span className="money">${money}</span>
          <Link to="/board" className="back-link">Back to Board</Link>
        </div>
      </header>
      <div className="shop-grid">
        {SHOP_ITEMS.map((item) => {
          const owned = !item.consumable && ownedTools.includes(item.id)
          const canAfford = money >= item.price

          return (
            <div key={item.id} className={`shop-card ${owned ? 'owned' : ''}`}>
              <h3>{item.name}</h3>
              <p className="item-description">{item.description}</p>
              <p className="item-price">${item.price}{item.consumable ? ' each' : ''}</p>
              {owned ? (
                <span className="owned-label">Owned</span>
              ) : (
                <button
                  className="buy-btn"
                  disabled={!canAfford}
                  onClick={() => buyTool(item.id, item.price)}
                >
                  Buy
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
