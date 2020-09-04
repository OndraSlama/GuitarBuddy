<template>
  <div>
    <h1 class="display-4">Song Book</h1>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  computed: {
    ...mapGetters({
      user: "getUser",
    }),
  },
};
</script>

<style lang="scss" scoped></style>
