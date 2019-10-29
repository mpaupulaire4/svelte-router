<script>
	import { Router, Route } from 'svelte-router'
	import Page from './Page.svelte'
	import { delay } from './utils'

	let hey;
</script>

<Router>
	<Route
		path="/home"
		let:params="{hey}"
		component="{Page}"
	>
		<Route
			path="home"
			component="{Page}"
		/>
		<p>are we home {!!hey}</p>
	</Route>
	<Route
		path="/other"
		component="{Page}"
	>
		<Route
			path=":type"
			component="{Page}"
		/>
		<div>child</div>
	</Route>
	<Route
		path="/help"
	>
		<h1>HELP PAGE {hey}</h1>
	</Route>
</Router>
<a href="/home">home</a>
<a href="/help">help</a>
<a href="/other">other</a>
<a href="/other/more">other/more</a>

<a href="http://www.google.com">stuff</a>