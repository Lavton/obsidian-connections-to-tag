<h1>How it works</h1>

<p>
	The plugin allows you to focus on a subset of your vault, such as one topic
	with several notes.
</p>

<p>
	"To focus" means adding all chosen notes to a <u>specific folder</u>, so you
	can view them together or use your ignore filters to hide everything except
	that folder. It can also mean adding a <u>specific tag</u> to all chosen
	notes, so you can find them in search or view them in the Graph plugin.
</p>

<u>How to choose notes to focus on?</u>
<p>
	The plugin starts with one note or folder and follows links from that note
	according to the rules you specify.
</p>
<p>To stay flexible, the plugin uses two concepts:</p>
<ul>
	<li>
		<code>Connection</code> - how to choose neighboring notes from a given note.
		Maybe all links are neighbors, but a link with a 'parent' tag indicates
		structure?
	</li>
	<li>
		<code>Rule</code> - how deep to go from the starting note? To the end or
		just a few steps? Through what connection will we go?
	</li>
</ul>

<hr />
Table of contents
<ul>
	<li><a href="#section-focuser">What to do with found notes</a></li>
	<li><a href="#section-chain">What rules to apply</a></li>
	<ul>
	<li><a href="#subsection-connection">Connections</a></li>
	<li><a href="#subsection-chainstep">Rules</a></li>
	</ul>
	<!-- <li><a href="#section-ui">UI settings</a></li> -->
</ul>
