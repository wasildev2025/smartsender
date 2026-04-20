import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import License from './pages/License';
import Accounts from './pages/Accounts';

function App() {
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);

  useEffect(() => {
    // Check local storage for existing license
    const license = localStorage.getItem('smartsender_license');
    if (license) {
      setHasLicense(true);
    } else {
      setHasLicense(false);
    }
  }, []);

  if (hasLicense === null) return null;

  if (!hasLicense) {
    return <License onVerify={() => setHasLicense(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sender" element={<div className="p-4">Bulk Sender Coming Soon</div>} />
          <Route path="auto-responder" element={<div className="p-4">Auto Responder Coming Soon</div>} />
          <Route path="extractor" element={<div className="p-4">Extractor Coming Soon</div>} />
          <Route path="groups" element={<div className="p-4">Groups Coming Soon</div>} />
          <Route path="validator" element={<div className="p-4">Validator Coming Soon</div>} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="settings" element={<div className="p-4">Settings Coming Soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
