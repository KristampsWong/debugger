import type { Level } from '../../types'

const level: Level = {
  id: 'level-06',
  title: "Fix the Dashboard Layout",
  client: {
    name: "DataDash Corp",
    avatar: '',
    brief: "Our analytics dashboard is broken. The sidebar should be on the left, the cards should be in a 2-column grid, and the notification badge is hidden behind other elements.",
    completionMessage: "The dashboard is working perfectly now. Our team can finally track metrics!",
    hintMessage: "The main layout needs grid, the cards need grid columns, and the badge needs a higher z-index.",
  },
  difficulty: 4,
  payout: 300,
  prerequisites: ['level-03'],
  html: `<div class="dashboard">
  <aside class="sidebar">
    <h2>DataDash</h2>
    <nav>
      <a href="#" class="nav-item active">Overview</a>
      <a href="#" class="nav-item">Analytics</a>
      <a href="#" class="nav-item">Reports</a>
    </nav>
  </aside>
  <main class="content">
    <div class="top-bar">
      <h1>Overview</h1>
      <div class="notification-wrapper">
        <span class="bell">Bell</span>
        <span class="badge">3</span>
      </div>
    </div>
    <div class="card-grid">
      <div class="stat-card">
        <h3>Users</h3>
        <p class="stat-value">12,345</p>
      </div>
      <div class="stat-card">
        <h3>Revenue</h3>
        <p class="stat-value">$84,230</p>
      </div>
      <div class="stat-card">
        <h3>Orders</h3>
        <p class="stat-value">1,847</p>
      </div>
      <div class="stat-card">
        <h3>Growth</h3>
        <p class="stat-value">+23%</p>
      </div>
    </div>
  </main>
</div>`,
  buggyCSS: `.dashboard {
  display: block;
  min-height: 100vh;
}

.sidebar {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  padding: 20px;
  width: 220px;
}

.sidebar h2 {
  margin-bottom: 24px;
}

.nav-item {
  display: block;
  color: rgb(170, 170, 170);
  padding: 8px 12px;
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 4px;
}

.nav-item.active {
  background-color: rgb(74, 144, 217);
  color: rgb(255, 255, 255);
}

.content {
  padding: 24px;
  flex: 1;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.notification-wrapper {
  position: relative;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: rgb(231, 76, 60);
  color: rgb(255, 255, 255);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 0;
}

.card-grid {
  display: block;
  gap: 16px;
}

.stat-card {
  background-color: rgb(245, 245, 245);
  border-radius: 12px;
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
}`,
  solutionCSS: `.dashboard {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.sidebar {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  padding: 20px;
  width: 220px;
}

.sidebar h2 {
  margin-bottom: 24px;
}

.nav-item {
  display: block;
  color: rgb(170, 170, 170);
  padding: 8px 12px;
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 4px;
}

.nav-item.active {
  background-color: rgb(74, 144, 217);
  color: rgb(255, 255, 255);
}

.content {
  padding: 24px;
  flex: 1;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.notification-wrapper {
  position: relative;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: rgb(231, 76, 60);
  color: rgb(255, 255, 255);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 10;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: rgb(245, 245, 245);
  border-radius: 12px;
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
}`,
  bugLines: [2, 55, 58, 59],
  tests: [
    {
      id: 'test-dashboard-layout',
      description: 'Dashboard should use grid with sidebar and content columns',
      assertions: [
        { selector: '.dashboard', property: 'display', expected: 'grid' },
        { selector: '.dashboard', property: 'grid-template-columns', expected: '220px 1fr' },
      ],
    },
    {
      id: 'test-badge-visible',
      description: 'Notification badge should appear above other elements (z-index)',
      assertions: [
        { selector: '.badge', property: 'z-index', expected: '10' },
      ],
    },
    {
      id: 'test-card-grid',
      description: 'Stat cards should be in a 2-column grid',
      assertions: [
        { selector: '.card-grid', property: 'display', expected: 'grid' },
        { selector: '.card-grid', property: 'grid-template-columns', expected: 'repeat(2, 1fr)' },
      ],
    },
  ],
}

export default level
