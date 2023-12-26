import { reactive } from 'vue'

export const store = reactive({
  loggedIn: false,
  username: "",
  password: "",
  statusMessage: "",
  inputs:{
    inputFormLogin:{
      username: { 
        label: "Username", 
        type: "text",
        placeholder: "Enter username here...",
        information: "Enter username here...",
        value: ""
      },
      password: { 
        label: "Password", 
        type: "password",
        placeholder: "Enter password here...",
        information: "Enter password here...",
        value: ""
      },
    }
  },

})