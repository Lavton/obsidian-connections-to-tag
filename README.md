# Connections to tag
obsidian plugin (https://obsidian.md/).

This plugin is used to add a hashtag to some subtree or to note neibors

## goal
some plugins work with notes with common tag (ex. https://github.com/erichalldev/obsidian-smart-random-note). So by adding this tag it is easier to focus on the set of notes.

### package trio
This package is invented as a part of the package trio:
- https://github.com/Lavton/obsidian-connections-to-tag -- a package that can add to notes subtree and its connections a common hashtag
- https://github.com/Lavton/obisidian-move-tag-to-folder -- a package that can move all notes with a common hashtag to a specific folder
- https://github.com/Lavton/obsidian-ignore-filter-shortcut -- a package that can add a Ignore Filter variant to focus on the specific folder.

So, the supposed workflow of the packages is the following: 
1. deside that you want to focus not on the whole vault, but on the specific subject
2. find the subtree of the subject and add a hashtag to the subtree
3. move all notes with the hashtag (so, all notes connected to the subject) to a specific folder
4. change the ignore filters so, that only the specific folder is not ignored
5. focus on the subject, do whatever you want to do
6. do reverse stuff: change ignore filters to a general one, move all notes from the specific folder to their original desitnation, remove the hashtag from the notes 

## settings
- `working tag` - a hashtag that will be added to/removed from the note
- `parents tags` - a list of frontmatter YAML tags or `dataview::`-format tags separated by comma, that identify the parent note
- `number of neibors` - number of neibors of the note/tree that will be added to the consideration
- `use first line as parents` - if true and note doesn't have any of the mention parent tags, the parents will be considered as: all notes on the first line, where the notes are mention (on top of the document). Usefull if you are not using tags

## commands
- `Add hashtag to tree` -- add the hashtag to the tree starting of the opened note
- `Remove hashtag from tree` -- remove the hashtag from the tree starting of the opened note
- `Add hashtag to note and neibors` -- add the hashtag to the opened note and its neibors
- `Remove hashtag from note and neibors` -- remove the hashtag from the opened note and its neibors
- `Totally remove the hashtag from tree` -- remove the hashtag totally from the vault