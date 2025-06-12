import { createSlice } from "@reduxjs/toolkit";
import { Course } from "~/types/shared.types";

export const globalSlice = createSlice({
  name: 'global',
  initialState: {
    course: Course.HTML,
  },
  reducers: {
    setCourse: (state, action) => {
      state.course = action.payload;
    },
  },
});

export const { setCourse } = globalSlice.actions;

export default globalSlice.reducer;