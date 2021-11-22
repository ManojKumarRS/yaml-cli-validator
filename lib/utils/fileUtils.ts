import {Dirent, readdirSync} from "fs";

export function getFilesInDirectory(directory: string) {
    const allEntries: Dirent[] = readdirSync(directory, { withFileTypes: true })
    const files: string[] = []
    const directories: string[] = []

    allEntries.forEach((entry) => {
        if (entry.isFile()) {
            files.push(entry.name)
        }
        if (entry.isDirectory()) {
            directories.push(entry.name)
        }
    })

    return {
        files,
        directories,
    }
}