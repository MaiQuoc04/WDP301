const authService = require('../services/authService')
exports.register = async (req, res) => {
  try { res.status(201).json({ success: true, data: await authService.register(req.body) }) }
  catch (err) { res.status(400).json({ success: false, message: err.message }) }
}
exports.login = async (req, res) => {
  try { res.status(200).json({ success: true, data: await authService.login(req.body) }) }
  catch (err) { res.status(401).json({ success: false, message: err.message }) }
}
exports.logout = async (req, res) => res.status(200).json({ success: true, message: 'Logged out' })
