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
          approved_by_user_id: Nullable<string>;
          approved_at: Nullable<string>;
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
          approved_by_user_id?: Nullable<string>;
          approved_at?: Nullable<string>;
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
          approved_by_user_id?: Nullable<string>;
          approved_at?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      user_availability: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          service_date: string;
          worship_service_id: Nullable<string>;
          available: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          service_date: string;
          worship_service_id?: Nullable<string>;
          available?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          service_date?: string;
          worship_service_id?: Nullable<string>;
          available?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: Nullable<string>;
          platform: Nullable<string>;
          enabled: boolean;
          last_used_at: Nullable<string>;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: Nullable<string>;
          platform?: Nullable<string>;
          enabled?: boolean;
          last_used_at?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: Nullable<string>;
          platform?: Nullable<string>;
          enabled?: boolean;
          last_used_at?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Relationships: [];
      };
      swap_requests: {
        Row: {
          id: string;
          requester_user_id: string;
          target_user_id: string;
          source_service_id: string;
          target_service_id: string;
          role_key: Database["public"]["Enums"]["role_key"];
          status: Database["public"]["Enums"]["swap_request_status"];
          reason: Nullable<string>;
          decided_by_user_id: Nullable<string>;
          decided_at: Nullable<string>;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          requester_user_id: string;
          target_user_id: string;
          source_service_id: string;
          target_service_id: string;
          role_key: Database["public"]["Enums"]["role_key"];
          status?: Database["public"]["Enums"]["swap_request_status"];
          reason?: Nullable<string>;
          decided_by_user_id?: Nullable<string>;
          decided_at?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          requester_user_id?: string;
          target_user_id?: string;
          source_service_id?: string;
          target_service_id?: string;
          role_key?: Database["public"]["Enums"]["role_key"];
          status?: Database["public"]["Enums"]["swap_request_status"];
          reason?: Nullable<string>;
          decided_by_user_id?: Nullable<string>;
          decided_at?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Relationships: [];
      };
      worship_services: {
        Row: {
          id: string;
          church_id: string;
          service_date: string;
          service_type: Database["public"]["Enums"]["worship_service_type"];
          start_time: string;
          end_time: string;
          preacher_user_id: Nullable<string>;
          singer_user_id: Nullable<string>;
          preacher_name: Nullable<string>;
          singer_name: Nullable<string>;
          is_special: boolean;
          special_type: Nullable<Database["public"]["Enums"]["worship_special_type"]>;
          title: Nullable<string>;
          notes: Nullable<string>;
          created_at: string;
          updated_at: string;
          deleted_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          church_id: string;
          service_date: string;
          service_type: Database["public"]["Enums"]["worship_service_type"];
          start_time: string;
          end_time: string;
          preacher_user_id?: Nullable<string>;
          singer_user_id?: Nullable<string>;
          preacher_name?: Nullable<string>;
          singer_name?: Nullable<string>;
          is_special?: boolean;
          special_type?: Nullable<Database["public"]["Enums"]["worship_special_type"]>;
          title?: Nullable<string>;
          notes?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          church_id?: string;
          service_date?: string;
          service_type?: Database["public"]["Enums"]["worship_service_type"];
          start_time?: string;
          end_time?: string;
          preacher_user_id?: Nullable<string>;
          singer_user_id?: Nullable<string>;
          preacher_name?: Nullable<string>;
          singer_name?: Nullable<string>;
          is_special?: boolean;
          special_type?: Nullable<Database["public"]["Enums"]["worship_special_type"]>;
          title?: Nullable<string>;
          notes?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: Nullable<string>;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      clear_all_worship_services: {
        Args: { actor_id: string; dry_run?: boolean };
        Returns: number;
      };
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
      swap_request_status: "pending" | "approved" | "rejected" | "cancelled";
      worship_service_type: "quarta" | "sabado" | "domingo" | "especial";
      worship_special_type:
        | "semana_oracao"
        | "mini_semana_oracao"
        | "culto_gratidao"
        | "culto_virada"
        | "outro";
    };
    CompositeTypes: Record<string, never>;
  };
};
