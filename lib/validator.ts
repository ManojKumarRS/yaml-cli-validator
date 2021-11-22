import { readFileSync } from 'fs'
import { resolve } from 'path'
import { load, YAMLException } from 'js-yaml'
import { cyan, green, magenta, red } from 'colorette'
import {getFilesInDirectory} from "./utils/fileUtils";

export type ValidatorParams = {
  relative?: boolean
}

type Mark = {
  name: string | null
  buffer: string
  position: number
  line: number
  column: number
  snippet: string
}

export type Error = {
  file: string
  reason: string
  mark: Mark
}

function validateNestedYamls(file: string, loadedYaml: Record<string, any>): Error[] {
  const errors: Error[] = []

  Object.entries(loadedYaml).forEach(([key, value]) => {
    if (typeof value === 'object') {
      errors.push(...validateNestedYamls(file, value))
    }
    if (key.includes('.yml') || key.includes('.yaml')) {
      try {
        load(value)
      } catch (err: any) {
        const yamlException: YAMLException = err
        const error: Error = {
          file: `${file} -> ${key}`,
          reason: yamlException.reason,
          mark: yamlException.mark,
        }
        errors.push(error)
      }
    }
  })
  return errors
}

function processFiles(directoryPath: string, directoryFiles: string[], isRelative: boolean): Error[] {
  const cwd = process.cwd()
  const errors: Error[] = []

  for (const file of directoryFiles) {
    const resolvedPath = isRelative ? resolve(cwd, directoryPath, file) : resolve(directoryPath, file)

    console.log(`Validating ${green(resolvedPath)}`)

    try {
      const loadedYaml = load(readFileSync(resolvedPath, 'utf8')) as Record<string, any>
      const nestedYamlErrors = validateNestedYamls(resolvedPath, loadedYaml)
      errors.push(...nestedYamlErrors)
    } catch (err: any) {
      const yamlException: YAMLException = err
      const error: Error = {
        file: resolvedPath,
        reason: yamlException.reason,
        mark: yamlException.mark,
      }
      errors.push(error)
    }
  }
  return errors
}

function processDirectory(parentDirectory: string, isRelative: boolean): Error[] {
  const cwd = process.cwd()
  const dirContent = getFilesInDirectory(parentDirectory)
  const errors: Error[] = []

  const fileErrors = processFiles(parentDirectory, dirContent.files, isRelative)
  errors.push(...fileErrors)
  for (const childDirectory of dirContent.directories) {
    const resolvedDirectoryPath = isRelative
      ? resolve(cwd, parentDirectory, childDirectory)
      : resolve(parentDirectory, childDirectory)
    const dirErrors = processDirectory(resolvedDirectoryPath, isRelative)
    errors.push(...dirErrors)
  }

  return errors
}

export function validateRecursively(combinedPaths: string, params: ValidatorParams): void {
  const paths = combinedPaths.split(';')
  const errors: Error[] = []

  for (const path of paths) {
    console.log(`Directory ${path}`)
    const dirErrors = processDirectory(path, params.relative ?? false)
    errors.push(...dirErrors)
  }

  console.log(`//////////////////////////////`)
  console.log(magenta(`Validation result:`))
  if (errors.length === 0) {
    console.log(green(`All files are valid!`))
  }
  errors.forEach((err) => {
    console.log(`Invalid file: ${cyan(err.file)}`)
    console.log(`Error: ${red(err.reason)}`)
    console.log(`Snippet: ${cyan(JSON.stringify(err.mark.snippet))}`)
    console.log(`Position: column ${cyan(err.mark.column)}, line ${cyan(err.mark.line)}`)
    console.log('\n')
  })
}
