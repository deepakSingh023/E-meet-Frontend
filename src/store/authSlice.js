import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


const initialState = {
    username: null,
    password: null,
    loading: false,
    error: null,
};

export const loginUser = createAsyncThunk(
    "auth/loginUser", // Action type prefix
    async ({ username, password }, { rejectWithValue }) => {
      try {
        const response = await axios.post(`${process.env.backendURL}/api/auth/login`, { username, password });
  
        // Store the token in localStorage
        localStorage.setItem("token", response.data.token);
  
        return response.data; // This goes to `fulfilled` case
      } catch (error) {
        return rejectWithValue(error.response.data); // This goes to `rejected` case
      }
    }
  );

  export const registerUser = createAsyncThunk(
    "auth/registerUser",
    async ({ username, password }, { rejectWithValue }) => {
      try {
        const response = await axios.post(`${process.env.backendURL}/api/auth/register`, { username, password});
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  export const logoutUser = () => (dispatch) => {
    localStorage.removeItem("token");
    dispatch(authSlice.actions.logout());
  };
  
  const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
      logout: (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(loginUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
          state.loading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
        })
        .addCase(loginUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        .addCase(registerUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(registerUser.fulfilled, (state) => {
          state.loading = false;
        })
        .addCase(registerUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });
    },
  });
  
  export default authSlice.reducer;