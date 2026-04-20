import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LicenseContextType {
  isLicensed: boolean;
  expiresAt: string | null;
  features: string[];
  isLoading: boolean;
  verifyLicense: (key?: string) => Promise<boolean>;
  logoutLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLicensed, setIsLicensed] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFromMain = useCallback(async () => {
    const status = await window.smartsender.license.status();
    setIsLicensed(status.valid);
    setExpiresAt(status.expiresAt);
    setFeatures(status.features);
    setIsLoading(false);
  }, []);

  const verifyLicense = useCallback(async (key?: string) => {
    if (!key) {
      await refreshFromMain();
      return isLicensed;
    }
    const res = await window.smartsender.license.activate(key);
    if (res.valid) {
      setIsLicensed(true);
      setExpiresAt(res.expiresAt);
      setFeatures(res.features);
      return true;
    }
    if (res.error) {
      throw new Error(res.error);
    }
    return false;
  }, [isLicensed, refreshFromMain]);

  const logoutLicense = useCallback(async () => {
    await window.smartsender.license.deactivate();
    setIsLicensed(false);
    setExpiresAt(null);
    setFeatures([]);
  }, []);

  useEffect(() => {
    refreshFromMain();
    // Re-check every 15 minutes; the main process can also extend offline grace.
    const interval = setInterval(refreshFromMain, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshFromMain]);

  return (
    <LicenseContext.Provider value={{ isLicensed, expiresAt, features, isLoading, verifyLicense, logoutLicense }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
