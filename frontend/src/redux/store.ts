import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './counter/counterSlice'
import accountReducer from './account/accountSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    account: accountReducer,
    // user: userReducer
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch