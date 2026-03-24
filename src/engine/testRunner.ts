import type { Test, TestResult } from '../types'

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

      if (actual !== assertion.expected) {
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
