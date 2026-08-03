<template>
	<div>
		<v-footer class="font-weight-medium pa-0">
			<v-col class="text-right" cols="12">
				{{ new Date().getFullYear() }} -
				<strong>guitarbuddy</strong>
			</v-col>
		</v-footer>
	</div>
</template>

<script>
export default {
	name: "AppFooter",
};
</script>

<style lang="scss" scoped></style>
