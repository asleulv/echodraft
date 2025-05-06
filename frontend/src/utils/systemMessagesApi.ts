import axios from 'axios';
import api from './api';

// Type definitions for system messages
export interface SystemMessage {
  id: number;
  title: string | null;
  message: string;
  message_type: 'info' | 'warning' | 'success' | 'error';
  disable_functionality?: boolean;
}

// API functions for system messages
export const systemMessagesAPI = {
  /**
   * Get the active message for a specific location
   * @param location The location to get the message for (dashboard, subscription, register)
   * @returns The active message for the location, or null if no active message
   */
  getActiveMessage: async (location: string): Promise<SystemMessage | null> => {
    try {
      const response = await api.get(`system-messages/active-message/${location}/`);
      return response.data;
    } catch (error) {
      // If we get a 204 No Content, it means there's no active message
      if (axios.isAxiosError(error) && error.response?.status === 204) {
        return null;
      }
      console.error(`Error fetching system message for ${location}:`, error);
      return null;
    }
  }
};
