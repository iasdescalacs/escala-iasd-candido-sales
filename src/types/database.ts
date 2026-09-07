export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Nullable<T> = T | null;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: Nullable<string>;
          full_name: string;
          email: string;
          phone: Nullable<string>;
          status: Database["public"]["Enums"]["user_status"];
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          auth_user_id?: Nullable<string>;
          full_name: string;
          email: string;
          phone?: Nullable<string>;
          status?: Database["public"]["Enums"]["user_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          auth_user_id?: Nullable<string>;
          full_name?: string;
          email?: string;
          phone?: Nullable<string>;
          status?: Database["public"]["Enums"]["user_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
      };
      roles: {
        Row: {
          id: string;
          key: Database["public"]["Enums"]["role_key"];
          name: string;
          description: Nullable<string>;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          key: Database["public"]["Enums"]["role_key"];
          name: string;
          description?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          key?: Database["public"]["Enums"]["role_key"];
          name?: string;
          description?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
      };
      churches: {
        Row: {
          id: string;
          name: string;
          city: string;
          state: string;
          active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          name: string;
          city?: string;
          state?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          state?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_at: string;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          assigned_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
      };
      user_church_links: {
        Row: {
          id: string;
          user_id: string;
          church_id: string;
          role_id: Nullable<string>;
          can_be_scheduled: boolean;
          is_manager: boolean;
          notes: Nullable<string>;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          user_id: string;
          church_id: string;
          role_id?: Nullable<string>;
          can_be_scheduled?: boolean;
          is_manager?: boolean;
          notes?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          user_id?: string;
          church_id?: string;
          role_id?: Nullable<string>;
          can_be_scheduled?: boolean;
          is_manager?: boolean;
          notes?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
      };
      history: {
        Row: {
          id: string;
          actor_user_id: Nullable<string>;
          entity_table: string;
          entity_id: Nullable<string>;
          action: string;
          details: Json;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          actor_user_id?: Nullable<string>;
          entity_table: string;
          entity_id?: Nullable<string>;
          action: string;
          details?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          actor_user_id?: Nullable<string>;
          entity_table?: string;
          entity_id?: Nullable<string>;
          action?: string;
          details?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: Nullable<string>;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json;
          description?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          status: Database["public"]["Enums"]["notification_status"];
          metadata: Json;
          read_at: Nullable<string>;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          status?: Database["public"]["Enums"]["notification_status"];
          metadata?: Json;
          read_at?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          status?: Database["public"]["Enums"]["notification_status"];
          metadata?: Json;
          read_at?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_app_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      current_user_has_role: {
        Args: { target_role: Database["public"]["Enums"]["role_key"] };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_status: "pending" | "approved" | "blocked" | "inactive";
      role_key: "admin" | "anciao" | "lider_musica" | "pregador" | "cantor";
      notification_status: "unread" | "read" | "archived";
    };
    CompositeTypes: Record<string, never>;
  };
};
