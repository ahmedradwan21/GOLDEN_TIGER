export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_ar: string | null;
          parent_id: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          name_ar?: string | null;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          name_ar?: string | null;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      brands: {
        Row: { id: string; slug: string; name_en: string; name_ar: string | null; logo_url: string | null; sort_order: number; is_active: boolean };
        Insert: { id?: string; slug: string; name_en: string; name_ar?: string | null; logo_url?: string | null; sort_order?: number; is_active?: boolean };
        Update: { slug?: string; name_en?: string; name_ar?: string | null; logo_url?: string | null; sort_order?: number; is_active?: boolean };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          title: string;
          title_ar: string | null;
          description_ar: string | null;
          brand: string | null;
          sku: string | null;
          short_description: string | null;
          description: string;
          features: string[];
          specifications: Json | null;
          price_cents: number;
          compare_at_cents: number | null;
          currency: string;
          stock: number;
          images: string[];
          video_urls: string[];
          rating: number;
          review_count: number;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string | null;
          tags: string[];
          is_published: boolean;
          category_id: string;
          is_sponsored: boolean;
          is_homepage_banner: boolean;
          ad_priority: number;
          banner_image_url: string | null;
          banner_headline: string | null;
          banner_subtext: string | null;
          ad_starts_at: string | null;
          ad_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          title_ar?: string | null;
          description_ar?: string | null;
          brand?: string | null;
          sku?: string | null;
          short_description?: string | null;
          description?: string;
          features?: string[];
          specifications?: Json | null;
          price_cents: number;
          compare_at_cents?: number | null;
          currency?: string;
          stock?: number;
          images?: string[];
          video_urls?: string[];
          rating?: number;
          review_count?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          tags?: string[];
          is_published?: boolean;
          category_id: string;
          is_sponsored?: boolean;
          is_homepage_banner?: boolean;
          ad_priority?: number;
          banner_image_url?: string | null;
          banner_headline?: string | null;
          banner_subtext?: string | null;
          ad_starts_at?: string | null;
          ad_ends_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          title_ar?: string | null;
          description_ar?: string | null;
          brand?: string | null;
          sku?: string | null;
          short_description?: string | null;
          description?: string;
          features?: string[];
          specifications?: Json | null;
          price_cents?: number;
          compare_at_cents?: number | null;
          currency?: string;
          stock?: number;
          images?: string[];
          video_urls?: string[];
          rating?: number;
          review_count?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          tags?: string[];
          is_published?: boolean;
          category_id?: string;
          is_sponsored?: boolean;
          is_homepage_banner?: boolean;
          ad_priority?: number;
          banner_image_url?: string | null;
          banner_headline?: string | null;
          banner_subtext?: string | null;
          ad_starts_at?: string | null;
          ad_ends_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          password_hash: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          phone?: string | null;
          password_hash?: string;
        };
        Relationships: [];
      };
      admins: {
        Row: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          role: string;
          last_login_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          role?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          password_hash?: string;
          role?: string;
          last_login_at?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string | null;
          session_id: string;
          user_id: string | null;
          status: string;
          email: string | null;
          shipping_address: Json | null;
          delivery_method: string | null;
          subtotal_cents: number;
          tax_cents: number;
          shipping_cents: number;
          total_cents: number;
          currency: string;
          payment_method: string | null;
          payment_ref: string | null;
          checkout_started_at: string;
          completed_at: string | null;
          points_earned: number;
          coupon_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string | null;
          session_id: string;
          user_id?: string | null;
          status?: string;
          email?: string | null;
          shipping_address?: Json | null;
          delivery_method?: string | null;
          subtotal_cents: number;
          tax_cents?: number;
          shipping_cents?: number;
          total_cents: number;
          currency?: string;
          payment_method?: string | null;
          payment_ref?: string | null;
          checkout_started_at?: string;
          completed_at?: string | null;
          points_earned?: number;
          coupon_code?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string | null;
          session_id?: string;
          user_id?: string | null;
          status?: string;
          email?: string | null;
          shipping_address?: Json | null;
          delivery_method?: string | null;
          subtotal_cents?: number;
          tax_cents?: number;
          shipping_cents?: number;
          total_cents?: number;
          currency?: string;
          payment_method?: string | null;
          payment_ref?: string | null;
          checkout_started_at?: string;
          completed_at?: string | null;
          points_earned?: number;
          coupon_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          title_snapshot: string;
          image_snapshot: string | null;
          unit_price_cents: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          title_snapshot: string;
          image_snapshot?: string | null;
          unit_price_cents: number;
          quantity: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          title_snapshot?: string;
          image_snapshot?: string | null;
          unit_price_cents?: number;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      click_logs: {
        Row: {
          id: number;
          event_type: string;
          product_id: string | null;
          session_id: string;
          user_id: string | null;
          path: string;
          source: string | null;
          referrer: string | null;
          user_agent: string | null;
          device_type: string | null;
          created_at: string;
        };
        Insert: {
          event_type: string;
          product_id?: string | null;
          session_id: string;
          user_id?: string | null;
          path: string;
          source?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          device_type?: string | null;
        };
        Update: {
          event_type?: string;
          product_id?: string | null;
          session_id?: string;
          user_id?: string | null;
          path?: string;
          source?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          device_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'click_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'click_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          title_en?: string | null;
          title_ar?: string | null;
          image_url?: string | null;
          discount_type: string;
          value: number;
          max_uses: number | null;
          uses_count: number;
          expires_at: string | null;
          is_reward: boolean;
          customer_email: string | null;
          customer_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title_en?: string | null;
          title_ar?: string | null;
          image_url?: string | null;
          discount_type?: string;
          value: number;
          max_uses?: number | null;
          uses_count?: number;
          expires_at?: string | null;
          is_reward?: boolean;
          customer_email?: string | null;
          customer_phone?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          title_en?: string | null;
          title_ar?: string | null;
          image_url?: string | null;
          discount_type?: string;
          value?: number;
          max_uses?: number | null;
          uses_count?: number;
          expires_at?: string | null;
          is_reward?: boolean;
          customer_email?: string | null;
          customer_phone?: string | null;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          type: string;
          is_active: boolean;
          title: string;
          description: string | null;
          discount_percentage: number;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          is_active?: boolean;
          title: string;
          description?: string | null;
          discount_percentage?: number;
          starts_at?: string | null;
          ends_at?: string | null;
        };
        Update: {
          id?: string;
          type?: string;
          is_active?: boolean;
          title?: string;
          description?: string | null;
          discount_percentage?: number;
          starts_at?: string | null;
          ends_at?: string | null;
        };
        Relationships: [];
      };
      search_audit_logs: {
        Row: {
          id: string;
          query: string;
          result_count: number;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          query: string;
          result_count?: number;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          query?: string;
          result_count?: number;
          session_id?: string | null;
        };
        Relationships: [];
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          author_name: string;
          rating: number;
          comment: string;
          is_approved: boolean;
          admin_reply: string | null;
          admin_replied_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          author_name: string;
          rating: number;
          comment: string;
          is_approved?: boolean;
          admin_reply?: string | null;
          admin_replied_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          author_name?: string;
          rating?: number;
          comment?: string;
          is_approved?: boolean;
          admin_reply?: string | null;
          admin_replied_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      site_content: {
        Row: {
          id: string;
          page_key: string;
          title_en: string;
          title_ar: string;
          body_en: string;
          body_ar: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_key: string;
          title_en?: string;
          title_ar?: string;
          body_en?: string;
          body_ar?: string;
        };
        Update: {
          id?: string;
          page_key?: string;
          title_en?: string;
          title_ar?: string;
          body_en?: string;
          body_ar?: string;
        };
        Relationships: [];
      };
      job_postings: {
        Row: {
          id: string;
          title: string;
          department: string;
          location: string;
          type: string;
          description: string;
          requirements: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          department: string;
          location: string;
          type?: string;
          description: string;
          requirements?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          department?: string;
          location?: string;
          type?: string;
          description?: string;
          requirements?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          cover_letter: string | null;
          resume_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          cover_letter?: string | null;
          resume_url?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          cover_letter?: string | null;
          resume_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'job_applications_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_postings';
            referencedColumns: ['id'];
          }
        ];
      };
      browsing_history: {
        Row: {
          id: string;
          session_id: string;
          product_id: string | null;
          product_slug: string;
          product_title: string;
          product_image: string | null;
          product_price: number | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          product_id?: string | null;
          product_slug: string;
          product_title: string;
          product_image?: string | null;
          product_price?: number | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          product_id?: string | null;
          product_slug?: string;
          product_title?: string;
          product_image?: string | null;
          product_price?: number | null;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'browsing_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      announcement_bar_settings: {
        // Single-row table. Only these columns are read or written by the app.
        Row: {
          id: string;
          message_en: string | null;
          message_ar: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          message_en?: string | null;
          message_ar?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          message_en?: string | null;
          message_ar?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      social_community_links: {
        Row: {
          id: string;
          platform: string;
          name_en: string;
          name_ar: string;
          description_en: string;
          description_ar: string;
          url: string;
          is_visible: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: string;
          name_en: string;
          name_ar: string;
          description_en?: string;
          description_ar?: string;
          url: string;
          is_visible?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          platform?: string;
          name_en?: string;
          name_ar?: string;
          description_en?: string;
          description_ar?: string;
          url?: string;
          is_visible?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
