import { createSlice } from "@reduxjs/toolkit";

interface Contact {
  $id: string;
  fullName?: string;
  membersId?: string[];
  chatType?: string;
  logoUrl?: string;
}

const initialState: Contact = {
  $id: '',
  fullName: '',
  membersId: [],
  chatType: '',
  logoUrl: ''
}

const recieverSlice = createSlice({
  name: 'reciever',
  initialState,
  reducers: {
    setReciever(state, action) {
      state.$id = action.payload.$id;
      state.fullName = action.payload.fullName;
      state.membersId = action.payload.membersId;
      state.chatType = action.payload.chatType;
      state.logoUrl = action.payload.logoUrl
    },
    resetReciever(state) {
      state.$id = '';
      state.fullName = '';
      state.membersId = [];
      state.chatType = '';
      state.logoUrl = '';
    }
  }
});


export const { setReciever, resetReciever } = recieverSlice.actions;
export default recieverSlice.reducer;