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
				orderGroupBy: "name",
				groupNameOrder: false,
				groupLabelOrder: false,
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
			this.filters.modifiedDateOrder =  this.filters.orderBy == 'dateModified' ? !this.filters.modifiedDateOrder : false;
			this.filters.orderBy = 'dateModified';
		},

		onDateCreated() {
			this.filters.createdDateOrder = this.filters.orderBy == 'dateCreated' ? !this.filters.createdDateOrder : false;
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
		onGroupLabel() {
			this.filters.groupLabelOrder = this.filters.orderGroupBy == 'label' ? !this.filters.groupLabelOrder : false;
			this.filters.orderGroupBy = 'label';
		},
	}

	
};
