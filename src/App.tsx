import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Warehouse as WarehouseIcon, 
  Users, 
  Package, 
  ArrowLeftRight, 
  FileText, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Settings
} from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, getDoc, writeBatch, increment, setDoc } from 'firebase/firestore';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from './components/GlassUI';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { Warehouse, Salesman, Item, Transaction, Stock, UserProfile, UserRole } from './types';
import { motion, AnimatePresence } from 'motion/react';
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
  LineChart,
  Line
} from 'recharts';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user, profile }: { activeTab: string, setActiveTab: (t: string) => void, user: any, profile: UserProfile | null }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager', 'staff'] },
    { id: 'masters', label: 'Masters', icon: '⚙️', roles: ['admin', 'manager'] },
    { id: 'transactions', label: 'Transactions', icon: '📦', roles: ['admin', 'manager', 'staff'] },
    { id: 'reports', label: 'Reports', icon: '📈', roles: ['admin', 'manager', 'staff'] },
    { id: 'users', label: 'User Mgmt', icon: '👤', roles: ['admin'] },
  ];

  const visibleItems = menuItems.filter(item => !profile || item.roles.includes(profile.role));

  return (
    <div className="w-[260px] h-full flex flex-col p-6 bg-white/70 backdrop-blur-[20px] border-r border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-extrabold text-[#1e293b] tracking-tight font-display bg-gradient-to-r from-[#4facfe] to-[#00f2fe] bg-clip-text text-transparent">AWT INVENTORY</h1>
        <p className="text-[10px] text-[#64748b] uppercase tracking-[0.2em] font-bold mt-1">AL WATANIA INTERNATIONAL</p>
      </div>
      
      <nav className="flex-1 space-y-3">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-gradient-to-r from-[#4facfe]/10 to-[#00f2fe]/10 border border-[#4facfe]/20 text-[#1e293b] font-extrabold shadow-[0_8px_20px_rgba(79,172,254,0.1)]' 
                : 'text-[#64748b] hover:bg-white/50 hover:text-[#1e293b] border border-transparent hover:border-white/60'
            }`}
          >
            <span className={`text-xl transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
            <span className="font-sans tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-8 border-t border-white/60">
        <div className="flex items-center gap-4 px-2 py-4 mb-8 bg-white/30 rounded-2xl border border-white/40">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center text-white font-extrabold shadow-[0_8px_20px_rgba(79,172,254,0.3)] shrink-0">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-[#1e293b] truncate font-sans">{user?.email?.split('@')[0]}</p>
            <p className="text-[10px] text-[#64748b] uppercase font-extrabold tracking-widest">{profile?.role || 'Loading...'}</p>
          </div>
        </div>
        <GlassButton 
          variant="danger" 
          className="w-full flex items-center gap-3 justify-center py-4 rounded-2xl shadow-none hover:shadow-[0_10px_20px_rgba(244,63,94,0.15)]"
          onClick={() => signOut(auth)}
        >
          <span className="text-lg">🚪</span>
          Logout
        </GlassButton>
      </div>
    </div>
  );
};

// --- Utils ---

const logActivity = async (action: string, details: string) => {
  try {
    await addDoc(collection(db, 'activity_log'), {
      userEmail: auth.currentUser?.email,
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// --- Modules ---

const Dashboard = ({ warehouses, items, transactions, stock }: any) => {
  const stats = [
    { label: 'Total Warehouses', value: warehouses.length, icon: '🏭', color: 'from-blue-400 to-blue-600', accent: '#3b82f6' },
    { label: 'Total Items', value: items.length, icon: '📦', color: 'from-emerald-400 to-emerald-600', accent: '#10b981' },
    { label: 'Total Transactions', value: transactions.length, icon: '📝', color: 'from-purple-400 to-purple-600', accent: '#a855f7' },
    { label: 'Low Stock Items', value: stock.filter((s: any) => s.quantity < 10).length, icon: '⚠️', color: 'from-rose-400 to-rose-600', accent: '#f43f5e' },
  ];

  const chartData = [
    { name: 'GRN', value: transactions.filter((t: any) => t.type === 'GRN').length },
    { name: 'Transfers', value: transactions.filter((t: any) => t.type === 'StockTransfer').length },
    { name: 'Invoices', value: transactions.filter((t: any) => t.type === 'Invoice').length },
    { name: 'Returns', value: transactions.filter((t: any) => t.type === 'SalesReturn').length },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-8 relative overflow-hidden group border-white/60">
              <div 
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-[0.2]"
                style={{ backgroundColor: stat.accent }}
              />
              <div className="flex items-center gap-6 relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-3xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-500`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] font-extrabold uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-4xl font-extrabold text-[#1e293b] font-display tracking-tight">{stat.value}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <h3 className="text-xl font-extrabold text-[#1e293b] mb-8 font-display">Transaction Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="value" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-8">
          <h3 className="text-xl font-extrabold text-[#1e293b] mb-8 font-display">Stock Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#4facfe', '#10b981', '#f59e0b', '#f43f5e'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const Masters = ({ warehouses, salesmen, items, profile }: { warehouses: Warehouse[], salesmen: Salesman[], items: Item[], profile: UserProfile | null }) => {
  const [subTab, setSubTab] = useState('warehouses');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager' || isAdmin;

  // Form states
  const [whName, setWhName] = useState('');
  const [whType, setWhType] = useState('Main warehouse');
  const [smName, setSmName] = useState('');
  const [smWh, setSmWh] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemUnit, setItemUnit] = useState('PCS');

  const resetForm = () => {
    setWhName('');
    setWhType('Main warehouse');
    setSmName('');
    setSmWh('');
    setItemName('');
    setItemSku('');
    setItemUnit('PCS');
    setEditingId(null);
  };

  const handleEdit = (type: string, data: any) => {
    setEditingId(data.id);
    if (type === 'warehouses') {
      setWhName(data.name);
      setWhType(data.type);
    } else if (type === 'salesmen') {
      setSmName(data.name);
      setSmWh(data.warehouseId);
    } else if (type === 'items') {
      setItemName(data.name);
      setItemSku(data.sku);
      setItemUnit(data.unit);
    }
    setShowAdd(true);
  };

  const saveWarehouse = async () => {
    if (!whName) return;
    setShowConfirm(true);
  };

  const confirmSaveWarehouse = async () => {
    const data = {
      name: whName,
      type: whType,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      await setDoc(doc(db, 'warehouses', editingId), data, { merge: true });
      await logActivity('Edit Warehouse', `Updated warehouse: ${whName} (${whType})`);
    } else {
      await addDoc(collection(db, 'warehouses'), { ...data, createdAt: serverTimestamp() });
      await logActivity('Add Warehouse', `Created new warehouse: ${whName} (${whType})`);
    }
    resetForm();
    setShowAdd(false);
  };

  const saveSalesman = async () => {
    if (!smName || !smWh) return;
    setShowConfirm(true);
  };

  const confirmSaveSalesman = async () => {
    const data = {
      name: smName,
      warehouseId: smWh,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      await setDoc(doc(db, 'salesmen', editingId), data, { merge: true });
      await logActivity('Edit Salesman', `Updated salesman: ${smName}`);
    } else {
      await addDoc(collection(db, 'salesmen'), { ...data, createdAt: serverTimestamp() });
      await logActivity('Add Salesman', `Created new salesman: ${smName}`);
    }
    resetForm();
    setShowAdd(false);
  };

  const saveItem = async () => {
    if (!itemName || !itemSku) return;
    setShowConfirm(true);
  };

  const confirmSaveItem = async () => {
    const data = {
      name: itemName,
      sku: itemSku,
      unit: itemUnit,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      await setDoc(doc(db, 'items', editingId), data, { merge: true });
      await logActivity('Edit Item', `Updated item: ${itemName} (SKU: ${itemSku})`);
    } else {
      await addDoc(collection(db, 'items'), { ...data, createdAt: serverTimestamp() });
      await logActivity('Add Item', `Created new item: ${itemName} (SKU: ${itemSku})`);
    }
    resetForm();
    setShowAdd(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 bg-white/40 p-1.5 rounded-2xl border border-white/60">
          {['warehouses', 'salesmen', 'items'].map((t) => (
            <GlassButton
              key={t}
              variant={subTab === t ? 'primary' : 'ghost'}
              onClick={() => { setSubTab(t); resetForm(); }}
              className={`capitalize px-6 py-2.5 ${subTab === t ? 'shadow-md' : ''}`}
            >
              {t}
            </GlassButton>
          ))}
        </div>
        {isManager && (
          <GlassButton onClick={() => { resetForm(); setShowAdd(true); }} className="flex items-center gap-3 px-6 py-3 shadow-[0_10px_25px_rgba(79,172,254,0.3)]">
            <span className="text-lg">➕</span> Add New
          </GlassButton>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-black/2 border-b border-black/5">
              <tr>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Name</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">
                  {subTab === 'warehouses' ? 'Type' : subTab === 'salesmen' ? 'Warehouse' : 'SKU'}
                </th>
                {subTab === 'items' && <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Unit</th>}
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {subTab === 'warehouses' && warehouses.map((w: any) => (
                <tr key={w.id} className="hover:bg-black/2 transition-colors group">
                  <td className="px-8 py-5 font-bold text-[#1e293b]">{w.name}</td>
                  <td className="px-8 py-5 text-[#64748b] font-bold">{w.type}</td>
                  <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    {isManager && <GlassButton variant="ghost" className="text-xs font-bold px-4 py-2" onClick={() => handleEdit('warehouses', w)}>✏️ Edit</GlassButton>}
                  </td>
                </tr>
              ))}
              {subTab === 'salesmen' && salesmen.map((s: any) => (
                <tr key={s.id} className="hover:bg-black/2 transition-colors group">
                  <td className="px-8 py-5 font-bold text-[#1e293b]">{s.name}</td>
                  <td className="px-8 py-5 text-[#64748b] font-bold">
                    {warehouses.find((w: any) => w.id === s.warehouseId)?.name || 'Unknown'}
                  </td>
                  <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    {isManager && <GlassButton variant="ghost" className="text-xs font-bold px-4 py-2" onClick={() => handleEdit('salesmen', s)}>✏️ Edit</GlassButton>}
                  </td>
                </tr>
              ))}
              {subTab === 'items' && items.map((i: any) => (
                <tr key={i.id} className="hover:bg-black/2 transition-colors group">
                  <td className="px-8 py-5 font-bold text-[#1e293b]">{i.name}</td>
                  <td className="px-8 py-5 text-[#64748b] font-bold">{i.sku}</td>
                  <td className="px-8 py-5 text-[#64748b] font-bold">{i.unit}</td>
                  <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    {isManager && <GlassButton variant="ghost" className="text-xs font-bold px-4 py-2" onClick={() => handleEdit('items', i)}>✏️ Edit</GlassButton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-10 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-white/60">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-extrabold text-[#1e293b] font-display capitalize">{editingId ? 'Edit' : 'Add'} {subTab.slice(0, -1)}</h3>
                  <button onClick={() => { setShowAdd(false); resetForm(); }} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-[#64748b] hover:bg-black/10 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {subTab === 'warehouses' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Warehouse Name</label>
                        <GlassInput value={whName} onChange={(e) => setWhName(e.target.value)} className="w-full py-3" placeholder="e.g. Main Store A" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Type</label>
                        <GlassSelect 
                          value={whType} 
                          onChange={(e) => setWhType(e.target.value)} 
                          className="w-full py-3"
                          options={[
                            { value: 'Main warehouse', label: 'Main warehouse' },
                            { value: 'Office Store', label: 'Office Store' },
                            { value: 'Van', label: 'Van' },
                          ]}
                        />
                      </div>
                      <GlassButton onClick={saveWarehouse} className="w-full py-4 shadow-[0_10px_25px_rgba(79,172,254,0.3)]">{editingId ? 'Update' : 'Save'} Warehouse</GlassButton>
                    </>
                  )}

                  {subTab === 'salesmen' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Salesman Name</label>
                        <GlassInput value={smName} onChange={(e) => setSmName(e.target.value)} className="w-full py-3" placeholder="e.g. John Doe" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Assign Warehouse</label>
                        <GlassSelect 
                          value={smWh} 
                          onChange={(e) => setSmWh(e.target.value)} 
                          className="w-full py-3"
                          options={[
                            { value: '', label: 'Select Warehouse' },
                            ...warehouses.map((w: any) => ({ value: w.id, label: w.name }))
                          ]}
                        />
                      </div>
                      <GlassButton onClick={saveSalesman} className="w-full py-4 shadow-[0_10px_25_rgba(79,172,254,0.3)]">{editingId ? 'Update' : 'Save'} Salesman</GlassButton>
                    </>
                  )}

                  {subTab === 'items' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Item Name</label>
                        <GlassInput value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full py-3" placeholder="e.g. Product X" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">SKU</label>
                        <GlassInput value={itemSku} onChange={(e) => setItemSku(e.target.value)} className="w-full py-3" placeholder="e.g. SKU-001" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Unit</label>
                        <GlassSelect 
                          value={itemUnit} 
                          onChange={(e) => setItemUnit(e.target.value)} 
                          className="w-full py-3"
                          options={[
                            { value: 'PCS', label: 'Pieces (PCS)' },
                            { value: 'BOX', label: 'Box' },
                            { value: 'KG', label: 'Kilogram' },
                          ]}
                        />
                      </div>
                      <GlassButton onClick={saveItem} className="w-full py-4 shadow-[0_10px_25px_rgba(79,172,254,0.3)]">{editingId ? 'Update' : 'Save'} Item</GlassButton>
                    </>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={
          subTab === 'warehouses' ? confirmSaveWarehouse :
          subTab === 'salesmen' ? confirmSaveSalesman :
          confirmSaveItem
        }
        title={`Confirm ${editingId ? 'Update' : 'Save'}`}
        message={`Are you sure you want to ${editingId ? 'update' : 'save'} this ${
          subTab === 'warehouses' ? 'warehouse' : 
          subTab === 'salesmen' ? 'salesman' : 
          'item'
        }?`}
        confirmText={editingId ? 'Update' : 'Save'}
      />
    </div>
  );
};

const Transactions = ({ warehouses, items, transactions, profile }: { warehouses: Warehouse[], items: Item[], transactions: Transaction[], profile: UserProfile | null }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isStaff = profile?.role === 'staff' || profile?.role === 'manager' || profile?.role === 'admin';
  const isManager = profile?.role === 'manager' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';
  const [type, setType] = useState<any>('GRN');
  const [fromWh, setFromWh] = useState('');
  const [toWh, setToWh] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [ref, setRef] = useState('');

  const addItemRow = () => {
    setSelectedItems([...selectedItems, { itemId: '', quantity: 0, unit: '', price: 0, reason: 'Other Reasons' }]);
  };

  const updateItemRow = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    newItems[index][field] = value;

    if (field === 'itemId' && value) {
      const item = items.find(i => i.id === value);
      if (item) {
        newItems[index].unit = item.unit || '';
        
        // Pre-fill price for Invoices from last known price
        if (type === 'Invoice') {
          const lastInvoice = [...transactions]
            .filter(t => t.type === 'Invoice' && t.items.some(ti => ti.itemId === value))
            .sort((a, b) => {
              const dateA = a.date?.toMillis?.() || 0;
              const dateB = b.date?.toMillis?.() || 0;
              return dateB - dateA;
            })[0];

          if (lastInvoice) {
            const lastItemEntry = lastInvoice.items.find(ti => ti.itemId === value);
            if (lastItemEntry) {
              newItems[index].price = lastItemEntry.price;
            }
          }
        }
      }
    }

    setSelectedItems(newItems);
  };

  const saveTransaction = async () => {
    if (selectedItems.length === 0) {
      alert('Please add at least one item');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSaveTransaction = async () => {
    let effectiveFromWh = fromWh;
    let effectiveToWh = toWh;

    const mainWh = warehouses.find(w => w.type === 'Main warehouse');

    // Logic for warehouse fallbacks based on transaction type
    if (type === 'StockTransfer' || type === 'MaterialRequest' || type === 'ItemHandover') {
      if (!effectiveFromWh) effectiveFromWh = mainWh?.id || '';
      if (!effectiveToWh) effectiveToWh = mainWh?.id || '';
    } else if (type === 'GRN' || type === 'SalesReturn') {
      if (!effectiveToWh) effectiveToWh = mainWh?.id || '';
    } else if (type === 'Invoice') {
      if (!effectiveFromWh) effectiveFromWh = mainWh?.id || '';
    }

    // Final validation
    if ((type === 'StockTransfer' || type === 'MaterialRequest' || type === 'ItemHandover') && (!effectiveFromWh || !effectiveToWh)) {
      alert('Please select both source and destination warehouses');
      return;
    }
    if ((type === 'GRN' || type === 'SalesReturn') && !effectiveToWh) {
      alert('Please select a destination warehouse');
      return;
    }
    if (type === 'Invoice' && !effectiveFromWh) {
      alert('Please select a source warehouse');
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // 1. Create Transaction Record
      const transRef = doc(collection(db, 'transactions'));
      batch.set(transRef, {
        type,
        fromWarehouseId: effectiveFromWh || null,
        toWarehouseId: effectiveToWh || null,
        items: selectedItems,
        reference: ref,
        date: serverTimestamp(),
        createdBy: auth.currentUser?.email
      });

      // 2. Update Stock Levels
      for (const item of selectedItems) {
        // Decrement from source
        if (effectiveFromWh) {
          const stockFromRef = doc(db, 'stock', `${effectiveFromWh}_${item.itemId}`);
          batch.set(stockFromRef, {
            warehouseId: effectiveFromWh,
            itemId: item.itemId,
            quantity: increment(-item.quantity)
          }, { merge: true });
        }

        // Increment to destination
        if (effectiveToWh) {
          const stockToRef = doc(db, 'stock', `${effectiveToWh}_${item.itemId}`);
          batch.set(stockToRef, {
            warehouseId: effectiveToWh,
            itemId: item.itemId,
            quantity: increment(item.quantity)
          }, { merge: true });
        }
      }

      await batch.commit();
      
      await logActivity('Create Transaction', `Created ${type} transaction with ${selectedItems.length} items. Ref: ${ref || 'N/A'}`);

      setShowAdd(false);
      setSelectedItems([]);
      setFromWh('');
      setToWh('');
      setRef('');
      alert('Transaction saved and stock updated successfully');
    } catch (err) {
      console.error('Transaction error:', err);
      alert('Failed to save transaction. Please check permissions.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-[#1e293b] font-display">Transactions</h2>
        {isStaff && (
          <GlassButton onClick={() => setShowAdd(true)} className="flex items-center gap-3 px-6 py-3 shadow-[0_10px_25px_rgba(79,172,254,0.3)]">
            <span className="text-lg">➕</span> New Transaction
          </GlassButton>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-black/2 border-b border-black/5">
              <tr>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Date</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Type</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Ref</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">From/To</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold text-right">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-black/2 transition-colors group">
                  <td className="px-8 py-5 text-[#64748b] font-bold text-sm">
                    {t.date?.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${
                      t.type === 'GRN' ? 'bg-[#4facfe]/10 text-[#4facfe]' :
                      t.type === 'Invoice' ? 'bg-[#10b981]/10 text-[#10b981]' :
                      'bg-[#64748b]/10 text-[#64748b]'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-[#1e293b] font-bold">{t.reference || '-'}</td>
                  <td className="px-8 py-5 text-[#64748b] font-bold text-sm">
                    <span className="text-[#1e293b]">{warehouses.find((w: any) => w.id === t.fromWarehouseId)?.name || '-'}</span>
                    <span className="mx-3 opacity-30">→</span>
                    <span className="text-[#1e293b]">{warehouses.find((w: any) => w.id === t.toWarehouseId)?.name || '-'}</span>
                  </td>
                  <td className="px-8 py-5 text-right text-[#1e293b] font-extrabold font-display text-lg">{t.items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl"
            >
              <GlassCard className="p-10 max-h-[90vh] overflow-y-auto shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-white/60">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-extrabold text-[#1e293b] font-display">New Transaction</h3>
                  <button onClick={() => setShowAdd(false)} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-[#64748b] hover:bg-black/10 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Transaction Type</label>
                    <GlassSelect 
                      value={type} 
                      onChange={(e) => setType(e.target.value)} 
                      className="w-full py-3"
                      options={[
                        { value: 'GRN', label: 'GRN (Receiving)' },
                        { value: 'MaterialRequest', label: 'Material Request' },
                        { value: 'StockTransfer', label: 'Stock Transfer' },
                        { value: 'Invoice', label: 'Invoice' },
                        { value: 'SalesReturn', label: 'Sales Return' },
                        { value: 'ItemHandover', label: 'Item Handover' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">From Warehouse</label>
                    <GlassSelect 
                      value={fromWh} 
                      onChange={(e) => setFromWh(e.target.value)} 
                      className="w-full py-3"
                      options={[
                        { value: '', label: 'Select Source' },
                        ...warehouses.map((w: any) => ({ value: w.id, label: w.name }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">To Warehouse</label>
                    <GlassSelect 
                      value={toWh} 
                      onChange={(e) => setToWh(e.target.value)} 
                      className="w-full py-3"
                      options={[
                        { value: '', label: 'Select Destination' },
                        ...warehouses.map((w: any) => ({ value: w.id, label: w.name }))
                      ]}
                    />
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-extrabold text-[#1e293b] font-display">Items List</h4>
                    <GlassButton variant="secondary" onClick={addItemRow} className="text-xs px-4 py-2">
                      <span className="mr-2">➕</span> Add Item
                    </GlassButton>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedItems.map((row, idx) => (
                      <div key={idx} className="flex gap-4 items-end bg-black/2 p-4 rounded-2xl border border-black/5">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-extrabold text-[#64748b] tracking-widest mb-2 block ml-1">Item</label>
                          <GlassSelect 
                            value={row.itemId} 
                            onChange={(e) => updateItemRow(idx, 'itemId', e.target.value)}
                            className="w-full py-2.5 text-sm bg-white"
                            options={[
                              { value: '', label: 'Select Item' },
                              ...items.map((i: any) => ({ value: i.id, label: i.name }))
                            ]}
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] uppercase font-extrabold text-[#64748b] tracking-widest mb-2 block ml-1">Unit</label>
                          <GlassInput 
                            value={row.unit || ''} 
                            readOnly
                            className="w-full py-2.5 text-sm bg-black/5 cursor-not-allowed"
                            placeholder="Unit"
                          />
                        </div>
                        <div className="w-28">
                          <label className="text-[10px] uppercase font-extrabold text-[#64748b] tracking-widest mb-2 block ml-1">Qty</label>
                          <GlassInput 
                            type="number" 
                            value={row.quantity} 
                            onChange={(e) => updateItemRow(idx, 'quantity', parseFloat(e.target.value))}
                            className="w-full py-2.5 text-sm bg-white"
                          />
                        </div>
                        {type === 'Invoice' && (
                          <div className="w-28">
                            <label className="text-[10px] uppercase font-extrabold text-[#64748b] tracking-widest mb-2 block ml-1">Price</label>
                            <GlassInput 
                              type="number" 
                              value={row.price} 
                              onChange={(e) => updateItemRow(idx, 'price', parseFloat(e.target.value))}
                              className="w-full py-2.5 text-sm bg-white"
                            />
                          </div>
                        )}
                        {(type === 'SalesReturn' || type === 'ItemHandover') && (
                          <div className="flex-1">
                            <label className="text-[10px] uppercase font-extrabold text-[#64748b] tracking-widest mb-2 block ml-1">Reason</label>
                            <GlassSelect 
                              value={row.reason} 
                              onChange={(e) => updateItemRow(idx, 'reason', e.target.value)}
                              className="w-full py-2.5 text-sm bg-white"
                              options={[
                                { value: 'Expired', label: 'Expired' },
                                { value: 'Damaged', label: 'Damaged' },
                                { value: 'Other Reasons', label: 'Other Reasons' },
                              ]}
                            />
                          </div>
                        )}
                        <button 
                          onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}
                          className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-6 items-end">
                  <div className="flex-1">
                    <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Reference / Remarks</label>
                    <GlassInput value={ref} onChange={(e) => setRef(e.target.value)} className="w-full py-3.5" placeholder="Invoice # or Notes" />
                  </div>
                  <GlassButton onClick={saveTransaction} className="px-12 py-4 shadow-[0_15px_35px_rgba(79,172,254,0.4)]">
                    Submit Transaction
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSaveTransaction}
        title="Confirm Transaction"
        message={`Are you sure you want to submit this ${type} transaction? This will update stock levels across warehouses.`}
        confirmText="Submit"
      />
    </div>
  );
};

const Reports = ({ warehouses, items, transactions, stock, profile }: { warehouses: Warehouse[], items: Item[], transactions: Transaction[], stock: Stock[], profile: UserProfile | null }) => {
  const [reportType, setReportType] = useState('stock-in-hand');

  return (
    <div className="space-y-8">
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'stock-in-hand', label: 'Stock In Hand', icon: '📦' },
          { id: 'stock-in', label: 'Stock IN', icon: '📥' },
          { id: 'stock-out', label: 'Stock OUT', icon: '📤' },
          { id: 'handover', label: 'Handover', icon: '🤝' },
        ].map((r) => (
          <GlassButton
            key={r.id}
            variant={reportType === r.id ? 'primary' : 'ghost'}
            onClick={() => setReportType(r.id)}
            className="whitespace-nowrap px-6 py-3 flex items-center gap-2"
          >
            <span>{r.icon}</span>
            {r.label}
          </GlassButton>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-black/2 border-b border-black/5">
              <tr>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Warehouse</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Item</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {reportType === 'stock-in-hand' && stock.map((s: any) => (
                <tr key={s.id} className="hover:bg-black/2 transition-colors group">
                  <td className="px-8 py-5 text-[#1e293b] font-bold">
                    {warehouses.find((w: any) => w.id === s.warehouseId)?.name || 'Unknown'}
                  </td>
                  <td className="px-8 py-5 text-[#64748b] font-bold">
                    {items.find((i: any) => i.id === s.itemId)?.name || 'Unknown'}
                  </td>
                  <td className="px-8 py-5 text-right font-extrabold text-[#1e293b] font-display text-lg">{s.quantity}</td>
                </tr>
              ))}
              {reportType !== 'stock-in-hand' && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-4xl opacity-20">📊</span>
                      <p className="text-[#64748b] font-bold italic">Aggregate report data for {reportType} would be calculated here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

const UserManagement = ({ users }: { users: UserProfile[] }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

  const saveUser = async () => {
    if (!email) return;
    // Note: In a real app, you'd use Firebase Admin SDK to create users.
    // Here we just create the profile document.
    await addDoc(collection(db, 'users'), {
      email,
      role,
      permissions: []
    });
    await logActivity('Add User', `Created user profile for ${email} with role ${role}`);
    setShowAdd(false);
    setEmail('');
  };

  const updateRole = async (uid: string, newRole: UserRole, userEmail: string) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { role: newRole }, { merge: true });
    await logActivity('Update User Role', `Updated role for ${userEmail} to ${newRole}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-[#1e293b] font-display">User Management</h2>
        <GlassButton onClick={() => setShowAdd(true)} className="flex items-center gap-3 px-6 py-3 shadow-[0_10px_25px_rgba(79,172,254,0.3)]">
          <span className="text-lg">👤</span> Add User Profile
        </GlassButton>
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-black/2 border-b border-black/5">
              <tr>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Email</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold">Role</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-[#64748b] font-extrabold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-black/2 transition-colors group">
                  <td className="px-8 py-5 font-bold text-[#1e293b]">{u.email}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-[#a855f7]/10 text-[#a855f7]' :
                      u.role === 'manager' ? 'bg-[#4facfe]/10 text-[#4facfe]' :
                      'bg-[#64748b]/10 text-[#64748b]'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <GlassSelect 
                      value={u.role} 
                      onChange={(e) => updateRole(u.uid, e.target.value as UserRole, u.email)}
                      className="text-xs py-1.5 w-32 ml-auto"
                      options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'manager', label: 'Manager' },
                        { value: 'staff', label: 'Staff' },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
              <GlassCard className="w-full max-w-md p-10 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-white/60">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-extrabold text-[#1e293b] font-display">Add User Profile</h3>
                  <button onClick={() => setShowAdd(false)} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-[#64748b] hover:bg-black/10 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">User Email</label>
                    <GlassInput value={email} onChange={(e) => setEmail(e.target.value)} className="w-full py-3" placeholder="user@example.com" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Role</label>
                    <GlassSelect 
                      value={role} 
                      onChange={(e) => setRole(e.target.value as UserRole)} 
                      className="w-full py-3"
                      options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'manager', label: 'Manager' },
                        { value: 'staff', label: 'Staff' },
                      ]}
                    />
                  </div>
                  <GlassButton onClick={saveUser} className="w-full py-4 shadow-[0_10px_25px_rgba(79,172,254,0.3)]">Save Profile</GlassButton>
                  <GlassButton variant="ghost" onClick={() => setShowAdd(false)} className="w-full py-3">Cancel</GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Auth
  const [email, setEmail] = useState('info@halfanapp.com');
  const [password, setPassword] = useState('bd19970714');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', u.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile({ uid: u.uid, ...profileSnap.data() } as UserProfile);
        } else {
          // Default profile for the first admin
          const isDefaultAdmin = u.email === 'info@halfanapp.com';
          const newProfile = {
            email: u.email,
            role: isDefaultAdmin ? 'admin' : 'staff',
            permissions: []
          };
          await setDoc(profileRef, newProfile);
          setProfile({ uid: u.uid, ...newProfile } as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubWH = onSnapshot(collection(db, 'warehouses'), (s) => {
      setWarehouses(s.docs.map(d => ({ id: d.id, ...d.data() } as Warehouse)));
    });
    const unsubSM = onSnapshot(collection(db, 'salesmen'), (s) => {
      setSalesmen(s.docs.map(d => ({ id: d.id, ...d.data() } as Salesman)));
    });
    const unsubItems = onSnapshot(collection(db, 'items'), (s) => {
      setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as Item)));
    });
    const unsubTrans = onSnapshot(collection(db, 'transactions'), (s) => {
      setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    const unsubStock = onSnapshot(collection(db, 'stock'), (s) => {
      setStock(s.docs.map(d => ({ id: d.id, ...d.data() } as Stock)));
    });

    // Only admins can see all users
    let unsubUsers = () => {};
    if (profile?.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, 'users'), (s) => {
        setAllUsers(s.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      });
    }

    return () => {
      unsubWH(); unsubSM(); unsubItems(); unsubTrans(); unsubStock(); unsubUsers();
    };
  }, [user, profile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert('Login failed. Please check credentials.');
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) return (
    <div className="h-screen flex items-center justify-center p-4 overflow-hidden relative">
      <div className="mesh-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard className="p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-white/60">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-[#1e293b] mb-3 font-display bg-gradient-to-r from-[#4facfe] to-[#00f2fe] bg-clip-text text-transparent">AWT INVENTORY</h1>
            <p className="text-[#64748b] font-bold uppercase tracking-[0.2em] text-xs">AL WATANIA INTERNATIONAL</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Email Address</label>
              <GlassInput 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3.5"
                placeholder="admin@awt.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-[#64748b] uppercase tracking-widest mb-3 ml-1">Password</label>
              <GlassInput 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5"
              />
            </div>
            <GlassButton type="submit" className="w-full py-4 text-lg shadow-[0_12px_30px_rgba(79,172,254,0.4)]">
              Sign In to Dashboard
            </GlassButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden relative">
      <div className="mesh-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} profile={profile} />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-24 bg-white/60 backdrop-blur-[30px] border-b border-white/60 flex items-center justify-between px-12 sticky top-0 z-30">
          <div className="flex items-center gap-8">
            <button 
              className="lg:hidden p-3 text-[#1e293b] hover:bg-black/5 rounded-2xl transition-all active:scale-90"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={28} />
            </button>
            <div className="relative hidden md:block">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-60">🔍</span>
              <GlassInput 
                placeholder="Search anything..." 
                className="pl-14 w-96 bg-white/40 border-transparent focus:bg-white/80 shadow-none hover:bg-white/60 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all active:scale-95 group">
              <div className="w-12 h-12 rounded-2xl bg-white/40 border border-white/60 flex items-center justify-center text-2xl group-hover:bg-white/60 transition-colors relative">
                🔔
                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#f43f5e] border-2 border-white shadow-sm animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-[1px] bg-black/5 mx-2" />
            <div className="flex items-center gap-5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-extrabold text-[#1e293b] font-sans tracking-tight">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-[#64748b] font-extrabold uppercase tracking-[0.2em] mt-0.5">{profile?.role}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/60 border border-white shadow-[0_8px_20px_rgba(0,0,0,0.03)] flex items-center justify-center text-2xl hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#4facfe]/10 to-[#00f2fe]/10 flex items-center justify-center">
                  👤
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {activeTab === 'dashboard' && <Dashboard warehouses={warehouses} items={items} transactions={transactions} stock={stock} />}
              {activeTab === 'masters' && <Masters warehouses={warehouses} salesmen={salesmen} items={items} profile={profile} />}
              {activeTab === 'transactions' && <Transactions warehouses={warehouses} items={items} transactions={transactions} profile={profile} />}
              {activeTab === 'reports' && <Reports warehouses={warehouses} items={items} transactions={transactions} stock={stock} profile={profile} />}
              {activeTab === 'users' && profile?.role === 'admin' && <UserManagement users={allUsers} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-white/90 backdrop-blur-2xl shadow-2xl border-r border-white"
            >
              <div className="p-6 flex justify-end">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#64748b] hover:text-[#1e293b] transition-colors">
                  <X size={28} />
                </button>
              </div>
              <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} user={user} profile={profile} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
