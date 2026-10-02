import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { allowed, firstPath } from '../domain/access';
import type { SessionUser } from '../domain/models';
export { allowed, firstPath };
const session = createSlice({
    name: 'session',
    initialState: { user: null as SessionUser | null, ready: false, expired: false, notice: '' },
    reducers: {
        setUser(state, action: PayloadAction<SessionUser | null>) { state.user = action.payload; state.ready = true; if (action.payload)
            state.expired = false; },
        expire(state) { state.user = null; state.expired = true; state.ready = true; },
        setNotice(state, action: PayloadAction<string>) { state.notice = action.payload; },
    },
});
export const { setUser, expire, setNotice } = session.actions;
export const store = configureStore({ reducer: { session: session.reducer } });
export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
export const useSession = () => useSelector((state: ReturnType<typeof store.getState>) => state.session);
