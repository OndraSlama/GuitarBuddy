<template>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <p v-if="willRedirect" class="display-1 text--secondary text-center mb-10">
            You must be logged in to access this page
          </p>
          <p v-if="!willRedirect" class="display-1 text--secondary text-center mb-10">
            Login or Register
          </p>
  
          <v-card class="pa-5">
            <v-tabs v-model="tab" grow>
              <v-tab>Login</v-tab>
              <v-tab>Register</v-tab>
            </v-tabs>
  
            <v-tabs-items v-model="tab">
              <v-tab-item>
                <!-- Login Form -->
                <v-form @submit.prevent="handleLogin" ref="loginForm" class="mt-5">
                  <v-text-field
                    v-model="loginEmail"
                    label="Email"
                    type="email"
                    required
                    :rules="emailRules"
                    outlined
                    prepend-inner-icon="mdi-email-outline"
                  ></v-text-field>
                  <v-text-field
                    v-model="loginPassword"
                    label="Password"
                    type="password"
                    required
                    :rules="passwordRules"
                    outlined
                    prepend-inner-icon="mdi-lock-outline"
                    class="mt-3"
                  ></v-text-field>
                  <v-btn type="submit" color="primary" block large class="mt-5" :loading="loading">Login</v-btn>
                  <p v-if="loginError" class="error--text text-center mt-3">{{ loginError }}</p>
                </v-form>
              </v-tab-item>
  
              <v-tab-item>
                <!-- Registration Form -->
                <v-form @submit.prevent="handleRegister" ref="registerForm" class="mt-5">
                  <v-text-field
                    v-model="registerEmail"
                    label="Email"
                    type="email"
                    required
                    :rules="emailRules"
                    outlined
                    prepend-inner-icon="mdi-email-outline"
                  ></v-text-field>
                  <v-text-field
                    v-model="registerPassword"
                    label="Password"
                    type="password"
                    required
                    :rules="passwordRules"
                    outlined
                    prepend-inner-icon="mdi-lock-outline"
                    class="mt-3"
                  ></v-text-field>
                   <v-text-field
                    v-model="registerPasswordConfirm"
                    label="Confirm Password"
                    type="password"
                    required
                    :rules="confirmPasswordRules"
                    outlined
                    prepend-inner-icon="mdi-lock-check-outline"
                    class="mt-3"
                  ></v-text-field>
                  <v-btn type="submit" color="success" block large class="mt-5" :loading="loading">Register</v-btn>
                  <p v-if="registerError" class="error--text text-center mt-3">{{ registerError }}</p>
                </v-form>
              </v-tab-item>
            </v-tabs-items>
          </v-card>
  
          <!-- Odstraněná část pro Google/Facebook -->
  
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  // Odstraněn import LoginUI
  import { mapGetters, mapActions } from "vuex";
  
  export default {
    // Odstraněna komponenta LoginUI z components
    props: ["redirect"],
    data() {
      return {
        tab: 0, // 0 pro Login, 1 pro Register
        loading: false, // Pro zobrazení načítání na tlačítkách
        loginEmail: "",
        loginPassword: "",
        loginError: null,
        registerEmail: "",
        registerPassword: "",
        registerPasswordConfirm: "",
        registerError: null,
  
        emailRules: [
          v => !!v || "E-mail is required",
          v => /.+@.+\..+/.test(v) || "E-mail must be valid",
        ],
        passwordRules: [
          v => !!v || "Password is required",
          v => (v && v.length >= 6) || "Password must be at least 6 characters",
        ],
      };
    },
    computed: {
      ...mapGetters({
        userLogged: "getUserLogged",
      }),
      willRedirect() {
        return !(this.redirect === undefined);
      },
      confirmPasswordRules() {
        return [
          v => !!v || "Confirm password is required",
          v => v === this.registerPassword || "Passwords do not match",
        ];
      }
    },
    methods: {
      ...mapActions([
          'registerUserWithEmailAndPassword',
          'loginUserWithEmailAndPassword'
      ]),
      async handleLogin() {
        this.loginError = null;
        if (this.$refs.loginForm.validate()) {
          this.loading = true;
          try {
            await this.loginUserWithEmailAndPassword({
              email: this.loginEmail,
              password: this.loginPassword,
            });
            // Přesměrování se provede ve watch: userLogged
          } catch (error) {
            this.loginError = this.getFriendlyErrorMessage(error);
          } finally {
            this.loading = false;
          }
        }
      },
      async handleRegister() {
        this.registerError = null;
        if (this.$refs.registerForm.validate()) {
           if (this.registerPassword !== this.registerPasswordConfirm) {
              this.registerError = "Passwords do not match.";
              return;
          }
          this.loading = true;
          try {
            await this.registerUserWithEmailAndPassword({
              email: this.registerEmail,
              password: this.registerPassword,
            });
            // Přesměrování se provede ve watch: userLogged
          } catch (error) {
            this.registerError = this.getFriendlyErrorMessage(error);
          } finally {
            this.loading = false;
          }
        }
      },
      getFriendlyErrorMessage(error) {
        // Můžete rozšířit o další kódy chyb Firebase
        switch (error.code) {
          case 'auth/invalid-email':
            return 'The email address is not valid.';
          case 'auth/user-not-found':
            return 'No user found with this email.';
          case 'auth/wrong-password':
            return 'Incorrect password.';
          case 'auth/email-already-in-use':
            return 'This email address is already in use.';
          case 'auth/weak-password':
            return 'The password is too weak.';
          default:
            return error.message;
        }
      }
    },
    watch: {
      userLogged(isLogged) {
        if (isLogged) {
          const redirectTo = this.redirect || "/";
          this.$router.push(redirectTo).catch(() => {});
        }
      },
    },
    created() {
      this.$store.commit("setCurrentPage", "Login / Register");
    },
  };
  </script>
  
  <style lang="scss" scoped>
  /* Vaše styly */
  </style>