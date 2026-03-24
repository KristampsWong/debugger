import type { Level } from '../../types'

const level: Level = {
  id: 'level-02',
  title: "Fix the Layout",
  client: {
    name: "Flex Fitness",
    avatar: '',
    brief: "Our class schedule page is a mess. The cards should be in a row, not stacked on top of each other. And the header is supposed to stick to the top!",
    completionMessage: "Now our members can actually find their classes. Much appreciated!",
    hintMessage: "Check the container's display property and the header's position.",
  },
  difficulty: 2,
  payout: 150,
  prerequisites: ['level-01'],
  html: `<header class="header">
  <h1>Flex Fitness</h1>
</header>
<div class="card-container">
  <div class="card">
    <h3>Yoga</h3>
    <p>Mon/Wed 9am</p>
  </div>
  <div class="card">
    <h3>HIIT</h3>
    <p>Tue/Thu 6pm</p>
  </div>
  <div class="card">
    <h3>Spin</h3>
    <p>Fri 7am</p>
  </div>
</div>`,
  buggyCSS: `.header {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  padding: 16px;
  text-align: center;
  position: relative;
  top: auto;
  width: 100%;
}

.card-container {
  display: block;
  padding: 20px;
  gap: 16px;
  margin-top: 80px;
}

.card {
  background-color: rgb(245, 245, 245);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  flex: 1;
}`,
  solutionCSS: `.header {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  padding: 16px;
  text-align: center;
  position: fixed;
  top: 0px;
  width: 100%;
}

.card-container {
  display: flex;
  padding: 20px;
  gap: 16px;
  margin-top: 80px;
}

.card {
  background-color: rgb(245, 245, 245);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  flex: 1;
}`,
  bugLines: [6, 7, 12],
  tests: [
    {
      id: 'test-header-fixed',
      description: 'Header should be fixed to the top of the page',
      assertions: [
        { selector: '.header', property: 'position', expected: 'fixed' },
        { selector: '.header', property: 'top', expected: '0px' },
      ],
    },
    {
      id: 'test-cards-flex',
      description: 'Cards should be displayed in a horizontal row',
      assertions: [
        { selector: '.card-container', property: 'display', expected: 'flex' },
      ],
    },
  ],
}

export default level
