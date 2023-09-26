import { addCategoryToDescription, getDescription, ReleaseNoteCategory } from '../../src/release-description'

describe('Release Description', () => {
  describe('getDescription', () => {
    it('throws error if release note for version does not exist', () => {
      const version = '1.0.0'
      expect(() =>
        getDescription({
          notes: [],
          version,
        })
      ).toThrow(`The release notes do not contain a release for version "${version}": "[]"`)
    })
    it('returns empty string if release only has version field', () => {
      const version = '1.0.0'
      expect(
        getDescription({
          notes: [
            {
              version,
            },
          ],
          version,
        })
      ).toEqual('')
    })
    it('returns string with description if release only has version and description fields', () => {
      const version = '1.0.0'
      const description = "I am a description (or so I'm told)"
      expect(
        getDescription({
          notes: [
            {
              version,
              description,
            },
          ],
          version,
        })
      ).toEqual([description, '', '---', '', ''].join('\n'))
    })
    it('returns string with single breaking change if release only has version and breaking fields', () => {
      const version = '1.0.0'
      const breaking = ['Authentication no longer works with username and password, access token required']
      expect(
        getDescription({
          notes: [
            {
              version,
              breaking,
            },
          ],
          version,
        })
      ).toEqual(['**Breaking Changes**', `* ${breaking[0]}`, '', ''].join('\n'))
    })
    it('returns string with multiple breaking changes if release only has version and breaking fields', () => {
      const version = '1.0.0'
      const breaking = ['whoopsy', 'daisy']
      expect(
        getDescription({
          notes: [
            {
              version,
              breaking,
            },
          ],
          version,
        })
      ).toEqual(['**Breaking Changes**', `* ${breaking[0]}`, `* ${breaking[1]}`, '', ''].join('\n'))
    })
    it('returns string with single feature if release only has version and features fields', () => {
      const version = '1.0.0'
      const features = ['Can run requests in parallel']
      expect(
        getDescription({
          notes: [
            {
              version,
              features,
            },
          ],
          version,
        })
      ).toEqual(['**New Features**', `* ${features[0]}`, '', ''].join('\n'))
    })
    it('returns string with multiple features if release only has version and features fields', () => {
      const version = '1.0.0'
      const features = ['shiny', 'useful']
      expect(
        getDescription({
          notes: [
            {
              version,
              features,
            },
          ],
          version,
        })
      ).toEqual(['**New Features**', `* ${features[0]}`, `* ${features[1]}`, '', ''].join('\n'))
    })
    it('returns string with single fix if release only has version and fixes fields', () => {
      const version = '1.0.0'
      const fixes = ['Redacts user password from error text']
      expect(
        getDescription({
          notes: [
            {
              version,
              fixes,
            },
          ],
          version,
        })
      ).toEqual(['**Bug Fixes**', `* ${fixes[0]}`, '', ''].join('\n'))
    })
    it('returns string with multiple fixes if release only has version and fixes fields', () => {
      const version = '1.0.0'
      const fixes = ['working', 'better']
      expect(
        getDescription({
          notes: [
            {
              version,
              fixes,
            },
          ],
          version,
        })
      ).toEqual(['**Bug Fixes**', `* ${fixes[0]}`, `* ${fixes[1]}`, '', ''].join('\n'))
    })
    it('returns string with build branch if buildBranch provided', () => {
      const version = '1.0.0'
      const buildBranch = 'main'
      expect(
        getDescription({
          notes: [
            {
              version,
            },
          ],
          version,
          buildBranch,
        })
      ).toEqual(['---', '', 'Additional Information', `* Build Branch: ${buildBranch}`].join('\n'))
    })
    it('returns string with build number if buildNumber provided', () => {
      const version = '1.0.0'
      const buildNumber = '3'
      expect(
        getDescription({
          notes: [
            {
              version,
            },
          ],
          version,
          buildNumber,
        })
      ).toEqual(['---', '', 'Additional Information', `* Build Number: ${buildNumber}`].join('\n'))
    })
    it('returns correct string if everything provided', () => {
      const version = '1.0.0'
      const description = 'All things provided'
      const breaking = ['redone', 'uncompatible']
      const features = ['easy', 'helpful']
      const fixes = ['mistake', 'patched']
      const buildBranch = '1.0.0'
      const buildNumber = '7'
      expect(
        getDescription({
          notes: [
            {
              version,
              description,
              breaking,
              features,
              fixes,
            },
          ],
          version,
          buildBranch,
          buildNumber,
        })
      ).toEqual(
        [
          description,
          '',
          '---',
          '',
          '**Breaking Changes**',
          `* ${breaking[0]}`,
          `* ${breaking[1]}`,
          '',
          '**New Features**',
          `* ${features[0]}`,
          `* ${features[1]}`,
          '',
          '**Bug Fixes**',
          `* ${fixes[0]}`,
          `* ${fixes[1]}`,
          '',
          '---',
          '',
          'Additional Information',
          `* Build Branch: ${buildBranch}`,
          `* Build Number: ${buildNumber}`,
        ].join('\n')
      )
    })
  })

  describe('addCategoryToDescription', () => {
    it('returns empty string for breaking if release notes do not contain types', () => {
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
          },
          category: ReleaseNoteCategory.Breaking,
        })
      ).toEqual('')
    })
    it('returns empty string for features if release notes do not contain types', () => {
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
          },
          category: ReleaseNoteCategory.Feature,
        })
      ).toEqual('')
    })
    it('returns empty string for fixes if release notes do not contain types', () => {
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
          },
          category: ReleaseNoteCategory.Fix,
        })
      ).toEqual('')
    })
    it('returns single breaking category', () => {
      const breaking = ['oops']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            breaking,
          },
          category: ReleaseNoteCategory.Breaking,
        })
      ).toEqual(['**Breaking Changes**', `* ${breaking[0]}`, '', ''].join('\n'))
    })
    it('returns single feature category', () => {
      const features = ['new']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            features,
          },
          category: ReleaseNoteCategory.Feature,
        })
      ).toEqual(['**New Features**', `* ${features[0]}`, '', ''].join('\n'))
    })
    it('returns single fix category', () => {
      const fixes = ['patched']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            fixes,
          },
          category: ReleaseNoteCategory.Fix,
        })
      ).toEqual(['**Bug Fixes**', `* ${fixes[0]}`, '', ''].join('\n'))
    })
    it('returns multiple breaking category', () => {
      const breaking = ['oops', 'incompatible']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            breaking,
          },
          category: ReleaseNoteCategory.Breaking,
        })
      ).toEqual(['**Breaking Changes**', `* ${breaking[0]}`, `* ${breaking[1]}`, '', ''].join('\n'))
    })
    it('returns multiple feature category', () => {
      const features = ['new', 'shiny']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            features,
          },
          category: ReleaseNoteCategory.Feature,
        })
      ).toEqual(['**New Features**', `* ${features[0]}`, `* ${features[1]}`, '', ''].join('\n'))
    })
    it('returns multiple fix category', () => {
      const fixes = ['patched', 'working']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            fixes,
          },
          category: ReleaseNoteCategory.Fix,
        })
      ).toEqual(['**Bug Fixes**', `* ${fixes[0]}`, `* ${fixes[1]}`, '', ''].join('\n'))
    })
    it('returns breaking category when all defined', () => {
      const breaking = ['oops']
      const features = ['new']
      const fixes = ['patched']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            breaking,
            features,
            fixes,
          },
          category: ReleaseNoteCategory.Breaking,
        })
      ).toEqual(['**Breaking Changes**', `* ${breaking[0]}`, '', ''].join('\n'))
    })
    it('returns feature category when all defined', () => {
      const breaking = ['oops']
      const features = ['new']
      const fixes = ['patched']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            breaking,
            features,
            fixes,
          },
          category: ReleaseNoteCategory.Feature,
        })
      ).toEqual(['**New Features**', `* ${features[0]}`, '', ''].join('\n'))
    })
    it('returns fix category when all defined', () => {
      const breaking = ['oops']
      const features = ['new']
      const fixes = ['patched']
      expect(
        addCategoryToDescription({
          release: {
            version: '1.0.0',
            breaking,
            features,
            fixes,
          },
          category: ReleaseNoteCategory.Fix,
        })
      ).toEqual(['**Bug Fixes**', `* ${fixes[0]}`, '', ''].join('\n'))
    })
  })
})
