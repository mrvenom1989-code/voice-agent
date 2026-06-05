import React, { useEffect, useState } from 'react';
import { 
  Package, 
  DollarSign, 
  Clock, 
  Smartphone, 
  MapPin, 
  Phone, 
  Mail, 
  Tag, 
  HelpCircle 
} from 'lucide-react';

export function PartsServicesPanel({ dbState, activeTool }) {
  const [prices, setPrices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [hours, setHours] = useState(null);
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState(null);

  const [activeTab, setActiveTab] = useState('services'); // services | info
  const [highlightedItem, setHighlightedItem] = useState(null); // { key, type: 'service'|'faq'|'info' }

  useEffect(() => {
    if (dbState) {
      if (dbState.repairPrices) setPrices(dbState.repairPrices);
      if (dbState.klinikFaqs) setFaqs(dbState.klinikFaqs);
      if (dbState.klinikOffers) setOffers(dbState.klinikOffers);
      if (dbState.klinikHours) setHours(dbState.klinikHours);
      if (dbState.klinikLocation) setLocation(dbState.klinikLocation);
      if (dbState.klinikContact) setContact(dbState.klinikContact);
    }
  }, [dbState]);

  // Flash rows when tools are executed
  useEffect(() => {
    if (!activeTool) return;

    const toolName = activeTool.name;
    if (toolName === 'get_repair_price') {
      const device = activeTool.args?.device;
      const issue = activeTool.args?.issue;
      if (device && issue) {
        setHighlightedItem({
          key: `${device.toLowerCase()}-${issue.toLowerCase()}`,
          type: 'service'
        });
        setActiveTab('services');
        const t = setTimeout(() => setHighlightedItem(null), 4000);
        return () => clearTimeout(t);
      }
    } else if (toolName === 'klinik_hours') {
      setHighlightedItem({
        key: 'hours',
        type: 'info'
      });
      setActiveTab('info');
      const t = setTimeout(() => setHighlightedItem(null), 4000);
      return () => clearTimeout(t);
    } else if (toolName === 'klinik_location') {
      setHighlightedItem({
        key: 'location',
        type: 'info'
      });
      setActiveTab('info');
      const t = setTimeout(() => setHighlightedItem(null), 4000);
      return () => clearTimeout(t);
    } else if (toolName === 'check_store_faq') {
      const topic = activeTool.args?.topic;
      if (topic) {
        setHighlightedItem({
          key: topic.toLowerCase(),
          type: 'faq'
        });
        setActiveTab('info');
        const t = setTimeout(() => setHighlightedItem(null), 4000);
        return () => clearTimeout(t);
      }
    }
  }, [activeTool]);

  return (
    <div className="glass-card rounded-3xl p-6 glow-blue relative overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold tracking-wide text-slate-100">Klinik Parts & Pricing</h2>
        </div>
        
        {/* Tab Buttons */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/40 shrink-0">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'services'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Store Info
          </button>
        </div>
      </div>

      {/* Content Panels */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {activeTab === 'services' ? (
          <div className="space-y-3">
            {prices.map((item, idx) => {
              const serviceKey = `${item.device.toLowerCase()}-${item.issue.toLowerCase()}`;
              const isHighlighted = highlightedItem?.type === 'service' && 
                (serviceKey.includes(highlightedItem.key) || highlightedItem.key.includes(serviceKey));

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                    isHighlighted
                      ? 'border-blue-500 bg-blue-950/20 scale-[1.01] shadow-[0_0_15px_rgba(59,130,246,0.25)] animate-double-pulse'
                      : 'bg-slate-900/40 border-slate-800/40 text-slate-300 hover:border-slate-850 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="text-left flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="font-semibold text-sm text-slate-100">{item.device}</span>
                    </div>
                    <span className="text-xs text-slate-400">Repair: {item.issue}</span>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-sm font-mono font-bold text-blue-300 bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded-lg flex items-center">
                      <DollarSign className="w-3.5 h-3.5" />
                      {item.cost}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.duration}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Hours and Location (Vertical Stack) */}
            <div className="flex flex-col gap-4">
              {/* Hours Card */}
              <div
                className={`p-4 rounded-2xl border transition-all duration-300 text-left ${
                  highlightedItem?.type === 'info' && highlightedItem?.key === 'hours'
                    ? 'border-blue-500 bg-blue-950/20 scale-[1.01] shadow-[0_0_15px_rgba(59,130,246,0.25)] animate-double-pulse'
                    : 'bg-slate-900/40 border-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm text-slate-100">Store Hours</span>
                </div>
                {hours ? (
                  <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mon - Sat:</span>
                      <span>{hours.weekdays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sunday:</span>
                      <span>{hours.sunday}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Loading hours...</span>
                )}
              </div>

              {/* Location Card */}
              <div
                className={`p-4 rounded-2xl border transition-all duration-300 text-left ${
                  highlightedItem?.type === 'info' && highlightedItem?.key === 'location'
                    ? 'border-blue-500 bg-blue-950/20 scale-[1.01] shadow-[0_0_15px_rgba(59,130,246,0.25)] animate-double-pulse'
                    : 'bg-slate-900/40 border-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm text-slate-100">Lethbridge Store</span>
                </div>
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">{location || 'Lethbridge Store'}</p>
                {contact && (
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-2.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Promotions */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-sm text-slate-100">Special Offers & Deals</span>
              </div>
              <div className="flex flex-col gap-3">
                {offers.map((offer, idx) => {
                  const isOfferHighlighted = highlightedItem?.type === 'faq' && highlightedItem?.key === 'promotions';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                        isOfferHighlighted
                          ? 'border-blue-500 bg-blue-950/25 scale-[1.01] shadow-[0_0_15px_rgba(59,130,246,0.25)] animate-double-pulse'
                          : 'bg-slate-900/20 border-slate-800/30'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-blue-300 mb-1">{offer.title}</h4>
                      <p className="text-xs text-slate-400 leading-normal">{offer.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Policy FAQs */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-sm text-slate-100">Store Policies & FAQs</span>
              </div>
              <div className="flex flex-col gap-3">
                {faqs.map((faq, idx) => {
                  const isFaqHighlighted = highlightedItem?.type === 'faq' && highlightedItem?.key === faq.topic;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        isFaqHighlighted
                          ? 'border-blue-500 bg-blue-950/25 scale-[1.01] shadow-[0_0_15px_rgba(59,130,246,0.25)] animate-double-pulse'
                          : 'bg-slate-900/30 border-slate-800/30'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-slate-200 mb-1.5 flex items-start gap-1.5">
                        <span className="text-blue-400 font-mono">Q:</span>
                        <span>{faq.question}</span>
                      </h4>
                      <p className="text-xs text-slate-400 pl-4 leading-normal flex items-start gap-1.5">
                        <span className="text-emerald-400 font-mono font-semibold">A:</span>
                        <span>{faq.answer}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
