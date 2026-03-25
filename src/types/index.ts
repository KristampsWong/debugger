// --- Level Data ---

export interface Assertion {
  selector: string
  property: string
  expected: string
}

export interface Test {
  id: string
  description: string
  assertions: Assertion[]
}

export interface Level {
  id: string
  title: string
  client: {
    name: string
    avatar: string
    brief: string
    completionMessage: string
    hintMessage?: string
  }
  difficulty: 1 | 2 | 3 | 4 | 5
  payout: number
  prerequisites: string[]
  html: string
  buggyCSS: string
  solutionCSS: string
  bugLines: number[]
  tests: Test[]
}

// --- Store Types ---

export interface TestResult {
  testId: string
  passed: boolean
  failedAssertion?: string
}

export type ToolId =
  | 'syntax-highlighter'
  | 'bug-detector'
  | 'property-hint'
  | 'solution-peek'
  | 'solution-preview'
  | 'css-reference'
  | 'client-call'

export interface ShopItem {
  id: ToolId
  name: string
  description: string
  price: number
  consumable: boolean
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'syntax-highlighter',
    name: 'Syntax Highlighter+',
    description: 'Enables CSS autocomplete and hover info in the editor.',
    price: 50,
    consumable: false,
  },
  {
    id: 'bug-detector',
    name: 'Bug Detector',
    description: 'Highlights lines that contain bugs with yellow gutter markers.',
    price: 150,
    consumable: false,
  },
  {
    id: 'property-hint',
    name: 'Property Hint',
    description: 'Reveals which CSS properties the failing tests are checking.',
    price: 150,
    consumable: false,
  },
  {
    id: 'solution-peek',
    name: 'Solution Peek',
    description: 'Shows the correct value for one failing assertion. Single use.',
    price: 100,
    consumable: true,
  },
  {
    id: 'client-call',
    name: 'Client Call',
    description: 'Reveals an extra hint from the client about what\'s wrong.',
    price: 50,
    consumable: false,
  },
  {
    id: 'solution-preview',
    name: 'Solution Preview',
    description: 'See the correct result side-by-side with your preview.',
    price: 100,
    consumable: false,
  },
  {
    id: 'css-reference',
    name: 'CSS Reference',
    description: 'Look up CSS property docs without leaving the game.',
    price: 75,
    consumable: false,
  },
]
