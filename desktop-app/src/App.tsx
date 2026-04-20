import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import License from './pages/License';
import Accounts from './pages/Accounts';
import Sender from './pages/Sender';
import Extractor from './pages/Extractor';
import Groups from './pages/Groups';
import Validator from './pages/Validator';
import AutoResponder from './pages/AutoResponder';
import Settings from './pages/Settings';

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
          <Route path="sender" element={<Sender />} />
          <Route path="auto-responder" element={<AutoResponder />} />
          <Route path="extractor" element={<Extractor />} />
          <Route path="groups" element={<Groups />} />
          <Route path="validator" element={<Validator />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
