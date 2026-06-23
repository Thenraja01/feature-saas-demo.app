import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import mongoose from "mongoose"

import { connectDB } from './config/database.js';
import featureFlagRoutes from './routes/featureFlagRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import authRoutes from './routes/authRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1
  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    message: dbReady ? 'Server is healthy' : 'Database not connected — start MongoDB on localhost:27017',
    mongo: dbReady ? 'connected' : 'disconnected',
  })
})

app.use('/api/v1/feature-flags', featureFlagRoutes);
app.use('/api/v1/auth/', authRoutes)
app.use('/api/v1/organizations', organizationRoutes);

const port = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()
    app.listen(port, () => console.log(`Server listening on port ${port}`))
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`)
    process.exit(1)
  }
}

startServer()
