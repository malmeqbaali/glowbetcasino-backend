import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

// --- AUTH ROUTES ---
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, password: hashed }
    });
    res.json({ message: 'User created', user });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login successful', token });
});

// --- WALLET ROUTES ---
app.get('/balance/:id', async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ balance: user.balance });
});

// --- GAME DEMO (Slots RNG) ---
app.post('/slots/play', async (req, res) => {
  const { betAmount } = req.body;
  const result = Math.random();
  const win = result > 0.7; // 30% win rate
  const payout = win ? betAmount * 2 : 0;
  res.json({ win, payout });
});

// --- START SERVER ---
app.listen(process.env.PORT || 5000, () => {
  console.log(`Backend running on port ${process.env.PORT || 5000}`);
});
