<script setup>
import axios from "axios"
import { onMounted } from 'vue'
import WindowInput from "./WindowInput.vue";
import { store } from '../store.js'
import { Modal } from 'bootstrap'

function test(){
  console.log(123)
}

function login (){

  const postData = {
    username: store.inputs.inputFormLogin.username.value,
    password: store.inputs.inputFormLogin.password.value
  };

  axios.post('/auth/login', postData)
    .then((response) => {
      // Handle success response here
      console.log('Response Data:', response.data);
      let modalElement = document.getElementById("login")
      let modal = Modal.getInstance(modalElement);
      modal.hide()          
      store.loggedIn = true
      store.statusMessage = ""
    })
    .catch((error) => {
      // Handle error here
      console.error('Error:', error);
      store.loggedIn = false
      store.statusMessage = "Login failed"
    });
  }

onMounted( async () => {
  console.log(`Mounted: ModalLogin`)
})


</script>

<template>

<div class="modal fade" id="login" aria-labelledby="login" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Login</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <WindowInput id="inputFormLogin"/>
      </div>
      <div class="modal-footer d-flex justify-content-between">
        <slot name="footer" >
          <!-- FOOTER FALLBACK BUTTONS -->   
          <!-- <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button> -->
            <p class="text-danger">{{store.statusMessage}}</p>
            <button type="button" class="btn btn-primary" @click="login" >Submit</button>            
        </slot>        
      </div>
    </div>
  </div>
</div> 
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>



</style>