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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accommodations: {
        Row: {
          address: string | null
          amenities: Json | null
          booking_reference: string | null
          booking_url: string | null
          cancellation_policy: string | null
          check_in: string
          check_out: string
          color: string | null
          coordinates: Json | null
          cost: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_confirmed: boolean | null
          location: string | null
          name: string
          nights: number | null
          notes: string | null
          plan_version_id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          booking_reference?: string | null
          booking_url?: string | null
          cancellation_policy?: string | null
          check_in: string
          check_out: string
          color?: string | null
          coordinates?: Json | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_confirmed?: boolean | null
          location?: string | null
          name: string
          nights?: number | null
          notes?: string | null
          plan_version_id: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          booking_reference?: string | null
          booking_url?: string | null
          cancellation_policy?: string | null
          check_in?: string
          check_out?: string
          color?: string | null
          coordinates?: Json | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_confirmed?: boolean | null
          location?: string | null
          name?: string
          nights?: number | null
          notes?: string | null
          plan_version_id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          booking_reference: string | null
          booking_status: string | null
          cost: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          itinerary_day_id: string
          location: string | null
          name: string
          notes: string | null
          plan_version_id: string
          sort_order: number | null
          time_end: string | null
          time_start: string | null
          updated_at: string | null
        }
        Insert: {
          booking_reference?: string | null
          booking_status?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          itinerary_day_id: string
          location?: string | null
          name: string
          notes?: string | null
          plan_version_id: string
          sort_order?: number | null
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_reference?: string | null
          booking_status?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          itinerary_day_id?: string
          location?: string | null
          name?: string
          notes?: string | null
          plan_version_id?: string
          sort_order?: number | null
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_itinerary_day_id_fkey"
            columns: ["itinerary_day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_research_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          model: string | null
          query: string
          query_type: string | null
          results: Json
          tokens_used: number | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          model?: string | null
          query: string
          query_type?: string | null
          results: Json
          tokens_used?: number | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          model?: string | null
          query?: string
          query_type?: string | null
          results?: Json
          tokens_used?: number | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_research_cache_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          amount_paid: number | null
          booking_reference: string | null
          booking_status: string
          booking_url: string | null
          category: string
          created_at: string
          deposit_amount: number | null
          description: string | null
          id: string
          is_fully_paid: boolean
          name: string
          notes: string | null
          payment_due_context: string | null
          payment_due_date: string | null
          payment_type: string
          plan_version_id: string
          sort_order: number
          source_id: string | null
          source_type: string | null
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          booking_reference?: string | null
          booking_status?: string
          booking_url?: string | null
          category?: string
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          id?: string
          is_fully_paid?: boolean
          name: string
          notes?: string | null
          payment_due_context?: string | null
          payment_due_date?: string | null
          payment_type?: string
          plan_version_id: string
          sort_order?: number
          source_id?: string | null
          source_type?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          booking_reference?: string | null
          booking_status?: string
          booking_url?: string | null
          category?: string
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          id?: string
          is_fully_paid?: boolean
          name?: string
          notes?: string | null
          payment_due_context?: string | null
          payment_due_date?: string | null
          payment_type?: string
          plan_version_id?: string
          sort_order?: number
          source_id?: string | null
          source_type?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          message: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          message: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          message?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      costs: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          id: string
          is_estimated: boolean | null
          is_paid: boolean | null
          item: string
          itinerary_day_id: string | null
          notes: string | null
          plan_version_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_estimated?: boolean | null
          is_paid?: boolean | null
          item: string
          itinerary_day_id?: string | null
          notes?: string | null
          plan_version_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_estimated?: boolean | null
          is_paid?: boolean | null
          item?: string
          itinerary_day_id?: string | null
          notes?: string | null
          plan_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "costs_itinerary_day_id_fkey"
            columns: ["itinerary_day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          created_at: string | null
          decided_at: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          options: Json | null
          plan_version_id: string | null
          priority: string | null
          selected_option: number | null
          status: string | null
          title: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          decided_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          options?: Json | null
          plan_version_id?: string | null
          priority?: string | null
          selected_option?: number | null
          status?: string | null
          title: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          decided_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          options?: Json | null
          plan_version_id?: string | null
          priority?: string | null
          selected_option?: number | null
          status?: string | null
          title?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          linked_item_id: string | null
          linked_item_type: string | null
          notes: string | null
          plan_version_id: string | null
          trip_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          linked_item_id?: string | null
          linked_item_type?: string | null
          notes?: string | null
          plan_version_id?: string | null
          trip_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          linked_item_id?: string | null
          linked_item_type?: string | null
          notes?: string | null
          plan_version_id?: string | null
          trip_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_days: {
        Row: {
          activities: Json | null
          color: string | null
          created_at: string | null
          date: string | null
          day_number: number
          drive_distance: string | null
          drive_time: string | null
          icon: string | null
          id: string
          location: string
          location_coordinates: Json | null
          notes: string | null
          plan_version_id: string
          updated_at: string | null
        }
        Insert: {
          activities?: Json | null
          color?: string | null
          created_at?: string | null
          date?: string | null
          day_number: number
          drive_distance?: string | null
          drive_time?: string | null
          icon?: string | null
          id?: string
          location: string
          location_coordinates?: Json | null
          notes?: string | null
          plan_version_id: string
          updated_at?: string | null
        }
        Update: {
          activities?: Json | null
          color?: string | null
          created_at?: string | null
          date?: string | null
          day_number?: number
          drive_distance?: string | null
          drive_time?: string | null
          icon?: string | null
          id?: string
          location?: string
          location_coordinates?: Json | null
          notes?: string | null
          plan_version_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      packing_items: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          id: string
          name: string
          packed: boolean | null
          quantity: number
          sort_order: number | null
          trip_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          id?: string
          name: string
          packed?: boolean | null
          quantity?: number
          sort_order?: number | null
          trip_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          id?: string
          name?: string
          packed?: boolean | null
          quantity?: number
          sort_order?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_versions: {
        Row: {
          color: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          total_cost: number | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          total_cost?: number | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          total_cost?: number | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      transport: {
        Row: {
          booking_url: string | null
          cost: number | null
          created_at: string | null
          currency: string | null
          dropoff_date: string | null
          dropoff_location: string | null
          dropoff_time: string | null
          id: string
          includes: Json | null
          is_confirmed: boolean | null
          notes: string | null
          pickup_date: string | null
          pickup_location: string | null
          pickup_time: string | null
          plan_version_id: string
          provider: string | null
          reference_number: string | null
          type: string
          updated_at: string | null
          vehicle: string | null
        }
        Insert: {
          booking_url?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          dropoff_date?: string | null
          dropoff_location?: string | null
          dropoff_time?: string | null
          id?: string
          includes?: Json | null
          is_confirmed?: boolean | null
          notes?: string | null
          pickup_date?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          plan_version_id: string
          provider?: string | null
          reference_number?: string | null
          type: string
          updated_at?: string | null
          vehicle?: string | null
        }
        Update: {
          booking_url?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          dropoff_date?: string | null
          dropoff_location?: string | null
          dropoff_time?: string | null
          id?: string
          includes?: Json | null
          is_confirmed?: boolean | null
          notes?: string | null
          pickup_date?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          plan_version_id?: string
          provider?: string | null
          reference_number?: string | null
          type?: string
          updated_at?: string | null
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_insurance: {
        Row: {
          coverage_end: string | null
          coverage_start: string | null
          created_at: string | null
          document_url: string | null
          emergency_phone: string | null
          id: string
          notes: string | null
          policy_number: string | null
          provider: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          coverage_end?: string | null
          coverage_start?: string | null
          created_at?: string | null
          document_url?: string | null
          emergency_phone?: string | null
          id?: string
          notes?: string | null
          policy_number?: string | null
          provider: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          coverage_end?: string | null
          coverage_start?: string | null
          created_at?: string | null
          document_url?: string | null
          emergency_phone?: string | null
          id?: string
          notes?: string | null
          policy_number?: string | null
          provider?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_insurance_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      travellers: {
        Row: {
          created_at: string | null
          dietary: string | null
          esta_status: string | null
          id: string
          is_child: boolean | null
          medical_notes: string | null
          name: string
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dietary?: string | null
          esta_status?: string | null
          id?: string
          is_child?: boolean | null
          medical_notes?: string | null
          name: string
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dietary?: string | null
          esta_status?: string | null
          id?: string
          is_child?: boolean | null
          medical_notes?: string | null
          name?: string
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travellers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_shares: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          permission: string
          shared_with_email: string
          shared_with_user_id: string | null
          trip_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          permission?: string
          shared_with_email: string
          shared_with_user_id?: string | null
          trip_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          permission?: string
          shared_with_email?: string
          shared_with_user_id?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_shares_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          destination: string | null
          end_date: string | null
          id: string
          is_archived: boolean | null
          name: string
          public_share_token: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          public_share_token?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          public_share_token?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_trip_owner: {
        Args: { p_trip_id: string; p_user_id: string }
        Returns: boolean
      }
      is_trip_shared_with_user: {
        Args: { p_trip_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
