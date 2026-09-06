import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Card,
  Input,
  Select,
  Space,
  Typography,
  message,
} from 'antd';

import {
  InfoCircleOutlined,
} from '@ant-design/icons';

import {
  hrTalentsApi,
  type HrSkillSupplyRiskItem,
  type HrSkillSupplyRiskLevel,
  type HrSkillSupplyRiskSummary as RiskSummary,
} from '../../../../api/hrTalents';

import SkillSupplyRiskSummary
  from './SkillSupplyRiskSummary';

import SkillSupplyRiskTable
  from './SkillSupplyRiskTable';

const {
  Text,
  Title,
} = Typography;

const DEFAULT_PAGE_SIZE = 20;

const SkillSupplyRiskView: React.FC =
  () => {
    const [
      data,
      setData,
    ] = useState<
      HrSkillSupplyRiskItem[]
    >([]);

    const [
      summary,
      setSummary,
    ] = useState<
      RiskSummary | null
    >(null);

    const [
      loading,
      setLoading,
    ] = useState(false);

    const [
      page,
      setPage,
    ] = useState(1);

    const [
      pageSize,
      setPageSize,
    ] = useState(
      DEFAULT_PAGE_SIZE,
    );

    const [
      total,
      setTotal,
    ] = useState(0);

    const [
      search,
      setSearch,
    ] = useState('');

    const [
      riskLevel,
      setRiskLevel,
    ] = useState<
      HrSkillSupplyRiskLevel
      | undefined
    >();

    const loadRisk =
      useCallback(async () => {
        setLoading(true);

        try {
          const response =
            await hrTalentsApi
              .getSkillSupplyRisk({
                page,
                limit:
                  pageSize,

                search:
                  search.trim() ||
                  undefined,

                riskLevel,
              });

          const payload =
            response?.data;

          setData(
            payload?.result ??
              [],
          );

          setSummary(
            payload?.summary ??
              null,
          );

          setTotal(
            payload?.meta
              ?.total ??
              0,
          );
        } catch (error) {
          console.error(
            'Không tải được rủi ro nguồn cung kỹ năng',
            error,
          );

          message.error(
            'Không thể tải dữ liệu rủi ro nguồn cung kỹ năng.',
          );
        } finally {
          setLoading(false);
        }
      }, [
        page,
        pageSize,
        search,
        riskLevel,
      ]);

    useEffect(() => {
      void loadRisk();
    }, [loadRisk]);

    const handleSearch = (
      value: string,
    ) => {
      setPage(1);
      setSearch(
        value.trim(),
      );
    };

    const handleRiskChange = (
      value:
        HrSkillSupplyRiskLevel
        | undefined,
    ) => {
      setPage(1);
      setRiskLevel(
        value,
      );
    };

    const handlePageChange = (
      nextPage: number,
      nextPageSize: number,
    ) => {
      if (
        nextPageSize !==
        pageSize
      ) {
        setPage(1);
        setPageSize(
          nextPageSize,
        );

        return;
      }

      setPage(
        nextPage,
      );
    };

    return (
      <div>
        <div
          style={{
            marginBottom: 18,
          }}
        >
          <Title
            level={4}
            style={{
              marginBottom: 4,
            }}
          >
            Rủi ro nguồn cung
            kỹ năng
          </Title>

          <Text
            type="secondary"
          >
            Phân tích mức độ
            mỏng, tập trung,
            xác minh và khả năng
            điều động của nguồn
            nhân lực theo từng
            kỹ năng.
          </Text>
        </div>

        <Card
          variant="borderless"
          style={{
            marginBottom: 16,
            borderRadius: 12,
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Space
            size={6}
            align="start"
          >
            <InfoCircleOutlined />

            <Text
              type="secondary"
              style={{
                fontSize: 13,
              }}
            >
              Chỉ số này đánh giá
              rủi ro của nguồn cung
              nhân lực nội bộ,
              không phải mức thiếu
              hụt kỹ năng so với
              nhu cầu của dự án.
            </Text>
          </Space>
        </Card>

        {summary && (
          <SkillSupplyRiskSummary
            summary={
              summary
            }
          />
        )}

        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Space
            wrap
            size={12}
            style={{
              marginBottom: 16,
            }}
          >
            <Input.Search
              allowClear
              placeholder="Tìm theo tên kỹ năng"
              style={{
                width: 280,
              }}
              onSearch={
                handleSearch
              }
            />

            <Select<
              HrSkillSupplyRiskLevel
            >
              allowClear
              placeholder="Mức rủi ro"
              style={{
                width: 190,
              }}
              value={
                riskLevel
              }
              onChange={
                handleRiskChange
              }
              options={[
                {
                  value:
                    'CRITICAL',
                  label:
                    'Nghiêm trọng',
                },
                {
                  value:
                    'HIGH',
                  label:
                    'Cao',
                },
                {
                  value:
                    'MEDIUM',
                  label:
                    'Trung bình',
                },
                {
                  value:
                    'LOW',
                  label:
                    'Thấp',
                },
              ]}
            />
          </Space>

          <SkillSupplyRiskTable
            data={data}
            loading={
              loading
            }
            page={page}
            pageSize={
              pageSize
            }
            total={total}
            onPageChange={
              handlePageChange
            }
          />
        </Card>
      </div>
    );
  };

export default SkillSupplyRiskView;