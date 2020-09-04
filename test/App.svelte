<script lang="ts">
	import {Router, Route} from '../src'
	import TestComponent from './Temp/TestComponent.svelte';
	export let name: string;
</script>

<main>
	<h1>Hello {name}!</h1>
	<div>
		<a href="/$base/?some=thing&some=thing2">Index</a>
	</div>
	<div>
		<a href="/$base/post">Post Index</a>
	</div>
	<div>
		<a href="/$base/post/new">Post New</a>
	</div>
	<div>
		<a href="/$base/post/1">Post 1</a>
	</div>

	<Router>
		<Route component="{TestComponent}" data="{() => ({ name: 'layout' })}">
			<Route component="{TestComponent}" data="{() => ({ name: 'index' })}"/>
			<Route path="post" component="{TestComponent}" data="{() => ({ name: 'post_layout' })}">
				<Route component="{TestComponent}" data="{() => ({ name: 'post_index' })}" />
				<Route path="/:id" component="{TestComponent}" data="{() => ({ name: 'post_id' })}" />
				<Route path="/new" component="{TestComponent}" data="{() => ({ name: 'post_new' })}"/>
			</Route>
		</Route>
	</Router>
</main>
