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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      delivery_proofs: {
        Row: {
          created_at: string
          doc_url: string | null
          id: string
          image_url: string | null
          notes: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          doc_url?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          doc_url?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proofs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          license_number: string
          phone: string
          state: string | null
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
          user_id: string
          vehicle_number: string
          vehicle_type: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          license_number: string
          phone: string
          state?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id: string
          vehicle_number: string
          vehicle_type?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          license_number?: string
          phone?: string
          state?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string
          vehicle_number?: string
          vehicle_type?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_videos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          dimensions: string | null
          district: string | null
          expires_at: string
          finish_type: string | null
          id: string
          price: number
          quantity: number
          seller_id: string
          shading_quality: string | null
          state: string
          status: Database["public"]["Enums"]["listing_status"]
          stock_available: number
          title: string
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          district?: string | null
          expires_at?: string
          finish_type?: string | null
          id?: string
          price: number
          quantity: number
          seller_id: string
          shading_quality?: string | null
          state: string
          status?: Database["public"]["Enums"]["listing_status"]
          stock_available: number
          title: string
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          district?: string | null
          expires_at?: string
          finish_type?: string | null
          id?: string
          price?: number
          quantity?: number
          seller_id?: string
          shading_quality?: string | null
          state?: string
          status?: Database["public"]["Enums"]["listing_status"]
          stock_available?: number
          title?: string
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          advance_amount: number
          buyer_id: string
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          delivery_address: string | null
          id: string
          listing_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          quantity: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          advance_amount: number
          buyer_id: string
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          listing_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity: number
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          advance_amount?: number
          buyer_id?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          listing_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seller_documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          seller_id: string
          url: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          seller_id: string
          url: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          seller_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_documents_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_documents_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          company_name: string
          created_at: string
          email: string
          gst_address: string
          gst_number: string
          id: string
          owner_name: string
          phone: string
          state: string
          status: Database["public"]["Enums"]["seller_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          gst_address: string
          gst_number: string
          id?: string
          owner_name: string
          phone: string
          state: string
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          gst_address?: string
          gst_number?: string
          id?: string
          owner_name?: string
          phone?: string
          state?: string
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      trip_locations: {
        Row: {
          id: string
          lat: number
          lng: number
          recorded_at: string
          trip_id: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          trip_id: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          driver_id: string
          id: string
          order_id: string
          seller_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          delivered_at?: string | null
          driver_id: string
          id?: string
          order_id: string
          seller_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          delivered_at?: string | null
          driver_id?: string
          id?: string
          order_id?: string
          seller_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
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
      drivers_public: {
        Row: {
          full_name: string | null
          id: string | null
          state: string | null
          status: Database["public"]["Enums"]["driver_status"] | null
          vehicle_type: string | null
          verified_at: string | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          vehicle_type?: string | null
          verified_at?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          vehicle_type?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      sellers_public: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: string | null
          owner_name: string | null
          state: string | null
          verified_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          owner_name?: string | null
          state?: string | null
          verified_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          owner_name?: string | null
          state?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_trip: { Args: { _trip_id: string }; Returns: boolean }
      get_my_driver_id: { Args: never; Returns: string }
      get_my_seller_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin" | "driver"
      driver_status: "pending" | "approved" | "rejected"
      listing_status: "active" | "sold" | "expired"
      order_status:
        | "pending"
        | "confirmed"
        | "dispatched"
        | "in_transit"
        | "delivered"
        | "cancelled"
      payment_status: "unpaid" | "advance_paid" | "paid"
      seller_status: "pending" | "approved" | "rejected"
      trip_status:
        | "assigned"
        | "loading"
        | "picked_up"
        | "in_transit"
        | "near_destination"
        | "delivered"
      unit_type: "sqft" | "tons"
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
      app_role: ["buyer", "seller", "admin", "driver"],
      driver_status: ["pending", "approved", "rejected"],
      listing_status: ["active", "sold", "expired"],
      order_status: [
        "pending",
        "confirmed",
        "dispatched",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      payment_status: ["unpaid", "advance_paid", "paid"],
      seller_status: ["pending", "approved", "rejected"],
      trip_status: [
        "assigned",
        "loading",
        "picked_up",
        "in_transit",
        "near_destination",
        "delivered",
      ],
      unit_type: ["sqft", "tons"],
    },
  },
} as const
