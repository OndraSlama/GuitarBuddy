<template>
    <v-dialog v-model="dialogOpened" max-width="450px" transition="dialog-bottom-transition">
      <v-card class="rounded-lg">
        <v-toolbar flat dense color="primary" dark>
          <v-icon left>mdi-share-variant-outline</v-icon>
          <v-toolbar-title class="font-weight-medium">Share Session</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogOpened = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
  
        <v-card-text class="pa-6 text-center">
          <p class="text-body-1 mb-4">
            Invite others to join your session using the link or QR code below.
          </p>
  
          <div class="mb-5">
            <qrcode-vue :value="sessionLink" :size="200" level="H" render-as="svg" />
          </div>
  
          <v-text-field
            :value="sessionLink"
            label="Session Link"
            readonly
            outlined
            dense
            hide-details
            append-icon="mdi-content-copy"
            @click:append="copyLink"
            class="mb-2 session-link-field"
          ></v-text-field>
          <v-btn block color="primary" @click="copyLink" class="elevation-0">
            <v-icon left small>mdi-content-copy</v-icon>
            Copy Link
          </v-btn>
        </v-card-text>
  
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn text @click="dialogOpened = false" color="secondary">Close</v-btn>
        </v-card-actions>
      </v-card>
      <v-snackbar v-model="snackbar" :timeout="2000" color="success" bottom>
        Link copied to clipboard!
      </v-snackbar>
    </v-dialog>
  </template>
  
  <script>
  import dialogBase from "../../mixins/dialogBase";
  import QrcodeVue from 'qrcode.vue';
  
  export default {
    mixins: [dialogBase],
    components: {
      QrcodeVue,
    },
    props: {
      sessionLink: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        snackbar: false,
      };
    },
    methods: {
      copyLink() {
        navigator.clipboard.writeText(this.sessionLink).then(() => {
          this.snackbar = true;
        }).catch(err => {
          console.error('Failed to copy link: ', err);
          // Zde by se mohla zobrazit chybová notifikace
        });
      },
    },
  };
  </script>
  
  <style scoped>
  .session-link-field {
    font-size: 0.9rem; /* Menší písmo pro odkaz */
  }
  /* Můžete přidat další styly podle potřeby */
  </style>