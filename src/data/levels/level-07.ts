import type { Level } from '../../types'

const level: Level = {
  id: 'level-07',
  title: "Fix the Restaurant Menu",
  client: {
    name: "La Maison Fine Dining",
    avatar: '',
    brief: "Our restaurant page is embarrassing. The hero section text isn't centered over the image, the menu categories should scroll horizontally, and the reservation button doesn't look clickable at all.",
    completionMessage: "Magnifique! Our online presence finally matches our cuisine.",
    hintMessage: "The hero needs absolute positioning with transforms for centering. The categories need overflow-x. The button needs proper styling.",
  },
  difficulty: 5,
  payout: 400,
  prerequisites: ['level-05', 'level-06'],
  html: `<section class="hero">
  <div class="hero-overlay">
    <h1 class="hero-title">La Maison</h1>
    <p class="hero-subtitle">Fine Dining Since 1987</p>
  </div>
</section>
<div class="categories-scroll">
  <span class="category active">Appetizers</span>
  <span class="category">Mains</span>
  <span class="category">Desserts</span>
  <span class="category">Wine</span>
  <span class="category">Cocktails</span>
  <span class="category">Specials</span>
</div>
<div class="menu-section">
  <div class="menu-item">
    <span class="dish-name">Truffle Risotto</span>
    <span class="dish-price">$28</span>
  </div>
  <div class="menu-item">
    <span class="dish-name">Wagyu Steak</span>
    <span class="dish-price">$65</span>
  </div>
</div>
<div class="reservation">
  <button class="reserve-btn">Make a Reservation</button>
</div>`,
  buggyCSS: `.hero {
  position: relative;
  height: 300px;
  background-color: rgb(30, 30, 30);
}

.hero-overlay {
  position: static;
  top: auto;
  left: auto;
  transform: none;
  text-align: center;
  color: rgb(255, 255, 255);
}

.hero-title {
  font-size: 48px;
  font-family: Georgia, serif;
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 18px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.categories-scroll {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: hidden;
  white-space: nowrap;
  background-color: rgb(245, 245, 245);
}

.category {
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.category.active {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
}

.menu-section {
  max-width: 600px;
  margin: 24px auto;
  padding: 0 20px;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgb(221, 221, 221);
}

.dish-price {
  font-weight: bold;
}

.reservation {
  text-align: center;
  padding: 32px;
}

.reserve-btn {
  padding: 14px 40px;
  background-color: transparent;
  color: rgb(200, 200, 200);
  border: none;
  border-radius: 0px;
  font-size: 16px;
  cursor: pointer;
}`,
  solutionCSS: `.hero {
  position: relative;
  height: 300px;
  background-color: rgb(30, 30, 30);
}

.hero-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgb(255, 255, 255);
}

.hero-title {
  font-size: 48px;
  font-family: Georgia, serif;
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 18px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.categories-scroll {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
  white-space: nowrap;
  background-color: rgb(245, 245, 245);
}

.category {
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.category.active {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
}

.menu-section {
  max-width: 600px;
  margin: 24px auto;
  padding: 0 20px;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgb(221, 221, 221);
}

.dish-price {
  font-weight: bold;
}

.reservation {
  text-align: center;
  padding: 32px;
}

.reserve-btn {
  padding: 14px 40px;
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}`,
  bugLines: [8, 9, 10, 11, 32, 69, 70, 72],
  tests: [
    {
      id: 'test-hero-centering',
      description: 'Hero text should be absolutely positioned for centering',
      assertions: [
        { selector: '.hero-overlay', property: 'position', expected: 'absolute' },
      ],
    },
    {
      id: 'test-categories-scroll',
      description: 'Categories should scroll horizontally when overflowing',
      assertions: [
        { selector: '.categories-scroll', property: 'overflow-x', expected: 'auto' },
      ],
    },
    {
      id: 'test-reserve-btn',
      description: 'Reservation button should look clickable with dark background and rounded corners',
      assertions: [
        { selector: '.reserve-btn', property: 'background-color', expected: 'rgb(30, 30, 30)' },
        { selector: '.reserve-btn', property: 'color', expected: 'rgb(255, 255, 255)' },
        { selector: '.reserve-btn', property: 'border-top-left-radius', expected: '8px' },
      ],
    },
  ],
}

export default level
