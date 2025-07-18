// Placeholder for Express.js server
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ProjekSync Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 ProjekSync Backend running on port ${PORT}`);
});

export default app;