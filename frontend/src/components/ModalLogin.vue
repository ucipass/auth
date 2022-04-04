<template>
<!-- Modal -->
<div class="modal fade" :id="name" tabindex="-1" :aria-labelledby="name+'label'" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" :id="name+'label'">{{title}}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <InputForm name="inputFormLogin"/>
      </div>
      <div class="modal-footer d-flex justify-content-between">
        <slot name="footer" >
          <!-- FOOTER FALLBACK BUTTONS -->   
          <!-- <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button> -->
            <p class="text-danger">{{statusMessage}}</p>
            <button type="button" class="btn btn-primary" @click="login" >Submit</button>            
        </slot>        
      </div>
    </div>
  </div>
</div> 
</template>

<script>
const LOGIN_URL = "/auth/login"

import { store } from '@/store.js'
import axios from 'axios'
import { Modal } from 'bootstrap';
import InputForm from '@/components/InputForm.vue'
export default {
  name: 'ModalLogin',
  components: {
    InputForm,
  },  
  props: {
    name: {
          type: String,
          default: "ModalLogin"
        },  
    title: {
          type: String,
          default: "Sign in"
        },  
  },
  data () {
    return {
      statusMessage: ""
    }
  },
  computed: {
    config: function (){
      return store[this.name]
    },
  },
  methods:{
    inputClick: function ( ev ) {
      if ( ev?.target?.type == "file") {
        ev.target.value = ""
      }
    },
    login: async function () {
      console.log("LOGIN", store.inputFormLogin.values.username,store.inputFormLogin.values.password)
      try {
        let response = await axios.post(LOGIN_URL, 
            {
            username: store.inputFormLogin.values.username,
            password: store.inputFormLogin.values.password
            },
            {
            withCredentials: true
            }
        )       
        store.loggedIn = true
        let myModalEl = document.getElementById('ModalLogin')
        var modal = Modal.getInstance(myModalEl) 
        modal.hide()
        this.statusMessage = ""
        console.log(`status: ${response.status}, ${response.statusText}`)
      } catch (error) {
          this.statusMessage = `${error.response.statusText} (code:${error.response.status}) `       
      }
    },
  },
  mounted: function () {
    console.log("Mounted:", this.name)
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>