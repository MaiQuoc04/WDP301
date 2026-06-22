const svc = require('../services/housekeepingService')

const handle = (fn, code = 200) => async (req, res) => {
  try {
    res.status(code).json({ success: true, data: await fn(req) })
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message })
  }
}

exports.listTasks = handle((req) => svc.listTasks(req.user.id, req.query))
exports.getTaskDetail = handle((req) => svc.getTaskDetail(req.user.id, req.params.id))
exports.claimTask = handle((req) => svc.claimTask(req.user.id, req.params.id))
exports.startTask = handle((req) => svc.startTask(req.user.id, req.params.id))
exports.saveAmenityReport = handle((req) => svc.saveAmenityReport(req.user.id, req.params.id, req.body.report))
exports.reportIssue = handle((req) => svc.reportIssue(req.user.id, req.params.id, req.body), 201)
exports.markMaintenance = handle((req) => svc.markMaintenance(req.user.id, req.params.id, req.body))
exports.completeTask = handle((req) => svc.completeTask(req.user.id, req.params.id))
exports.getHistory = handle((req) => svc.getHistory(req.user.id, req.query))
