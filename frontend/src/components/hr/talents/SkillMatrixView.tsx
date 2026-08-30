import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Button,
  Card,
  Flex,
  Input,
  Space,
  Typography,
  message,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import {
  hrTalentsApi,
  type HrSkillMatrixItem,
} from '../../../api/hrTalents';

import SkillMatrixTable from './SkillMatrixTable';

const { Text } = Typography;

const PAGE_SIZE = 20;

const SkillMatrixView: React.FC =
  () => {
    const [
      skills,
      setSkills,
    ] = useState<
      HrSkillMatrixItem[]
    >([]);

    const [
      loading,
      setLoading,
    ] = useState(false);

    const [
      page,
      setPage,
    ] = useState(1);

    const [
      total,
      setTotal,
    ] = useState(0);

    const [
      searchInput,
      setSearchInput,
    ] = useState('');

    const [
      search,
      setSearch,
    ] = useState('');

    const loadSkillMatrix =
      useCallback(async () => {
        setLoading(true);

        try {
          const response =
            await hrTalentsApi.getSkillMatrix(
              {
                page,
                limit:
                  PAGE_SIZE,
                search:
                  search ||
                  undefined,
              },
            );

          const data =
            response?.data;

          setSkills(
            data?.result ?? [],
          );

          setTotal(
            data?.meta?.total ??
              0,
          );
        } catch (error) {
          console.error(
            'Không tải được HR Skill Matrix',
            error,
          );

          setSkills([]);
          setTotal(0);

          message.error(
            'Không thể tải ma trận kỹ năng.',
          );
        } finally {
          setLoading(false);
        }
      }, [
        page,
        search,
      ]);

    useEffect(() => {
      void loadSkillMatrix();
    }, [loadSkillMatrix]);

    const handleSearch =
      () => {
        setPage(1);

        setSearch(
          searchInput.trim(),
        );
      };

    const handleReset =
      () => {
        setSearchInput('');
        setSearch('');
        setPage(1);
      };

    return (
      <>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            marginBottom: 16,
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)',
          }}
          styles={{
            body: {
              padding: 16,
            },
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={12}
          >
            <Space wrap>
              <Input
                value={
                  searchInput
                }
                onChange={(event) =>
                  setSearchInput(
                    event.target
                      .value,
                  )
                }
                onPressEnter={
                  handleSearch
                }
                placeholder="Tìm kỹ năng..."
                prefix={
                  <SearchOutlined />
                }
                allowClear
                style={{
                  width: 280,
                }}
              />

              <Button
                type="primary"
                icon={
                  <SearchOutlined />
                }
                onClick={
                  handleSearch
                }
              >
                Tìm kiếm
              </Button>

              <Button
                onClick={
                  handleReset
                }
              >
                Xóa bộ lọc
              </Button>
            </Space>

            <Space>
              <Text type="secondary">
                {total} kỹ năng
              </Text>

              <Button
                icon={
                  <ReloadOutlined />
                }
                loading={loading}
                onClick={() =>
                  void loadSkillMatrix()
                }
              >
                Làm mới
              </Button>
            </Space>
          </Flex>
        </Card>

        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)',
          }}
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <SkillMatrixTable
            data={skills}
            loading={loading}
            page={page}
            pageSize={
              PAGE_SIZE
            }
            total={total}
            onPageChange={(
              nextPage,
            ) =>
              setPage(
                nextPage,
              )
            }
          />
        </Card>
      </>
    );
  };

export default SkillMatrixView;