import { Navigate } from "react-router";
import { useAppSelector } from "../../hooks/hooks";
import Loading from "./loading";

const RoleBaseRoute = (props: any) => {
  return <>{props.children}</>;
};

const ProtectedRoute = (props: any) => {
  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated,
  );
  const isLoading = useAppSelector((state) => state.account.isLoading);

  // Temporary development bypass: do not redirect away from PM screens while working on feature development.
  if (isLoading === true) {
    return <Loading />;
  }

  return <RoleBaseRoute>{props.children}</RoleBaseRoute>;
};

export default ProtectedRoute;
