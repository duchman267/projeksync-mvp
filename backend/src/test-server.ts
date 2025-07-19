import app from './server';

const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`✅ Test server started on port ${PORT}`);
  console.log('✅ Clients API routes should be available at:');
  console.log('   GET    /api/clients');
  console.log('   POST   /api/clients');
  console.log('   PUT    /api/clients/:id');
  console.log('   DELETE /api/clients/:id');
  console.log('✅ Server is ready for testing!');
  
  // Close server after a short delay
  setTimeout(() => {
    server.close(() => {
      console.log('✅ Test server closed successfully');
      process.exit(0);
    });
  }, 2000);
});