<template>
  <v-app>
    <v-app-bar
      app
      color="brown"
      dark
    >
      <div class="d-flex align-center">
        <v-img
          alt="Speckle Logo"
          class="shrink mr-2"
          contain
          src='./assets/img.png'
          transition="scale-transition"
          width="40"
        />
        <v-toolbar-title>Concrete Defect Management</v-toolbar-title>
      </div>
    </v-app-bar>

    <v-main>
      <Home/>
    </v-main>
  </v-app>
</template>

<script>
import Home from './views/Home'

export default {
  name: 'App',

  components: {
    Home
  },

  data: () => ( {
  } )
}
</script>
