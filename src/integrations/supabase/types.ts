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
      ai_system_registry: {
        Row: {
          accuracy_percent: number | null
          affected_persons: Json | null
          annex_iii_category: string | null
          automation_level: string | null
          complaints_count: number | null
          compliance_status: string | null
          created_at: string | null
          decisions_per_month: number | null
          estimated_affected_persons: number | null
          estimated_daily_uses: number | null
          human_oversight_level: string | null
          id: string
          incidents_count: number | null
          last_assessment_date: string | null
          last_performance_review: string | null
          linked_asset_ids: string[] | null
          linked_process_count: number | null
          logging_enabled: boolean | null
          name: string
          next_assessment_date: string | null
          override_rate_percent: number | null
          performance_notes: string | null
          provider: string | null
          risk_category: string | null
          risk_justification: string | null
          status: string | null
          transparency_measures: string | null
          updated_at: string | null
          usage_frequency: string | null
          use_cases: Json | null
          version: string | null
        }
        Insert: {
          accuracy_percent?: number | null
          affected_persons?: Json | null
          annex_iii_category?: string | null
          automation_level?: string | null
          complaints_count?: number | null
          compliance_status?: string | null
          created_at?: string | null
          decisions_per_month?: number | null
          estimated_affected_persons?: number | null
          estimated_daily_uses?: number | null
          human_oversight_level?: string | null
          id?: string
          incidents_count?: number | null
          last_assessment_date?: string | null
          last_performance_review?: string | null
          linked_asset_ids?: string[] | null
          linked_process_count?: number | null
          logging_enabled?: boolean | null
          name: string
          next_assessment_date?: string | null
          override_rate_percent?: number | null
          performance_notes?: string | null
          provider?: string | null
          risk_category?: string | null
          risk_justification?: string | null
          status?: string | null
          transparency_measures?: string | null
          updated_at?: string | null
          usage_frequency?: string | null
          use_cases?: Json | null
          version?: string | null
        }
        Update: {
          accuracy_percent?: number | null
          affected_persons?: Json | null
          annex_iii_category?: string | null
          automation_level?: string | null
          complaints_count?: number | null
          compliance_status?: string | null
          created_at?: string | null
          decisions_per_month?: number | null
          estimated_affected_persons?: number | null
          estimated_daily_uses?: number | null
          human_oversight_level?: string | null
          id?: string
          incidents_count?: number | null
          last_assessment_date?: string | null
          last_performance_review?: string | null
          linked_asset_ids?: string[] | null
          linked_process_count?: number | null
          logging_enabled?: boolean | null
          name?: string
          next_assessment_date?: string | null
          override_rate_percent?: number | null
          performance_notes?: string | null
          provider?: string | null
          risk_category?: string | null
          risk_justification?: string | null
          status?: string | null
          transparency_measures?: string | null
          updated_at?: string | null
          usage_frequency?: string | null
          use_cases?: Json | null
          version?: string | null
        }
        Relationships: []
      }
      ai_usage_metrics: {
        Row: {
          accuracy_score: number | null
          affected_persons_count: number | null
          ai_system_id: string | null
          automated_decisions: number | null
          complaints: number | null
          corrections: number | null
          created_at: string | null
          false_negative_count: number | null
          false_positive_count: number | null
          id: string
          incidents: number | null
          overridden_decisions: number | null
          period_end: string
          period_start: string
          total_decisions: number | null
          total_uses: number | null
        }
        Insert: {
          accuracy_score?: number | null
          affected_persons_count?: number | null
          ai_system_id?: string | null
          automated_decisions?: number | null
          complaints?: number | null
          corrections?: number | null
          created_at?: string | null
          false_negative_count?: number | null
          false_positive_count?: number | null
          id?: string
          incidents?: number | null
          overridden_decisions?: number | null
          period_end: string
          period_start: string
          total_decisions?: number | null
          total_uses?: number | null
        }
        Update: {
          accuracy_score?: number | null
          affected_persons_count?: number | null
          ai_system_id?: string | null
          automated_decisions?: number | null
          complaints?: number | null
          corrections?: number | null
          created_at?: string | null
          false_negative_count?: number | null
          false_positive_count?: number | null
          id?: string
          incidents?: number | null
          overridden_decisions?: number | null
          period_end?: string
          period_start?: string
          total_decisions?: number | null
          total_uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_metrics_ai_system_id_fkey"
            columns: ["ai_system_id"]
            isOneToOne: false
            referencedRelation: "ai_system_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_ai_documents: {
        Row: {
          asset_ai_usage_id: string
          description: string | null
          document_type: string
          file_path: string | null
          id: string
          title: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          asset_ai_usage_id: string
          description?: string | null
          document_type: string
          file_path?: string | null
          id?: string
          title: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          asset_ai_usage_id?: string
          description?: string | null
          document_type?: string
          file_path?: string | null
          id?: string
          title?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_ai_documents_asset_ai_usage_id_fkey"
            columns: ["asset_ai_usage_id"]
            isOneToOne: false
            referencedRelation: "asset_ai_usage"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_ai_usage: {
        Row: {
          affected_persons: string[] | null
          ai_features: Json | null
          ai_provider: string | null
          annex_iii_category: string | null
          assessment_completed_by: string | null
          asset_id: string
          compliance_status: string | null
          created_at: string
          data_used_for_training: boolean | null
          has_ai: boolean
          human_oversight_description: string | null
          human_oversight_level: string | null
          id: string
          last_assessment_date: string | null
          logging_enabled: boolean | null
          model_info: string | null
          next_assessment_date: string | null
          purpose_description: string | null
          risk_category: string | null
          risk_justification: string | null
          transparency_description: string | null
          transparency_implemented: boolean | null
          updated_at: string
        }
        Insert: {
          affected_persons?: string[] | null
          ai_features?: Json | null
          ai_provider?: string | null
          annex_iii_category?: string | null
          assessment_completed_by?: string | null
          asset_id: string
          compliance_status?: string | null
          created_at?: string
          data_used_for_training?: boolean | null
          has_ai?: boolean
          human_oversight_description?: string | null
          human_oversight_level?: string | null
          id?: string
          last_assessment_date?: string | null
          logging_enabled?: boolean | null
          model_info?: string | null
          next_assessment_date?: string | null
          purpose_description?: string | null
          risk_category?: string | null
          risk_justification?: string | null
          transparency_description?: string | null
          transparency_implemented?: boolean | null
          updated_at?: string
        }
        Update: {
          affected_persons?: string[] | null
          ai_features?: Json | null
          ai_provider?: string | null
          annex_iii_category?: string | null
          assessment_completed_by?: string | null
          asset_id?: string
          compliance_status?: string | null
          created_at?: string
          data_used_for_training?: boolean | null
          has_ai?: boolean
          human_oversight_description?: string | null
          human_oversight_level?: string | null
          id?: string
          last_assessment_date?: string | null
          logging_enabled?: boolean | null
          model_info?: string | null
          next_assessment_date?: string | null
          purpose_description?: string | null
          risk_category?: string | null
          risk_justification?: string | null
          transparency_description?: string | null
          transparency_implemented?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      asset_relationships: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          relationship_type: string
          source_asset_id: string
          target_asset_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          relationship_type: string
          source_asset_id: string
          target_asset_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          relationship_type?: string
          source_asset_id?: string
          target_asset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_relationships_source_asset_id_fkey"
            columns: ["source_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_relationships_target_asset_id_fkey"
            columns: ["target_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_type_templates: {
        Row: {
          applicable_standards: string[] | null
          asset_type: string
          color: string | null
          created_at: string | null
          custom_fields: Json | null
          display_name: string
          display_name_plural: string
          enabled_tabs: string[] | null
          icon: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          applicable_standards?: string[] | null
          asset_type: string
          color?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          display_name: string
          display_name_plural: string
          enabled_tabs?: string[] | null
          icon?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          applicable_standards?: string[] | null
          asset_type?: string
          color?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          display_name?: string
          display_name_plural?: string
          enabled_tabs?: string[] | null
          icon?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          asset_manager: string | null
          asset_owner: string | null
          asset_type: string
          category: string | null
          compliance_score: number | null
          created_at: string | null
          criticality: string | null
          description: string | null
          external_id: string | null
          external_source_id: string | null
          external_source_provider: string | null
          id: string
          last_synced_at: string | null
          lifecycle_status: string | null
          metadata: Json | null
          name: string
          next_review_date: string | null
          risk_level: string | null
          risk_score: number | null
          sync_enabled: boolean | null
          updated_at: string | null
          url: string | null
          vendor: string | null
          work_area_id: string | null
        }
        Insert: {
          asset_manager?: string | null
          asset_owner?: string | null
          asset_type: string
          category?: string | null
          compliance_score?: number | null
          created_at?: string | null
          criticality?: string | null
          description?: string | null
          external_id?: string | null
          external_source_id?: string | null
          external_source_provider?: string | null
          id?: string
          last_synced_at?: string | null
          lifecycle_status?: string | null
          metadata?: Json | null
          name: string
          next_review_date?: string | null
          risk_level?: string | null
          risk_score?: number | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          url?: string | null
          vendor?: string | null
          work_area_id?: string | null
        }
        Update: {
          asset_manager?: string | null
          asset_owner?: string | null
          asset_type?: string
          category?: string | null
          compliance_score?: number | null
          created_at?: string | null
          criticality?: string | null
          description?: string | null
          external_id?: string | null
          external_source_id?: string | null
          external_source_provider?: string | null
          id?: string
          last_synced_at?: string | null
          lifecycle_status?: string | null
          metadata?: Json | null
          name?: string
          next_review_date?: string | null
          risk_level?: string | null
          risk_score?: number | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          url?: string | null
          vendor?: string | null
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profile: {
        Row: {
          brreg_employees: number | null
          brreg_industry: string | null
          created_at: string | null
          domain: string | null
          employees: string | null
          id: string
          industry: string
          initial_maturity: string | null
          maturity: string | null
          maturity_calculated_at: string | null
          name: string
          org_number: string | null
          team_size: string | null
          updated_at: string | null
          use_cases: string[] | null
        }
        Insert: {
          brreg_employees?: number | null
          brreg_industry?: string | null
          created_at?: string | null
          domain?: string | null
          employees?: string | null
          id?: string
          industry: string
          initial_maturity?: string | null
          maturity?: string | null
          maturity_calculated_at?: string | null
          name: string
          org_number?: string | null
          team_size?: string | null
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Update: {
          brreg_employees?: number | null
          brreg_industry?: string | null
          created_at?: string | null
          domain?: string | null
          employees?: string | null
          id?: string
          industry?: string
          initial_maturity?: string | null
          maturity?: string | null
          maturity_calculated_at?: string | null
          name?: string
          org_number?: string | null
          team_size?: string | null
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Relationships: []
      }
      company_subscriptions: {
        Row: {
          company_id: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_addons: {
        Row: {
          activated_at: string | null
          company_id: string | null
          created_at: string | null
          domain_id: string
          id: string
          monthly_price: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          company_id?: string | null
          created_at?: string | null
          domain_id: string
          id?: string
          monthly_price?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          company_id?: string | null
          created_at?: string | null
          domain_id?: string
          id?: string
          monthly_price?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_addons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          api_key_encrypted: string | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          sync_frequency: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      maturity_milestones: {
        Row: {
          achieved_at: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          milestone_key: string | null
          milestone_type: string
          points: number | null
        }
        Insert: {
          achieved_at?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_key?: string | null
          milestone_type: string
          points?: number | null
        }
        Update: {
          achieved_at?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_key?: string | null
          milestone_type?: string
          points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maturity_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profile"
            referencedColumns: ["id"]
          },
        ]
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
      process_ai_usage: {
        Row: {
          affected_persons: string[] | null
          ai_features: Json | null
          ai_purpose: string | null
          ai_system_id: string | null
          assessed_by: string | null
          automated_decisions: boolean | null
          compliance_checklist: Json | null
          compliance_status: string | null
          created_at: string
          decision_impact: string | null
          estimated_affected_persons: number | null
          estimated_monthly_decisions: number | null
          has_ai: boolean
          human_oversight_description: string | null
          human_oversight_level: string | null
          human_oversight_required: boolean | null
          id: string
          last_review_date: string | null
          next_review_date: string | null
          override_rate: string | null
          process_id: string
          risk_category: string | null
          risk_justification: string | null
          transparency_description: string | null
          transparency_status: string | null
          updated_at: string
          usage_frequency: string | null
          work_area_id: string | null
        }
        Insert: {
          affected_persons?: string[] | null
          ai_features?: Json | null
          ai_purpose?: string | null
          ai_system_id?: string | null
          assessed_by?: string | null
          automated_decisions?: boolean | null
          compliance_checklist?: Json | null
          compliance_status?: string | null
          created_at?: string
          decision_impact?: string | null
          estimated_affected_persons?: number | null
          estimated_monthly_decisions?: number | null
          has_ai?: boolean
          human_oversight_description?: string | null
          human_oversight_level?: string | null
          human_oversight_required?: boolean | null
          id?: string
          last_review_date?: string | null
          next_review_date?: string | null
          override_rate?: string | null
          process_id: string
          risk_category?: string | null
          risk_justification?: string | null
          transparency_description?: string | null
          transparency_status?: string | null
          updated_at?: string
          usage_frequency?: string | null
          work_area_id?: string | null
        }
        Update: {
          affected_persons?: string[] | null
          ai_features?: Json | null
          ai_purpose?: string | null
          ai_system_id?: string | null
          assessed_by?: string | null
          automated_decisions?: boolean | null
          compliance_checklist?: Json | null
          compliance_status?: string | null
          created_at?: string
          decision_impact?: string | null
          estimated_affected_persons?: number | null
          estimated_monthly_decisions?: number | null
          has_ai?: boolean
          human_oversight_description?: string | null
          human_oversight_level?: string | null
          human_oversight_required?: boolean | null
          id?: string
          last_review_date?: string | null
          next_review_date?: string | null
          override_rate?: string | null
          process_id?: string
          risk_category?: string | null
          risk_justification?: string | null
          transparency_description?: string | null
          transparency_status?: string | null
          updated_at?: string
          usage_frequency?: string | null
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_ai_usage_ai_system_id_fkey"
            columns: ["ai_system_id"]
            isOneToOne: false
            referencedRelation: "ai_system_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_ai_usage_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "system_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_ai_usage_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
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
      selected_frameworks: {
        Row: {
          addon_required: boolean | null
          category: string
          created_at: string
          framework_id: string
          framework_name: string
          id: string
          included_in_plan: boolean | null
          is_mandatory: boolean | null
          is_recommended: boolean | null
          is_selected: boolean | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          addon_required?: boolean | null
          category: string
          created_at?: string
          framework_id: string
          framework_name: string
          id?: string
          included_in_plan?: boolean | null
          is_mandatory?: boolean | null
          is_recommended?: boolean | null
          is_selected?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          addon_required?: boolean | null
          category?: string
          created_at?: string
          framework_id?: string
          framework_name?: string
          id?: string
          included_in_plan?: boolean | null
          is_mandatory?: boolean | null
          is_recommended?: boolean | null
          is_selected?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          display_name: string
          features: Json | null
          id: string
          included_domains: string[]
          name: string
          price_monthly: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          features?: Json | null
          id?: string
          included_domains?: string[]
          name: string
          price_monthly?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          included_domains?: string[]
          name?: string
          price_monthly?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          ai_system_id: string | null
          category: string | null
          created_at: string | null
          criticality: string | null
          description: string | null
          due_date: string | null
          id: string
          is_ai_related: boolean | null
          last_updated: string | null
          measures_completed: number | null
          measures_count: number | null
          processes_count: number | null
          relevant_frameworks: string[] | null
          responsible: string | null
          risk_level: string | null
          status: string | null
          system_id: string
          systems_count: number | null
          time_hours: number | null
          title: string
        }
        Insert: {
          ai_system_id?: string | null
          category?: string | null
          created_at?: string | null
          criticality?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_ai_related?: boolean | null
          last_updated?: string | null
          measures_completed?: number | null
          measures_count?: number | null
          processes_count?: number | null
          relevant_frameworks?: string[] | null
          responsible?: string | null
          risk_level?: string | null
          status?: string | null
          system_id: string
          systems_count?: number | null
          time_hours?: number | null
          title: string
        }
        Update: {
          ai_system_id?: string | null
          category?: string | null
          created_at?: string | null
          criticality?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_ai_related?: boolean | null
          last_updated?: string | null
          measures_completed?: number | null
          measures_count?: number | null
          processes_count?: number | null
          relevant_frameworks?: string[] | null
          responsible?: string | null
          risk_level?: string | null
          status?: string | null
          system_id?: string
          systems_count?: number | null
          time_hours?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_incidents_ai_system_id_fkey"
            columns: ["ai_system_id"]
            isOneToOne: false
            referencedRelation: "ai_system_registry"
            referencedColumns: ["id"]
          },
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
      system_templates: {
        Row: {
          ai_features: string | null
          category: string | null
          created_at: string | null
          description: string | null
          has_ai: boolean | null
          id: string
          name: string
          sort_order: number | null
          vendor: string | null
          work_area_type: string
        }
        Insert: {
          ai_features?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          has_ai?: boolean | null
          id?: string
          name: string
          sort_order?: number | null
          vendor?: string | null
          work_area_type: string
        }
        Update: {
          ai_features?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          has_ai?: boolean | null
          id?: string
          name?: string
          sort_order?: number | null
          vendor?: string | null
          work_area_type?: string
        }
        Relationships: []
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
      user_dashboard_preferences: {
        Row: {
          active_view: string | null
          created_at: string | null
          hidden_widgets: string[] | null
          id: string
          pinned_widgets: string[] | null
          updated_at: string | null
          user_id: string
          widget_order: Json | null
        }
        Insert: {
          active_view?: string | null
          created_at?: string | null
          hidden_widgets?: string[] | null
          id?: string
          pinned_widgets?: string[] | null
          updated_at?: string | null
          user_id: string
          widget_order?: Json | null
        }
        Update: {
          active_view?: string | null
          created_at?: string | null
          hidden_widgets?: string[] | null
          id?: string
          pinned_widgets?: string[] | null
          updated_at?: string | null
          user_id?: string
          widget_order?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_area_templates: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          industry: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          industry: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          industry?: string
          name?: string
          sort_order?: number | null
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
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "daglig_leder"
        | "personvernombud"
        | "sikkerhetsansvarlig"
        | "compliance_ansvarlig"
        | "ai_governance"
        | "operativ_bruker"
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
      app_role: [
        "daglig_leder",
        "personvernombud",
        "sikkerhetsansvarlig",
        "compliance_ansvarlig",
        "ai_governance",
        "operativ_bruker",
      ],
    },
  },
} as const
