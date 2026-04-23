import type { App, TFile } from "obsidian";
import { extractLinksFromString, getFilepaths } from "src/link_utils";
import type { Connection } from "src/connections/connections";
import { convertToLinePositions, findAllOccurrences, removeFrontmatter } from "src/utils";
import type { ConnectionTypeDescriptor } from "../factory";
import JustRegexpConnectionEditor from "./JustRegexpConnectionEditor.svelte";
import type { ConnectionConfig, ValidationAboveRule, ValidationLocalRule } from "src/settings/types";

// links after some regexp. Ex: after "parent:: "
export class JustRegexpConnection implements Connection {
    readonly type = 'just-regexp';
    title: string;
    readonly locality = 'local';

    in_the_same_string: boolean;
    is_regexp: boolean;
    is_before: boolean;
    to_find: string;

    constructor(
        title: string,
        in_the_same_string: boolean,
        is_regexp: boolean,
        is_before: boolean,
        to_find: string
    ) {
        this.title = title;
        this.in_the_same_string = in_the_same_string;
        this.is_regexp = is_regexp;
        this.is_before = is_before;
        this.to_find = to_find;
    }

    async get_connected(app: App, node: TFile): Promise<TFile[]> {
        const content = await app.vault.read(node);
        const contentWithoutFrontmatter = removeFrontmatter(content);
        const occurance = findAllOccurrences(contentWithoutFrontmatter, this.to_find, this.is_regexp);

        const lines = contentWithoutFrontmatter.split('\n');
        const linePositions = convertToLinePositions(occurance, lines);
        const allLinks: string[] = [];
        for (const linePos of linePositions) {
            allLinks.push(...this.getOne(lines, linePos));
        }
        return getFilepaths([...new Set(allLinks)], node, app);
    }

    private getOne(lines: string[], indexes: [[number, number], [number, number]]): string[] {
        if (this.in_the_same_string) {
            if (this.is_before) {
                const test_line: string = lines[indexes[0][0]];
                const test = test_line.slice(0, indexes[0][1] + 1);
                return extractLinksFromString(test);
            } else {
                const test_line: string = lines[indexes[1][0]];
                const test = test_line.slice(indexes[1][1], test_line.length);
                return extractLinksFromString(test);
            }
        } else {
            let start_line: number;
            let direction: number;
            if (this.is_before) {
                start_line = indexes[0][0] - 1;
                direction = -1;
            } else {
                start_line = indexes[1][0] + 1;
                direction = +1;
            }
            const links: string[] = [];
            while (true) {
                if (start_line == -1) { break; }
                if (start_line == lines.length) { break; }
                const lineLinks = extractLinksFromString(lines[start_line]);
                if (lineLinks.length == 0) { break; }
                links.push(...lineLinks);
                start_line += direction;
            }
            return links;
        }
    }
}


export class JustRegexpConnConfig implements ConnectionConfig {
	readonly type = 'just-regexp';
	title: string;
	in_the_same_string: boolean;
	is_regexp: boolean;
	is_before: boolean;
	to_find: string;

	constructor(
		title: string,
		in_the_same_string: boolean,
		is_regexp: boolean,
		is_before: boolean,
		to_find: string
	) {
		this.title = title;
		this.in_the_same_string = in_the_same_string;
		this.is_regexp = is_regexp;
		this.is_before = is_before;
		this.to_find = to_find;
	}
}

function validateJustRegexpToFind(item: JustRegexpConnConfig) {
	if (!item.to_find.trim()) {
		return { code: "to_find_empty", path: "to_find" };
	}
	return null;
}

export const JustRegexpConnectionDescriptor: ConnectionTypeDescriptor<JustRegexpConnConfig> = {
    type: 'just-regexp',

    createInstance(config) {
        return new JustRegexpConnection(
            config.title,
            config.in_the_same_string,
            config.is_regexp,
            config.is_before,
            config.to_find
        );
    },

    createConfig(instance) {
        const wrapper = instance as JustRegexpConnection;
        return {
            type: wrapper.type,
            title: wrapper.title,
            in_the_same_string: wrapper.in_the_same_string,
            is_regexp: wrapper.is_regexp,
            is_before: wrapper.is_before,
            to_find: wrapper.to_find,
        };
    },

    label: "Regexp / Prefix",
    editorComponent: JustRegexpConnectionEditor,

    createDefaultConfig() {
        return {
            type: 'just-regexp',
            title: '',
            in_the_same_string: true,
            is_regexp: false,
            is_before: false,
            to_find: '',
        };
    },
	validateLocalRules: [
		{ run: validateJustRegexpToFind },
	],
	validateAboveRules: [] = [],
};
