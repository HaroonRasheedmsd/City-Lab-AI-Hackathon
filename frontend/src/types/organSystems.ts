import type React from 'react';
import {
  Heart,
  Droplet,
  Activity,
  Flame,
} from 'lucide-react';

export type OrganSystemKey =
  | 'blood'
  | 'liver'
  | 'pancreas'
  | 'heart'
  | 'thyroid'
  | 'kidney';

export interface OrganConfig {
  key: OrganSystemKey;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  cx: number;
  cy: number;
  r: number;
  testPatterns: string[];
}

export const ORGAN_SYSTEMS: OrganConfig[] = [
  {
    key: 'thyroid',
    name: 'Thyroid',
    subtitle: 'Endocrine & Metabolism',
    icon: Flame,
    cx: 150,
    cy: 78,
    r: 18,
    testPatterns: ['tsh', 'thyroid', 't4', 't3'],
  },
  {
    key: 'heart',
    name: 'Heart & Vascular',
    subtitle: 'Cardiovascular & Lipids',
    icon: Heart,
    cx: 172,
    cy: 135,
    r: 22,
    testPatterns: ['cholesterol', 'triglyceride', 'hdl', 'ldl', 'lipid', 'vldl'],
  },
  {
    key: 'liver',
    name: 'Liver',
    subtitle: 'Hepatic Enzymes & Clearance',
    icon: Activity,
    cx: 128,
    cy: 165,
    r: 24,
    testPatterns: ['alt', 'sgpt', 'ast', 'sgot', 'bilirubin', 'alp', 'alkaline', 'phosphatase'],
  },
  {
    key: 'pancreas',
    name: 'Pancreas & Sugar',
    subtitle: 'Glucose & Glycemic Control',
    icon: Activity,
    cx: 150,
    cy: 198,
    r: 20,
    testPatterns: ['glucose', 'blood sugar', 'sugar', 'hba1c', 'fasting blood sugar'],
  },
  {
    key: 'kidney',
    name: 'Kidneys & Urinary',
    subtitle: 'Renal Function & Urinalysis',
    icon: Droplet,
    cx: 150,
    cy: 235,
    r: 22,
    testPatterns: ['urine', 'protein', 'ph', 'creatinine', 'urea', 'bun', 'specific gravity'],
  },
  {
    key: 'blood',
    name: 'Blood & Marrow',
    subtitle: 'Hematology & Immune Cells',
    icon: Droplet,
    cx: 150,
    cy: 310,
    r: 26,
    testPatterns: ['hemoglobin', 'tlc', 'wbc', 'platelet', 'rbc', 'red blood', 'leukocyte', 'esr'],
  },
];

export function mapTestToOrgan(testCanonical: string, testAsReported: string): OrganSystemKey | null {
  const combined = `${testCanonical} ${testAsReported}`.toLowerCase();
  for (const organ of ORGAN_SYSTEMS) {
    if (organ.testPatterns.some((pattern) => combined.includes(pattern))) {
      return organ.key;
    }
  }
  return null;
}
