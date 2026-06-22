import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import adminService from '../../services/adminService'

export const fetchBranches = createAsyncThunk('admin/fetchBranches', async (_, thunkAPI) => {
  try { return await adminService.getBranches() }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const createBranch = createAsyncThunk('admin/createBranch', async (data, thunkAPI) => {
  try { return await adminService.createBranch(data) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const toggleBranch = createAsyncThunk('admin/toggleBranch', async (id, thunkAPI) => {
  try { return await adminService.toggleBranchActive(id) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const fetchStaff = createAsyncThunk('admin/fetchStaff', async (_, thunkAPI) => {
  try { return await adminService.getAllStaff() }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const createStaff = createAsyncThunk('admin/createStaff', async (data, thunkAPI) => {
  try { return await adminService.createStaff(data) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const toggleAccount = createAsyncThunk('admin/toggleAccount', async (id, thunkAPI) => {
  try { return await adminService.toggleAccountActive(id) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const updateBranch = createAsyncThunk('admin/updateBranch', async ({ id, data }, thunkAPI) => {
  try { return await adminService.updateBranch(id, data) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const changeStaffRole = createAsyncThunk('admin/changeStaffRole', async ({ accountId, role }, thunkAPI) => {
  try { return await adminService.changeStaffRole(accountId, role) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const assignStaffBranch = createAsyncThunk('admin/assignStaffBranch', async ({ accountId, branchId }, thunkAPI) => {
  try { return await adminService.assignStaffBranch(accountId, branchId) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const removeStaffBranch = createAsyncThunk('admin/removeStaffBranch', async (assignmentId, thunkAPI) => {
  try { return await adminService.removeStaffBranch(assignmentId) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (role, thunkAPI) => {
  try { return await adminService.getAllAccounts(role) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const fetchDashboardStats = createAsyncThunk('admin/fetchDashboardStats', async (_, thunkAPI) => {
  try { return await adminService.getDashboardStats() }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

export const fetchBranchDashboard = createAsyncThunk('admin/fetchBranchDashboard', async (branchId, thunkAPI) => {
  try { return await adminService.getBranchDashboard(branchId) }
  catch (err) { return thunkAPI.rejectWithValue(err.response?.data?.message || err.message) }
})

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    branches: [],
    staffList: [],
    usersList: [],
    dashboardStats: null,
    branchDashboard: null,
    loading: false,
    error: null
  },
  reducers: {
    clearAdminError: (state) => { state.error = null }
  },
  extraReducers: (builder) => {
    builder
      // Branches
      .addCase(fetchBranches.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false
        state.branches = action.payload
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.branches.unshift(action.payload)
      })
      .addCase(toggleBranch.fulfilled, (state, action) => {
        const index = state.branches.findIndex(b => b._id === action.payload._id)
        if (index !== -1) state.branches[index] = action.payload
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        const index = state.branches.findIndex(b => b._id === action.payload._id)
        if (index !== -1) state.branches[index] = action.payload
      })
      // Staff
      .addCase(fetchStaff.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false
        state.staffList = action.payload
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createStaff.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(toggleAccount.fulfilled, (state, action) => {
        const staff = state.staffList.find(s => s.account?._id === action.payload._id)
        if (staff) staff.account.isActive = action.payload.isActive

        const user = state.usersList.find(u => u._id === action.payload._id)
        if (user) user.isActive = action.payload.isActive
      })
      // Users/Accounts listing
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.usersList = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false
        state.dashboardStats = action.payload
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Branch Dashboard Stats
      .addCase(fetchBranchDashboard.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchBranchDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.branchDashboard = action.payload
      })
      .addCase(fetchBranchDashboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearAdminError } = adminSlice.actions
export default adminSlice.reducer


