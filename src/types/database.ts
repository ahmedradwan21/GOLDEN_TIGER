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
          parent_id: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          title: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
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
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
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
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
