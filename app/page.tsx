"use client";
import * as React from "react";
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, DollarSign, Activity, ArrowUpRight, TrendingUp, AlertCircle, PieChart as PieIcon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = React.useState({
    activePolicies: 0,
    totalRevenue: 0,
    uniqueClients: 0,
    activeClaims: 0,
    totalClaims: 0,
    openClaims: 0,
    totalIndemnities: 0,
    totalRecoveredRegress: 0,
    totalRemainingRegress: 0
  });
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [claimsData, setClaimsData] = React.useState<any[]>([]);
  const [growthData, setGrowthData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [policiesRes, claimsRes] = await Promise.all([
          fetch('/api/policies'),
          fetch('/api/claims')
        ]);
        const policies = await policiesRes.json();
        const allClaims = await claimsRes.json();
        // Filter out REGRES claims to match Claims Page logic
        const claims = allClaims.filter((c: any) => !c.id.endsWith('-REGRES'));
        const regressClaims = allClaims.filter((c: any) => c.id.endsWith('-REGRES'));

        // 1. Calculate KPIs
        const activePoliciesCount = policies.length; // Assuming all returned are active for now
        const revenue = policies.reduce((acc: number, p: any) => {
          const amount = parseFloat(p.details?.acoperiri_total_prima || "0");
          return acc + (isNaN(amount) ? 0 : amount);
        }, 0);
        const uniqueHolders = new Set(policies.map((p: any) => p.holder)).size;

        const totalClaimsCount = claims.length;
        const openClaimsCount = claims.filter((c: any) => c.status !== 'Finalizat' && c.status !== 'Respins' && c.status !== 'Closed' && c.status !== 'Resolved').length;
        const activeClaimsCount = openClaimsCount;

        // Calculate Total Indemnities for finalized/closed claims
        const indemnities = claims
          .filter((c: any) => ['Finalizat', 'Resolved', 'Closed'].includes(c.status))
          .reduce((acc: number, c: any) => {
            let claimTotal = 0;
            if (c.payments && Array.isArray(c.payments)) {
              claimTotal = c.payments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
            } else if (c.payment) {
              claimTotal = parseFloat(c.payment.amount) || 0;
            }
            return acc + claimTotal;
          }, 0);

        // Calculate Regress Metrics
        const totalRecoveredRegress = regressClaims.reduce((acc: number, c: any) => {
          const rec = c.regress?.recoveredPayments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) || 0;
          return acc + rec;
        }, 0);

        const totalRegressDebt = regressClaims.reduce((acc: number, c: any) => {
          return acc + (parseFloat(c.regress?.amount) || 0);
        }, 0);

        const totalRemainingRegress = Math.max(0, totalRegressDebt - totalRecoveredRegress);

        setStats({
          activePolicies: activePoliciesCount,
          totalRevenue: revenue,
          uniqueClients: uniqueHolders,
          activeClaims: activeClaimsCount,
          totalClaims: totalClaimsCount,
          openClaims: openClaimsCount,
          totalIndemnities: indemnities,
          totalRecoveredRegress,
          totalRemainingRegress
        });

        // 2. Prepare Charts Data
        // Claims Status
        const statusCounts: { [key: string]: number } = {};
        claims.forEach((c: any) => {
          const s = c.status || "Necunoscut";
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        const pieData = Object.keys(statusCounts).map(key => ({
          name: key,
          value: statusCounts[key]
        }));
        setClaimsData(pieData);

        // Policy Growth 
        const months: { [key: string]: number } = {};
        policies.forEach((p: any) => {
          if (p.startDate) {
            const date = new Date(p.startDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months[key] = (months[key] || 0) + 1;
          }
        });
        const barData = Object.keys(months).sort().map(key => ({
          name: key,
          policies: months[key]
        })).slice(-6);
        setGrowthData(barData);


        // 3. Recent Activity 
        const combined = [
          ...policies.map((p: any) => ({
            type: 'policy',
            id: p.id,
            title: `Poliță Nouă: ${p.holder}`,
            date: p.startDate ? new Date(p.startDate) : new Date(),
            details: p.type
          })),
          ...claims.map((c: any) => ({
            type: 'claim',
            id: c.id,
            title: `Dosar Daună: ${c.holderName}`,
            date: c.submittedAt ? new Date(c.submittedAt) : new Date(),
            details: c.status
          }))
        ];

        combined.sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecentActivity(combined.slice(0, 5));

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      { Metric: "Utilizatori (Clienți)", Value: stats.uniqueClients },
      { Metric: "Polițe Active", Value: stats.activePolicies },
      { Metric: "Venituri Estimate", Value: stats.totalRevenue },
      { Metric: "Total Dosare", Value: stats.totalClaims },
      { Metric: "Dosare Deschise", Value: stats.openClaims },
      { Metric: "Total Despăgubiri", Value: stats.totalIndemnities },
      { Metric: "Total Recuperat Regres", Value: stats.totalRecoveredRegress },
      { Metric: "Total De Recuperat Regres", Value: stats.totalRemainingRegress },
      { Metric: "Data Raport", Value: new Date().toLocaleDateString() }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Sumar Executiv");

    // 2. Policy Growth Sheet
    const wsGrowth = XLSX.utils.json_to_sheet(growthData.map(d => ({ Luna: d.name, 'Polițe Noi': d.policies })));
    XLSX.utils.book_append_sheet(wb, wsGrowth, "Evoluție Polițe");

    // 3. Claims Distribution Sheet
    const wsClaims = XLSX.utils.json_to_sheet(claimsData.map(d => ({ Status: d.name, 'Număr Dosare': d.value })));
    XLSX.utils.book_append_sheet(wb, wsClaims, "Distribuție Daune");

    // 4. Recent Activity Sheet
    const wsActivity = XLSX.utils.json_to_sheet(recentActivity.map(a => ({
      Tip: a.type === 'policy' ? 'Poliță' : 'Dosar Daună',
      Descriere: a.title,
      Detalii: a.details,
      Data: a.date.toLocaleString()
    })));
    XLSX.utils.book_append_sheet(wb, wsActivity, "Activitate Recentă");

    // Save file
    XLSX.writeFile(wb, `Dashboard_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Privire de ansamblu a portofoliului.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">Exportă Date Complexe (XLSX)</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilizatori (Clienți)</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueClients}</div>
            <p className="text-xs text-muted-foreground">clienți unici în portofoliu</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Polițe Active</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePolicies}</div>
            <p className="text-xs text-muted-foreground">total polițe emise</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Venituri Estimate</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">valoare totală prime</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-pink-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Despăgubiri</CardTitle>
            <Wallet className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIndemnities.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">plăți dosare finalizate</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Dosare</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClaims}</div>
            <p className="text-xs text-muted-foreground">toate dosarele înregistrate</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dosare Deschise</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openClaims}</div>
            <p className="text-xs text-muted-foreground">necesită atenție</p>
          </CardContent>
        </Card>
        {/* Regress Metrics */}
        <Card className="border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition-shadow bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Recuperat (Regres)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{stats.totalRecoveredRegress.toFixed(2)} RON</div>
            <p className="text-xs text-emerald-600">total sume recuperate</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow bg-rose-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-800">De Recuperat (Regres)</CardTitle>
            <Activity className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{stats.totalRemainingRegress.toFixed(2)} RON</div>
            <p className="text-xs text-rose-600">restanțe active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Evoluție Polițe Noi (Ultimile Luni)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="policies" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
              {growthData.length === 0 && <div className="h-full flex items-center justify-center text-gray-400">Nu sunt suficiente date pentru grafic.</div>}
            </CardContent>
          </Card>

          {/* Claims Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-blue-600" />
                  Distribuție Dosare Daună
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={claimsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {claimsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Notifications Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Notificări Sistem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-r-md">
                    <p className="font-bold text-sm">Mentenanță Programată</p>
                    <p className="text-xs mt-1">Platforma va fi în mentenanță duminică, orele 02:00 - 04:00.</p>
                  </div>
                  <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 rounded-r-md">
                    <p className="font-bold text-sm">Update Realizat</p>
                    <p className="text-xs mt-1">Versiunea 2.4 este acum live.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Activitate Recentă</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex relative items-start">
                  <div className="absolute left-0 top-1 bottom-[-24px] w-px bg-gray-200 last:hidden ml-4"></div>
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mr-4 border-2 border-white shadow-sm shrink-0 ${item.type === 'policy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                    {item.type === 'policy' ? <FileText className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <Badge variant={item.type === 'policy' ? 'secondary' : 'warning'} className="text-[10px] px-1 py-0 h-5">
                        {item.details}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && !loading && (
                <p className="text-sm text-gray-500 text-center py-4">Nu există activitate recentă.</p>
              )}
              {loading && (
                <p className="text-sm text-gray-500 text-center py-4">Se încarcă...</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t flex justify-center">
              <Link href="/claims" className="text-sm text-blue-600 font-medium hover:underline flex items-center">
                Vezi toate dosarele <ArrowUpRight className="ml-1 w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  const variants: any = {
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    warning: "bg-orange-100 text-orange-700 hover:bg-orange-200"
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant] || variants.secondary} ${className}`}>{children}</span>
}
