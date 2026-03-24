import type { Level } from '../../types'

const level: Level = {
  id: 'level-01',
  title: "Fix the Menu Colors",
  client: {
    name: "Bob's Bakery",
    avatar: '',
    brief: "Help! I just launched my bakery website but the text colors are all wrong. My customers can't read the menu!",
    completionMessage: "The menu looks perfect now! Thanks a bunch, here's your payment.",
    hintMessage: "I think the heading and the menu items have the wrong colors.",
  },
  difficulty: 1,
  payout: 100,
  prerequisites: [],
  html: `<div class="bakery">
  <h1 class="title">Bob's Bakery</h1>
  <ul class="menu">
    <li class="menu-item">Croissant - $3.50</li>
    <li class="menu-item">Sourdough Loaf - $6.00</li>
    <li class="menu-item">Cinnamon Roll - $4.00</li>
  </ul>
  <p class="footer">Open daily 7am - 5pm</p>
</div>`,
  buggyCSS: `.bakery {
  font-family: Georgia, serif;
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  background-color: rgb(255, 248, 240);
}

.title {
  color: rgb(255, 248, 240);
  text-align: center;
  margin-bottom: 16px;
}

.menu {
  list-style: none;
  padding: 0;
}

.menu-item {
  padding: 8px 0;
  color: rgb(255, 248, 240);
  border-bottom: 1px solid rgb(221, 204, 187);
}

.footer {
  text-align: center;
  color: rgb(153, 119, 85);
  margin-top: 16px;
  font-size: 14px;
}`,
  solutionCSS: `.bakery {
  font-family: Georgia, serif;
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  background-color: rgb(255, 248, 240);
}

.title {
  color: rgb(139, 90, 43);
  text-align: center;
  margin-bottom: 16px;
}

.menu {
  list-style: none;
  padding: 0;
}

.menu-item {
  padding: 8px 0;
  color: rgb(51, 51, 51);
  border-bottom: 1px solid rgb(221, 204, 187);
}

.footer {
  text-align: center;
  color: rgb(153, 119, 85);
  margin-top: 16px;
  font-size: 14px;
}`,
  bugLines: [10, 23],
  tests: [
    {
      id: 'test-title-color',
      description: 'Title text should be visible (dark brown)',
      assertions: [
        { selector: '.title', property: 'color', expected: 'rgb(139, 90, 43)' },
      ],
    },
    {
      id: 'test-menu-color',
      description: 'Menu items should be readable (dark text)',
      assertions: [
        { selector: '.menu-item', property: 'color', expected: 'rgb(51, 51, 51)' },
      ],
    },
  ],
}

export default level
