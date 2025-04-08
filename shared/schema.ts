import { z } from 'zod';

export const insertUserSchema = z.object({
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha deve ter pelo menos 6 caracteres'),
  age: z.number().min(18, 'Você deve ter pelo menos 18 anos'),
  gender: z.enum(['male', 'female']),
  bio: z.string().optional(),
  photos: z.array(z.string()).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

export const insertMessageSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode estar vazia'),
  receiverId: z.number().int().positive(),
  senderId: z.number().int().positive()
});

export const insertProfileSchema = z.object({
  bio: z.string().optional(),
  photos: z.array(z.string()).optional(),
  age: z.number().min(18, 'Você deve ter pelo menos 18 anos').optional(),
  gender: z.enum(['male', 'female']).optional()
}); 