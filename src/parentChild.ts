import { App, Notice, TFile } from "obsidian";
import * as utils from 'src/utils'
import {tagData} from 'src/tagsModifier'

export async function findAllSubtree(app: App, initPath: string, isFirstTagLineParentWhenEmpty: boolean, parentTags: string[]): string[] {
    var allNotes: string[] = [initPath]
    var notesQueue: string[] = [initPath]
    while (notesQueue.length != 0) {
        var currentPath = notesQueue.pop()
        if (currentPath == undefined) {
            continue
        }
        var file = app.vault.getAbstractFileByPath(currentPath)
        if (!(file instanceof TFile)) {
            continue
        }
        var noteChildren: string[] = await getAllChildrenOfFile(
            file, app, isFirstTagLineParentWhenEmpty, parentTags
        )
        noteChildren.forEach(nc => {
            if (!(allNotes.contains(nc))) {
                allNotes.push(nc)
                notesQueue.push(nc)
            }
        })
    }
    return allNotes

}

export async function getAllChildrenOfFile(file: TFile, app: App,  isFirstTagLineParentWhenEmpty: boolean, parentTags: string[]): Promise<string[]> {
    var backlinksObj = app.metadataCache.getBacklinksForFile(file)?.data
    if ((backlinksObj == undefined)) {
        return []
    }
    var backlinks: string[] = Object.keys(backlinksObj)
    var children: string[] = []
    var res: string[][] = await Promise.all(backlinks.map(async bl => {
        var subchildren: string[] = []
        var subfile = app.vault.getAbstractFileByPath(bl)
        if (subfile instanceof TFile) {
            var neiborsParents = await getNoteParents(subfile, app, isFirstTagLineParentWhenEmpty, parentTags)
            
            var neiborPaths = utils.getNotePaths(neiborsParents, bl, app)
            if (neiborPaths.contains(file.path)) {
                subchildren.push(bl)
            }
        }
        return subchildren
    }))
    res.forEach(r => {
        r.forEach(r2 => children.push(r2))
    })
    return children
}

async function getNoteParents(file: TFile, app: App,  isFirstTagLineParentWhenEmpty: boolean, parentTags: string[]): Promise<string[]> {
    var parents: string[] = []
    var parentsOnTags: (string[] | null)[] = await Promise.all(parentTags.map(async (tag) => {
        return await tagData(app, file, tag)
    }))
    parentsOnTags.forEach(pp => {
        if (Array.isArray(pp)) {
            pp.forEach(p => parents.push(p))
        }
    })
    if ((parents.length == 0) && isFirstTagLineParentWhenEmpty) {
        var rawParents = getParentsAsFirstLineNotes(file, app)
        rawParents.forEach(p => {parents.push(p)})
    }
    return parents
}

function getParentsAsFirstLineNotes(file: TFile, app: App): string[] {
    var inFileLinks = app.metadataCache.getFileCache(file)?.links
    if (inFileLinks == undefined) {
        return []
    }
    var lines: number[] = inFileLinks.map(l => l.position.start.line)
    var links: string[] = inFileLinks.map(l => l.original)
    var minimalLine = Math.min(...lines)
    var parents: string[] = []
    for(let i=0; i < lines.length; i++) {
        if (lines[i] == minimalLine) {
            parents.push(links[i])
        }
    }
    return parents
}