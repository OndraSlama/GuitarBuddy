export default {
	data() {
		return {
			dialogOpened: false,
		};
	},
	props: ["modelValue"],
	emits: ["update:modelValue"],

	created() {
		this.dialogOpened = this.modelValue;
	},

	watch: {
		modelValue: function(val) {
			this.dialogOpened = val;
		},

		dialogOpened: function(val) {
			this.$emit("update:modelValue", val);
		},
	},
};
