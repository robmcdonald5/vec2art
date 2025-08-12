<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { Upload, Clock, TrendingUp } from 'lucide-svelte';
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold">Dashboard</h1>
		<p class="text-muted-foreground">Welcome back to vec2art</p>
	</div>

	<!-- Quick Actions -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<div class="rounded-lg border p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-muted-foreground text-sm">Total Conversions</p>
					<p class="text-2xl font-bold">0</p>
				</div>
				<Upload class="text-muted-foreground h-8 w-8" />
			</div>
		</div>
		<div class="rounded-lg border p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-muted-foreground text-sm">Avg Processing Time</p>
					<p class="text-2xl font-bold">--</p>
				</div>
				<Clock class="text-muted-foreground h-8 w-8" />
			</div>
		</div>
		<div class="rounded-lg border p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-muted-foreground text-sm">Success Rate</p>
					<p class="text-2xl font-bold">--</p>
				</div>
				<TrendingUp class="text-muted-foreground h-8 w-8" />
			</div>
		</div>
	</div>

	<!-- Quick Start -->
	<div class="rounded-lg border p-8 text-center">
		<h2 class="text-xl font-semibold">Ready to convert?</h2>
		<p class="text-muted-foreground mt-2">
			Upload an image to transform it into beautiful line art
		</p>
		<Button href="/app/converter" size="lg" class="mt-6">Start Converting</Button>
	</div>

	<!-- Recent Activity -->
	<div class="rounded-lg border">
		<div class="border-b p-4">
			<h2 class="font-semibold">Recent Activity</h2>
		</div>
		<div class="text-muted-foreground p-8 text-center">
			<p>No recent conversions</p>
			<p class="mt-2 text-sm">Your conversion history will appear here</p>
		</div>
	</div>
</div>
