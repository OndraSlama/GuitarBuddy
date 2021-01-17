export default (string) => {
	if (string === undefined) return undefined;
	return string
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
};
