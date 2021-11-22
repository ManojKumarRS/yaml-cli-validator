import {readFileSync, writeFileSync} from 'fs'
import {resolve} from 'path'
import { load, dump, DumpOptions } from 'js-yaml'
import {green} from 'colorette'
import {getFilesInDirectory} from "./utils/fileUtils";

export type FormatterParams = {
    relative?: boolean
}

const options: DumpOptions = {
    sortKeys: true
}

function formatNestedYamls(file: string, loadedYaml: Record<string, any>): Error[] {
    const errors: Error[] = []

    Object.entries(loadedYaml).forEach(([key, value]) => {
        if (typeof value === 'object') {
            formatNestedYamls(file, value)
        }
        if (key.includes('.yml') || key.includes('.yaml')) {
            const loadedValue = load(value)
            loadedYaml[key] = dump(loadedValue, options)
        }
    })
    return errors
}

function processFiles(directoryPath: string, directoryFiles: string[], isRelative: boolean): void {
    const cwd = process.cwd()

    for (const file of directoryFiles) {
        const resolvedPath = isRelative ? resolve(cwd, directoryPath, file) : resolve(directoryPath, file)

        console.log(`Formatting ${green(resolvedPath)}`)
        const loadedYaml = load(readFileSync(resolvedPath, 'utf8')) as Record<string, any>
        formatNestedYamls(resolvedPath, loadedYaml)
        writeFileSync(resolvedPath, Buffer.from(dump(loadedYaml, options)))
    }
}

function processDirectory(parentDirectory: string, isRelative: boolean): void {
    const cwd = process.cwd()
    const dirContent = getFilesInDirectory(parentDirectory)

    processFiles(parentDirectory, dirContent.files, isRelative)
    for (const childDirectory of dirContent.directories) {
        const resolvedDirectoryPath = isRelative
            ? resolve(cwd, parentDirectory, childDirectory)
            : resolve(parentDirectory, childDirectory)
        processDirectory(resolvedDirectoryPath, isRelative)
    }
}


export function formatRecursively(combinedPaths: string, params: FormatterParams): void {
    const paths = combinedPaths.split(';')

    for (const path of paths) {
        console.log(`Directory ${path}`)
        processDirectory(path, params.relative ?? false)
    }

    console.log(green(`Formatting finished!`))
}
