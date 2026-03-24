import type { Level } from '../../types'

const level: Level = {
  id: 'level-04',
  title: "Fix the Blog Typography",
  client: {
    name: "TechBlog Daily",
    avatar: '',
    brief: "Our blog posts look terrible. The headings are too small, paragraphs have no spacing, and the code blocks don't stand out at all.",
    completionMessage: "Readers can finally enjoy our articles. Great work!",
    hintMessage: "Focus on font-size for headings, margin for paragraphs, and background for code blocks.",
  },
  difficulty: 3,
  payout: 200,
  prerequisites: ['level-02'],
  html: `<article class="post">
  <h1 class="post-title">Understanding CSS Specificity</h1>
  <p class="post-meta">Posted on March 15, 2026</p>
  <p class="post-body">CSS specificity determines which styles are applied when multiple rules target the same element.</p>
  <pre class="code-block">
.parent .child { color: blue; }
.child { color: red; }
  </pre>
  <p class="post-body">In this case, the first rule wins because it has higher specificity.</p>
</article>`,
  buggyCSS: `.post {
  max-width: 680px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: Georgia, serif;
  line-height: 1.6;
}

.post-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.post-meta {
  color: rgb(153, 153, 153);
  font-size: 14px;
  margin-bottom: 24px;
}

.post-body {
  margin-bottom: 0px;
  font-size: 16px;
  color: rgb(51, 51, 51);
}

.code-block {
  background-color: rgb(255, 255, 255);
  padding: 0px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  overflow-x: auto;
  margin-bottom: 16px;
}`,
  solutionCSS: `.post {
  max-width: 680px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: Georgia, serif;
  line-height: 1.6;
}

.post-title {
  font-size: 32px;
  margin-bottom: 8px;
}

.post-meta {
  color: rgb(153, 153, 153);
  font-size: 14px;
  margin-bottom: 24px;
}

.post-body {
  margin-bottom: 16px;
  font-size: 16px;
  color: rgb(51, 51, 51);
}

.code-block {
  background-color: rgb(245, 245, 245);
  padding: 16px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  overflow-x: auto;
  margin-bottom: 16px;
}`,
  bugLines: [10, 11, 22, 28, 29],
  tests: [
    {
      id: 'test-title-size',
      description: 'Post title should be large (32px)',
      assertions: [
        { selector: '.post-title', property: 'font-size', expected: '32px' },
      ],
    },
    {
      id: 'test-body-spacing',
      description: 'Paragraphs should have bottom margin (16px)',
      assertions: [
        { selector: '.post-body', property: 'margin-bottom', expected: '16px' },
      ],
    },
    {
      id: 'test-code-block',
      description: 'Code block should have a gray background and padding',
      assertions: [
        { selector: '.code-block', property: 'background-color', expected: 'rgb(245, 245, 245)' },
        { selector: '.code-block', property: 'padding-top', expected: '16px' },
      ],
    },
  ],
}

export default level
