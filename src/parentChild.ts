import { App, TFile } from "obsidian";
import * as utils from 'src/utils'
import {tagData} from 'src/tagsModifier'

export function findAllSubtree(app: App, initPath: string, isFirstTagLineParentWhenEmpty: boolean, parentTags: string[]): string[] {

}

export async function getAllChildrenOfFile(file: TFile, app: App,  isFirstTagLineParentWhenEmpty: boolean, parentTags: string[]): Promise<string[]> {
    var backlinksObj = app.metadataCache.getBacklinksForFile(file)?.data
    if ((backlinksObj == undefined)) {
        return []
    }
    var backlinks: string[] = Object.keys(backlinksObj)
    var children: string[] = []
    backlinks.forEach(async bl => {
        var subfile = app.vault.getAbstractFileByPath(bl)
        if (subfile instanceof TFile) {
            var neiborsParents = await getNoteParents(subfile, app, isFirstTagLineParentWhenEmpty, parentTags)
            var neiborPaths = utils.getNotePaths(neiborsParents, bl, app)
            if (neiborPaths.contains(file.path)) {
                children.push(bl)
            }
        }
    })
    return children
}

async function getNoteParents(file: TFile, app: App,  isFirstTagLineParentWhenEmpty: boolean, parentTags: string[]): Promise<string[]> {
    var parents: string[] = []
    parentTags.forEach(async tag => {
        var foundParents = await tagData(app, file, tag)
        foundParents?.forEach(fp => parents.push(fp))
    })
    if ((parents.length == 0) && isFirstTagLineParentWhenEmpty) {
        var rawParents = getParentsAsFirstLineNotes(file, app)
        rawParents.forEach(p => parents.push(p))
    }
    return parents
}

function getParentsAsFirstLineNotes(file: TFile, app: App): string[] {
    var inFileLinks = app.metadataCache.getFileCache(file)?.links
    console.log(inFileLinks)
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