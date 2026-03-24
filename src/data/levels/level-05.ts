import type { Level } from '../../types'

const level: Level = {
  id: 'level-05',
  title: "Fix the Event Page",
  client: {
    name: "EventBright",
    avatar: '',
    brief: "Our event page is a disaster! The banner image overflows, the ticket info isn't aligned properly, and the CTA button is invisible against the background.",
    completionMessage: "The event page looks fantastic! Ticket sales are going to skyrocket.",
    hintMessage: "Check the banner's overflow and object-fit, the ticket section's alignment, and the button colors.",
  },
  difficulty: 4,
  payout: 300,
  prerequisites: ['level-03'],
  html: `<div class="event-page">
  <div class="banner">
    <img class="banner-img" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'><rect fill='%234a90d9' width='800' height='400'/><text x='400' y='200' text-anchor='middle' fill='white' font-size='32'>Summer Music Festival</text></svg>" alt="Event Banner" />
  </div>
  <div class="ticket-section">
    <div class="ticket-info">
      <h2>General Admission</h2>
      <p class="price">$49.99</p>
    </div>
    <button class="cta-btn">Buy Tickets</button>
  </div>
  <div class="details">
    <div class="detail-item">
      <strong>Date</strong>
      <span>July 15, 2026</span>
    </div>
    <div class="detail-item">
      <strong>Location</strong>
      <span>Central Park</span>
    </div>
    <div class="detail-item">
      <strong>Time</strong>
      <span>2:00 PM - 11:00 PM</span>
    </div>
  </div>
</div>`,
  buggyCSS: `.event-page {
  max-width: 700px;
  margin: 0 auto;
}

.banner {
  height: 250px;
  overflow: visible;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ticket-section {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px;
  background-color: rgb(245, 245, 245);
}

.ticket-info h2 {
  margin: 0;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: rgb(51, 51, 51);
}

.cta-btn {
  padding: 12px 32px;
  background-color: rgb(245, 245, 245);
  color: rgb(245, 245, 245);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.details {
  display: flex;
  justify-content: space-around;
  padding: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}`,
  solutionCSS: `.event-page {
  max-width: 700px;
  margin: 0 auto;
}

.banner {
  height: 250px;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ticket-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background-color: rgb(245, 245, 245);
}

.ticket-info h2 {
  margin: 0;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: rgb(51, 51, 51);
}

.cta-btn {
  padding: 12px 32px;
  background-color: rgb(74, 144, 217);
  color: rgb(255, 255, 255);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.details {
  display: flex;
  justify-content: space-around;
  padding: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}`,
  bugLines: [8, 14, 20, 21, 37, 38],
  tests: [
    {
      id: 'test-banner-overflow',
      description: 'Banner should clip overflow and cover the area',
      assertions: [
        { selector: '.banner', property: 'overflow', expected: 'hidden' },
        { selector: '.banner-img', property: 'object-fit', expected: 'cover' },
      ],
    },
    {
      id: 'test-ticket-alignment',
      description: 'Ticket section should space items apart and center vertically',
      assertions: [
        { selector: '.ticket-section', property: 'justify-content', expected: 'space-between' },
        { selector: '.ticket-section', property: 'align-items', expected: 'center' },
      ],
    },
    {
      id: 'test-cta-visible',
      description: 'CTA button should have a blue background with white text',
      assertions: [
        { selector: '.cta-btn', property: 'background-color', expected: 'rgb(74, 144, 217)' },
        { selector: '.cta-btn', property: 'color', expected: 'rgb(255, 255, 255)' },
      ],
    },
  ],
}

export default level
