import { createSlice } from "@reduxjs/toolkit";

interface ChatRoom {
  $id: string
  name?: string
  chatType: 'group' | 'single' | ''
  blockedIds?: string[]
  memberIds?: string[]
  deleteChatIds?: string[]
}

const initialState: ChatRoom = {
  $id: '',
  name: '',
  chatType: '',
  blockedIds: [],
  memberIds: [],
  deleteChatIds: []
}

const chatRoomSlice = createSlice({
  name: 'chatRoom',
  initialState,
  reducers: {
    setChatRoom(state, action) {
      state.$id = action.payload.$id
      state.name = action.payload.name
      state.chatType = action.payload.chatType
      state.blockedIds = action.payload.blockedIds
      state.memberIds = action.payload.memberIds
      state.deleteChatIds = action.payload.deleteChatIds
    }
  }
});

export const { setChatRoom } = chatRoomSlice.actions;
export default chatRoomSlice.reducer;