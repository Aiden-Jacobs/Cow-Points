
import { supabase } from '../utils/supabaseClient.js';

/**
 * Fetch notifications for a user
 * @param {string} userId
 * @returns {Array} List of notifications
 */
export async function getNotifications(userId) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to recent 20 for now

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data;
}

/**
 * Get unread notification count
 * @param {string} userId
 * @returns {number} Count of unread notifications
 */
export async function getUnreadCount(userId) {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
    return count;
}

/**
 * Mark a notification as read
 * @param {string} notificationId
 */
export async function markAsRead(notificationId) {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
    }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId
 */
export async function markAllAsRead(userId) {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all as read:', error);
    }
}
