// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import type { PayloadAction } from '@reduxjs/toolkit'
// import { callApiGetAccount } from '../../services/api';

// // First, create the thunk
// export const fetchAccount = createAsyncThunk(
//   'user/fetchAccount',
//   async () => {
//     const response = await callApiGetAccount();
//     return response.data;
//   }
// )

// export interface userState {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   isRefreshingToken: boolean;
//   errorRefreshToken: string | null;
//   user: IUser | null;
// }

// const initialState: userState = {
//   isAuthenticated: false,
//   isLoading: false,
//   isRefreshingToken: false,
//   errorRefreshToken: null,
//   user: null,
// }

// export const userSlice = createSlice({
//   name: 'user',
//   initialState,
//   reducers: {
//     setUserLoginInfo: (state, action: PayloadAction<IUser>) => {
//       state.user = action.payload;
//       state.isAuthenticated = true;
//       state.isLoading = false;
//       state.isRefreshingToken = false;
//       state.errorRefreshToken = null;
//     }
//   },
//   extraReducers: (builder) => {
//     builder.addCase(fetchAccount.pending, (state, action) => {
//       if (action.payload) {
//         state.isAuthenticated = false;
//         state.isLoading = true;
//       }
//     })

//     builder.addCase(fetchAccount.fulfilled, (state, action) => {
//       if (action.payload) {
//         state.isAuthenticated = true;
//         state.isLoading = false;
//         state.user = action.payload;
//       }
//     })

//     builder.addCase(fetchAccount.rejected, (state, action) => {
//       if (action.payload) {
//         state.isAuthenticated = false;
//         state.isLoading = false;
//       }
//     })

//   }
// })

// // Action creators are generated for each case reducer function
// export const { setUserLoginInfo } = userSlice.actions

// export default userSlice.reducer