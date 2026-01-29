"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  failed_attempts?: number;
  locked_until?: string | null;
}

export async function getUsers(): Promise<AdminUser[]> {
  try {
    console.log("[USERS] Fetching users with optimized query");
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        locked_until: true
      },
      orderBy: { created_at: 'desc' }
    });

    console.log(`[USERS] Successfully fetched ${users.length} users`);
    return users.map(u => ({
      ...u,
      created_at: u.created_at.toISOString(),
      updated_at: u.updated_at.toISOString(),
      locked_until: u.locked_until ? u.locked_until.toISOString() : null,
      failed_attempts: 0
    }));
  } catch (error) {
    console.error("[USERS] Error fetching users:", error);
    return [];
  }
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  try {
    console.log(`[USERS] Fetching user by ID: ${id}`);
    const user = await prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        locked_until: true
      }
    });

    if (!user) {
      console.log(`[USERS] User not found with ID: ${id}`);
      return null;
    }

    console.log(`[USERS] Successfully fetched user: ${user.email}`);
    return {
      ...user,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      locked_until: user.locked_until ? user.locked_until.toISOString() : null,
      failed_attempts: 0
    };
  } catch (error) {
    console.error(`[USERS] Error fetching user with ID ${id}:`, error);
    return null;
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[USERS] Attempting to delete user with ID: ${id}`);
    
    const user = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, email: true }
    });

    if (!user) {
      console.log(`[USERS] User not found, cannot delete: ${id}`);
      return { success: false, error: "User not found" };
    }

    await prisma.adminUser.delete({
      where: { id }
    });

    console.log(`[USERS] Successfully deleted user: ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error("[USERS] Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user. Please try again.";
    return { success: false, error: errorMessage };
  }
}

export async function updateUser(id: string, updates: { name?: string; email?: string; role?: string }): Promise<{ success: boolean; error?: string; data?: AdminUser }> {
  try {
    console.log(`[USERS] Updating user with ID: ${id}`, updates);
    
    const user = await prisma.adminUser.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true
      }
    });

    console.log(`[USERS] Successfully updated user: ${user.email}`);
    return { success: true, data: { 
      ...user, 
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      failed_attempts: 0, 
      locked_until: null 
    } };
  } catch (error) {
    console.error("[USERS] Error updating user:", error);
    let errorMessage = "Failed to update user. Please try again.";
    
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        errorMessage = "Email already exists. Please use a different email address.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage, data: null };
  }
}

export async function unlockUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[USERS] Unlocking user with ID: ${id}`);
    
    await prisma.adminUser.update({
      where: { id },
      data: { 
        failed_attempts: 0, 
        locked_until: null 
      }
    });

    console.log(`[USERS] Successfully unlocked user with ID: ${id}`);
    return { success: true };
  } catch (error) {
    console.error("[USERS] Error unlocking user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to unlock user. Please try again.";
    return { success: false, error: errorMessage };
  }
}

export async function changePassword(id: string, newPassword: string): Promise<{ success: boolean; error?: string; data?: AdminUser }> {
  try {
    if (!newPassword || newPassword.length < 8) {
      console.log(`[USERS] Password validation failed for user ID: ${id}`);
      return { success: false, error: "Password must be at least 8 characters long.", data: null };
    }

    console.log(`[USERS] Changing password for user with ID: ${id}`);
    const hash = await bcrypt.hash(newPassword, 10);

    const user = await prisma.adminUser.update({
      where: { id },
      data: { 
        password_hash: hash,
        failed_attempts: 0,
        locked_until: null,
        is_default_password: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true
      }
    });

    console.log(`[USERS] Successfully changed password for user: ${user.email}`);
    return { success: true, data: { 
      ...user, 
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      failed_attempts: 0, 
      locked_until: null 
    } };
  } catch (error) {
    console.error("[USERS] Error changing password:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to change password. Please try again.";
    return { success: false, error: errorMessage, data: null };
  }
}

export async function createAdminUser(adminData: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<{ success: boolean; error?: string; data?: AdminUser }> {
  try {
    console.log(`[USERS] Creating new admin user: ${adminData.email}`);
    
    if (!adminData.name?.trim()) {
      return { success: false, error: "Name is required.", data: null };
    }
    
    if (!adminData.email?.trim() || !adminData.email.includes('@')) {
      return { success: false, error: "Valid email address is required.", data: null };
    }
    
    if (!adminData.password || adminData.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long.", data: null };
    }

    const hash = await bcrypt.hash(adminData.password, 10);

    const user = await prisma.adminUser.create({
      data: {
        name: adminData.name.trim(),
        email: adminData.email.toLowerCase().trim(),
        password_hash: hash,
        role: adminData.role || 'admin',
        is_active: true,
        failed_attempts: 0,
        is_default_password: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        locked_until: true
      }
    });

    console.log(`[USERS] Successfully created admin user: ${user.email}`);
    return { success: true, data: { 
      ...user, 
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      locked_until: user.locked_until ? user.locked_until.toISOString() : null,
      failed_attempts: 0 
    } };
  } catch (error) {
    console.error("[USERS] Error creating admin user:", error);
    let errorMessage = "Failed to create user. Please try again.";
    
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint") || error.message.includes("email")) {
        errorMessage = "A user with this email already exists.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage, data: null };
  }
}
