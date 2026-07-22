import { Navigate, Outlet } from "react-router";
import { useLoading } from "../context/LoadingContext";

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  redirectPath?: string;
}
export const ProtectedRoute = ({
  isAuthenticated,
  redirectPath = "/",
}: ProtectedRouteProps) => {
  const { isLoading } = useLoading();
  //   useEffect(() => {
  //     console.log("protector", isLoading, isAuthenticated);
  //   }, [isLoading, isAuthenticated]);
  if (isLoading) {
    return <Outlet />;
  }
  if (isAuthenticated) {
    return <Outlet />;
  }
  return (
    <Navigate to={redirectPath} replace />
    //   <Navigate to={redirectPath} replace={replace} />
  );
};
