import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  username: null,
  password: null,
  token: null,
  videoCallId: null, // ✅ New field
  loading: false,
  error: null,
  user: null, // assuming you want to keep full user data
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `https://videochatapp-backend-wx80.onrender.com/api/auth/login`,
        { username, password }
      );

      // Store the token in localStorage
      localStorage.setItem("token", response.data.token);

      return response.data; // Must include `user` object with `videoCallId`
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `https://videochatapp-backend-wx80.onrender.com/api/auth/register`,
        { username, password }
      );
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
      state.username = null;
      state.password = null;
      state.videoCallId = null;
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
        state.username = action.payload.user.username;
        state.videoCallId = action.payload.user.videoCallId; // ✅ Assign it here
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
