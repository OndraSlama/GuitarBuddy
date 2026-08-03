<template>
  <div></div>
</template>

<script>
export default {
  name: "AboutPage",
  created() {
    this.$store.commit("setCurrentPage", "About");
  },
};
</script>

<style lang="scss" scoped>
</style>


