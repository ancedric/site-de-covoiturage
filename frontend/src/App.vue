<template>
  <div class="ctn">
    
    <Header/>
    <main>
      <router-view />
    </main>

    <footer>
      <p>&copy; {{ new Date().getFullYear() }} Mon Covoiturage</p>
    </footer>
  </div>
</template>

<script setup>
  import Header from './components/common/header/index.vue';
</script>

<style>
.ctn {
  font-family: "Inria Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100vw;
  margin:0; 
  padding: 0;
}

main {
  flex-grow: 1;
}

footer {
  background-color: #333;
  color: white;
  padding: 15px;
  text-align: center;
  margin-top: auto;
}
</style>