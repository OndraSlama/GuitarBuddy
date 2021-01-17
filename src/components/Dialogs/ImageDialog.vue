<template>
	<v-dialog v-model="dialogOpened" transition="dialog-transition" width="unset">		
		<v-img
			contain
			:src="imagePath"				
		>
		<v-btn icon large class="ml-1 mt-1" relative top left @click="dialogOpened = false"><v-icon>mdi-window-close</v-icon></v-btn>
		</v-img>		
	</v-dialog>
</template>
<script>

import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],
	props: ["imagePath"],	
};
</script>

<style lang="scss" scoped></style>
