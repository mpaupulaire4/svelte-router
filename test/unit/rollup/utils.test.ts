import type { Dirent } from 'fs'

import { mocked } from 'ts-jest/utils'
import { createFolderParser } from '../../../rollup/utils'
import fs from 'fs'

jest.mock('fs')

const mFS = mocked(fs, true)

function dirent(name: string, file: boolean = true): Dirent {
  return {
    name,
    isDirectory: () => !file,
    isFile: () => file,
    isFIFO: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }
}


describe('file system parser', () => {
  it('should do something', () => {
    mFS.readdirSync.mockReturnValueOnce([dirent('Somthing.svelte')])
    console.log(createFolderParser(['.svelte'])('/'))

  })
})
