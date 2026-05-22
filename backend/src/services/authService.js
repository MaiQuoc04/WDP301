const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

exports.register = async ({ name, email, password }) => {
  if (await User.findOne({ email })) throw new Error('Email already registered')
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) })
  return { id: user._id, name: user.name, email: user.email }
}

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email })
  if (!user || !(await bcrypt.compare(password, user.password))) throw new Error('Invalid credentials')
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
  return { token, user: { id: user._id, name: user.name, email: user.email } }
}
