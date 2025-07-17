import { createAppSlice } from "../../app/createAppSlice"
import type { PayloadAction } from "@reduxjs/toolkit"
import { login as loginThunk } from "./authThunk"

export type AuthState = {
  id: string
  token: string
  username: string
  email: string
  role: "Employee" | "HR" | null
  login: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  id: "",
  token: "",
  username: "",
  email: "",
  role: null,
  login: false,
  loading: false,
  error: null,
}
// const initialState: AuthState = {
//   id: "68784931abe7312974122630",
//   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Nzg0OTMxYWJlNzMxMjk3NDEyMjYzMCIsInJvbGUiOiJIUiIsImlhdCI6MTc1Mjc0MjA2MiwiZXhwIjoxNzUyODI4NDYyfQ.usqBhW9tkcSOSO9AnPR20fDiYvDBuoF1OzExe-T1vN4",
//   username: "hradmin",
//   email: "hr@example.com",
//   role: "HR",
//   onBoardingStatus: "approved",
//   login: true,
// }

export type AuthPayload = {
  id: string
  token: string
  username: string
  email: string
  role: "Employee" | "HR" | null
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
      state.login = true
      state.error = null
    }),
    logout: create.reducer(state => {
      state.id = ""
      state.token = ""
      state.username = ""
      state.email = ""
      state.role = null
      state.login = false
      state.error = null
    }),
  }),
  extraReducers: builder => {
    builder
      .addCase(loginThunk.pending, state => {
        state.loading = true
        state.error = null
        state.login = false
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.id = action.payload.id
        state.token = action.payload.token
        state.username = action.payload.username
        state.email = action.payload.email
        state.role = action.payload.role
        state.login = true
        state.error = null
      })
      .addCase(loginThunk.rejected, state => {
        state.loading = false
        state.login = false
        state.error = action.payload?.message ?? "Login failed"
      })
  },
  selectors: {
    selectUser: state => state,
    selectRole: state => state.role,
    selectToken: state => state.token,
    selectLoginStatus: state => state.login,
    selectLoadingStatus: state => state.loading,
    selectError: state => state.error,
  },
})

export const { login, logout } = authSlice.actions
export const {
  selectUser,
  selectRole,
  selectToken,
  selectLoginStatus,
  selectLoadingStatus,
  selectError,
} = authSlice.selectors
export default authSlice.reducer
