import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApiLogout } from "../api";
import { prepareSessionLogout } from "../config/interceptor";
import { disconnectSocket } from "../config/socket.config";
import { clearAccountState } from "../redux/account/accountSlice";
import { useAppDispatch } from "./hooks";

export const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await prepareSessionLogout();
      const accessToken = localStorage.getItem("access_token");

      disconnectSocket();
      localStorage.removeItem("access_token");
      await callApiLogout(accessToken);
    } catch {
      // The response interceptor reports the API error; local cleanup must continue.
    } finally {
      localStorage.removeItem("access_token");
      dispatch(clearAccountState());
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  }, [dispatch, isLoggingOut, navigate]);

  return { logout, isLoggingOut };
};
