<script setup lang="ts">
import OlympicsMedals from './components/OlympicsMedals.vue';
</script>

<template>
  <img alt="Paris 2024 logo" src="./assets/paris-2024.png" class="logo">
  <OlympicsMedals />
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
