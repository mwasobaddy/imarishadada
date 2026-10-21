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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          metadata: Json | null
          row_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          row_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          sender_id: string
          sender_name: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          row_id: string
          table_name: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: Json
          id?: string
          row_id: string
          table_name: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          row_id?: string
          table_name?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      core_values: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          cadence: string
          completed_at: string | null
          consent_recurring: boolean
          consent_updates: boolean
          consented_at: string | null
          created_at: string
          display_amount: number
          display_currency: string
          donor_email: string
          donor_name: string | null
          donor_phone: string | null
          fee: number
          giving_tier_id: string | null
          id: string
          idempotency_key: string
          outcome_label: string
          provider: string
          provider_payload: Json | null
          provider_ref: string | null
          rail: string
          reference: string
          settlement_amount: number
          settlement_currency: string
          status: string
          total: number
        }
        Insert: {
          cadence?: string
          completed_at?: string | null
          consent_recurring?: boolean
          consent_updates?: boolean
          consented_at?: string | null
          created_at?: string
          display_amount: number
          display_currency: string
          donor_email: string
          donor_name?: string | null
          donor_phone?: string | null
          fee?: number
          giving_tier_id?: string | null
          id?: string
          idempotency_key: string
          outcome_label?: string
          provider?: string
          provider_payload?: Json | null
          provider_ref?: string | null
          rail: string
          reference: string
          settlement_amount: number
          settlement_currency?: string
          status?: string
          total: number
        }
        Update: {
          cadence?: string
          completed_at?: string | null
          consent_recurring?: boolean
          consent_updates?: boolean
          consented_at?: string | null
          created_at?: string
          display_amount?: number
          display_currency?: string
          donor_email?: string
          donor_name?: string | null
          donor_phone?: string | null
          fee?: number
          giving_tier_id?: string | null
          id?: string
          idempotency_key?: string
          outcome_label?: string
          provider?: string
          provider_payload?: Json | null
          provider_ref?: string | null
          rail?: string
          reference?: string
          settlement_amount?: number
          settlement_currency?: string
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "donations_giving_tier_id_fkey"
            columns: ["giving_tier_id"]
            isOneToOne: false
            referencedRelation: "giving_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          created_at: string
          email: string
          enquiry_type: string
          id: string
          message: string
          name: string | null
          notes: string | null
          phone: string | null
          read_at: string | null
          reference: string
          replied_at: string | null
          request_hash: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          enquiry_type?: string
          id?: string
          message: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          read_at?: string | null
          reference: string
          replied_at?: string | null
          request_hash: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          enquiry_type?: string
          id?: string
          message?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          read_at?: string | null
          reference?: string
          replied_at?: string | null
          request_hash?: string
          status?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          body: string | null
          created_at: string
          description: string
          ends_at: string | null
          id: string
          image_path: string | null
          location: string | null
          max_attendees: number | null
          published: boolean
          published_at: string | null
          rsvp_enabled: boolean
          scheduled_at: string | null
          slug: string
          starts_at: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          description?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          max_attendees?: number | null
          published?: boolean
          published_at?: string | null
          rsvp_enabled?: boolean
          scheduled_at?: string | null
          slug: string
          starts_at: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          description?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          max_attendees?: number | null
          published?: boolean
          published_at?: string | null
          rsvp_enabled?: boolean
          scheduled_at?: string | null
          slug?: string
          starts_at?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_breakdown: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          direction: string
          fiscal_year: string
          id: string
          programme_id: string | null
          share_pct: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          direction?: string
          fiscal_year: string
          id?: string
          programme_id?: string | null
          share_pct?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          direction?: string
          fiscal_year?: string
          id?: string
          programme_id?: string | null
          share_pct?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_breakdown_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      giving_tiers: {
        Row: {
          active: boolean
          amount: number
          cadence: string
          created_at: string
          currency: string
          display_label: string | null
          id: string
          outcome_label: string
          programme_id: string | null
          programme_id_note: string | null
          rail_note: string | null
          slug: string
          sort_order: number
          tier_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount: number
          cadence?: string
          created_at?: string
          currency?: string
          display_label?: string | null
          id?: string
          outcome_label: string
          programme_id?: string | null
          programme_id_note?: string | null
          rail_note?: string | null
          slug: string
          sort_order?: number
          tier_type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          cadence?: string
          created_at?: string
          currency?: string
          display_label?: string | null
          id?: string
          outcome_label?: string
          programme_id?: string | null
          programme_id_note?: string | null
          rail_note?: string | null
          slug?: string
          sort_order?: number
          tier_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "giving_tiers_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_stats: {
        Row: {
          active: boolean
          created_at: string
          display_value: string | null
          id: string
          label: string
          period: string
          programme_id: string | null
          slug: string
          sort_order: number
          unit: string | null
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_value?: string | null
          id?: string
          label: string
          period: string
          programme_id?: string | null
          slug: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          created_at?: string
          display_value?: string | null
          id?: string
          label?: string
          period?: string
          programme_id?: string | null
          slug?: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "impact_stats_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string
          consent_expires_at: string | null
          consent_tier: string
          created_at: string
          exif_stripped: boolean
          file_name: string
          file_path: string
          height: number | null
          id: string
          mime_type: string
          size_bytes: number
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text: string
          consent_expires_at?: string | null
          consent_tier?: string
          created_at?: string
          exif_stripped?: boolean
          file_name: string
          file_path: string
          height?: number | null
          id?: string
          mime_type: string
          size_bytes: number
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string
          consent_expires_at?: string | null
          consent_tier?: string
          created_at?: string
          exif_stripped?: boolean
          file_name?: string
          file_path?: string
          height?: number | null
          id?: string
          mime_type?: string
          size_bytes?: number
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          active: boolean
          email: string
          id: string
          name: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          active?: boolean
          email: string
          id?: string
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          active?: boolean
          email?: string
          id?: string
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          in_app_enabled: boolean
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json | null
          read: boolean
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      partner_enquiries: {
        Row: {
          assigned_to: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string
          notes: string | null
          organisation: string
          partnership_type: string
          phone: string | null
          read_at: string | null
          reference: string
          replied_at: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message: string
          notes?: string | null
          organisation: string
          partnership_type?: string
          phone?: string | null
          read_at?: string | null
          reference: string
          replied_at?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          notes?: string | null
          organisation?: string
          partnership_type?: string
          phone?: string | null
          read_at?: string | null
          reference?: string
          replied_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_enquiries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_schools: {
        Row: {
          active: boolean
          agreement_on: string
          area: string | null
          created_at: string
          id: string
          logo_path: string | null
          name: string
          note: string | null
          programme_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          agreement_on: string
          area?: string | null
          created_at?: string
          id?: string
          logo_path?: string | null
          name: string
          note?: string | null
          programme_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          agreement_on?: string
          area?: string | null
          created_at?: string
          id?: string
          logo_path?: string | null
          name?: string
          note?: string | null
          programme_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_schools_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          is_test: boolean
          logo_path: string | null
          name: string
          sort_order: number
          tier: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          is_test?: boolean
          logo_path?: string | null
          name: string
          sort_order?: number
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          is_test?: boolean
          logo_path?: string | null
          name?: string
          sort_order?: number
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          created_at: string
          donation_id: string
          event: string
          id: string
          payload: Json | null
          provider: string
          provider_ref: string | null
          signature_verified: boolean
        }
        Insert: {
          created_at?: string
          donation_id: string
          event: string
          id?: string
          payload?: Json | null
          provider: string
          provider_ref?: string | null
          signature_verified?: boolean
        }
        Update: {
          created_at?: string
          donation_id?: string
          event?: string
          id?: string
          payload?: Json | null
          provider?: string
          provider_ref?: string | null
          signature_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string
          id?: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          resource?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          body: string
          category: string
          cover_path: string | null
          created_at: string
          excerpt: string
          featured: boolean
          id: string
          published: boolean
          published_at: string | null
          reading_minutes: number | null
          scheduled_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          category?: string
          cover_path?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          published?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          scheduled_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: string
          cover_path?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          published?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          scheduled_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      programmes: {
        Row: {
          active: boolean
          body: string
          created_at: string
          icon: string
          id: string
          image_alt: string | null
          image_path: string | null
          outcomes: Json | null
          slug: string
          sort_order: number
          stat: string | null
          stat_label: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string
          created_at?: string
          icon?: string
          id?: string
          image_alt?: string | null
          image_path?: string | null
          outcomes?: Json | null
          slug: string
          sort_order?: number
          stat?: string | null
          stat_label?: string | null
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          icon?: string
          id?: string
          image_alt?: string | null
          image_path?: string | null
          outcomes?: Json | null
          slug?: string
          sort_order?: number
          stat?: string | null
          stat_label?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      settings_versions: {
        Row: {
          change_note: string | null
          changed_at: string
          changed_by: string | null
          id: string
          key: string
          value: Json
        }
        Insert: {
          change_note?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          key: string
          value: Json
        }
        Update: {
          change_note?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          key?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          label: string
          page_key: string
          route: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          label: string
          page_key: string
          route: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          page_key?: string
          route?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          active: boolean
          body: string | null
          body_secondary: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          cta_secondary_href: string | null
          cta_secondary_label: string | null
          eyebrow: string | null
          heading: string
          id: string
          image_alt: string | null
          image_path: string | null
          images: Json | null
          page_key: string | null
          section_key: string
          seo_description: string | null
          seo_title: string | null
          sort_order: number
          stat_line: string | null
          steps: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string | null
          body_secondary?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          eyebrow?: string | null
          heading: string
          id?: string
          image_alt?: string | null
          image_path?: string | null
          images?: Json | null
          page_key?: string | null
          section_key: string
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number
          stat_line?: string | null
          steps?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string | null
          body_secondary?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          eyebrow?: string | null
          heading?: string
          id?: string
          image_alt?: string | null
          image_path?: string | null
          images?: Json | null
          page_key?: string | null
          section_key?: string
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number
          stat_line?: string | null
          steps?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          is_developer: boolean
          last_login_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          is_developer?: boolean
          last_login_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          is_developer?: boolean
          last_login_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          attribution: string | null
          body: string
          consent_expires_at: string | null
          consent_tier: string
          created_at: string
          excerpt: string
          featured: boolean
          id: string
          image_alt: string | null
          image_path: string | null
          programme_id: string | null
          published: boolean
          published_at: string | null
          quote: string | null
          reading_minutes: number | null
          scheduled_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          attribution?: string | null
          body?: string
          consent_expires_at?: string | null
          consent_tier?: string
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          image_alt?: string | null
          image_path?: string | null
          programme_id?: string | null
          published?: boolean
          published_at?: string | null
          quote?: string | null
          reading_minutes?: number | null
          scheduled_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          attribution?: string | null
          body?: string
          consent_expires_at?: string | null
          consent_tier?: string
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          image_alt?: string | null
          image_path?: string | null
          programme_id?: string | null
          published?: boolean
          published_at?: string | null
          quote?: string | null
          reading_minutes?: number | null
          scheduled_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean
          bio: string | null
          consent_recorded: boolean
          created_at: string
          department: string | null
          id: string
          name: string
          photo_path: string | null
          role: string
          safeguarding_officer: boolean
          slug: string
          social_links: Json | null
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          consent_recorded?: boolean
          created_at?: string
          department?: string | null
          id?: string
          name: string
          photo_path?: string | null
          role: string
          safeguarding_officer?: boolean
          slug: string
          social_links?: Json | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          consent_recorded?: boolean
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          photo_path?: string | null
          role?: string
          safeguarding_officer?: boolean
          slug?: string
          social_links?: Json | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string
          field_name: string
          id: string
          is_reviewed: boolean
          locale: string
          reviewed_at: string | null
          reviewed_by: string | null
          row_id: string
          table_name: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          is_reviewed?: boolean
          locale: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          row_id: string
          table_name: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          is_reviewed?: boolean
          locale?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          row_id?: string
          table_name?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      transparency_gaps: {
        Row: {
          created_at: string
          id: string
          item: string
          kind: string
          notes: string | null
          sort_order: number
          status: string
          target_date: string | null
          target_label: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item: string
          kind?: string
          notes?: string | null
          sort_order?: number
          status?: string
          target_date?: string | null
          target_label?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item?: string
          kind?: string
          notes?: string | null
          sort_order?: number
          status?: string
          target_date?: string | null
          target_label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_applications: {
        Row: {
          assigned_to: string | null
          availability: string | null
          created_at: string
          email: string
          id: string
          motivation: string
          name: string
          notes: string | null
          phone: string | null
          read_at: string | null
          reference: string
          replied_at: string | null
          role_id: string | null
          skills: string[]
          skills_detail: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          availability?: string | null
          created_at?: string
          email: string
          id?: string
          motivation: string
          name: string
          notes?: string | null
          phone?: string | null
          read_at?: string | null
          reference: string
          replied_at?: string | null
          role_id?: string | null
          skills?: string[]
          skills_detail?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          availability?: string | null
          created_at?: string
          email?: string
          id?: string
          motivation?: string
          name?: string
          notes?: string | null
          phone?: string | null
          read_at?: string | null
          reference?: string
          replied_at?: string | null
          role_id?: string | null
          skills?: string[]
          skills_detail?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "volunteer_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_roles: {
        Row: {
          active: boolean
          commitment: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          positions_available: number
          positions_filled: number
          requirements: string | null
          skills_needed: string[]
          sort_order: number
          time_commitment: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          commitment?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          positions_available?: number
          positions_filled?: number
          requirements?: string | null
          skills_needed?: string[]
          sort_order?: number
          time_commitment?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          commitment?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          positions_available?: number
          positions_filled?: number
          requirements?: string | null
          skills_needed?: string[]
          sort_order?: number
          time_commitment?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      downgrade_expired_consents: { Args: never; Returns: number }
      exec_sql: { Args: { p_sql: string }; Returns: undefined }
      has_permission: {
        Args: { p_action: string; p_resource: string }
        Returns: boolean
      }
      is_developer: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      my_permissions: {
        Args: never
        Returns: {
          action: string
          resource: string
        }[]
      }
      prune_rate_limits: { Args: never; Returns: number }
      social_links_valid: { Args: { v: Json }; Returns: boolean }
      visible_staff: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          is_developer: boolean
          last_login_at: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "staff"
          isOneToOne: false
          isSetofReturn: true
        }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
