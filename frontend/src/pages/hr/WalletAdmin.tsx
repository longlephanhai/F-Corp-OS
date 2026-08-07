import React from 'react';
import { Tag, Avatar, Typography, Flex } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Row, Col } from 'antd';
import ActionTable from '../../components/ui/ActionTable';
import type { FilterOption } from '../../components/ui/ActionTable';

const { Title, Text } = Typography;

// ─────────────────────────────────────────────────────────────────────────────
// Types & static data
// ─────────────────────────────────────────────────────────────────────────────

type TxType = 'reward' | 'redeem';

interface Transaction {
    key: string;
    id: string;
    name: string;
    avatar: string;
    type: TxType;
    description: string;
    amount: number;
    date: string;
}

const transactions: Transaction[] = [
    { key:'1', id:'#FT-0982', name:'Nguyễn Văn A', avatar:'https://lh3.googleusercontent.com/aida-public/AB6AXuCHZNCswUFR-QlpK_PiGnzGwFQTUYn1sqv-37JhsesjFZICJGegOc--qwhECCNohLB9BsadvM9YK1i6IdDQkbKjW_QSStbepnNwFc7UWgO9pWu90rd-ALs9k3Lzr8wd10iyjkBvk5MFqM-mnJMoSkouzzx9z40rb3xL4G8Q7mD9BkWFhrIBj16oqQ25MnqINq6guH7LMzsUplg5ve8wyZtkCygcQ_O6DEXXtrcbGhGeeylh_MNKJ6bi', type:'reward', description:'Hoàn thành xuất sắc dự án vượt tiến độ',         amount:500,   date:'12/10/2023 14:30' },
    { key:'2', id:'#FT-0981', name:'Trần Thị B',   avatar:'https://lh3.googleusercontent.com/aida-public/AB6AXuCHTFg9kQcC8nmyPWNg5FbzhT0UffCOCCe0qyYFc8sRCYWePUB7jYJ_wAykprtTlIi-_5OITNLtvcEycznC2UjuS9klJdbtkpW6oW1xvJZxIvGQqBHcBU5qmtWVIMQ-OuQVa0I8yi95fKp23o8QvH4e7eN8uKf6UDiImQOZvLdNQXnVfRbJ_qFBPyzRdKQoV3HdAib9ZjSi9epfcyhZ93sCUv6tJ0f-BEmbvNzlk21LaU6F4EX0bTVO', type:'redeem', description:'Voucher 2 vé xem phim tại Metiz Cinemas',          amount:-1200, date:'11/10/2023 09:15' },
    { key:'3', id:'#FT-0980', name:'Lê Minh C',    avatar:'https://lh3.googleusercontent.com/aida-public/AB6AXuDtFr36i1fv6HV3coMBNoTPjaeOWtspUZijtYllbpdU6yHah_gThoXe0v1-FFrlfOV08iiBNiMAWl2Vbw5I7Den2BxseFYEBnT5AwufW_B7Qz2bUbYPAG6yu1LwMFhnPJRjOVG3kGoQnef8Xn2JVYDOd7FYp-cEZgNXCsH5aO5RTFGKBI-pHK1SeAcQL4De51VWiHyjlsrwdJABvr14PqV6qESL4QxWz7B68WREwXF3sN190x3RM7db', type:'redeem', description:'Voucher đồ uống tại Fin Chill Coffee & Tea',        amount:-200,  date:'10/10/2023 16:45' },
    { key:'4', id:'#FT-0979', name:'Phạm Hoàng D', avatar:'https://lh3.googleusercontent.com/aida-public/AB6AXuB7m8sN71dX91uHUAj62CWicspuRFlb0gJkKo-7ws3gCGGaQCsiIFZMa5xlgqbi8CquBJ8Q-RCrQRNBOoUljWgWlu3PWw02wrK0eGoSOVWkBBPzvm1LhWRuFnVd-E8Jv_85vI--a_ZJR9InZFgeRBW29qzS0wAGz_tYdd9Lkx4eEUp2IapVXbWGtVAJwCqcfR3oD35IyU4_KpmP0U6l-RC6-JQWEoWACPJfCdLteqTRLbH6CUr4jYTx', type:'redeem', description:'Thẻ quà tặng mua sắm dụng cụ thể thao',            amount:-800,  date:'09/10/2023 10:20' },
];

const TX_BADGE: Record<TxType, {label:string; color:string}> = {
    reward: { label:'Thưởng điểm', color:'green' },
    redeem: { label:'Đổi quà',     color:'orange' },
};

const filterOptions: FilterOption[] = [
    { key:'type', placeholder:'Loại GD: Tất cả', options:[{value:'reward',label:'Thưởng điểm'},{value:'redeem',label:'Đổi quà'}] },
];

const filterPredicates: Record<string,(row:Transaction,value:string)=>boolean> = {
    type: (r,v) => r.type === v,
};

const columns: ColumnsType<Transaction> = [
    { title:'Mã GD', dataIndex:'id', key:'id', width:110, render:v=><Text style={{fontSize:13}}>{v}</Text> },
    { title:'Nhân viên', dataIndex:'name', key:'name', width:200, render:(v,r)=>(
        <Flex align="center" gap={8}>
            <Avatar src={r.avatar} size={32} style={{flexShrink:0}}>{v[0]}</Avatar>
            <Text strong style={{fontSize:13}}>{v}</Text>
        </Flex>
    )},
    { title:'Loại giao dịch', dataIndex:'type', key:'type', width:140, render:(v:TxType)=>(
        <Tag color={TX_BADGE[v].color} style={{borderRadius:6,fontWeight:600}}>{TX_BADGE[v].label}</Tag>
    )},
    { title:'Nội dung', dataIndex:'description', key:'description', ellipsis:true, render:v=><Text style={{fontSize:13}} type="secondary">{v}</Text> },
    { title:'Số lượng', dataIndex:'amount', key:'amount', width:110, align:'right', sorter:(a,b)=>a.amount-b.amount, render:(v:number)=>(
        <Text strong style={{color:v>0?'#266d00':'#ba1a1a',fontSize:14}}>
            {v>0 ? `+ ${v}` : `- ${Math.abs(v)}`}
        </Text>
    )},
    { title:'Thời gian', dataIndex:'date', key:'date', width:150, align:'right', render:v=><Text type="secondary" style={{fontSize:12}}>{v}</Text> },
];

// ─────────────────────────────────────────────────────────────────────────────
// Stat card — specific to WalletAdmin design
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps { label:string; value:string; trend:string; trendUp:boolean; accentColor:string; iconBg:string; icon:React.ReactNode; }

const StatCard: React.FC<StatCardProps> = ({label,value,trend,trendUp,accentColor,iconBg,icon}) => (
    <Card bordered={false}
        style={{borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.05)',height:'100%',overflow:'hidden',position:'relative',transition:'box-shadow 0.3s,transform 0.3s'}}
        styles={{body:{padding:24}}}
        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';}}
        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.05)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';}}
    >
        {/* Decorative circle */}
        <div style={{position:'absolute',top:-16,right:-16,width:96,height:96,borderRadius:'50%',background:accentColor,opacity:0.07}}/>
        <Flex justify="space-between" align="flex-start" style={{marginBottom:12,position:'relative'}}>
            <Text style={{fontSize:11,fontWeight:600,color:'#414755',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</Text>
            <div style={{padding:8,background:iconBg,borderRadius:8,display:'flex',alignItems:'center'}}>{icon}</div>
        </Flex>
        <div style={{fontSize:32,fontWeight:700,color:'#1c1b1b',marginBottom:8,position:'relative'}}>{value}</div>
        <Flex align="center" gap={4} style={{fontSize:12,color:trendUp?'#266d00':'#414755'}}>
            <span>{trendUp?'↑':'—'}</span><span>{trend}</span>
        </Flex>
    </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component — page content only, LayoutHR provides chrome
// ─────────────────────────────────────────────────────────────────────────────

const WalletAdmin: React.FC = () => (
    <div style={{fontFamily:'Inter, sans-serif',color:'#1c1b1b'}}>

        {/* ── Page header ───────────────────────────────────────── */}
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16} style={{marginBottom:24}}>
            <div>
                <Title level={3} style={{margin:0,letterSpacing:'-0.02em'}}>Quản lý Ví F-Token &amp; Đổi thưởng</Title>
                <Text type="secondary" style={{fontSize:14}}>Tổng quan về hoạt động phân bổ và sử dụng token của nhân sự.</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined/>} size="large"
                style={{borderRadius:8,fontWeight:600,boxShadow:'0 2px 8px rgba(0,87,194,0.25)'}}>
                Cấp phát F-Token
            </Button>
        </Flex>

        {/* ── Statistics cards ──────────────────────────────────── */}
        <Row gutter={[16,16]} style={{marginBottom:32}}>
            <Col xs={24} sm={8}>
                <StatCard label="Tổng Token đang lưu hành" value="125,000" trend="+5.2% so với tháng trước" trendUp accentColor="#0057c2" iconBg="#d9e2ff" icon={<span style={{fontSize:20,color:'#0057c2'}}>🪙</span>}/>
            </Col>
            <Col xs={24} sm={8}>
                <StatCard label="Token đã quy đổi trong tháng" value="45,000" trend="+12.4% so với tháng trước" trendUp accentColor="#266d00" iconBg="#88fd54" icon={<span style={{fontSize:20,color:'#266d00'}}>🎁</span>}/>
            </Col>
            <Col xs={24} sm={8}>
                <StatCard label="Số lượng giao dịch" value="342" trend="Ổn định so với tháng trước" trendUp={false} accentColor="#7d5400" iconBg="#ffddb0" icon={<span style={{fontSize:20,color:'#7d5400'}}>🧾</span>}/>
            </Col>
        </Row>

        {/* ── ActionTable (filter bar + antd table) ─────────────── */}
        <ActionTable<Transaction>
            columns={columns}
            dataSource={transactions}
            rowKey="key"
            scrollX={720}
            searchPlaceholder="Tìm kiếm nhân viên, mã GD..."
            onSearch={(r,q)=>r.name.toLowerCase().includes(q.toLowerCase())||r.id.toLowerCase().includes(q.toLowerCase())}
            filterOptions={filterOptions}
            filterPredicates={filterPredicates}
            resultLabel="Giao dịch"
            tableTitle={<Text strong style={{fontSize:15}}>Lịch sử giao dịch gần đây</Text>}
        />
    </div>
);

export default WalletAdmin;