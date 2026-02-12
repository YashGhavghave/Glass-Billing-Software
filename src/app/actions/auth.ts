'use server';

import { z } from 'zod';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

const RegisterSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export type RegisterState = {
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    password?: string[];
    database?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function registerUser(
  prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const validatedFields = RegisterSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Failed to register user.',
      success: false,
    };
  }

  const { email, password, firstName, lastName } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        errors: { database: ['An account with this email already exists.'] },
        message: 'Registration failed.',
        success: false,
      };
    }

    const passwordHash = await hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: UserRole.CUSTOMER,
      },
    });
  } catch (error) {
    return {
      errors: { database: ['Something went wrong. Please try again.'] },
      message: 'Database error.',
      success: false,
    };
  }
  
  return { message: 'Registration successful! Please log in.', success: true, errors: {} };
}
