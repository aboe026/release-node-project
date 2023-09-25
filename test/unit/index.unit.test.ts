import yargs from 'yargs' // eslint-disable-line @typescript-eslint/no-unused-vars

const error = 'whoopsy daisy'

jest.mock('yargs', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    scriptName: jest.fn().mockReturnValue({
      command: jest.fn().mockReturnValue({
        command: jest.fn().mockReturnValue({
          env: jest.fn().mockReturnValue({
            argv: new Promise((resolve, reject) => {
              reject(error)
            }),
          }),
        }),
      }),
    }),
  }),
}))

describe('Index', () => {
  it('prints error and exits with unsuccessful code', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation()
    await jest.isolateModules(async () => {
      await import('../../src/index')
    })
    await new Promise((resolve) => setTimeout(resolve, 10)) // need explicit sleep here because isolateModules does not await thrown error :/
    expect(consoleErrorSpy.mock.calls).toEqual([[error]])
    expect(exitSpy.mock.calls).toEqual([[1]])
  }, 10000) // for some reason this failed in CI with the default timeout
})
