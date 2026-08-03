<template>
	<v-dialog v-model="dialogOpened" max-width="500px" transition="dialog-transition">
		<v-card>
			<v-card-title class="text-h5">Import settings</v-card-title>

			<v-card-text>
				<v-list class="py-0">
					<v-list-item @click.stop="localSettings.chordsAboveText = !localSettings.chordsAboveText">
						<div class="d-flex align-center">
							<v-list-item-title class="mr-3">{{ localSettings.chordsAboveText ? "Chords above text" : "Chords in brackets" }}</v-list-item-title>
							<v-icon class="mr-3" :color="!localSettings.chordsAboveText ? 'primary' : ''">mdi-code-brackets</v-icon>
							<v-switch @click.stop v-model="localSettings.chordsAboveText" inset hide-details class="mx-2"> </v-switch>
							<v-icon :color="localSettings.chordsAboveText ? 'primary' : ''">mdi-arrow-up</v-icon>
						</div>
					</v-list-item>
					<v-list-item @click.stop="localSettings.standardNotation = !localSettings.standardNotation">
						<div class="d-flex align-center">
							<v-list-item-title class="mr-3">{{ localSettings.standardNotation ? "Standard notation (A B C D E F G)" : "German notation (A H C D E F G)" }}</v-list-item-title>
							<v-icon class="mr-1" size="large" :color="!localSettings.standardNotation ? 'primary' : ''">mdi-alpha-h</v-icon>
							<v-switch @click.stop v-model="localSettings.standardNotation" inset hide-details class="mx-2"> </v-switch>
							<v-icon size="large" class="mr-n1" :color="localSettings.standardNotation ? 'primary' : ''">mdi-alpha-b</v-icon>
						</div>
					</v-list-item>

					<v-list-item @click.stop.prevent="localSettings.trimLines = !localSettings.trimLines">
						<div class="d-flex align-center">
							<v-list-item-title>Trim lines</v-list-item-title>
							<v-checkbox-btn v-model="localSettings.trimLines" @click.stop.prevent class="flex-grow-0"></v-checkbox-btn>
						</div>
					</v-list-item>
					<v-list-item @click.stop.prevent="localSettings.public = !localSettings.public">
						<div class="d-flex align-center">
							<v-list-item-title>Save as public</v-list-item-title>
							<v-checkbox-btn v-model="localSettings.public" @click.stop.prevent class="flex-grow-0"></v-checkbox-btn>
						</div>
					</v-list-item>
				</v-list>
			</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>

				<v-btn color="secondary" variant="text" @click="dialogOpened = false">Cancel</v-btn>

				<v-btn color="primary" variant="text" @click="onAgree">Import file</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import dialogBase from "../../mixins/dialogBase";
export default {
	mixins: [dialogBase],
	props: ["importSettings"],
	emits: ["accept"],

	data() {
		return {
			localSettings: { ...this.importSettings },
		};
	},

	watch: {
		importSettings: {
			handler(newSettings) {
				this.localSettings = { ...newSettings };
			},
			deep: true,
		},
	},

	methods: {
		onAgree() {
			this.dialogOpened = false;
			this.$emit("accept", this.localSettings);
		},
	},
};
</script>

<style lang="scss" scoped></style>
