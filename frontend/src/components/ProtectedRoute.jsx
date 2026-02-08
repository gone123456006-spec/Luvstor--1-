import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                // Optional: You could verify the token with the backend here if needed
                // const response = await fetch('/api/auth/me', ...);

                if (token) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoading) {
        // You can replace this with a proper LoadingSpinner component
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a', color: '#fff' }}>
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login, saving the location they tried to access
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
