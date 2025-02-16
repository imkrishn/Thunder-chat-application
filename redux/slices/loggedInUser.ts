import { createSlice } from "@reduxjs/toolkit";


const loggedInUserSlice = createSlice({
  name: 'loggedInUser',
  initialState: {
    loggedInUserName: '',
    loggedInUserId: ''
  },
  reducers: {
    setLoggedInUser(state, action) {
      state.loggedInUserName = action.payload.loggedInUserName;
      state.loggedInUserId = action.payload.loggedInUserId

    }
  }
});


export const { setLoggedInUser } = loggedInUserSlice.actions;
export default loggedInUserSlice.reducer;