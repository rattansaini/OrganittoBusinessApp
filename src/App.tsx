import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineBanner from './components/OfflineBanner';
import UpdateNotification from './components/UpdateNotification';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import ExpenseList from './pages/ExpenseList';
import ExpenseReports from './pages/ExpenseReports';
import Investments from './pages/Investments';
import ProductPipeline from './pages/ProductPipeline';
import ProductDetail from './pages/ProductDetail';
import CostCalculator from './pages/CostCalculator';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import Ingredients from './pages/Ingredients';
import IngredientDetail from './pages/IngredientDetail';
import Compliance from './pages/Compliance';
import LicenseDetail from './pages/LicenseDetail';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineBanner />
        <PWAInstallPrompt />
        <UpdateNotification />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/add"
            element={
              <ProtectedRoute>
                <AddExpense />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpenseList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/reports"
            element={
              <ProtectedRoute>
                <ExpenseReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investments"
            element={
              <ProtectedRoute>
                <Investments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductPipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <ProductDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calculator"
            element={
              <ProtectedRoute>
                <CostCalculator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors"
            element={
              <ProtectedRoute>
                <Vendors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:id"
            element={
              <ProtectedRoute>
                <VendorDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batches"
            element={
              <ProtectedRoute>
                <Batches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batches/:id"
            element={
              <ProtectedRoute>
                <BatchDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ingredients"
            element={
              <ProtectedRoute>
                <Ingredients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ingredients/:id"
            element={
              <ProtectedRoute>
                <IngredientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <Compliance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance/:id"
            element={
              <ProtectedRoute>
                <LicenseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
