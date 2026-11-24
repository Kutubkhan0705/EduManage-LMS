
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem("edumanage_token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get("/auth/me");
                setUser(response.data.user);
            } catch (error) {
                localStorage.removeItem("edumanage_token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, []);

    const register = async (formData) => {
        const response = await api.post("/auth/register", formData);

        localStorage.setItem("edumanage_token", response.data.token);
        setUser(response.data.user);

        return response.data;
    };

    const login = async (formData) => {
        const response = await api.post("/auth/login", formData);

        localStorage.setItem("edumanage_token", response.data.token);
        setUser(response.data.user);

        return response.data;
    };

    const logout = () => {
        localStorage.removeItem("edumanage_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                register,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
};
