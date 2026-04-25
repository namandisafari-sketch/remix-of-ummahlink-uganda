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
    PostgrestVersion: "14.5"
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
      operator_applications: {
        Row: {
          admin_notes: string | null
          bio: string | null
          city: string | null
          company_name: string
          contact_phone: string
          created_at: string
          created_operator_id: string | null
          district: string | null
          email: string | null
          id: string
          license_authority: string | null
          license_no: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          bio?: string | null
          city?: string | null
          company_name: string
          contact_phone: string
          created_at?: string
          created_operator_id?: string | null
          district?: string | null
          email?: string | null
          id?: string
          license_authority?: string | null
          license_no?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string
          contact_phone?: string
          created_at?: string
          created_operator_id?: string | null
          district?: string | null
          email?: string | null
          id?: string
          license_authority?: string | null
          license_no?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
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
      resource_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_comments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "shared_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_likes: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_likes_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "shared_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_resources: {
        Row: {
          author: string
          category: string
          created_at: string
          downloads: number
          embed_provider: string | null
          external_url: string | null
          file_path: string | null
          file_size: string | null
          id: string
          reciter_scope: string | null
          thumbnail_url: string | null
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
          embed_provider?: string | null
          external_url?: string | null
          file_path?: string | null
          file_size?: string | null
          id?: string
          reciter_scope?: string | null
          thumbnail_url?: string | null
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
          embed_provider?: string | null
          external_url?: string | null
          file_path?: string | null
          file_size?: string | null
          id?: string
          reciter_scope?: string | null
          thumbnail_url?: string | null
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
      tour_booking_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          method: string
          note: string | null
          paid_at: string | null
          pesapal_order_tracking_id: string | null
          pesapal_transaction_id: string | null
          recorded_by: string | null
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          method: string
          note?: string | null
          paid_at?: string | null
          pesapal_order_tracking_id?: string | null
          pesapal_transaction_id?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          note?: string | null
          paid_at?: string | null
          pesapal_order_tracking_id?: string | null
          pesapal_transaction_id?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_bookings: {
        Row: {
          created_at: string
          currency: string
          departure_date: string | null
          emergency_contact: string | null
          id: string
          notes: string | null
          operator_id: string
          package_id: string
          paid_amount: number
          passenger_email: string | null
          passenger_name: string
          passenger_phone: string
          passport_no: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          departure_date?: string | null
          emergency_contact?: string | null
          id?: string
          notes?: string | null
          operator_id: string
          package_id: string
          paid_amount?: number
          passenger_email?: string | null
          passenger_name: string
          passenger_phone: string
          passport_no?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          departure_date?: string | null
          emergency_contact?: string | null
          id?: string
          notes?: string | null
          operator_id?: string
          package_id?: string
          paid_amount?: number
          passenger_email?: string | null
          passenger_name?: string
          passenger_phone?: string
          passport_no?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tour_inquiries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          operator_id: string
          package_id: string | null
          phone: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          operator_id: string
          package_id?: string | null
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          operator_id?: string
          package_id?: string | null
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_inquiries_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "tour_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_inquiries_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "tour_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_operators: {
        Row: {
          active: boolean
          bio: string | null
          city: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          hero_url: string | null
          id: string
          license_authority: string | null
          license_no: string | null
          logo_url: string | null
          name: string
          owner_user_id: string
          slug: string
          updated_at: string
          verified: boolean
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          city?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          hero_url?: string | null
          id?: string
          license_authority?: string | null
          license_no?: string | null
          logo_url?: string | null
          name: string
          owner_user_id: string
          slug: string
          updated_at?: string
          verified?: boolean
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          city?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          hero_url?: string | null
          id?: string
          license_authority?: string | null
          license_no?: string | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          slug?: string
          updated_at?: string
          verified?: boolean
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      tour_packages: {
        Row: {
          active: boolean
          created_at: string
          departure_date: string | null
          departure_month: string | null
          description: string | null
          duration_days: number | null
          hotel_madinah: string | null
          hotel_makkah: string | null
          id: string
          image_url: string | null
          includes: string[] | null
          name: string
          operator_id: string
          price_ugx: number
          seats_available: number | null
          tier: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          departure_date?: string | null
          departure_month?: string | null
          description?: string | null
          duration_days?: number | null
          hotel_madinah?: string | null
          hotel_makkah?: string | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          name: string
          operator_id: string
          price_ugx?: number
          seats_available?: number | null
          tier?: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          departure_date?: string | null
          departure_month?: string | null
          description?: string | null
          duration_days?: number | null
          hotel_madinah?: string | null
          hotel_makkah?: string | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          name?: string
          operator_id?: string
          price_ugx?: number
          seats_available?: number | null
          tier?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_packages_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "tour_operators"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          operator_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          operator_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          operator_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_reviews_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "tour_operators"
            referencedColumns: ["id"]
          },
        ]
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
      user_preferences: {
        Row: {
          account_purpose: string | null
          age_range: string | null
          business_category: string | null
          business_description: string | null
          business_name: string | null
          constituency: string | null
          created_at: string
          district: string | null
          has_business: boolean
          hobbies: string[] | null
          id: string
          interests: string[] | null
          location_city: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          parish: string | null
          referral_source: string | null
          region: string | null
          subcounty: string | null
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          account_purpose?: string | null
          age_range?: string | null
          business_category?: string | null
          business_description?: string | null
          business_name?: string | null
          constituency?: string | null
          created_at?: string
          district?: string | null
          has_business?: boolean
          hobbies?: string[] | null
          id?: string
          interests?: string[] | null
          location_city?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          parish?: string | null
          referral_source?: string | null
          region?: string | null
          subcounty?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          account_purpose?: string | null
          age_range?: string | null
          business_category?: string | null
          business_description?: string | null
          business_name?: string | null
          constituency?: string | null
          created_at?: string
          district?: string | null
          has_business?: boolean
          hobbies?: string[] | null
          id?: string
          interests?: string[] | null
          location_city?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          parish?: string | null
          referral_source?: string | null
          region?: string | null
          subcounty?: string | null
          updated_at?: string
          user_id?: string
          village?: string | null
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
      app_role: "admin" | "moderator" | "user" | "operator"
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
      app_role: ["admin", "moderator", "user", "operator"],
    },
  },
} as const
