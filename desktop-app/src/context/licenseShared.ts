import { createContext, useContext } from 'react';
import type { LicenseStatus } from '../global';

// Hooks and the context object live in this non-component file so the
// Provider component can be HMR-friendly (react-refresh requires that JSX
// component files only export components).

export interface LicenseContextType {
  isLicensed: boolean;
  expiresAt: string | null;
  features: string[];
  isLoading: boolean;
  verifyLicense: (key?: string) => Promise<boolean>;
  logoutLicense: () => Promise<void>;
}

export const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export type LicenseUpdatePayload = LicenseStatus;

export const useLicense = (): LicenseContextType => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
