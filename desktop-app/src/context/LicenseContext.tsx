import React, { useState, useEffect, useCallback } from 'react';
import { LicenseContext, type LicenseUpdatePayload } from './licenseShared';

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
    // One-shot bootstrap on mount
    // Wrapping in an async call or handling the promise satisfies the lint rule
    // against synchronous-looking state updates in effects.
    refreshFromMain().catch(console.error);

    const unsub = window.smartsender.license.onUpdate((status: LicenseUpdatePayload) => {
      setIsLicensed(status.valid);
      setExpiresAt(status.expiresAt);
      setFeatures(status.features);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [refreshFromMain]);

  return (
    <LicenseContext.Provider value={{ isLicensed, expiresAt, features, isLoading, verifyLicense, logoutLicense }}>
      {children}
    </LicenseContext.Provider>
  );
};
