import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET - Retrieve user's API key (without exposing the full key)
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const apiKey = await prisma.userAPIKey.findUnique({
            where: { userId },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                geminiApiKey: true,
            },
        });

        if (!apiKey) {
            return NextResponse.json(
                { success: true, hasApiKey: false },
                { status: 200 }
            );
        }

        // Return masked key for display
        const maskedKey = apiKey.geminiApiKey
            ? `${apiKey.geminiApiKey.slice(0, 8)}...${apiKey.geminiApiKey.slice(-8)}`
            : '';

        return NextResponse.json(
            {
                success: true,
                hasApiKey: true,
                maskedKey,
                createdAt: apiKey.createdAt,
                updatedAt: apiKey.updatedAt,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching API key:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Save or update user's API key
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { geminiApiKey } = body;

        if (!geminiApiKey || typeof geminiApiKey !== 'string' || geminiApiKey.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Invalid API key' },
                { status: 400 }
            );
        }

        // Upsert the API key
        const apiKey = await prisma.userAPIKey.upsert({
            where: { userId },
            update: {
                geminiApiKey: geminiApiKey.trim(),
                updatedAt: new Date(),
            },
            create: {
                userId,
                geminiApiKey: geminiApiKey.trim(),
            },
        });

        const maskedKey = `${apiKey.geminiApiKey.slice(0, 8)}...${apiKey.geminiApiKey.slice(-8)}`;

        return NextResponse.json(
            {
                success: true,
                message: 'API key saved successfully',
                maskedKey,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error saving API key:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Remove user's API key
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await prisma.userAPIKey.delete({
            where: { userId },
        });

        return NextResponse.json(
            { success: true, message: 'API key deleted successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: true, message: 'No API key found to delete' },
                { status: 200 }
            );
        }

        console.error('Error deleting API key:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
