import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CurrentMsgState {
  currentMsg: null | string | File[];
}

const initialState: CurrentMsgState = {
  currentMsg: null,
};

const currentMsgSlice = createSlice({
  name: "currentMsg",
  initialState,
  reducers: {
    setCurrentMsg(state, action: PayloadAction<string | File[] | null>) {
      state.currentMsg = action.payload;
    },
    clearCurrentMsg(state) {
      state.currentMsg = null;
    },
  },
});

export const { setCurrentMsg, clearCurrentMsg } = currentMsgSlice.actions;

export default currentMsgSlice.reducer;
