<script setup>
import ModalLogin from "./components/ModalLogin.vue";
import { onMounted } from 'vue'
import { Modal } from 'bootstrap'
import { store } from "./store.js"
import axios from "axios"

onMounted( async () => {
  console.log(`Mounted: PageMain`)

  // CHECK IF ALREADY LOGGED IN
  axios.get('/auth/login')
  .then((response) => {
      // Handle success response here
      console.log('Response Data:', response.data);
      store.loggedIn = true
    })
  .catch((error) => {
      // Handle error here
      // console.error('Error:', error.message);
      store.loggedIn = false
    });
   
  
})

function login (){
  let elem = document.getElementById("login")
  let modal = new Modal(elem)
  modal.show()    
}

function logout (){
  axios.get('/auth/logout')
  .then((response) => {
      // Handle success response here
      console.log('Response Data:', response.data);
      store.loggedIn = false
    })
  .catch((error) => {
      // Handle error here
      // console.error('Error:', error.message);
      store.loggedIn = true
    });
}


function test (){
  console.log(123)
}

</script>

<template>
  <div class="home vh-100  d-flex flex-column justify-content-center">
    <div v-if="!store.loggedIn" class="d-flex flex-column justify-content-center align-items-center">
      <div>
        <i class="bi bi-door-closed text-danger" style="font-size: 16rem;"></i>
      </div>
      <div>
        <h1 class="m-0">Unauthorized</h1>
      </div>
      <div>
        <button @click="login"  type="button" class="btn btn-danger">Login</button>
      </div>
      
      
    </div>

    <div v-else class="d-flex flex-column justify-content-center align-items-center">
      <div>
        <i class="bi bi-door-open   text-success" style="font-size: 16rem;"></i>
      </div>
      
      <div class="d-flex justify-content-center ">
        <h1 class="m-0">Authorized: username</h1>
      </div>
      <div>
        <button @click="logout" type="button" class="btn btn-success">Logout</button>
      </div>
    </div>
  </div>
  <ModalLogin/>
</template>

<style>
html, body, #app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: grey;
}

</style>
