import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { insertUserSchema, insertMessageSchema, insertProfileSchema } from '@shared/schema';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import Stripe from 'stripe';
import { uploadToCloudinary } from './cloudinary';

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

const router = Router();

// Authentication middleware
const authMiddleware = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Admin middleware
const adminMiddleware = async (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  next();
};

// Hash password helper
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Authentication routes
router.post('/register', async (req, res) => {
  try {
    // Handle file uploads
    const photos = req.files?.photos;
    const photoUrls = [];
    
    if (photos) {
      const photosArray = Array.isArray(photos) ? photos : [photos];
      for (const photo of photosArray) {
        const result = await uploadToCloudinary(photo.tempFilePath);
        photoUrls.push(result.secure_url);
      }
    }
    
    // Parse and validate user data
    const userData = insertUserSchema.parse({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      age: parseInt(req.body.age),
      gender: req.body.gender,
      bio: req.body.bio,
      photos: photoUrls
    });
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Omit confirmPassword and replace password with hashed version
    const { confirmPassword, ...userDataWithoutConfirmation } = userData;
    const userToCreate = {
      ...userDataWithoutConfirmation,
      password: hashedPassword
    };
    
    const user = await storage.createUser(userToCreate);
    
    // Automatically log in after registration
    req.session.userId = user.id;
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(1, 'Senha é obrigatória')
    }).parse(req.body);
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Email ou senha incorretos' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email ou senha incorretos' });
    }
    
    // For female users, check if they are approved
    if (user.gender === 'female' && !user.isApproved) {
      return res.status(403).json({ 
        message: 'Seu perfil está pendente de aprovação', 
        isPending: user.isPending 
      });
    }
    
    req.session.userId = user.id;
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

export default router; 