
import React, { useState } from 'react';
import { McpProvider } from '../types';
import { McpService } from '../services';
import { useGlobal } from '../store';
import {
   Search, Database, Search as SearchIcon, MessageSquare,
   CreditCard, Trello, DownloadCloud, Check, RefreshCw,
   Settings, X, Shield, Terminal, Zap, Trash2, AlertTriangle, Loader2,
   Activity, ExternalLink, FileText, TrendingUp, CheckCircle, XCircle,
   Filter, ChevronDown, ChevronUp, Play, BarChart3, Users, Plus
} from 'lucide-react';

const IconMap: Record<string, React.ReactNode> = {
   'database': <Database className="w-6 h-6" />,
   'search': <SearchIcon className="w-6 h-6" />,
   'message-square': <MessageSquare className="w-6 h-6" />,
   'credit-card': <CreditCard className="w-6 h-6" />,
   'trello': <Trello className="w-6 h-6" />,
};

// --- Config Modal ---

const McpConfigModal: React.FC<{
   provider: McpProvider;
   onClose: () => void;
   onSave: (provider: McpProvider) => void;
   onUninstall: (id: string) => Promise<void>;
   onTest: (id: string) => Promise<boolean>;
}> = ({ provider, onClose, onSave, onUninstall, onTest }) => {
   const [apiKey, setApiKey] = useState('');
   const [isSaving, setIsSaving] = useState(false);
   const [isUninstalling, setIsUninstalling] = useState(false);
   const [isTesting, setIsTesting] = useState(false);
   const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

   const handleSave = async () => {
      setIsSaving(true);
      try {
         // Call service to save configuration
         const updated = await McpService.configure(provider.id, { apiKey });
         onSave(updated);
         onClose();
      } catch (e) {
         console.error("Failed to save config", e);
      } finally {
         setIsSaving(false);
      }
   };

   const handleUninstall = async () => {
      if (confirm(`Are you sure you want to uninstall ${provider.name}? This will remove all configuration.`)) {
         setIsUninstalling(true);
         try {
            await onUninstall(provider.id);
            onClose();
         } catch (e) {
            console.error("Failed to uninstall", e);
            setIsUninstalling(false);
         }
      }
   };

   const handleTestConnection = async () => {
      setIsTesting(true);
      setTestResult(null);
      try {
         const result = await onTest(provider.id);
         setTestResult(result ? 'success' : 'failed');
      } catch (e) {
         setTestResult('failed');
      } finally {
         setIsTesting(false);
      }
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-background/60 backdrop-blur-md transition-all duration-300" onClick={onClose}></div>
         <div className="relative bg-surface border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in z-10">

            {/* Header */}
            <div className="bg-surfaceHighlight/30 p-6 border-b border-white/5 flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-primary shadow-lg">
                     {IconMap[provider.icon]}
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-100">{provider.name}</h3>
                     <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span className="bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">v{provider.installedVersion || provider.version}</span>
                        <span>•</span>
                        <span>Official Connector</span>
                     </div>
                  </div>
               </div>
               <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
               <p className="text-sm text-slate-300 leading-relaxed">
                  Configure connection settings for <strong>{provider.name}</strong>. This allows your agents to securely access data and perform actions.
               </p>

               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">API Endpoint</label>
                     <div className="flex items-center gap-2 bg-input border border-white/10 rounded-lg px-3 py-2 text-slate-400 text-sm">
                        <Terminal className="w-4 h-4" />
                        <span className="font-mono">https://api.gateway.pairmind.ai/v1/{provider.id}</span>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Secret Key / Token</label>
                     <input
                        type="password"
                        className="w-full bg-input border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-primary/50 placeholder:text-slate-600"
                        placeholder={provider.isConfigured ? "••••••••••••••••" : "sk_prod_..."}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                     />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                     <Shield className="w-4 h-4 text-blue-400" />
                     <p className="text-xs text-blue-300">Credentials are encrypted at rest using AES-256.</p>
                  </div>

                  {/* Test Connection */}
                  {provider.isConfigured && (
                     <div className="pt-4 border-t border-white/5">
                        <button
                           onClick={handleTestConnection}
                           disabled={isTesting}
                           className="w-full py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                           {isTesting ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Testing Connection...</>
                           ) : (
                              <><Play className="w-4 h-4" /> Test Connection</>
                           )}
                        </button>
                        {testResult && (
                           <div className={`mt - 3 p - 3 rounded - lg flex items - center gap - 2 ${testResult === 'success'
                              ? 'bg-success/10 border border-success/20'
                              : 'bg-danger/10 border border-danger/20'
                              } `}>
                              {testResult === 'success' ? (
                                 <><CheckCircle className="w-4 h-4 text-success" /><span className="text-xs text-success font-medium">Connection successful!</span></>
                              ) : (
                                 <><XCircle className="w-4 h-4 text-danger" /><span className="text-xs text-danger font-medium">Connection failed. Check credentials.</span></>
                              )}
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center gap-3">
               <button
                  onClick={handleUninstall}
                  disabled={isUninstalling}
                  className="text-danger hover:text-red-400 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
               >
                  {isUninstalling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Uninstall
               </button>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
                  <button
                     onClick={handleSave}
                     disabled={isSaving}
                     className="px-4 py-2 rounded-lg bg-primary hover:bg-primaryHover text-white text-sm font-medium shadow-neon transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                     {isSaving ? (
                        <> <Loader2 className="w-4 h-4 animate-spin" /> Saving... </>
                     ) : (
                        <> <Check className="w-4 h-4" /> Save Configuration </>
                     )}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- Create MCP Provider Modal ---

const CreateMcpModal: React.FC<{
   onClose: () => void;
   onCreate: (provider: McpProvider) => void;
}> = ({ onClose, onCreate }) => {
   const [formData, setFormData] = useState({
      name: '',
      description: '',
      category: 'Database',
      version: '1.0.0',
      icon: 'database',
      apiEndpoint: ''
   });
   const [isCreating, setIsCreating] = useState(false);

   const iconOptions = [
      { value: 'database', label: 'Database', icon: <Database className="w-5 h-5" /> },
      { value: 'search', label: 'Search', icon: <SearchIcon className="w-5 h-5" /> },
      { value: 'message-square', label: 'Messaging', icon: <MessageSquare className="w-5 h-5" /> },
      { value: 'credit-card', label: 'Payment', icon: <CreditCard className="w-5 h-5" /> },
      { value: 'trello', label: 'Productivity', icon: <Trello className="w-5 h-5" /> },
   ];

   const categoryOptions = ['Database', 'Search', 'Productivity', 'Payment', 'Integration', 'Analytics'];

   const handleCreate = async () => {
      // Validation
      if (!formData.name || !formData.description || !formData.apiEndpoint) {
         alert('Please fill in all required fields');
         return;
      }

      setIsCreating(true);
      try {
         // Create new provider object
         const newProvider: McpProvider = {
            id: `mcp-custom-${Date.now()}`,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            status: 'Available',
            icon: formData.icon,
            version: formData.version,
            isConfigured: false
         };

         // Simulate API call
         await new Promise(resolve => setTimeout(resolve, 1000));

         onCreate(newProvider);
         onClose();
      } catch (e) {
         console.error("Failed to create provider", e);
         alert('Failed to create provider');
      } finally {
         setIsCreating(false);
      }
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-background/60 backdrop-blur-md transition-all duration-300" onClick={onClose}></div>
         <div className="relative bg-surface border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in z-10 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="bg-surfaceHighlight/30 p-6 border-b border-white/5 flex justify-between items-start sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg">
                     <Plus className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-100">Create New MCP Provider</h3>
                     <p className="text-xs text-slate-400 mt-1">Add a custom Model Context Protocol provider</p>
                  </div>
               </div>
               <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Provider Name */}
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Provider Name *</label>
                     <input
                        type="text"
                        className="w-full bg-input border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary/50 placeholder:text-slate-600"
                        placeholder="e.g., MongoDB Connector"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description *</label>
                     <textarea
                        className="w-full bg-input border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary/50 placeholder:text-slate-600 resize-none"
                        placeholder="Describe what this provider does..."
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     />
                  </div>

                  {/* Category */}
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                     <select
                        className="w-full bg-input border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary/50"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                     >
                        {categoryOptions.map(cat => (
                           <option key={cat} value={cat}>{cat}</option>
                        ))}
                     </select>
                  </div>

                  {/* Version */}
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Version</label>
                     <input
                        type="text"
                        className="w-full bg-input border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary/50 placeholder:text-slate-600"
                        placeholder="1.0.0"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                     />
                  </div>

                  {/* Icon Selection */}
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Icon</label>
                     <div className="grid grid-cols-5 gap-3">
                        {iconOptions.map(option => (
                           <button
                              key={option.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, icon: option.value })}
                              className={`p-4 rounded-lg border transition-all flex flex-col items-center justify-center gap-2 ${formData.icon === option.value
                                 ? 'bg-primary/10 border-primary text-primary'
                                 : 'bg-surface border-white/10 text-slate-400 hover:border-primary/30'
                                 }`}
                           >
                              {option.icon}
                              <span className="text-[10px] font-medium">{option.label}</span>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* API Endpoint */}
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2">API Endpoint *</label>
                     <div className="flex items-center gap-2 bg-input border border-white/10 rounded-lg px-4 py-2.5">
                        <Terminal className="w-4 h-4 text-slate-500" />
                        <input
                           type="text"
                           className="flex-1 bg-transparent text-slate-100 text-sm focus:outline-none placeholder:text-slate-600"
                           placeholder="https://api.example.com/v1"
                           value={formData.apiEndpoint}
                           onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                        />
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-300">Custom providers will be available for configuration after creation.</p>
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end items-center gap-3 sticky bottom-0">
               <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
               <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="px-6 py-2 rounded-lg bg-primary hover:bg-primaryHover text-white text-sm font-bold shadow-neon transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
               >
                  {isCreating ? (
                     <> <Loader2 className="w-4 h-4 animate-spin" /> Creating... </>
                  ) : (
                     <> <Plus className="w-4 h-4" /> Create Provider </>
                  )}
               </button>
            </div>
         </div>
      </div>
   );
};


const McpMarketplace: React.FC = () => {
   const { mcpProviders, setMcpProviders, notify } = useGlobal();
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string>('All');
   const [configuringProvider, setConfiguringProvider] = useState<McpProvider | null>(null);
   const [creatingProvider, setCreatingProvider] = useState(false);
   const [processingId, setProcessingId] = useState<string | null>(null);
   const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

   // Get unique categories
   const categories = ['All', ...Array.from(new Set(mcpProviders.map(p => p.category)))];

   const filteredProviders = mcpProviders.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
   });

   // Stats
   const installedCount = mcpProviders.filter(p => p.status === 'Installed').length;
   const updateAvailableCount = mcpProviders.filter(p => p.status === 'Update Available').length;
   const healthyCount = mcpProviders.filter(p => p.status === 'Installed' && p.isConfigured).length;

   const handleUpdateProviderState = async (updatedProvider: McpProvider) => {
      const updatedList = mcpProviders.map(p => p.id === updatedProvider.id ? updatedProvider : p);
      await setMcpProviders(updatedList);
   };

   const handleInstall = async (provider: McpProvider) => {
      setProcessingId(provider.id);
      try {
         const updated = await McpService.install(provider.id);
         await handleUpdateProviderState(updated);

         notify(`${provider.name} installed successfully`, 'success');
         // Auto-open config after install
         setConfiguringProvider(updated);
      } catch (e) {
         console.error("Install failed", e);
         notify(`Failed to install ${provider.name} `, 'error');
      } finally {
         setProcessingId(null);
      }
   };

   const handleUpdateProvider = async (provider: McpProvider) => {
      setProcessingId(provider.id);
      try {
         const updated = await McpService.performUpdate(provider.id);
         await handleUpdateProviderState(updated);

         notify(`${provider.name} updated to v${updated.version} `, 'success');
      } catch (e) {
         console.error("Update failed", e);
         notify(`Failed to update ${provider.name} `, 'error');
      } finally {
         setProcessingId(null);
      }
   };

   const handleUninstallProvider = async (id: string) => {
      const provider = mcpProviders.find(p => p.id === id);
      const updated = await McpService.uninstall(id);
      await handleUpdateProviderState(updated);

      if (provider) {
         notify(`${provider.name} uninstalled`, 'success');
      }
   };

   const handleTestConnection = async (id: string): Promise<boolean> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const success = Math.random() > 0.2; // 80% success rate

      return success;
   };

   // Mock usage data (in real app, this would come from API)
   const getProviderUsage = (providerId: string) => {
      const usageMap: Record<string, number> = {
         'mcp-1': 8,
         'mcp-2': 0,
         'mcp-3': 5,
         'mcp-4': 0,
         'mcp-5': 0,
      };
      return usageMap[providerId] || 0;
   };

   const getProviderHealth = (provider: McpProvider): 'healthy' | 'warning' | 'error' | null => {
      if (provider.status !== 'Installed') return null;
      if (!provider.isConfigured) return 'warning';
      return 'healthy';
   };

   const handleCreateProvider = async (newProvider: McpProvider) => {
      const updatedList = [...mcpProviders, newProvider];
      await setMcpProviders(updatedList);
      notify(`${newProvider.name} created successfully`, 'success');
   };

   return (
      <div className="space-y-6 animate-fade-in relative min-h-[500px]">

         {/* Modals */}
         {configuringProvider && (
            <McpConfigModal
               provider={configuringProvider}
               onClose={() => setConfiguringProvider(null)}
               onSave={handleUpdateProviderState}
               onUninstall={handleUninstallProvider}
               onTest={handleTestConnection}
            />
         )}

         {creatingProvider && (
            <CreateMcpModal
               onClose={() => setCreatingProvider(false)}
               onCreate={handleCreateProvider}
            />
         )}

         {/* Header with Stats */}
         <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
               <div>
                  <h2 className="text-2xl font-bold text-slate-100">MCP Providers</h2>
                  <p className="text-slate-400 text-sm">Connect your agents to external tools and data sources via Model Context Protocol.</p>
               </div>
               <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                     <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                     <input
                        type="text"
                        placeholder="Search providers..."
                        className="w-full bg-input border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-primary/50 placeholder:text-slate-600 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <button
                     onClick={() => setCreatingProvider(true)}
                     className="px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl text-sm font-bold shadow-neon transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                     <Plus className="w-4 h-4" />
                     <span className="hidden sm:inline">Create Provider</span>
                  </button>
               </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-surface border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Providers</div>
                     <Database className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-100">{mcpProviders.length}</div>
               </div>
               <div className="bg-surface border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Installed</div>
                     <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="text-2xl font-bold text-success">{installedCount}</div>
               </div>
               <div className="bg-surface border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Updates Available</div>
                     <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div className="text-2xl font-bold text-warning">{updateAvailableCount}</div>
               </div>
               <div className="bg-surface border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                     <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Healthy</div>
                     <Activity className="w-4 h-4 text-success" />
                  </div>
                  <div className="text-2xl font-bold text-slate-100">{healthyCount}</div>
               </div>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
               <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
               {categories.map(category => (
                  <button
                     key={category}
                     onClick={() => setSelectedCategory(category)}
                     className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category
                        ? 'bg-primary text-white shadow-neon'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                        }`}
                  >
                     {category}
                  </button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 gap-6">
            {/* Providers Grid */}
            <div>
               {filteredProviders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     {filteredProviders.map(provider => {
                        const isProcessing = processingId === provider.id;
                        const isExpanded = expandedProvider === provider.id;
                        const usage = getProviderUsage(provider.id);
                        const health = getProviderHealth(provider);

                        return (
                           <div key={provider.id} className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group flex flex-col relative overflow-hidden">
                              {/* Install Progress Overlay */}
                              {isProcessing && (
                                 <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-fade-in">
                                    <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
                                    <span className="text-sm font-bold text-white">
                                       {provider.status === 'Update Available' ? 'Updating...' : 'Installing...'}
                                    </span>
                                 </div>
                              )}

                              <div className="flex justify-between items-start mb-4">
                                 <div className="w-12 h-12 rounded-xl bg-surfaceHighlight border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg">
                                    {IconMap[provider.icon] || <Database className="w-6 h-6" />}
                                 </div>
                                 <div className="flex flex-col items-end gap-2">
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${provider.status === 'Installed' ? 'bg-success/10 text-success' :
                                       provider.status === 'Update Available' ? 'bg-warning/10 text-warning' :
                                          'bg-white/5 text-slate-400'
                                       }`}>
                                       {provider.status === 'Installed' && <Check className="w-3 h-3" />}
                                       {provider.status === 'Update Available' && <AlertTriangle className="w-3 h-3" />}
                                       {provider.status}
                                    </div>
                                    {health && (
                                       <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 ${health === 'healthy' ? 'bg-success/10 text-success' :
                                          health === 'warning' ? 'bg-warning/10 text-warning' :
                                             'bg-danger/10 text-danger'
                                          } `}>
                                          <Activity className="w-2.5 h-2.5" />
                                          {health}
                                       </div>
                                    )}
                                 </div>
                              </div>

                              <div className="mb-2">
                                 <h3 className="text-lg font-bold text-slate-100 flex items-center justify-between">
                                    {provider.name}
                                    <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-mono font-normal">v{provider.version}</span>
                                 </h3>
                                 <div className="text-xs text-slate-500 mt-1">{provider.category}</div>
                              </div>
                              <p className="text-sm text-slate-400 mb-4 flex-1 leading-relaxed">{provider.description}</p>

                              {/* Usage Stats */}
                              {provider.status === 'Installed' && (
                                 <div className="mb-4 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                                    <div className="flex items-center justify-between text-xs">
                                       <div className="flex items-center gap-2 text-slate-400">
                                          <Users className="w-3.5 h-3.5" />
                                          <span>Used by instances</span>
                                       </div>
                                       <span className="font-bold text-slate-200">{usage}</span>
                                    </div>
                                 </div>
                              )}

                              {provider.status === 'Installed' && !provider.isConfigured && (
                                 <div className="mb-4 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-warning" />
                                    <span className="text-xs text-warning font-medium">Configuration Required</span>
                                 </div>
                              )}

                              {/* Expandable Details */}
                              {isExpanded && provider.status === 'Installed' && (
                                 <div className="mb-4 p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2 animate-fade-in">
                                    <div className="flex items-center justify-between text-xs">
                                       <span className="text-slate-500">Installed Version</span>
                                       <span className="font-mono text-slate-300">{provider.installedVersion}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                       <span className="text-slate-500">Latest Version</span>
                                       <span className="font-mono text-slate-300">{provider.version}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                       <span className="text-slate-500">Configuration</span>
                                       <span className={`font - medium ${provider.isConfigured ? 'text-success' : 'text-warning'} `}>
                                          {provider.isConfigured ? 'Complete' : 'Pending'}
                                       </span>
                                    </div>
                                 </div>
                              )}

                              <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                                 {provider.status === 'Installed' ? (
                                    <>
                                       <button
                                          onClick={() => setConfiguringProvider(provider)}
                                          className="w-full py-2.5 bg-surfaceHighlight border border-white/10 rounded-xl text-slate-300 text-sm font-medium hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group-hover:border-primary/30"
                                       >
                                          <Settings className="w-4 h-4" /> Configure
                                       </button>
                                       <button
                                          onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                                          className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
                                       >
                                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                          {isExpanded ? 'Show Less' : 'Show Details'}
                                       </button>
                                    </>
                                 ) : provider.status === 'Update Available' ? (
                                    <button
                                       onClick={() => handleUpdateProvider(provider)}
                                       disabled={isProcessing}
                                       className="w-full py-2.5 bg-warning/10 border border-warning/20 rounded-xl text-warning text-sm font-bold hover:bg-warning/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                       <RefreshCw className="w-4 h-4" /> Update to v{provider.version}
                                    </button>
                                 ) : (
                                    <button
                                       onClick={() => handleInstall(provider)}
                                       disabled={isProcessing}
                                       className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primaryHover shadow-neon transition-colors flex items-center justify-center gap-2"
                                    >
                                       <DownloadCloud className="w-4 h-4" /> Install Provider
                                    </button>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 opacity-40" />
                     </div>
                     <h3 className="text-lg font-medium text-slate-300">No providers found</h3>
                     <p className="text-sm mt-1">Try a different search term or category.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default McpMarketplace;
