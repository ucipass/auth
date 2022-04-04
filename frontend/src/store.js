import { reactive } from 'vue'

export const store = reactive({
  loggedIn: false,
  username: "",
  password: "",
  inputFormLogin:{
    input_rows: [
      { id: "username", label: "Username", information: "Enter your username" , placeholder: "Enter your username" },
      { id: "password", label: "Password", information: "Enter your password" , placeholder: "Enter your password" , type: "password"},
    ],
    values:{
      // username: "admin",
      // password: process.env.NODE_ENV === "development" ? "Admin123#": "",
      username: "",
      password: ""
    },
  },

})