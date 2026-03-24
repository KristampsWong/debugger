import type { Level } from '../../types'

const level: Level = {
  id: 'level-08',
  title: "Fix the Product Page",
  client: {
    name: "ShopNow",
    avatar: '',
    brief: "Our product page is losing us sales! The image gallery doesn't work, the price is invisible, the 'Add to Cart' button blends into the background, the reviews section is a mess, and the rating stars aren't inline.",
    completionMessage: "Sales are already picking up! You're a CSS wizard.",
    hintMessage: "There are 5 separate issues: gallery flex direction, price color, button styling, review layout, and star display.",
  },
  difficulty: 5,
  payout: 400,
  prerequisites: ['level-05', 'level-06'],
  html: `<div class="product-page">
  <div class="gallery">
    <img class="main-image" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect fill='%23ddd' width='400' height='400'/><text x='200' y='200' text-anchor='middle' fill='%23999' font-size='20'>Product Image</text></svg>" alt="Product" />
    <div class="thumbnails">
      <div class="thumb">1</div>
      <div class="thumb">2</div>
      <div class="thumb">3</div>
    </div>
  </div>
  <div class="product-info">
    <h1 class="product-name">Premium Wireless Headphones</h1>
    <div class="rating">
      <span class="stars">\u2605\u2605\u2605\u2605\u2606</span>
      <span class="review-count">(128 reviews)</span>
    </div>
    <p class="price">$199.99</p>
    <p class="description">High-quality noise-cancelling headphones with 30-hour battery life.</p>
    <button class="add-to-cart">Add to Cart</button>
  </div>
</div>
<div class="reviews-section">
  <h2>Customer Reviews</h2>
  <div class="review">
    <div class="review-header">
      <strong>Jane D.</strong>
      <span class="review-stars">\u2605\u2605\u2605\u2605\u2605</span>
    </div>
    <p class="review-text">Best headphones I've ever owned!</p>
  </div>
  <div class="review">
    <div class="review-header">
      <strong>Mike R.</strong>
      <span class="review-stars">\u2605\u2605\u2605\u2605\u2606</span>
    </div>
    <p class="review-text">Great sound quality, slightly tight fit.</p>
  </div>
</div>`,
  buggyCSS: `.product-page {
  display: flex;
  max-width: 900px;
  margin: 24px auto;
  padding: 20px;
  gap: 32px;
}

.gallery {
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 400px;
}

.main-image {
  width: 100%;
  border-radius: 8px;
}

.thumbnails {
  display: flex;
  gap: 8px;
}

.thumb {
  width: 60px;
  height: 60px;
  background-color: rgb(221, 221, 221);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 24px;
  margin-bottom: 8px;
}

.rating {
  display: block;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stars {
  color: rgb(255, 193, 7);
  font-size: 18px;
}

.price {
  font-size: 28px;
  font-weight: bold;
  color: rgb(255, 255, 255);
  margin-bottom: 12px;
}

.description {
  color: rgb(102, 102, 102);
  margin-bottom: 20px;
  line-height: 1.5;
}

.add-to-cart {
  padding: 14px 32px;
  background-color: rgb(240, 240, 240);
  color: rgb(240, 240, 240);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

.reviews-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.reviews-section h2 {
  margin-bottom: 16px;
}

.review {
  padding: 16px 0;
  border-bottom: 1px solid rgb(221, 221, 221);
}

.review-header {
  display: block;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.review-stars {
  color: rgb(255, 193, 7);
}

.review-text {
  color: rgb(102, 102, 102);
}`,
  solutionCSS: `.product-page {
  display: flex;
  max-width: 900px;
  margin: 24px auto;
  padding: 20px;
  gap: 32px;
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 400px;
}

.main-image {
  width: 100%;
  border-radius: 8px;
}

.thumbnails {
  display: flex;
  gap: 8px;
}

.thumb {
  width: 60px;
  height: 60px;
  background-color: rgb(221, 221, 221);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 24px;
  margin-bottom: 8px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stars {
  color: rgb(255, 193, 7);
  font-size: 18px;
}

.price {
  font-size: 28px;
  font-weight: bold;
  color: rgb(51, 51, 51);
  margin-bottom: 12px;
}

.description {
  color: rgb(102, 102, 102);
  margin-bottom: 20px;
  line-height: 1.5;
}

.add-to-cart {
  padding: 14px 32px;
  background-color: rgb(74, 144, 217);
  color: rgb(255, 255, 255);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

.reviews-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.reviews-section h2 {
  margin-bottom: 16px;
}

.review {
  padding: 16px 0;
  border-bottom: 1px solid rgb(221, 221, 221);
}

.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.review-stars {
  color: rgb(255, 193, 7);
}

.review-text {
  color: rgb(102, 102, 102);
}`,
  bugLines: [11, 42, 54, 63, 64, 85],
  tests: [
    {
      id: 'test-gallery-column',
      description: 'Gallery should stack image and thumbnails vertically',
      assertions: [
        { selector: '.gallery', property: 'flex-direction', expected: 'column' },
      ],
    },
    {
      id: 'test-rating-inline',
      description: 'Rating stars and review count should be inline (flex)',
      assertions: [
        { selector: '.rating', property: 'display', expected: 'flex' },
      ],
    },
    {
      id: 'test-price-visible',
      description: 'Price should be visible (dark text)',
      assertions: [
        { selector: '.price', property: 'color', expected: 'rgb(51, 51, 51)' },
      ],
    },
    {
      id: 'test-cart-button',
      description: 'Add to Cart button should be blue with white text',
      assertions: [
        { selector: '.add-to-cart', property: 'background-color', expected: 'rgb(74, 144, 217)' },
        { selector: '.add-to-cart', property: 'color', expected: 'rgb(255, 255, 255)' },
      ],
    },
    {
      id: 'test-review-header',
      description: 'Review header should display name and stars inline',
      assertions: [
        { selector: '.review-header', property: 'display', expected: 'flex' },
      ],
    },
  ],
}

export default level
