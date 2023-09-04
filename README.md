# Connections to tag
obsidian plugin (https://obsidian.md/).

This plugin is used to add a hashtag to some subtree or to note neibors

## goal
some plugins work with notes with common tag (ex. https://github.com/erichalldev/obsidian-smart-random-note). So by adding this tag it is easier to focus on the set of notes.

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