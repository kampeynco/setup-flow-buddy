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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      account_balances: {
        Row: {
          auto_topup_enabled: boolean
          created_at: string
          current_balance: number
          id: string
          last_topup_at: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          auto_topup_enabled?: boolean
          created_at?: string
          current_balance?: number
          id?: string
          last_topup_at?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          auto_topup_enabled?: boolean
          created_at?: string
          current_balance?: number
          id?: string
          last_topup_at?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      balance_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          postcard_id: string | null
          profile_id: string
          stripe_payment_intent_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          postcard_id?: string | null
          profile_id: string
          stripe_payment_intent_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          postcard_id?: string | null
          profile_id?: string
          stripe_payment_intent_id?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      campaign_mappings: {
        Row: {
          campaign_name: string | null
          created_at: string
          id: string
          profile_id: string
          refcode: string
          updated_at: string
        }
        Insert: {
          campaign_name?: string | null
          created_at?: string
          id?: string
          profile_id: string
          refcode: string
          updated_at?: string
        }
        Update: {
          campaign_name?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          refcode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      csvs: {
        Row: {
          created_at: string
          download_id: string
          download_url: string
          error_message: string | null
          file_status: string | null
          id: string
          import_status: string | null
          initial_request_status: string | null
          profile_id: string
          request_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          download_id: string
          download_url: string
          error_message?: string | null
          file_status?: string | null
          id?: string
          import_status?: string | null
          initial_request_status?: string | null
          profile_id: string
          request_status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          download_id?: string
          download_url?: string
          error_message?: string | null
          file_status?: string | null
          id?: string
          import_status?: string | null
          initial_request_status?: string | null
          profile_id?: string
          request_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "csvs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          donation_date: string | null
          donation_status: string | null
          donor_address: string | null
          donor_address_verified: boolean | null
          donor_city: string | null
          donor_country: string | null
          donor_country_code: string | null
          donor_email: string | null
          donor_name: string | null
          donor_phone: string | null
          donor_state: string | null
          donor_zip: string | null
          employer: string | null
          form_name: string | null
          id: string
          is_mobile: boolean | null
          is_recurring: boolean | null
          isinternational: boolean | null
          lineitem_id: string | null
          lob_address_id: string | null
          occupation: string | null
          order_number: string | null
          paid_at: string | null
          profile_id: string
          recurring_amount: number | null
          recurring_period: string | null
          refcode: string | null
          refcode_custom: string | null
          refcode2: string | null
          sequence: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          donation_date?: string | null
          donation_status?: string | null
          donor_address?: string | null
          donor_address_verified?: boolean | null
          donor_city?: string | null
          donor_country?: string | null
          donor_country_code?: string | null
          donor_email?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          donor_state?: string | null
          donor_zip?: string | null
          employer?: string | null
          form_name?: string | null
          id?: string
          is_mobile?: boolean | null
          is_recurring?: boolean | null
          isinternational?: boolean | null
          lineitem_id?: string | null
          lob_address_id?: string | null
          occupation?: string | null
          order_number?: string | null
          paid_at?: string | null
          profile_id: string
          recurring_amount?: number | null
          recurring_period?: string | null
          refcode?: string | null
          refcode_custom?: string | null
          refcode2?: string | null
          sequence?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          donation_date?: string | null
          donation_status?: string | null
          donor_address?: string | null
          donor_address_verified?: boolean | null
          donor_city?: string | null
          donor_country?: string | null
          donor_country_code?: string | null
          donor_email?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          donor_state?: string | null
          donor_zip?: string | null
          employer?: string | null
          form_name?: string | null
          id?: string
          is_mobile?: boolean | null
          is_recurring?: boolean | null
          isinternational?: boolean | null
          lineitem_id?: string | null
          lob_address_id?: string | null
          occupation?: string | null
          order_number?: string | null
          paid_at?: string | null
          profile_id?: string
          recurring_amount?: number | null
          recurring_period?: string | null
          refcode?: string | null
          refcode_custom?: string | null
          refcode2?: string | null
          sequence?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_usage: {
        Row: {
          billing_cycle_end: string
          billing_cycle_start: string
          created_at: string
          id: string
          last_reported_count: number
          mailing_count: number
          profile_id: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          billing_cycle_end: string
          billing_cycle_start: string
          created_at?: string
          id?: string
          last_reported_count?: number
          mailing_count?: number
          profile_id: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          id?: string
          last_reported_count?: number
          mailing_count?: number
          profile_id?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailing_usage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mailing_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          loops_event_id: string | null
          loops_sent: boolean | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          loops_event_id?: string | null
          loops_sent?: boolean | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          loops_event_id?: string | null
          loops_sent?: boolean | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      postcards: {
        Row: {
          billing_reported: boolean | null
          created_at: string
          donation_id: string
          expected_delivery_date: string | null
          id: string
          status: string | null
          stripe_invoice_item_id: string | null
          tracking_number: string | null
          updated_at: string
          usage_billed: boolean | null
        }
        Insert: {
          billing_reported?: boolean | null
          created_at?: string
          donation_id: string
          expected_delivery_date?: string | null
          id?: string
          status?: string | null
          stripe_invoice_item_id?: string | null
          tracking_number?: string | null
          updated_at?: string
          usage_billed?: boolean | null
        }
        Update: {
          billing_reported?: boolean | null
          created_at?: string
          donation_id?: string
          expected_delivery_date?: string | null
          id?: string
          status?: string | null
          stripe_invoice_item_id?: string | null
          tracking_number?: string | null
          updated_at?: string
          usage_billed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "postcards_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_verified: boolean | null
          city: string | null
          client_secret: string | null
          client_uuid: string | null
          committee_name: string | null
          committee_type: string | null
          country: string | null
          created_at: string
          email_notifications: boolean | null
          id: string
          lob_address_id: string | null
          loops_contact_id: string | null
          marketing_emails: boolean | null
          organization_name: string | null
          postal_code: string | null
          source_id: string | null
          state: string | null
          status_updates: boolean | null
          street_address: string | null
          updated_at: string
          webhook_url: string | null
          weekly_digest: boolean | null
        }
        Insert: {
          address_verified?: boolean | null
          city?: string | null
          client_secret?: string | null
          client_uuid?: string | null
          committee_name?: string | null
          committee_type?: string | null
          country?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id: string
          lob_address_id?: string | null
          loops_contact_id?: string | null
          marketing_emails?: boolean | null
          organization_name?: string | null
          postal_code?: string | null
          source_id?: string | null
          state?: string | null
          status_updates?: boolean | null
          street_address?: string | null
          updated_at?: string
          webhook_url?: string | null
          weekly_digest?: boolean | null
        }
        Update: {
          address_verified?: boolean | null
          city?: string | null
          client_secret?: string | null
          client_uuid?: string | null
          committee_name?: string | null
          committee_type?: string | null
          country?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          lob_address_id?: string | null
          loops_contact_id?: string | null
          marketing_emails?: boolean | null
          organization_name?: string | null
          postal_code?: string | null
          source_id?: string | null
          state?: string | null
          status_updates?: boolean | null
          street_address?: string | null
          updated_at?: string
          webhook_url?: string | null
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          id: number
          monthly_fee: number
          name: string
          per_mailing_fee: number
          stripe_price_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          monthly_fee: number
          name: string
          per_mailing_fee: number
          stripe_price_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          monthly_fee?: number
          name?: string
          per_mailing_fee?: number
          stripe_price_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_files: {
        Row: {
          content: string | null
          content_type: string
          created_at: string | null
          file_path: string
          filename: string
          id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string | null
          file_path: string
          filename: string
          id?: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string | null
          file_path?: string
          filename?: string
          id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_files_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          backpsc_canvas_direction: string | null
          backpsc_html: string | null
          created_at: string
          frontpsc_background_color: string | null
          frontpsc_background_image: string | null
          frontpsc_background_size: string | null
          frontpsc_background_text: string | null
          frontpsc_bg_type: string | null
          frontpsc_canvas_direction: string | null
          frontpsc_html: string | null
          frontpsc_text_color: string | null
          id: string
          letter_html: string | null
          profile_id: string
          template_name: string
          updated_at: string
        }
        Insert: {
          backpsc_canvas_direction?: string | null
          backpsc_html?: string | null
          created_at?: string
          frontpsc_background_color?: string | null
          frontpsc_background_image?: string | null
          frontpsc_background_size?: string | null
          frontpsc_background_text?: string | null
          frontpsc_bg_type?: string | null
          frontpsc_canvas_direction?: string | null
          frontpsc_html?: string | null
          frontpsc_text_color?: string | null
          id?: string
          letter_html?: string | null
          profile_id: string
          template_name: string
          updated_at?: string
        }
        Update: {
          backpsc_canvas_direction?: string | null
          backpsc_html?: string | null
          created_at?: string
          frontpsc_background_color?: string | null
          frontpsc_background_image?: string | null
          frontpsc_background_size?: string | null
          frontpsc_background_text?: string | null
          frontpsc_bg_type?: string | null
          frontpsc_canvas_direction?: string | null
          frontpsc_html?: string | null
          frontpsc_text_color?: string | null
          id?: string
          letter_html?: string | null
          profile_id?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          carrier: string | null
          created_at: string
          date_created: string | null
          date_modified: string | null
          description: string | null
          details: string | null
          estimated_delivery_date: string | null
          id: string
          location: string | null
          name: string | null
          object: string | null
          postcard_id: string
          status: string
          time: string | null
          tracking_event_id: string | null
          tracking_number: string
          type: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          date_created?: string | null
          date_modified?: string | null
          description?: string | null
          details?: string | null
          estimated_delivery_date?: string | null
          id?: string
          location?: string | null
          name?: string | null
          object?: string | null
          postcard_id: string
          status: string
          time?: string | null
          tracking_event_id?: string | null
          tracking_number: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          date_created?: string | null
          date_modified?: string | null
          description?: string | null
          details?: string | null
          estimated_delivery_date?: string | null
          id?: string
          location?: string | null
          name?: string | null
          object?: string | null
          postcard_id?: string
          status?: string
          time?: string | null
          tracking_event_id?: string | null
          tracking_number?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_postcard_id_fkey"
            columns: ["postcard_id"]
            isOneToOne: false
            referencedRelation: "postcards"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_charges: {
        Row: {
          amount: number
          charged_at: string
          created_at: string
          currency: string | null
          id: string
          plan_type: string
          postcard_id: string
          profile_id: string
          stripe_invoice_item_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          charged_at?: string
          created_at?: string
          currency?: string | null
          id?: string
          plan_type: string
          postcard_id: string
          profile_id: string
          stripe_invoice_item_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          charged_at?: string
          created_at?: string
          currency?: string | null
          id?: string
          plan_type?: string
          postcard_id?: string
          profile_id?: string
          stripe_invoice_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_charges_postcard_id_fkey"
            columns: ["postcard_id"]
            isOneToOne: false
            referencedRelation: "postcards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          plan_id: number
          profile_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_used: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start: string
          id?: string
          plan_id: number
          profile_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_used?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan_id?: number
          profile_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_used?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_credentials: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          profile_id: string
          salt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          profile_id: string
          salt: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          profile_id?: string
          salt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_credentials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      hash_password_with_salt: {
        Args: { password: string; salt: string }
        Returns: string
      }
      verify_password: {
        Args: { hash: string; password: string; salt: string }
        Returns: boolean
      }
    }
    Enums: {
      template_status: "active" | "inactive"
      template_status_type: "active" | "inactive"
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
      template_status: ["active", "inactive"],
      template_status_type: ["active", "inactive"],
    },
  },
} as const
