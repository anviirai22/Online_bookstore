const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (_req, res) => {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ data: { status: database === 'connected' ? 'ok' : 'degraded', database, uptimeSeconds: Math.round(process.uptime()), timestamp: new Date().toISOString() } });
});

module.exports = router;
