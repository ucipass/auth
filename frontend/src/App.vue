<template>
  <div class="home vh-100  d-flex flex-column justify-content-center">
    <div v-if="!loggedIn" class="d-flex flex-column justify-content-center">
      <div>
        <i class="bi bi-door-closed text-danger" style="font-size: 16rem;"></i>
      </div>
      <div>
        <h1 class="m-0">Unauthorized</h1>
      </div>
      <div>
        <button onclick="location.href='/auth/saml/login'" type="button" class="btn btn-danger">Login</button>
      </div>
      
      
    </div>

    <div v-if="loggedIn" class="d-flex flex-column justify-content-center">
      <div>
        <i class="bi bi-door-open   text-success" style="font-size: 16rem;"></i>
      </div>
      
      <div class="d-flex justify-content-center ">
        <h1 class="m-0">Authorized: {{username}}</h1>
      </div>
      <div>
        <button onclick="location.href='/auth/saml/logout'" type="button" class="btn btn-success">Logout</button>
        <!-- <button @click="logout" type="button" class="btn btn-success">Logout</button> -->
        <!-- <button type="button" class="ms-2 btn btn-danger" @click="logout"><i class="bi bi-box-arrow-right"  style="font-size: 1.5rem;"></i></button> -->
      </div>
    </div>

    <ModalLogin/>
  </div>
</template>

<script>
const LOGOUT_URL      = "/auth/logout"
// const LOGIN_URL = "/auth/login"
const STATUS_URL = "/auth/status"
import ModalLogin from './components/ModalLogin.vue'
import { store }  from './store.js'
import { Modal } from 'bootstrap';
import axios from 'axios'

export default {
  name: 'App',
  components: {
    ModalLogin,
  },
  methods: {
    login: async function () {
        let myModalEl = document.getElementById('ModalLogin')
        var modal = Modal.getInstance(myModalEl) 
        modal.show()
    },    
    logout: async function () {
      console.log("LOGOUT", store.inputFormLogin.values.username,store.inputFormLogin.values.password)
      try {
        await axios.get( LOGOUT_URL , { withCredentials: true })
        store.loggedIn = false
      } catch (error) {
          console.log("Logout failed!", error)
      }
    },    
    status: async function () {
      try {
        let response = await axios.get( STATUS_URL ,{ withCredentials: true })
        try {
          console.log(`User: ${response.data.id}`)
          store.loggedIn = true
          store.username = response.data.id
        } catch (error) {
          console.log("no user info found in status reply!")
          store.loggedIn = false
          store.username = "anonymous"
        }
        console.log(`status: ${response.status}, ${response.statusText}`)
      } catch (error) {
        store.loggedIn = false
        store.username = null
        console.log(`${error.response.statusText} (code:${error.response.status}) `)
        // let element = document.getElementById('ModalLogin')
        // var myModal = new Modal( element, {keyboard: false} )
        // myModal.show()
      }
    },
  },
  computed: {
    loggedIn: function () {
      return store.loggedIn
    },
    username: function () {
      try {
        return store.username
      } catch (error) {
        return "anonymous"
      }
    }
  },
  mounted: function () {
    console.log("Mounted:", "Home")
    this.status()
    // setInterval(() => {
    //   if ( ! store.loggedIn && ! document.getElementById('ModalLogin').classList.contains("show")) {
    //     let element = document.getElementById('ModalLogin')
    //     var myModal = new Modal( element, {keyboard: false} )
    //     myModal.show()
    //   }
    // }, 2000);
  }

}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
