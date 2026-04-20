import { HashRouter, Routes, Route } from 'react-router-dom';
import { LicenseProvider } from './context/LicenseContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Sender from './pages/Sender';
import Extractor from './pages/Extractor';
import Groups from './pages/Groups';
import GroupBlaster from './pages/GroupBlaster';
import Validator from './pages/Validator';
import AutoResponder from './pages/AutoResponder';
import Settings from './pages/Settings';

function App() {
  return (
    <LicenseProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sender" element={<Sender />} />
            <Route path="auto-responder" element={<AutoResponder />} />
            <Route path="extractor" element={<Extractor />} />
            <Route path="groups" element={<Groups />} />
            <Route path="group-blaster" element={<GroupBlaster />} />
            <Route path="validator" element={<Validator />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </LicenseProvider>
  );
}

export default App;


