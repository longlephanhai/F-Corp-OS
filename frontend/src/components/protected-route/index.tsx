import { Navigate } from "react-router";
import { useAppSelector } from "../../hooks/hooks"
import Loading from "./loading";

const RoleBaseRoute = (props: any) => {
    return (
        <>{props.children}</>
    )
}

const ProtectedRoute = (props: any) => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const isLoading = useAppSelector(state => state.account.isLoading);

    return (
        <>
            {isLoading === true
                ?
                <Loading />
                :
                <>
                    {isAuthenticated === true ?
                        <>
                            <RoleBaseRoute>
                                {props.children}
                            </RoleBaseRoute>
                        </>
                        :
                        <Navigate to='/login' replace />
                    }
                </>
            }
        </>
    )
}

export default ProtectedRoute;