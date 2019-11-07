<script>
	import { Router, Route } from 'svelte-router'
	import Page from './Page.svelte'
	import { delay } from './utils'

</script>

<Router>
	<Route
		path="/home"
		component="{Page}"
	/>
	<Route
		path="/other"
		component="{Page}"
	/>
	<Route
		path="/help"
	>
		<h1>HELP PAGE</h1>
	</Route>
</Router>
<a href="/home">home</a>
<a href="/help">help</a>
<a href="/other">other</a>
<a href="/other/more">other/more</a>

<a href="http://www.google.com">stuff</a>