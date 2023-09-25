import type { Config } from 'jest'

const config: Config = {
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/build', './test/e2e/.temp-work-dir'],
  preset: 'ts-jest',
  resetMocks: true,
  restoreMocks: true,
  testEnvironment: 'node',
  testTimeout: 10000,
}

const testSuiteName: string | undefined = process.env.TEST_RESULT_NAME
if (testSuiteName) {
  config.collectCoverage = true
  config.collectCoverageFrom = ['src/**/*']
  config.coverageReporters = ['json', 'lcov', 'cobertura']
  config.reporters = [
    'default',
    [
      'jest-junit',
      {
        ancestorSeparator: ' - ',
        classNameTemplate: `${testSuiteName}.{classname}`,
        outputDirectory: 'test-results',
        outputName: `${testSuiteName}.xml`,
        titleTemplate: '{title}',
      },
    ],
  ]
}

export default config
