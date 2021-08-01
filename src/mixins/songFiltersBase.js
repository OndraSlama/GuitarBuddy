export default {
	data() {
		return {
			filters: {
                search: "",
				groupBy: "favourite",
				titleNameOrder: false,
				authorNameOrder: false,
				modifiedDateOrder: true,
				createdDateOrder: true,
				forksOrder: false,
				orderBy: "dateModified",
				orderGroupBy: "name",
				groupNameOrder: false,
				groupSizeOrder: false,
				lastRow: null,
			},

		};
	},

	methods: {
		onTitleName() {
			this.filters.titleNameOrder = this.filters.orderBy == 'titleName' ? !this.filters.titleNameOrder : false;
			this.filters.orderBy = 'titleName';
		},
		onAuthorName() {
			this.filters.authorNameOrder = this.filters.orderBy == 'authorName' ? !this.filters.authorNameOrder : false;
			this.filters.orderBy = 'authorName';
		},

		onDateModified() {
			this.filters.modifiedDateOrder =  this.filters.orderBy == 'dateModified' ? !this.filters.modifiedDateOrder : true;
			this.filters.orderBy = 'dateModified';
		},

		onDateCreated() {
			this.filters.createdDateOrder = this.filters.orderBy == 'dateCreated' ? !this.filters.createdDateOrder : true;
			this.filters.orderBy = 'dateCreated';
		},

		onForks() {
			this.filters.forksOrder = this.filters.orderBy == 'forks' ? !this.filters.forksOrder : false;
			this.filters.orderBy = 'forks';
		},
		onGroupName() {
			this.filters.groupNameOrder = this.filters.orderGroupBy == 'name' ? !this.filters.groupNameOrder : false;
			this.filters.orderGroupBy = 'name';
		},
		onGroupSize() {
			this.filters.groupSizeOrder = this.filters.orderGroupBy == 'size' ? !this.filters.groupSizeOrder : false;
			this.filters.orderGroupBy = 'size';
		},
	}

	
};
