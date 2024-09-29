// src/store/slices/versionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VersionState {
    version: string | undefined;
}

const initialState: VersionState = {
    version: '1.0 BETA', // 初始版本号
};

const versionSlice = createSlice({
  name: 'version',
  initialState,
  reducers: {
    setVersion: (state, action: PayloadAction<string>) => {
      state.version = action.payload;
    },
  },
});

export const { setVersion } = versionSlice.actions;
export default versionSlice.reducer;