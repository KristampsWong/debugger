import type { Level } from '../../types'

const level: Level = {
  id: 'level-03',
  title: "Fix the Portfolio Grid",
  client: {
    name: "Pixel Portfolio",
    avatar: '',
    brief: "I'm a photographer and my portfolio grid is broken. The images should be in a nice grid, the nav links need proper spacing, and my bio section is invisible for some reason!",
    completionMessage: "My portfolio finally looks professional! Great debugging work.",
    hintMessage: "There are three separate problems: the grid layout, the nav link spacing, and the bio section visibility.",
  },
  difficulty: 3,
  payout: 200,
  prerequisites: ['level-02'],
  html: `<nav class="nav">
  <a class="nav-link" href="#">Home</a>
  <a class="nav-link" href="#">Gallery</a>
  <a class="nav-link" href="#">Contact</a>
</nav>
<section class="bio">
  <h2>About Me</h2>
  <p>Capturing moments since 2015.</p>
</section>
<div class="gallery">
  <div class="photo">Photo 1</div>
  <div class="photo">Photo 2</div>
  <div class="photo">Photo 3</div>
  <div class="photo">Photo 4</div>
  <div class="photo">Photo 5</div>
  <div class="photo">Photo 6</div>
</div>`,
  buggyCSS: `.nav {
  display: flex;
  background-color: rgb(30, 30, 30);
  padding: 12px;
}

.nav-link {
  color: rgb(255, 255, 255);
  text-decoration: none;
  margin-right: 0px;
  padding: 8px 0px;
}

.bio {
  padding: 20px;
  text-align: center;
  display: none;
}

.gallery {
  display: block;
  gap: 12px;
  padding: 20px;
}

.photo {
  background-color: rgb(221, 221, 221);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}`,
  solutionCSS: `.nav {
  display: flex;
  background-color: rgb(30, 30, 30);
  padding: 12px;
}

.nav-link {
  color: rgb(255, 255, 255);
  text-decoration: none;
  margin-right: 24px;
  padding: 8px 16px;
}

.bio {
  padding: 20px;
  text-align: center;
  display: block;
}

.gallery {
  display: grid;
  gap: 12px;
  padding: 20px;
  grid-template-columns: repeat(3, 1fr);
}

.photo {
  background-color: rgb(221, 221, 221);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}`,
  bugLines: [10, 11, 17, 21],
  tests: [
    {
      id: 'test-nav-spacing',
      description: 'Nav links should have horizontal spacing between them',
      assertions: [
        { selector: '.nav-link', property: 'margin-right', expected: '24px' },
        { selector: '.nav-link', property: 'padding-left', expected: '16px' },
      ],
    },
    {
      id: 'test-bio-visible',
      description: 'Bio section should be visible',
      assertions: [
        { selector: '.bio', property: 'display', expected: 'block' },
      ],
    },
    {
      id: 'test-gallery-grid',
      description: 'Gallery should use CSS Grid with 3 columns',
      assertions: [
        { selector: '.gallery', property: 'display', expected: 'grid' },
        { selector: '.gallery', property: 'grid-template-columns', expected: 'repeat(3, 1fr)' },
      ],
    },
  ],
}

export default level
