export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts_janaza: {
        Row: {
          active: boolean
          contact: string
          created_at: string
          description: string | null
          id: string
          location: string
          maps_link: string | null
          time: string
          title: string
          type: string
          updated_at: string
          urgent: boolean
          user_id: string
        }
        Insert: {
          active?: boolean
          contact: string
          created_at?: string
          description?: string | null
          id?: string
          location: string
          maps_link?: string | null
          time: string
          title: string
          type: string
          updated_at?: string
          urgent?: boolean
          user_id: string
        }
        Update: {
          active?: boolean
          contact?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          maps_link?: string | null
          time?: string
          title?: string
          type?: string
          updated_at?: string
          urgent?: boolean
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string
          donor_name: string | null
          id: string
          pesapal_order_tracking_id: string | null
          pesapal_transaction_id: string | null
          phone: string | null
          project_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          donor_name?: string | null
          id?: string
          pesapal_order_tracking_id?: string | null
          pesapal_transaction_id?: string | null
          phone?: string | null
          project_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          donor_name?: string | null
          id?: string
          pesapal_order_tracking_id?: string | null
          pesapal_transaction_id?: string | null
          phone?: string | null
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mosque_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_banners: {
        Row: {
          active: boolean
          badge: string | null
          created_at: string
          cta_label: string | null
          cta_link: string | null
          id: string
          image_url: string | null
          published_at: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
          variant: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          id?: string
          image_url?: string | null
          published_at?: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
          variant?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          id?: string
          image_url?: string | null
          published_at?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
          variant?: string
        }
        Relationships: []
      }
      masjid_submissions: {
        Row: {
          address: string | null
          admin_notes: string | null
          city: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          district: string | null
          id: string
          imam_name: string | null
          latitude: number
          longitude: number
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          id?: string
          imam_name?: string | null
          latitude: number
          longitude: number
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          id?: string
          imam_name?: string | null
          latitude?: number
          longitude?: number
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      masjids: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          description: string | null
          district: string | null
          facilities: string[] | null
          id: string
          image_url: string | null
          imam_name: string | null
          latitude: number
          longitude: number
          name: string
          prayer_times: Json | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          facilities?: string[] | null
          id?: string
          image_url?: string | null
          imam_name?: string | null
          latitude: number
          longitude: number
          name: string
          prayer_times?: Json | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          facilities?: string[] | null
          id?: string
          image_url?: string | null
          imam_name?: string | null
          latitude?: number
          longitude?: number
          name?: string
          prayer_times?: Json | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      mosque_projects: {
        Row: {
          active: boolean
          beneficiaries: number | null
          category: string | null
          created_at: string
          deadline: string | null
          description: string | null
          gallery: string[] | null
          goal: number
          id: string
          image_url: string | null
          location: string | null
          mosque: string
          name: string
          raised: number
          updated_at: string
          video_links: string[] | null
        }
        Insert: {
          active?: boolean
          beneficiaries?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          gallery?: string[] | null
          goal?: number
          id?: string
          image_url?: string | null
          location?: string | null
          mosque: string
          name: string
          raised?: number
          updated_at?: string
          video_links?: string[] | null
        }
        Update: {
          active?: boolean
          beneficiaries?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          gallery?: string[] | null
          goal?: number
          id?: string
          image_url?: string | null
          location?: string | null
          mosque?: string
          name?: string
          raised?: number
          updated_at?: string
          video_links?: string[] | null
        }
        Relationships: []
      }
      mosque_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          masjid_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          masjid_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          masjid_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosque_reviews_masjid_id_fkey"
            columns: ["masjid_id"]
            isOneToOne: false
            referencedRelation: "masjids"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_resources: {
        Row: {
          author: string
          category: string
          created_at: string
          downloads: number
          file_path: string
          file_size: string | null
          id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author: string
          category: string
          created_at?: string
          downloads?: number
          file_path: string
          file_size?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string
          category?: string
          created_at?: string
          downloads?: number
          file_path?: string
          file_size?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sheikhs: {
        Row: {
          active: boolean
          channel_name: string | null
          channel_url: string
          country: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          rank: number
          subscribers: string | null
          title: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          channel_name?: string | null
          channel_url: string
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rank?: number
          subscribers?: string | null
          title?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          channel_name?: string | null
          channel_url?: string
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rank?: number
          subscribers?: string | null
          title?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      tv_content: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          is_live: boolean
          platform: string
          scheduled_at: string | null
          sort_order: number
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          video_url: string
          views: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_live?: boolean
          platform?: string
          scheduled_at?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          type?: string
          updated_at?: string
          video_url: string
          views?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_live?: boolean
          platform?: string
          scheduled_at?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          video_url?: string
          views?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_download_count: {
        Args: { resource_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
