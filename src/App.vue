<script setup lang="ts">
import OlympicsMedals2 from './components/OlympicsMedals2.vue';
</script>

<template>
  <img alt="Paris 2024 logo" src="./assets/paris-2024.png" class="logo">
  <OlympicsMedals2 />
</template>

<style scoped>
.logo {
  width: 8rem;
}

@media (max-width: 768px) {
  .logo {
    width: 4rem;
  }
}
</style>
