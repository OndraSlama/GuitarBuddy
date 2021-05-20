<template>
	<v-dialog v-model="dialogOpened" max-width="500px" transition="dialog-transition">
		<v-card>
			<v-card-title class="headline">Import settings</v-card-title>

			<v-card-text>
				<v-list class="py-0">
					<v-list-item @click.stop="importSettings.chordsAboveText = !importSettings.chordsAboveText">
						<v-list-item-title class="mr-3">{{ importSettings.chordsAboveText ? "Chords above text" : "Chords in brackets" }}</v-list-item-title>
						<v-icon class="mr-3" :color="!importSettings.chordsAboveText ? 'primary' : ''">mdi-code-brackets</v-icon>
						<v-switch @click.stop v-model="importSettings.chordsAboveText" inset color="gray"> </v-switch>
						<v-icon :color="importSettings.chordsAboveText ? 'primary' : ''">mdi-arrow-up</v-icon>
						<!-- 
									<v-list-item-icon>
										<v-icon>mdi-format-text-variant</v-icon>
									</v-list-item-icon> -->
					</v-list-item>
					<v-list-item @click.stop="importSettings.standardNotation = !importSettings.standardNotation">
						<v-list-item-title class="mr-3">{{ importSettings.standardNotation ? "Standard notation (A B C D E F G)" : "German notation (A H C D E F G)" }}</v-list-item-title>
						<v-icon class="mr-1" large :color="!importSettings.standardNotation ? 'primary' : ''">mdi-alpha-h</v-icon>
						<v-switch @click.stop v-model="importSettings.standardNotation" inset color="gray"> </v-switch>
						<v-icon large class="mr-n1 ml-n2" :color="importSettings.standardNotation ? 'primary' : ''">mdi-alpha-b</v-icon>
					</v-list-item>

					<v-list-item @click.stop.prevent="importSettings.trimLines = !importSettings.trimLines">
						<v-list-item-title>Trim lines</v-list-item-title>
						<!-- <v-list-item-icon>
							<v-icon>mdi-format-horizontal-align-left</v-icon>
						</v-list-item-icon> -->
						<v-checkbox v-model="importSettings.trimLines" @click.stop.prevent></v-checkbox>
					</v-list-item>
					<v-list-item @click.stop.prevent="importSettings.public = !importSettings.public">
						<v-list-item-title>Save as public</v-list-item-title>
						<!-- <v-list-item-icon>
							<v-icon>mdi-format-horizontal-align-left</v-icon>
						</v-list-item-icon> -->
						<v-checkbox v-model="importSettings.public" @click.stop.prevent></v-checkbox>
					</v-list-item>
				</v-list>
			</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>

				<v-btn color="secondary" text @click="dialogOpened = false">Cancel</v-btn>

				<v-btn color="primary" text @click="onAgree">Import file</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],
	props: ["importSettings"],

	// data(){
	// 	return {

	// 	}
	// },

	methods: {
		onAgree() {
			this.dialogOpened = false;
			this.$emit("accept", this.importSettings);
		},
	},
};
</script>

<style lang="scss" scoped></style>
