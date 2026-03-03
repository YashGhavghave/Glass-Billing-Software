'use server';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, createAuthToken } from '@/lib/auth-token';
import { getCurrentUser } from '@/lib/auth-session';
import { createUserWithFallback } from '@/lib/user-service';

const RegisterSchema = z.object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

const LoginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

const ProfileSchema = z.object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    lastName: z.string().min(1, { message: 'Last name is required.' }),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
});

export async function loginUser(prevState, formData) {
    const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to login.',
            success: false,
        };
    }

    const { email, password } = validatedFields.data;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                passwordHash: true,
            },
        });

        if (!user || !user.passwordHash) {
            return {
                errors: { database: ['Invalid email or password.'] },
                message: 'Login failed.',
                success: false,
            };
        }

        const isValidPassword = await compare(password, user.passwordHash);
        if (!isValidPassword) {
            return {
                errors: { database: ['Invalid email or password.'] },
                message: 'Login failed.',
                success: false,
            };
        }

        const token = createAuthToken({ userId: user.id });
        cookies().set(AUTH_COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        redirect('/dashboard');
    }
    catch (error) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('loginUser failed:', error);
        return {
            errors: { database: ['Database error during login. Please try again.'] },
            message: 'Database error.',
            success: false,
        };
    }
}

export async function registerUser(prevState, formData) {
    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to register user.',
            success: false,
        };
    }
    const { email, password, firstName, lastName } = validatedFields.data;
    const passwordHash = await hash(password, 10);
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (existingUser) {
            return {
                errors: { database: ['An account with this email already exists.'] },
                message: 'Registration failed.',
                success: false,
            };
        }
        await createUserWithFallback(prisma, {
            email,
            passwordHash,
            firstName,
            lastName,
            role: UserRole.CUSTOMER,
        });
    }
    catch (error) {
        console.error('registerUser failed:', error);
        const errorMessage = process.env.NODE_ENV === 'development'
            ? (error?.message || 'Something went wrong. Please try again.')
            : 'Something went wrong. Please try again.';
        return {
            errors: {
                database: [errorMessage],
            },
            message: 'Database error.',
            success: false,
        };
    }
    return { message: 'Registration successful! Please log in.', success: true, errors: {} };
}

export async function logoutUser() {
    cookies().delete(AUTH_COOKIE_NAME);
    redirect('/login');
}

export async function updateProfile(prevState, formData) {
    const user = await getCurrentUser();
    if (!user) {
        return {
            success: false,
            message: 'Unauthorized. Please login again.',
            errors: { database: ['Unauthorized'] },
        };
    }

    const validatedFields = ProfileSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid profile fields.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { firstName, lastName, phone, avatar, timezone, language } = validatedFields.data;

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                firstName,
                lastName,
                phone: phone || null,
                avatar: avatar || null,
                timezone: timezone || null,
                language: language || 'en',
            },
        });

        return {
            success: true,
            message: 'Profile updated successfully.',
            errors: {},
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to update profile.',
            errors: { database: ['Failed to update profile.'] },
        };
    }
}
