import { hideBin } from 'yargs/helpers'
import yargs from 'yargs'

import LintReleaseNotes from './lint-release-notes'
import ReleaseGitHub from './release-github'

/**
 * The entrypoint of the CLI
 */
;(async () => {
  try {
    await yargs(hideBin(process.argv))
      .scriptName('release-node-project')
      .command(LintReleaseNotes.getCommand())
      .command(ReleaseGitHub.getCommand())
      .env('RELEASE_NODE_PROJECT').argv
  } catch (err: unknown) {
    console.error(err)
    process.exit(1)
  }
})()
