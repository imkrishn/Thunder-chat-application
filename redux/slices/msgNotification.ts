import { createSlice } from "@reduxjs/toolkit";

const msgNotificationSlice = createSlice({
  name: 'msgNotification',
  initialState: {
    message: '',
    timestamp: ''
  },
  reducers: {
    setMsgNotification(state, action) {
      state.message = action.payload.message;
      state.timestamp = action.payload.timestamp
    }
  }
})


export const { setMsgNotification } = msgNotificationSlice.actions;
export default msgNotificationSlice.reducer;