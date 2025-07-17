import { createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../api"
import axios from "axios"

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  id: string
  email: string
  username: string
  token: string
  role: "EMPLOYEE" | "HR" | null
  onBoardingStatus: "unsubmitted" | "pending" | "rejected" | "approved"
}

export type LoginError = {
  message: string
}

export const login = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: LoginError }
>("login", async (payload, thunkApi) => {
  try {
    const res = await api.post<LoginResponse>("login", payload)
    return res.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const msg =
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message
      return thunkApi.rejectWithValue({ message: msg })
    }
    return thunkApi.rejectWithValue({ message: "An unknown error occurred" })
  }
})
