export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      course_sections: {
        Row: {
          added_by: string
          course_id: string
          created_at: string | null
          id: string
          section_number: string
          whatsapp_link: string
        }
        Insert: {
          added_by?: string
          course_id: string
          created_at?: string | null
          id?: string
          section_number: string
          whatsapp_link: string
        }
        Update: {
          added_by?: string
          course_id?: string
          created_at?: string | null
          id?: string
          section_number?: string
          whatsapp_link?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_added_by_fkey"
            columns: ["added_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          id: string
          name: string
          professor: string | null
          semester: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          id?: string
          name: string
          professor?: string | null
          semester?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          professor?: string | null
          semester?: string | null
        }
        Relationships: []
      }
      lost_items: {
        Row: {
          category: string
          contact_email: string
          created_at: string | null
          description: string
          id: string
          images: string[] | null
          location: string
          reward: number | null
          status: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category: string
          contact_email: string
          created_at?: string | null
          description: string
          id?: string
          images?: string[] | null
          location: string
          reward?: number | null
          status?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          category?: string
          contact_email?: string
          created_at?: string | null
          description?: string
          id?: string
          images?: string[] | null
          location?: string
          reward?: number | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          category: string
          condition: string
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          location: string
          original_price: number | null
          price: number
          title: string
          user_id: string
        }
        Insert: {
          category: string
          condition: string
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          location: string
          original_price?: number | null
          price: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          location?: string
          original_price?: number | null
          price?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      note_hearts: {
        Row: {
          created_at: string | null
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_hearts_note_id_fkey"
            columns: ["note_id"]
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_hearts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          linktree_url: string
          major: string
          title: string
          uploader_name: string | null
          user_id: string
          hearts_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          linktree_url: string
          major: string
          title: string
          uploader_name?: string | null
          user_id: string
          hearts_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          linktree_url?: string
          major?: string
          title?: string
          uploader_name?: string | null
          user_id?: string
          hearts_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      review_hearts: {
        Row: {
          id: string
          review_id: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_hearts_review_id_fkey"
            columns: ["review_id"]
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_hearts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          comments_count: number | null
          content: string
          course: string | null
          created_at: string | null
          id: string
          hearts_count: number | null
          is_hearted: boolean
          professor: string | null
          rating: number
          reviewer_name: string | null
          subject: string
          type: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          course?: string | null
          created_at?: string | null
          id?: string
          hearts_count?: number | null
          is_hearted?: boolean
          professor?: string | null
          rating: number
          reviewer_name?: string | null
          subject: string
          type: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          course?: string | null
          created_at?: string | null
          id?: string
          hearts_count?: number | null
          is_hearted?: boolean
          professor?: string | null
          rating?: number
          reviewer_name?: string | null
          subject?: string
          type?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
