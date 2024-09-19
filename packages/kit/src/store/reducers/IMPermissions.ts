// src/store/slices/reminderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PermissionsState {
  [key: string]: {
    allowed: boolean;
  };
}

const initialState: PermissionsState = {};

const IMPermissionsSlice = createSlice({
  name: 'IMPermissions',
  initialState,
  reducers: {
    setPermissios: (state, action: PayloadAction<{ walletId: string; allowed:boolean}>) => {
      const { walletId,allowed } = action.payload;
      const key = `${walletId}`;
      if (!state[key]) {
        state[key] = { allowed: false };
      }
      state[key].allowed = allowed;
    }
  },
});

export const { setPermissios } = IMPermissionsSlice.actions;
export default IMPermissionsSlice.reducer;