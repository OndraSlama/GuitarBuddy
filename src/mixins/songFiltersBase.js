export default {
	data() {
		return {
			filters: {
				search: "",
				groupByAuthor: false,
				titleNameOrder: false,
				authorNameOrder: false,
				modifiedDateOrder: false,
				createdDateOrder: false,
				forksOrder: false,
				orderOption: "titleName",
				lastRow: 5,
			},

		};
	},

	methods: {
		onTitleName() {
			this.filters.titleNameOrder = !this.filters.titleNameOrder;
			this.filters.orderOption = 'titleName';
		},
		onAuthorName() {
			this.filters.authorNameOrder = !this.filters.authorNameOrder;
			this.filters.orderOption = 'authorName';
		},

		onDateModified() {
			this.filters.modifiedDateOrder = !this.filters.modifiedDateOrder;
			this.filters.orderOption = 'dateModified';
		},

		onDateCreated() {
			this.filters.createdDateOrder = !this.filters.createdDateOrder;
			this.filters.orderOption = 'dateCreated';
		},

		onForks() {
			this.filters.forksOrder = !this.filters.forksOrder;
			this.filters.orderOption = 'forks';
		},
	}

	
};
