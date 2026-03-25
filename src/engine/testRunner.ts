import type { Test, TestResult } from '../types'

const COLOR_PROPERTIES = new Set([
  'color',
  'background-color',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
])

const COLOR_TOLERANCE = 60

function parseRgb(value: string): [number, number, number] | null {
  const match = value.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (!match) return null
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

function valuesMatch(property: string, actual: string, expected: string): boolean {
  if (actual === expected) return true

  if (COLOR_PROPERTIES.has(property)) {
    const actualRgb = parseRgb(actual)
    const expectedRgb = parseRgb(expected)
    if (actualRgb && expectedRgb) {
      return colorDistance(actualRgb, expectedRgb) <= COLOR_TOLERANCE
    }
  }

  return false
}

export function runTests(tests: Test[], doc: Document): TestResult[] {
  return tests.map((test) => {
    for (const assertion of test.assertions) {
      const element = doc.querySelector(assertion.selector)
      if (!element) {
        return {
          testId: test.id,
          passed: false,
          failedAssertion: `"${assertion.selector}" — element not found`,
        }
      }

      const computed = doc.defaultView!.getComputedStyle(element)
      const actual = computed.getPropertyValue(assertion.property)

      if (!valuesMatch(assertion.property, actual, assertion.expected)) {
        return {
          testId: test.id,
          passed: false,
          failedAssertion: `"${assertion.selector}" ${assertion.property}: expected "${assertion.expected}", got "${actual}"`,
        }
      }
    }

    return { testId: test.id, passed: true }
  })
}
