import React, { useState } from 'react';
import { Tag, Button, Avatar, Typography, Card, Row, Col, Statistic, Progress, Tooltip, Space, Flex } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import ActionTable from '../../components/ui/ActionTable';
import type { FilterOption } from '../../components/ui/ActionTable';

const { Title, Text } = Typography;

type ReviewStatus = 'pending' | 'approved' | 'needs_info';
interface ReviewRow { key: number; name: string; email: string; title: string; department: 'dev'|'ba'|'tester'|'pm'; selfScore: number; managerScore: number|null; status: ReviewStatus; initials: string; avatarColor: string; }

const reviews: ReviewRow[] = [
    { key:1, name:'Nguyễn Văn A', email:'nva@fcorp.vn', title:'Senior Frontend', department:'dev',    selfScore:85, managerScore:null, status:'pending',    initials:'NA', avatarColor:'#0057c2' },
    { key:2, name:'Lê Thị B',     email:'ltb@fcorp.vn', title:'Mid-level BA',    department:'ba',     selfScore:90, managerScore:88,   status:'approved',   initials:'LB', avatarColor:'#266d00' },
    { key:3, name:'Trần Văn C',   email:'tvc@fcorp.vn', title:'Junior Tester',   department:'tester', selfScore:70, managerScore:65,   status:'needs_info', initials:'TC', avatarColor:'#7d5400' },
    { key:4, name:'Phạm Thị D',   email:'ptd@fcorp.vn', title:'Project Manager', department:'pm',     selfScore:95, managerScore:null, status:'pending',    initials:'PD', avatarColor:'#614000' },
    { key:5, name:'Hoàng Minh E', email:'hme@fcorp.vn', title:'Senior BA',       department:'ba',     selfScore:88, managerScore:91,   status:'approved',   initials:'HE', avatarColor:'#5c0a83' },
];

const STATUS_CONFIG: Record<ReviewStatus, {label:string; color:string; icon:React.ReactNode}> = {
    pending:    { label:'Chờ duyệt',   color:'orange', icon:<ClockCircleOutlined /> },
    approved:   { label:'Đã duyệt',    color:'green',  icon:<CheckCircleOutlined /> },
    needs_info: { label:'Cần bổ sung', color:'red',    icon:<ExclamationCircleOutlined /> },
};
const DEPT_LABEL: Record<ReviewRow['department'],string> = { dev:'Dev', ba:'BA', tester:'Tester', pm:'PM' };

const ScoreCell: React.FC<{value:number|null}> = ({value}) => {
    if (value === null) return <Text type="secondary">—</Text>;
    const color = value>=85 ? '#52c41a' : value>=70 ? '#faad14' : '#ff4d4f';
    return <Flex vertical gap={2} style={{minWidth:90}}><Text strong style={{color,fontSize:13}}>{value}/100</Text><Progress percent={value} size="small" showInfo={false} strokeColor={color} trailColor="#f0f0f0" /></Flex>;
};

const filterOptions: FilterOption[] = [
    { key:'department', placeholder:'Phòng ban: Tất cả', options:[{value:'dev',label:'Dev'},{value:'ba',label:'BA'},{value:'tester',label:'Tester'},{value:'pm',label:'PM'}] },
    { key:'status',     placeholder:'Trạng thái: Tất cả', options:[{value:'pending',label:'Chờ duyệt'},{value:'approved',label:'Đã duyệt'},{value:'needs_info',label:'Cần bổ sung'}] },
];

const filterPredicates: Record<string,(row:ReviewRow,value:string)=>boolean> = {
    department: (r,v) => r.department === v,
    status:     (r,v) => r.status === v,
};

const columns: ColumnsType<ReviewRow> = [
    { title:'Nhân viên', dataIndex:'name', key:'name', fixed:'left', width:220, render:(_,r)=>(
        <Flex align="center" gap={10}><Avatar style={{background:r.avatarColor,flexShrink:0}}>{r.initials}</Avatar><Flex vertical gap={0}><Text strong style={{fontSize:13}}>{r.name}</Text><Text type="secondary" style={{fontSize:11}}>{r.email}</Text></Flex></Flex>
    )},
    { title:'Vị trí', dataIndex:'title', key:'title', width:160, render:(v,r)=>(
        <Flex vertical gap={4}><Text style={{fontSize:13}}>{v}</Text><Tag style={{width:'fit-content',fontSize:11}}>{DEPT_LABEL[r.department]}</Tag></Flex>
    )},
    { title:'Điểm tự đánh giá', dataIndex:'selfScore', key:'selfScore', width:150, align:'center', render:v=><ScoreCell value={v}/>, sorter:(a,b)=>a.selfScore-b.selfScore },
    { title:'Điểm quản lý', dataIndex:'managerScore', key:'managerScore', width:150, align:'center', render:v=><ScoreCell value={v}/> },
    { title:'Trạng thái', dataIndex:'status', key:'status', width:140, render:(v:ReviewStatus)=>{ const cfg=STATUS_CONFIG[v]; return <Tag icon={cfg.icon} color={cfg.color} style={{borderRadius:999,padding:'2px 10px',fontWeight:500}}>{cfg.label}</Tag>; } },
    { title:'Hành động', key:'actions', width:150, align:'right', fixed:'right', render:(_,r)=>(
        <Space size={6}><Tooltip title="Xem chi tiết"><Button type="link" size="small" style={{padding:0}}>Chi tiết</Button></Tooltip>{r.status==='pending'&&<Button type="primary" size="small" icon={<CheckCircleOutlined/>} style={{borderRadius:6,fontSize:12}}>Phê duyệt</Button>}</Space>
    )},
];

const ReviewConsole: React.FC = () => {
    const total = reviews.length;
    const stats = [
        { label:'Tổng nhân viên', value:total,                                          icon:<TeamOutlined/>,              color:'#0057c2', bg:'#e6f0ff' },
        { label:'Đã duyệt',       value:reviews.filter(r=>r.status==='approved').length, icon:<CheckCircleOutlined/>,       color:'#266d00', bg:'#edffd6' },
        { label:'Chờ duyệt',      value:reviews.filter(r=>r.status==='pending').length,  icon:<ClockCircleOutlined/>,       color:'#b35c00', bg:'#fff3e0' },
        { label:'Cần bổ sung',    value:reviews.filter(r=>r.status==='needs_info').length,icon:<ExclamationCircleOutlined/>, color:'#ba1a1a', bg:'#ffecea' },
    ];

    return (
        <div style={{fontFamily:'Inter, sans-serif'}}>
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16} style={{marginBottom:24}}>
                <div>
                    <Title level={3} style={{margin:0,letterSpacing:'-0.02em'}}>Quản lý Kỳ Đánh Giá &amp; KPI</Title>
                    <Text type="secondary" style={{fontSize:14}}>Kỳ đánh giá: <Text strong>Quý 3/2026</Text></Text>
                </div>
                <Button type="primary" icon={<PlusOutlined/>} size="large" style={{borderRadius:8,fontWeight:600,boxShadow:'0 2px 8px rgba(0,87,194,0.25)'}}>Tạo kỳ đánh giá mới</Button>
            </Flex>

            <Row gutter={[16,16]} style={{marginBottom:24}}>
                {stats.map(s=>(
                    <Col xs={12} sm={12} md={6} key={s.label}>
                        <Card bordered={false} style={{borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.05)',height:'100%'}} styles={{body:{padding:'16px 20px'}}}>
                            <Flex align="center" gap={12}>
                                <div style={{width:44,height:44,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:s.color,flexShrink:0}}>{s.icon}</div>
                                <Statistic title={<Text style={{fontSize:12,color:'#6b7280'}}>{s.label}</Text>} value={s.value} valueStyle={{fontSize:26,fontWeight:700,color:s.color,lineHeight:1.2}}/>
                            </Flex>
                            <Progress percent={Math.round((s.value/total)*100)} size="small" showInfo={false} strokeColor={s.color} trailColor="#f0f0f0" style={{marginTop:10}}/>
                        </Card>
                    </Col>
                ))}
            </Row>

            <ActionTable<ReviewRow>
                columns={columns}
                dataSource={reviews}
                rowKey="key"
                scrollX={800}
                searchPlaceholder="Tìm kiếm nhân viên..."
                onSearch={(r,q)=>r.name.toLowerCase().includes(q.toLowerCase())||r.email.toLowerCase().includes(q.toLowerCase())}
                filterOptions={filterOptions}
                filterPredicates={filterPredicates}
                tableTitle={<Flex align="center" gap={8}><TrophyOutlined style={{color:'#0057c2'}}/><Text strong style={{fontSize:15}}>Danh sách đánh giá</Text></Flex>}
            />
        </div>
    );
};

export default ReviewConsole;
