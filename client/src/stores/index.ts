import { enableMapSet } from 'immer'
import { configureStore } from '@reduxjs/toolkit'
import userReducer from './UserStore'
import chatReducer from './ChatStore'
import roomReducer from './RoomStore'
import buildingReducer from './BuildingStore'
import npcReducer from './NpcStore'
import questReducer from './QuestStore'
import authReducer from './AuthStore'

enableMapSet()

const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    room: roomReducer,
    building: buildingReducer,
    npc: npcReducer,
    quest: questReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export default store
