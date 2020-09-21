<template>
  <div></div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  computed: {
    ...mapGetters({
      user: "getUser",
    }),
  },
  created() {
    this.$store.commit("setCurrentPage", "My Songs");
  },
};
</script>

<style lang="scss" scoped></style>
