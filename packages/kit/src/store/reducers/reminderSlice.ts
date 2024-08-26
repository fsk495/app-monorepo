// src/store/slices/reminderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ReminderState {
  [key: string]: {
    reminded: boolean;
    backedUp: boolean;
  };
}

const initialState: ReminderState = {};

const reminderSlice = createSlice({
  name: 'reminder',
  initialState,
  reducers: {
    setReminded: (state, action: PayloadAction<{ walletId: string; networkId: string }>) => {
      const { walletId, networkId } = action.payload;
      const key = `${walletId}_${networkId}`;
      if (!state[key]) {
        state[key] = { reminded: false, backedUp: false };
      }
      state[key].reminded = true;
    },
    setBackedUp: (state, action: PayloadAction<{ walletId: string; networkId: string }>) => {
      const { walletId, networkId } = action.payload;
      const key = `${walletId}_${networkId}`;
      if (!state[key]) {
        state[key] = { reminded: false, backedUp: false };
      }
      state[key].backedUp = true;
    },
  },
});

export const { setReminded, setBackedUp } = reminderSlice.actions;
export default reminderSlice.reducer;