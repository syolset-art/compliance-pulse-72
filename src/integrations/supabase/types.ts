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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_autonomy_settings: {
        Row: {
          admin_level: number
          id: string
          process_level: number
          service_level: number
          system_level: number
          updated_at: string
        }
        Insert: {
          admin_level?: number
          id?: string
          process_level?: number
          service_level?: number
          system_level?: number
          updated_at?: string
        }
        Update: {
          admin_level?: number
          id?: string
          process_level?: number
          service_level?: number
          system_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          company_info_completed: boolean | null
          id: string
          roles_assigned: boolean | null
          systems_added: boolean | null
          updated_at: string | null
          work_areas_defined: boolean | null
        }
        Insert: {
          company_info_completed?: boolean | null
          id?: string
          roles_assigned?: boolean | null
          systems_added?: boolean | null
          updated_at?: string | null
          work_areas_defined?: boolean | null
        }
        Update: {
          company_info_completed?: boolean | null
          id?: string
          roles_assigned?: boolean | null
          systems_added?: boolean | null
          updated_at?: string | null
          work_areas_defined?: boolean | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          responsibilities: string[] | null
          updated_at: string | null
          work_area_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          responsibilities?: string[] | null
          updated_at?: string | null
          work_area_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          responsibilities?: string[] | null
          updated_at?: string | null
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      system_compliance: {
        Row: {
          created_at: string | null
          id: string
          score: number | null
          standard: string
          status: string | null
          system_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          score?: number | null
          standard: string
          status?: string | null
          system_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          score?: number | null
          standard?: string
          status?: string | null
          system_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_compliance_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_data_handling: {
        Row: {
          ai_usage: boolean | null
          ai_usage_description: string | null
          created_at: string | null
          data_locations: string[] | null
          documents: string[] | null
          id: string
          retention_keywords: string[] | null
          system_id: string
          updated_at: string | null
        }
        Insert: {
          ai_usage?: boolean | null
          ai_usage_description?: string | null
          created_at?: string | null
          data_locations?: string[] | null
          documents?: string[] | null
          id?: string
          retention_keywords?: string[] | null
          system_id: string
          updated_at?: string | null
        }
        Update: {
          ai_usage?: boolean | null
          ai_usage_description?: string | null
          created_at?: string | null
          data_locations?: string[] | null
          documents?: string[] | null
          id?: string
          retention_keywords?: string[] | null
          system_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_data_handling_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_incidents: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          last_updated: string | null
          responsible: string | null
          risk_level: string | null
          status: string | null
          system_id: string
          time_hours: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_updated?: string | null
          responsible?: string | null
          risk_level?: string | null
          status?: string | null
          system_id: string
          time_hours?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_updated?: string | null
          responsible?: string | null
          risk_level?: string | null
          status?: string | null
          system_id?: string
          time_hours?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_incidents_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_processes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          system_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          system_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          system_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_processes_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_risk_assessments: {
        Row: {
          created_at: string | null
          id: string
          next_review: string | null
          notes: string | null
          risk_distribution: Json | null
          risk_score: number | null
          status: string | null
          system_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          next_review?: string | null
          notes?: string | null
          risk_distribution?: Json | null
          risk_score?: number | null
          status?: string | null
          system_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          next_review?: string | null
          notes?: string | null
          risk_distribution?: Json | null
          risk_score?: number | null
          status?: string | null
          system_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_risk_assessments_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_vendors: {
        Row: {
          created_at: string | null
          eu_eos_compliant: boolean | null
          id: string
          name: string
          purpose: string | null
          source: string | null
          system_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          eu_eos_compliant?: boolean | null
          id?: string
          name: string
          purpose?: string | null
          source?: string | null
          system_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          eu_eos_compliant?: boolean | null
          id?: string
          name?: string
          purpose?: string | null
          source?: string | null
          system_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_vendors_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      systems: {
        Row: {
          category: string | null
          compliance_score: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          next_review_date: string | null
          risk_level: string | null
          risk_score: number | null
          status: string | null
          system_manager: string | null
          updated_at: string | null
          url: string | null
          vendor: string | null
          work_area_id: string | null
        }
        Insert: {
          category?: string | null
          compliance_score?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          next_review_date?: string | null
          risk_level?: string | null
          risk_score?: number | null
          status?: string | null
          system_manager?: string | null
          updated_at?: string | null
          url?: string | null
          vendor?: string | null
          work_area_id?: string | null
        }
        Update: {
          category?: string | null
          compliance_score?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          next_review_date?: string | null
          risk_level?: string | null
          risk_score?: number | null
          status?: string | null
          system_manager?: string | null
          updated_at?: string | null
          url?: string | null
          vendor?: string | null
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "systems_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_autonomy_level: number
          ai_handling: boolean | null
          completed_at: string | null
          created_at: string
          description: string
          id: string
          priority: string
          process_count: number | null
          progress: number | null
          relevant_for: string[]
          started_at: string | null
          status: string
          system_count: number | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          ai_autonomy_level: number
          ai_handling?: boolean | null
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          priority: string
          process_count?: number | null
          progress?: number | null
          relevant_for?: string[]
          started_at?: string | null
          status?: string
          system_count?: number | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          ai_autonomy_level?: number
          ai_handling?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          process_count?: number | null
          progress?: number | null
          relevant_for?: string[]
          started_at?: string | null
          status?: string
          system_count?: number | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      uploaded_documents: {
        Row: {
          analysis_results: Json | null
          analysis_status: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_results?: Json | null
          analysis_status?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          analysis_results?: Json | null
          analysis_status?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_areas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          responsible_person: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          responsible_person?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          responsible_person?: string | null
          updated_at?: string | null
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
    Enums: {},
  },
} as const
