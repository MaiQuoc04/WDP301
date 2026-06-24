const svc = require('../services/notificationService')

const handle = (fn, code = 200) => async (req, res) => {
  try { res.status(code).json({ success: true, data: await fn(req) }) }
  catch (err) { res.status(err.status || 400).json({ success: false, message: err.message }) }
}

exports.list = handle((req) => svc.list(req.user.id, req.query))
exports.unreadCount = handle(async (req) => ({ count: await svc.unreadCount(req.user.id) }))
exports.markRead = handle((req) => svc.markRead(req.user.id, req.params.id))
exports.markAllRead = handle((req) => svc.markAllRead(req.user.id))
