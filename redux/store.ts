import { configureStore } from '@reduxjs/toolkit'
import currentMsgSlice from '@/redux/slices/currentMsg'
import addContactsSlice from '@/redux/slices/addContact'
import recieverSlice from '@/redux/slices/reciever'
import chatRoomSlice from '@/redux/slices/chatRoom'
import loggedInUserSlice from '@/redux/slices/loggedInUser'
import msgNotificationSlice from '@/redux/slices/msgNotification'



export const store = configureStore({
  reducer: {
    currentMsg: currentMsgSlice,
    addContacts: addContactsSlice,
    reciever: recieverSlice,
    chatRoom: chatRoomSlice,
    loggedInUser: loggedInUserSlice,
    msgNotification: msgNotificationSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["setCurrentMsg"], // Ignore specific actions
        ignoredPaths: ["currentMsg"], // Ignore specific state paths
      },
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch