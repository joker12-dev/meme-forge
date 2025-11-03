const express = require('express');
const path = require('path');
const app = express();

// Serve static files from build
app.use(express.static(path.join(__dirname, 'build')));

// SPA fallback - all routes go to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend server running on http://localhost:${PORT}`);
  console.log(`📱 Access from LAN: http://192.168.1.104:${PORT}`);
  console.log(`🌐 Access from internet: http://78.184.163.223:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} already in use!`);
    process.exit(1);
  }
});
