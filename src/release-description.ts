import ReleaseNote from './release-note'

export enum ReleaseNoteCategory {
  /* Changes that potentially break existing use cases */
  Breaking = 'breaking',
  /* New functionality */
  Feature = 'features',
  /* Bugs that have been resolved */
  Fix = 'fixes',
}

/**
 * Get a description of a release in Markdown format
 *
 * @param params The parameters defining the release
 * @returns The description of a release in Markdown format
 */
export function getDescription({
  notes,
  version,
  buildBranch,
  buildNumber,
}: {
  notes: ReleaseNote[]
  version: string
  buildBranch?: string
  buildNumber?: string
}): string {
  const release: ReleaseNote | undefined = notes.find((note) => note.version === version)
  if (!release) {
    throw Error(`The release notes do not contain a release for version "${version}": "${JSON.stringify(notes)}"`)
  }
  let description = ''
  if (release.description) {
    description += `${release.description}\n\n---\n\n`
  }
  description += addCategoryToDescription({
    release,
    category: ReleaseNoteCategory.Breaking,
  })
  description += addCategoryToDescription({
    release,
    category: ReleaseNoteCategory.Feature,
  })
  description += addCategoryToDescription({
    release,
    category: ReleaseNoteCategory.Fix,
  })
  if (buildBranch || buildNumber) {
    description += `---\n\nAdditional Information`
    if (buildBranch) {
      description += `\n* Build Branch: ${buildBranch}`
    }
    if (buildNumber) {
      description += `\n* Build Number: ${buildNumber}`
    }
  }
  return description
}

/**
 * Adds a potential type of detail to a release note
 *
 * @param params The release not and type of note
 * @returns The additional detail of the release as a string
 */
export function addCategoryToDescription({
  release,
  category,
}: {
  release: ReleaseNote
  category: ReleaseNoteCategory
}): string {
  let description = ''
  const notes = release[category]
  if (notes && notes.length > 0) {
    if (category === ReleaseNoteCategory.Breaking) {
      description += '**Breaking Changes**\n'
    } else if (category === ReleaseNoteCategory.Feature) {
      description += '**New Features**\n'
    } else if (category === ReleaseNoteCategory.Fix) {
      description += '**Bug Fixes**\n'
    }
    for (const note of notes) {
      description += `* ${note}\n`
    }
    description += '\n'
  }
  return description
}
