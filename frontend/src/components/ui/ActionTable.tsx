import React, { useState } from 'react';
import {
    Table,
    Input,
    Select,
    Card,
    Badge,
    Button,
    Flex,
    Typography,
} from 'antd';
import type { TableProps } from 'antd';
import { SearchOutlined, FilterOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FilterOption {
    /** Unique key used as the Select's value */
    key: string;
    /** Label shown in the dropdown trigger (e.g. "Phòng ban: Tất cả") */
    placeholder: string;
    /** The options inside this dropdown */
    options: { value: string; label: string }[];
    /** Width of the Select widget (default: 180) */
    width?: number;
}

export interface ActionTableProps<T extends object> {
    // ── Table ──────────────────────────────────────────────────────────────
    /** antd ColumnsType passed straight through to <Table> */
    columns: TableProps<T>['columns'];
    /** Full unfiltered dataset. ActionTable handles client-side filtering. */
    dataSource: T[];
    /** Field used as the row key (default: "key") */
    rowKey?: string;
    /** Horizontal scroll threshold (default: 800) */
    scrollX?: number;
    /** Page size (default: 10) */
    pageSize?: number;

    // ── Search ─────────────────────────────────────────────────────────────
    /** Placeholder for the search input */
    searchPlaceholder?: string;
    /**
     * Called with the current search string whenever it changes.
     * Return `true` to include the row, `false` to exclude it.
     * If omitted, no search filtering is applied.
     */
    onSearch?: (row: T, query: string) => boolean;

    // ── Dropdown filters ───────────────────────────────────────────────────
    /**
     * Dynamic Select filters rendered next to the search box.
     * Each filter independently narrows the visible rows.
     */
    filterOptions?: FilterOption[];
    /**
     * For each FilterOption key, a predicate that decides whether a row
     * passes the selected value.  'all' means no filter is applied.
     */
    filterPredicates?: Record<string, (row: T, value: string) => boolean>;

    // ── Table card chrome ──────────────────────────────────────────────────
    /** Icon + text shown in the Card title area (left side) */
    tableTitle?: React.ReactNode;
    /** Extra element shown on the right of the Card title (e.g. row count) */
    tableExtra?: React.ReactNode;

    // ── Result badge label ─────────────────────────────────────────────────
    /** Text inside the "Kết quả" badge button (default: "Kết quả") */
    resultLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

function ActionTable<T extends object>({
    columns,
    dataSource,
    rowKey = 'key',
    scrollX = 800,
    pageSize = 10,
    searchPlaceholder = 'Tìm kiếm...',
    onSearch,
    filterOptions = [],
    filterPredicates = {},
    tableTitle,
    tableExtra,
    resultLabel = 'Kết quả',
}: ActionTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    // Stores { [filterKey]: selectedValue }
    const [filterValues, setFilterValues] = useState<Record<string, string>>(
        Object.fromEntries(filterOptions.map(f => [f.key, 'all']))
    );

    // ── Client-side filtering ────────────────────────────────────────────
    const filtered = dataSource.filter(row => {
        // Search predicate
        if (onSearch && searchQuery.trim()) {
            if (!onSearch(row, searchQuery.trim())) return false;
        }
        // Dropdown predicates
        for (const [key, value] of Object.entries(filterValues)) {
            if (value === 'all') continue;
            const predicate = filterPredicates[key];
            if (predicate && !predicate(row, value)) return false;
        }
        return true;
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <>
            {/* Filter bar */}
            <Card
                bordered={false}
                style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                styles={{ body: { padding: '14px 16px' } }}
            >
                <Flex gap={12} wrap="wrap" align="center">
                    {/* Search input */}
                    {onSearch && (
                        <Input
                            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            allowClear
                            style={{ width: 260, borderRadius: 8 }}
                        />
                    )}

                    {/* Dynamic Select dropdowns */}
                    {filterOptions.map(filter => (
                        <Select
                            key={filter.key}
                            value={filterValues[filter.key] ?? 'all'}
                            onChange={val => handleFilterChange(filter.key, val)}
                            style={{ width: filter.width ?? 180, borderRadius: 8 }}
                            suffixIcon={<FilterOutlined />}
                        >
                            <Option value="all">{filter.placeholder}</Option>
                            {filter.options.map(opt => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    ))}

                    {/* Result count badge */}
                    <Badge count={filtered.length} color="#0057c2" style={{ fontWeight: 600 }}>
                        <Button icon={<UserOutlined />} style={{ borderRadius: 8 }}>
                            {resultLabel}
                        </Button>
                    </Badge>
                </Flex>
            </Card>

            {/* Table card */}
            <Card
                bordered={false}
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                styles={{ body: { padding: 0 } }}
                title={tableTitle}
                extra={
                    tableExtra ?? (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {filtered.length} / {dataSource.length} bản ghi
                        </Text>
                    )
                }
            >
                <Table<T>
                    columns={columns}
                    dataSource={filtered}
                    rowKey={rowKey}
                    scroll={{ x: scrollX }}
                    pagination={{
                        pageSize,
                        showSizeChanger: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} trên ${total} bản ghi`,
                        style: { padding: '12px 16px' },
                    }}
                    style={{ borderRadius: 12, overflow: 'hidden' }}
                />
            </Card>
        </>
    );
}

export default ActionTable;
