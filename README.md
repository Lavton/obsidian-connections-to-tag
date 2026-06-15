# Focus On
[Obsidian.md plugin](https://obsidian.md/) for working with a part of your Vault.

Want to focus just on one topic? This is the right plugin for it!

## Goal & how to set it up
The plugin allows you to focus on a subset of your Vault (ex: one topic with several notes).

Examples:
- Your Vault is about programming, and you want to focus on software architecture notes.
- Your Vault is about communication and you want to focus on your notes about flirting.
- Your Vault is about personal projects, and you want to focus on one active project.

### What does it means "to focus on notes"

#### Put notes to one folder
Collect all notes of one topic in specific folder.

![Move notes to folder](./images/move_to_folder.png)

P.S. you can use my other plugin `Ignore Filters Boost` to add every folder exept the focus one to ignore list

#### Add one tag for notes
Mark all notes with yaml tag or hastag

![Add a tag to topic](./images/tags.png)

#### View marked notes in graph
Look at graph only on the selected topics

![View in graph](./images/graph.png)

### How to focus on notes

#### Globaly: from search
(case: you mark you topics with hashtags or put them in folder.)

![Global search](./images/global-search.png)

You can put any notes directly from search results. Just create search as deep as you want


#### Localy: from connections
(case: your notes have a tree-like structure)

![View in graph](./images/local-search.png)

The main power of the plugin is to go throw connections between notes. If you use YAML tags or just mark notes inside the text, plugin will allow you to collect the topic!

### How to set it up
Plugin has two main consepts: "connections" and "rules".
#### Connections
![Connection](./images/connection-trivial.png)

- "Connection" is a way how your notes are connected. There may be a lot of options.
- Every connection has a title (make it unique) and direction: 
- "forward" direction means we look of the note itself and the connections *from* the note. Example: you have a frontmatter `next` to mark next notes.
- "backward" direction means we look at the connections *to* the note. Example: you have a frontmatter `topic` from children to parent and you start with parent to find all it children.

Connection types:
- `All links in text` -- find links in note body (not in yaml). Example: you want to get all neibors of the note
- `All links in frontmatter` -- find links in fronmatter header. Example: you want all structural notes
- `Arbitrary (danger)` -- put any code you want. Just create a markdown file with a code block like below.
- `Between in text` -- find links between to text strings. Example: your "topic" is always at the end of file after `---` mark
- `Regexp/prefix` -- finds links just after some structure. Example: you use dataview `topic:: <link>` text
- `Top links in text` -- finds links at the top of the notes body. Example: you mark topic as the first link in the note file
- `Trivial connection` -- put just this note, don't go throw connections. Example: you already find all notes with search and want to work only with this found notes
- `YAML tags` -- finds links by yaml tag. Example - your topics are mark with `topic` yaml tag
- `Combine` -- finds links based on combination of connections. Example: you want to go throw yaml tag but only if it doesn't have another tag 


Arbitrary connection example: put such a code to .md file
```javascript
// Read the contents of the current file
const content = await app.vault.read(node);

// Remove frontmatter
const contentWithoutFrontmatter = utils.removeFrontmatter(content);
console.log("ha!")

// Extract links
const links = utils.extractLinksFromString(contentWithoutFrontmatter);

// Get files from the links
const files = utils.getFilepaths(links, node, app);

// Return an array of files
return files;
```

#### Rules
![rule](./images/rule.png)
- "Rule" is a rule what to do with connection

Rule types:
- `go to the end` -- go with connection to the end. Example: you want to take all the tree
- `N steps` -- go with connection only a few steps. Example: you want to take all the notes neibors (1 step)
- `probability` -- go with some probability. Example: you don't know what notes to add, so try to make it with some probability
- `Trivial rule` -- ignore connection and mark just the given note.

## How to use
1. determinate what are the connecitions inside your vault. Do you use frontmatter to structure anything, `topic::` style or just mark the parent as the first link in the note
2. set connection and rules
3. choose a start note and run command `apply chain` or just right click on the note
