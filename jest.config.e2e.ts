import type { Config } from 'jest'

import config from './jest.config'

const e2eConfig: Config = {
  collectCoverage: false, // since E2E is run against built code, there will never be source code to check coverage against
  globalSetup: './test/e2e/util/_global_setup.ts',
  setupFilesAfterEnv: ['./test/e2e/util/_suite_setup_teardown.ts'],
  testTimeout: 60000,
}

export default {
  ...config,
  ...e2eConfig,
}
