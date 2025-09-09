import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLayout, RegisterForm } from '../components/auth';
import { useAuth } from '../hooks';

const RegisterPage: React.FC = () => {
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
      title="Создать аккаунт"
      subtitle="Зарегистрируйтесь для использования мессенджера"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;