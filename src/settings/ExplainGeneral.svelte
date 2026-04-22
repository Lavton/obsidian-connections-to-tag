<h1>How it works?</h1>

<p>
	The plugin allows you to focus on a subset of your Vault (ex: one topic with
	several notes).
</p>

<p>
	"to focus" means to add all choosen files to <u>specific folder</u> (so you
	can look at them all or just apply your "Ignore Filters" to ignore
	everything except this folder). Or it means to add to all choosen files
	<u>specific tag</u>: to look at the tag through search or to look at Graph
	plugin.
</p>

<u>How to choose notes to focus on?</u>
<p>
	The plugin starts with one file/folder and distributes on links from the
	file according to the rules you specify.
</p>
<p>To be flexible, plugin works with 3 abstractions:</p>
<ul>
	<li>
		<code>Connection</code> - how to choose neighbour files from given one. Maybe
		all links are just 'neighbour', but the link with 'parent' tag indicates structure?
	</li>
	<li>
		<code>Rule</code> - how deep to go from the starting file? Till the end or
		just a few steps?
	</li>
	<li>
		<code>Chain step</code> - combination of "connection" and "rule": from this
		starting note will look at all neighbours according to "Connection" and go
		there if "Rule" told to
	</li>
</ul>

<hr />
Table of content
<ul>
	<li><a href="#section-focuser">What to do with found notes</a></li>
	<li><a href="#section-chain">What rules and chains to apply</a></li>
	<ul>
	<li><a href="#subsection-connection">Connections</a></li>
	<li><a href="#subsection-chainstep">Chain Steps</a></li>
	</ul>
	<li><a href="#section-ui">UI settings</a></li>
</ul>
