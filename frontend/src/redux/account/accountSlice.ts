import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { callFetchAccount } from "../../api";
import type { UserStatusType } from "../../common/enum";

export const fetchAccount = createAsyncThunk(
    'account/fetchAccount',
    async () => {
        const response = await callFetchAccount();
        return response.data;
    }
)

interface IState {
    isAuthenticated: boolean;
    isLoading: boolean;
    isRefreshToken: boolean;
    errorRefreshToken: string;
    user: {
        id: string;
        email: string;
        fullName: string;
        status: UserStatusType;
        role: {
            id: string;
            name: string;
        }
        permissions: {
            id: string;
            name: string;
            apiPath: string;
            method: string;
            module: string;
        }[]
    };
}

const initialState: IState = {
    isAuthenticated: false,
    isLoading: true,
    isRefreshToken: false,
    errorRefreshToken: '',
    user: {
        id: '',
        email: '',
        fullName: '',
        status: 'AVAILABLE',
        role: {
            id: '',
            name: ''
        },
        permissions: []
    }
}

export const accountSlice = createSlice({
    name: 'account',
    initialState,
    reducers: {
        setUserLoginInfo: (state, action) => {
            state.isAuthenticated = true;
            state.isLoading = false;
            state.errorRefreshToken = '';
            state.user.id = action.payload.id;
            state.user.email = action.payload.email;
            state.user.fullName = action.payload.fullName;
            state.user.status = action.payload.status;
            state.user.role.name = action.payload.role.name;
            state.user.permissions = action.payload.permissions;
        },
        setRefreshTokenAction: (state, action) => {
            state.isRefreshToken = action.payload?.status ?? false;
            state.errorRefreshToken = action.payload?.message ?? "";
        }
    },
    extraReducers: (builder) => {
        /**
         * pending: action.payload luôn undefined với createAsyncThunk pending
         * → Bỏ guard if(action.payload), set isLoading trực tiếp.
         * (initialState đã là isLoading=true nên case này chủ yếu để tường minh)
         */
        builder.addCase(fetchAccount.pending, (state) => {
            state.isAuthenticated = false;
            state.isLoading = true;
        })

        /**
         * fulfilled: Phải set isLoading=false TRƯỚC KHI kiểm tra payload.
         * Bug cũ: nếu payload=undefined (API trả về rỗng / interceptor nuốt lỗi),
         * isLoading không bao giờ được set false → ProtectedRoute spinner vô tận.
         */
        builder.addCase(fetchAccount.fulfilled, (state, action) => {
            // Luôn tắt loading bất kể payload có dữ liệu hay không
            state.isLoading = false;

            if (action.payload) {
                state.isAuthenticated = true;
                state.user.id = action.payload.user.id;
                state.user.email = action.payload.user.email;
                state.user.fullName = action.payload.user.fullName;
                state.user.status = action.payload.user.status;
                state.user.role.name = action.payload.user.role.name;
                state.user.permissions = action.payload.user.permissions;
            } else {
                // payload rỗng = token hết hạn và interceptor không throw error
                // → Coi như chưa xác thực, ProtectedRoute sẽ redirect /login
                state.isAuthenticated = false;
            }
        })

        /**
         * rejected: Tương tự — phải set isLoading=false bất điều kiện.
         * Bug cũ: if(action.payload) → thunk reject không đính payload
         * trừ khi dùng rejectWithValue() → handler không bao giờ chạy.
         */
        builder.addCase(fetchAccount.rejected, (state) => {
            state.isAuthenticated = false;
            state.isLoading = false;
        })
    }
})

export const { setUserLoginInfo, setRefreshTokenAction } = accountSlice.actions;

export default accountSlice.reducer;