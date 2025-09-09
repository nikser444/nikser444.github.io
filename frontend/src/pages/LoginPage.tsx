import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLayout, LoginForm } from '../components/auth';
import { useAuth } from '../hooks';

const LoginPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <AuthLayout
      title="Добро пожаловать"
      subtitle="Войдите в свой аккаунт для доступа к мессенджеру"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;