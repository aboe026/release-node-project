import path from 'path'

import env from './e2e-env'

export const PackageTarballPath = path.join(env.E2E_TEMP_WORK_DIR, 'release-node-project.tgz')

export default {
  PackageTarballPath,
}
