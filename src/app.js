import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import routes
import userRoutes from './routes/userRoutes.js';
import parcelRoutes from './routes/parcelRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// routes 
app.use('/api/users', userRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/payments', paymentRoutes);


app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app;
