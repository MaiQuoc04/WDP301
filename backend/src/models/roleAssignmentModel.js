// Owner: Sáng — gán role tại 1 branch cho 1 account (staff làm nhiều branch) (UC-76/77)
const mongoose = require('mongoose')

const roleAssignmentSchema = new mongoose.Schema({
  account:  { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  branch:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  role:     { type: String, required: true }, // receptionist | housekeeper | branch_manager
  isActive: { type: Boolean, default: true },
  floors:   [{ type: Number }], // CHỈ housekeeper: các tầng phụ trách (branch manager set)
}, { timestamps: true })

roleAssignmentSchema.index({ account: 1, branch: 1, role: 1 }, { unique: true })
module.exports = mongoose.model('RoleAssignment', roleAssignmentSchema)
