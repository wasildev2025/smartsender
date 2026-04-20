import React, { createContext, useContext, useState, useEffect } from 'react';

interface LicenseContextType {
  isLicensed: boolean;
  expiresAt: string | null;
  licenseKey: string | null;
  isLoading: boolean;
  verifyLicense: (key?: string) => Promise<boolean>;
  logoutLicense: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLicensed, setIsLicensed] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyLicense = async (key?: string) => {
    try {
      const targetKey = key || localStorage.getItem('smartsender_license');
      if (!targetKey) {
        setIsLicensed(false);
        setExpiresAt(null);
        setLicenseKey(null);
        setIsLoading(false);
        return false;
      }

      const machineId = await (window as any).ipcRenderer.invoke('get-machine-id');
      const res = await fetch('http://127.0.0.1:3000/api/license/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: targetKey, machineId }),
        cache: 'no-store'
      });

      if (!res.ok) throw new Error('Verification failed');

      const data = await res.json();
      if (data.valid) {
        localStorage.setItem('smartsender_license', targetKey);
        setIsLicensed(true);
        setExpiresAt(data.expires_at || null);
        setLicenseKey(targetKey);
        return true;
      } else {
        // Only clear if we explicitly provided a key that failed
        if (key) {
           throw new Error(data.message || 'Invalid license');
        }
        setIsLicensed(false);
        return false;
      }
    } catch (err) {
      console.error('License verification error:', err);
      if (key) throw err;
      setIsLicensed(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutLicense = () => {
    localStorage.removeItem('smartsender_license');
    setIsLicensed(false);
    setExpiresAt(null);
    setLicenseKey(null);
  };

  useEffect(() => {
    verifyLicense();
    // Check every 5 minutes
    const interval = setInterval(() => verifyLicense(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LicenseContext.Provider value={{ isLicensed, expiresAt, licenseKey, isLoading, verifyLicense, logoutLicense }}>
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
