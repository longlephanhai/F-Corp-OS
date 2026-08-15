import { useEffect, useState } from "react";
import { useAppSelector } from "../../hooks/hooks";
import { Result } from "antd";

interface IProps {
    hideChildren?: boolean;
    children: React.ReactNode;
    permission: { method: string, api_path: string, module: string };
}

const Access = (props: IProps) => {

    const { permission, hideChildren = false } = props;
    const [allow, setAllow] = useState<boolean>(true);
    const permissions = useAppSelector(state => state.account.user.permissions);


    useEffect(() => {
        if (permissions.length) {
            const check = permissions.find(item =>
                item.apiPath === permission.api_path
                && item.method === permission.method
                && item.module === permission.module
            )
            if (check) {
                setAllow(true)
            } else
                setAllow(false);
        }
    }, [permissions])

    return (
        <>
            {allow === true
                ?
                <>{props.children}</>
                :
                <>
                    {hideChildren === false ?
                        <Result
                            status="403"
                            title="Truy cập bị từ chối"
                            subTitle="Xin lỗi, bạn không có quyền hạn truy cập thông tin này"
                        />
                        :
                        <>

                        </>
                    }
                </>
            }
        </>
    )
}

export default Access;