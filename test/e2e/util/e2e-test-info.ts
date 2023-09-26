export const E2eTests: E2eTests = {}

export function getTestName(): string {
  return expect.getState().currentTestName || ''
}

interface E2eTests {
  [key: string]: {
    id: string
    directory: string
  }
}
