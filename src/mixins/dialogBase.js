export default {
	data() {
		return {
			dialogOpened: false,
		};
	},
	props: ["value"],

	created() {
		this.dialogOpened = this.value;
	},

	watch: {
		value: function(val) {
			this.dialogOpened = val;
		},

		dialogOpened: function(val) {
			this.$emit("input", val);
		},
	},	
};
