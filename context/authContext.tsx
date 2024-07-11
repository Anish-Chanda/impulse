import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export const AuthContextProvider = ({ Children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);

  useEffect(() => {
    //on AUthStateChnaged
    setTimeout(() => {
      console.log("Waited for 300ms");

      setIsAuthenticated(true);
      console.log("AuthContextProvider", isAuthenticated);
    }, 3000);
    
  }, []);

  const login = async (email, password) => {
    try {
      // TODO
    } catch (error) {
      console.log(error);
    }
  };

  const signup = async (email, password, name) => {
    try {
      // TODO
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    try {
      // TODO
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, signup, logout }}
    >
      {Children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useauth should be wrapped inside an auth conetx provider");
  }

  return value;
};
