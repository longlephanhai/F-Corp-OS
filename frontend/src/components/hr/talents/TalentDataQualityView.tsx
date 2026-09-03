import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    message,
} from 'antd';


import {
    hrTalentsApi,
    type HrTalentDataQualityItem,
    type HrTalentDataQualityResponse,
} from '../../../api/hrTalents';

import TalentDataQualityIssueDrawer, {
    type TalentDataQualityIssueType,
} from './TalentDataQualityIssueDrawer';

import TalentProfileDrawer from './TalentProfileDrawer';
import TalentDataQualityFilters from './TalentDataQualityFilters';
import TalentDataQualitySummary from './TalentDataQualitySummary';
import TalentDataQualityIssues from './TalentDataQualityIssues';


const DEFAULT_STALE_DAYS = 90;



const TalentDataQualityView:
    React.FC = () => {
        const [
            data,
            setData,
        ] = useState<
            HrTalentDataQualityResponse | null
        >(null);

        const [
            loading,
            setLoading,
        ] = useState(false);

        const [
            role,
            setRole,
        ] = useState<string>();

        const [
            staleDays,
            setStaleDays,
        ] = useState(
            DEFAULT_STALE_DAYS,
        );

        const [
            selectedIssue,
            setSelectedIssue,
        ] = useState<
            TalentDataQualityIssueType | null
        >(null);

        const [
            issueDrawerOpen,
            setIssueDrawerOpen,
        ] = useState(false);

        const [
            selectedEmployeeId,
            setSelectedEmployeeId,
        ] = useState<string | null>(
            null,
        );

        const [
            profileOpen,
            setProfileOpen,
        ] = useState(false);

        const loadDataQuality =
            useCallback(async () => {
                setLoading(true);

                try {
                    const response =
                        await hrTalentsApi
                            .getTalentDataQuality({
                                role:
                                    role ||
                                    undefined,

                                staleDays,
                            });

                    setData(
                        response?.data ??
                        null,
                    );
                } catch (error) {
                    console.error(
                        'Không tải được Talent Data Quality',
                        error,
                    );

                    setData(null);

                    message.error(
                        'Không thể tải dữ liệu chất lượng hồ sơ năng lực.',
                    );
                } finally {
                    setLoading(false);
                }
            }, [
                role,
                staleDays,
            ]);

        useEffect(() => {
            void loadDataQuality();
        }, [loadDataQuality]);

        const handleReset = () => {
            setRole(undefined);

            setStaleDays(
                DEFAULT_STALE_DAYS,
            );
        };

        const handleOpenIssue = (
            issue:
                TalentDataQualityIssueType,
        ) => {
            setSelectedIssue(
                issue,
            );

            setIssueDrawerOpen(
                true,
            );
        };

        const handleCloseIssue =
            () => {
                setIssueDrawerOpen(
                    false,
                );

                setSelectedIssue(
                    null,
                );
            };

        const handleViewProfile = (
            employeeId: string,
        ) => {
            /*
             * Tránh hai Drawer chồng nhau.
             */
            setIssueDrawerOpen(
                false,
            );

            setSelectedEmployeeId(
                employeeId,
            );

            setProfileOpen(true);
        };

        const handleCloseProfile =
            () => {
                setProfileOpen(false);

                setSelectedEmployeeId(
                    null,
                );
            };

        const getIssueData = (
            issue:
                TalentDataQualityIssueType
                | null,
        ): HrTalentDataQualityItem[] => {
            if (
                !issue ||
                !data
            ) {
                return [];
            }

            switch (issue) {
                case 'WITHOUT_SKILLS':
                    return (
                        data.issues
                            .withoutSkills ??
                        []
                    );

                case 'WITHOUT_APPROVED_EVIDENCE':
                    return (
                        data.issues
                            .withoutApprovedEvidence ??
                        []
                    );

                case 'PENDING_EVIDENCE':
                    return (
                        data.issues
                            .pendingEvidence ??
                        []
                    );

                case 'STALE_PROFILE':
                    return (
                        data.issues
                            .staleProfiles ??
                        []
                    );

                default:
                    return [];
            }
        };

        const summary =
            data?.summary;

        return (
            <>
                {/* ================================= */}
                {/* FILTER */}
                {/* ================================= */}

                <TalentDataQualityFilters
                    role={role}
                    staleDays={
                        staleDays
                    }
                    loading={
                        loading
                    }
                    onRoleChange={(
                        value,
                    ) =>
                        setRole(
                            value,
                        )
                    }
                    onStaleDaysChange={(
                        value,
                    ) =>
                        setStaleDays(
                            value,
                        )
                    }
                    onReset={
                        handleReset
                    }
                    onReload={() =>
                        void loadDataQuality()
                    }
                />

                {/* ================================= */}
                {/* SUMMARY */}
                {/* ================================= */}

                <TalentDataQualitySummary
                    summary={
                        summary
                    }
                    staleDays={
                        data?.criteria
                            ?.staleDays ??
                        staleDays
                    }
                />

                {/* ================================= */}
                {/* ISSUES */}
                {/* ================================= */}

                <TalentDataQualityIssues
                    summary={
                        summary
                    }
                    staleDays={
                        data?.criteria
                            ?.staleDays ??
                        staleDays
                    }
                    onOpenIssue={
                        handleOpenIssue
                    }
                />

                {/* ================================= */}
                {/* DRAWERS */}
                {/* ================================= */}

                <TalentDataQualityIssueDrawer
                    open={
                        issueDrawerOpen
                    }
                    issueType={
                        selectedIssue
                    }
                    data={getIssueData(
                        selectedIssue,
                    )}
                    staleDays={
                        data?.criteria
                            ?.staleDays ??
                        staleDays
                    }
                    onClose={
                        handleCloseIssue
                    }
                    onViewProfile={
                        handleViewProfile
                    }
                />

                <TalentProfileDrawer
                    open={profileOpen}
                    employeeId={
                        selectedEmployeeId
                    }
                    onClose={
                        handleCloseProfile
                    }
                />
            </>
        );
    };

export default TalentDataQualityView;