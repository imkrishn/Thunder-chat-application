import { createSlice } from "@reduxjs/toolkit";


const addContactsSlice = createSlice({
  name: 'addContacts',
  initialState: {
    $id: '',
    fullName: '',
    logoUrl: ''
  },
  reducers: {
    setContact(state, action) {
      state.$id = action.payload.$id;
      state.fullName = action.payload.fullName
      state.logoUrl = action.payload.logoUrl
    }
  }
});

export const { setContact } = addContactsSlice.actions;

export default addContactsSlice.reducer;

