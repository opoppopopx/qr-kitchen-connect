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
          icon: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          icon?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          icon?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          points: number
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
          points?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          points?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          note: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          order_id: string
          price?: number
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          order_no: number
          source: string
          status: Database["public"]["Enums"]["order_status"]
          table_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          order_no?: number
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          table_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          order_no?: number
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      password_change_logs: {
        Row: {
          changed_by_user_id: string | null
          changed_by_username: string
          created_at: string
          id: string
          target_user_id: string
          target_username: string
        }
        Insert: {
          changed_by_user_id?: string | null
          changed_by_username?: string
          created_at?: string
          id?: string
          target_user_id: string
          target_username?: string
        }
        Update: {
          changed_by_user_id?: string | null
          changed_by_username?: string
          created_at?: string
          id?: string
          target_user_id?: string
          target_username?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean
          category_id: string | null
          created_at: string
          description: string
          id: string
          image: string
          name: string
          price: number
        }
        Insert: {
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image?: string
          name: string
          price?: number
        }
        Update: {
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          phone: string
          salary: number
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name?: string
          id: string
          phone?: string
          salary?: number
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          salary?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reservation_items: {
        Row: {
          created_at: string
          id: string
          note: string
          price: number
          product_id: string
          quantity: number
          reservation_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          price?: number
          product_id: string
          quantity?: number
          reservation_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          price?: number
          product_id?: string
          quantity?: number
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          code: string
          created_at: string
          deposit_amount: number
          food_amount: number
          guests: number
          id: string
          name: string
          note: string
          payment_ref: string
          phone: string
          reserved_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string | null
          total_due: number
          updated_at: string
          zone: string
        }
        Insert: {
          code?: string
          created_at?: string
          deposit_amount?: number
          food_amount?: number
          guests?: number
          id?: string
          name: string
          note?: string
          payment_ref?: string
          phone?: string
          reserved_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          total_due?: number
          updated_at?: string
          zone?: string
        }
        Update: {
          code?: string
          created_at?: string
          deposit_amount?: number
          food_amount?: number
          guests?: number
          id?: string
          name?: string
          note?: string
          payment_ref?: string
          phone?: string
          reserved_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          total_due?: number
          updated_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_settings: {
        Row: {
          account_name: string
          created_at: string
          deposit_amount: number
          id: string
          promptpay_id: string
          updated_at: string
        }
        Insert: {
          account_name?: string
          created_at?: string
          deposit_amount?: number
          id?: string
          promptpay_id?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          created_at?: string
          deposit_amount?: number
          id?: string
          promptpay_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string
          id: string
          number: number
          seats: number
          status: Database["public"]["Enums"]["table_status"]
          zone: string
        }
        Insert: {
          created_at?: string
          id?: string
          number: number
          seats?: number
          status?: Database["public"]["Enums"]["table_status"]
          zone?: string
        }
        Update: {
          created_at?: string
          id?: string
          number?: number
          seats?: number
          status?: Database["public"]["Enums"]["table_status"]
          zone?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "kitchen" | "waiter"
      order_status: "pending" | "preparing" | "ready" | "served" | "cancelled"
      payment_method: "cash" | "qr_code"
      payment_status: "pending" | "completed"
      reservation_status: "pending" | "confirmed" | "cancelled" | "seated"
      table_status: "available" | "occupied" | "reserved"
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
      app_role: ["admin", "manager", "cashier", "kitchen", "waiter"],
      order_status: ["pending", "preparing", "ready", "served", "cancelled"],
      payment_method: ["cash", "qr_code"],
      payment_status: ["pending", "completed"],
      reservation_status: ["pending", "confirmed", "cancelled", "seated"],
      table_status: ["available", "occupied", "reserved"],
    },
  },
} as const
