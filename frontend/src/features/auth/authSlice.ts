import { createAppSlice } from "../../app/createAppSlice"
import type { PayloadAction } from "@reduxjs/toolkit"

export type AuthState = {
  id: string
  token: string
  username: string
  email: string
  role: string
  onBoardingStatus: "unsubmitted" | "pending" | "rejected" | "approved"
  login: boolean
}

const initialState: AuthState = {
  id: "",
  token: "",
  username: "",
  email: "",
  role: "EMPLOYEE",
  onBoardingStatus: "unsubmitted",
  login: false,
}

export type AuthPayload = {
  id: string
  token: string
  username: string
  email: string
  role: string
  onBoardingStatus: "unsubmitted" | "pending" | "rejected" | "approved"
}

export const authSlice = createAppSlice({
  name: "auth",
  initialState,
  reducers: create => ({
    login: create.reducer((state, action: PayloadAction<AuthPayload>) => {
      state.id = action.payload.id
      state.token = action.payload.token
      state.username = action.payload.username
      state.email = action.payload.email
      state.role = action.payload.role
      state.onBoardingStatus = action.payload.onBoardingStatus
      state.login = true
    }),
    logout: create.reducer(state => {
      state.id = ""
      state.token = ""
      state.username = ""
      state.email = ""
      state.role = ""
      state.onBoardingStatus = "unsubmitted"
      state.login = false
    }),
  }),
  selectors: {
    selectUser: state => state,
    selectRole: state => state.role,
    selectToken: state => state.token,
    selectOnBoardingStatus: state => state.onBoardingStatus,
    selectLoginStatus: state => state.login,
  },
})

export const { login, logout } = authSlice.actions
export const {
  selectUser,
  selectRole,
  selectToken,
  selectOnBoardingStatus,
  selectLoginStatus,
} = authSlice.selectors
export default authSlice.reducer
