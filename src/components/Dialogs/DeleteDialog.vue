<template>
  <v-dialog v-model="dialogOpened" max-width="400px" transition="dialog-transition">
    <v-card>
      <v-card-title class="headline">Deleting song created by you</v-card-title>

      <v-card-text>Deleting song created by you will remove it permanently. Are you sure about this?</v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn color="secondary" text @click="dialogOpened = false">Cancel</v-btn>

        <v-btn color="primary" text @click="onAgree">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      dialogOpened: true,
    };
  },
  props: ["value"],

  methods: {
    onAgree() {
      this.dialogOpened = false;
      this.$emit("accept");
    },
  },

  computed: {
    ...mapGetters({}),
  },

  created() {
    this.dialogOpened = this.value;
  },

  watch: {
    value: function (val) {
      this.dialogOpened = val;
    },

    dialogOpened: function (val) {
      this.$emit("input", val);
    },
  },

  components: {},
};
</script>

<style lang="scss" scoped>
</style>