export default {
	data() {
		return {
			filters: {
                search: "",
				groupBy: "favourite",
				titleNameOrder: false,
				authorNameOrder: false,
				modifiedDateOrder: false,
				createdDateOrder: false,
				forksOrder: false,
				orderBy: "titleName",
				lastRow: 15,
			},

		};
	},

	methods: {
		onTitleName() {
			this.filters.titleNameOrder = !this.filters.titleNameOrder;
			this.filters.orderBy = 'titleName';
		},
		onAuthorName() {
			this.filters.authorNameOrder = !this.filters.authorNameOrder;
			this.filters.orderBy = 'authorName';
		},

		onDateModified() {
			this.filters.modifiedDateOrder = !this.filters.modifiedDateOrder;
			this.filters.orderBy = 'dateModified';
		},

		onDateCreated() {
			this.filters.createdDateOrder = !this.filters.createdDateOrder;
			this.filters.orderBy = 'dateCreated';
		},

		onForks() {
			this.filters.forksOrder = !this.filters.forksOrder;
			this.filters.orderBy = 'forks';
		},
	}

	
};
