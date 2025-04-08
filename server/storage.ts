import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, profiles, messages, notifications, plans } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/sugar_connection';
const client = postgres(connectionString);
const db = drizzle(client);

export const storage = {
  // User operations
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async createUser(userData: any) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  async updateUser(id: number, userData: any) {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async updateUserStripeInfo(id: number, stripeInfo: { customerId: string }) {
    const [user] = await db.update(users)
      .set({ stripeCustomerId: stripeInfo.customerId })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async updateUserApprovalStatus(id: number, approve: boolean) {
    const [user] = await db.update(users)
      .set({ isApproved: approve, isPending: false })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async updateSubscriptionPlan(id: number, plan: string) {
    const [user] = await db.update(users)
      .set({ subscriptionPlan: plan })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  // Profile operations
  async getProfile(userId: number) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  },

  async createProfile(profileData: any) {
    const [profile] = await db.insert(profiles).values(profileData).returning();
    return profile;
  },

  async updateProfile(userId: number, profileData: any) {
    const [profile] = await db.update(profiles)
      .set(profileData)
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  },

  // Message operations
  async getMessages(userId: number) {
    return await db.select().from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(messages.createdAt);
  },

  async getConversation(userId1: number, userId2: number) {
    return await db.select().from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  },

  async createMessage(messageData: any) {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  },

  async markMessageAsRead(messageId: number) {
    const [message] = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))
      .returning();
    return message;
  },

  // Notification operations
  async getNotifications(userId: number) {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  },

  async markNotificationAsRead(notificationId: number) {
    const [notification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return notification;
  },

  // Plan operations
  async getPlans() {
    return await db.select().from(plans);
  },

  async getPlan(id: number) {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  },

  // Admin operations
  async getPendingUsers() {
    return await db.select().from(users)
      .where(eq(users.isPending, true));
  }
}; 