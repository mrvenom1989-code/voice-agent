import React, { useEffect, useState, useRef } from 'react';
import { Package, HelpCircle, Activity, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

export function InventoryPanel({ dbState, activeTool }) {
  const [inventory, setInventory] = useState([]);
  const [highlightedItem, setHighlightedItem] = useState(null); // { name, type: 'queried' | 'reserved' }
  const prevInventoryRef = useRef([]);

  useEffect(() => {
    if (dbState?.inventory) {
      const newInv = dbState.inventory;
      const prevInv = prevInventoryRef.current;

      // Detect reservation changes (quantity decreased)
      if (prevInv.length > 0) {
        newInv.forEach(newItem => {
          const prevItem = prevInv.find(p => p.name.toLowerCase() === newItem.name.toLowerCase());
          if (prevItem && prevItem.quantity !== newItem.quantity) {
            // Flash as reserved/mutated
            setHighlightedItem({ name: newItem.name.toLowerCase(), type: 'reserved' });
            const t = setTimeout(() => setHighlightedItem(null), 3000);
            return () => clearTimeout(t);
          }
        });
      }

      prevInventoryRef.current = newInv;
      setInventory(newInv);
    }
  }, [dbState]);

  // Flash item when tool check_stock or reserve_medicine is active
  useEffect(() => {
    if (activeTool && (activeTool.name === 'check_stock' || activeTool.name === 'reserve_medicine')) {
      const medName = activeTool.args?.medicine_name;
      if (medName) {
        setHighlightedItem({
          name: medName.toLowerCase(),
          type: activeTool.name === 'reserve_medicine' ? 'reserved' : 'queried'
        });
        const t = setTimeout(() => setHighlightedItem(null), 3000);
        return () => clearTimeout(t);
      }
    }
  }, [activeTool]);

  return (
    <div className="glass-card rounded-3xl p-6 glow-purple relative overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold tracking-wide text-slate-100">Pharmacy Inventory</h2>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-full border border-slate-800/40">
          <Activity className="w-3.5 h-3.5 text-emerald-400" /> Live Database Sync
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
        {inventory.map(item => {
          const lowerName = item.name.toLowerCase();
          const isHighlighted = highlightedItem?.name === lowerName;
          const highlightType = highlightedItem?.type;
          
          const isLowStock = item.quantity <= 10;
          const isOutOfStock = item.quantity === 0;

          // Flash style binding
          let flashClass = '';
          if (isHighlighted) {
            if (highlightType === 'reserved') {
              flashClass = 'border-amber-500/50 bg-amber-950/20 scale-[1.01] shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-double-pulse';
            } else {
              // queried
              flashClass = 'border-indigo-500/50 bg-indigo-950/20 scale-[1.01] shadow-[0_0_15px_rgba(99,102,241,0.25)] animate-double-pulse';
            }
          }

          return (
            <div
              key={item.name}
              className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                flashClass || 'bg-slate-900/40 border-slate-800/40 text-slate-300 hover:border-slate-800 hover:bg-slate-900/60'
              }`}
            >
              {/* Left Details */}
              <div className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-100">{item.name}</span>
                  {item.needsPrescription ? (
                    <span className="text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/40 flex items-center gap-1">
                      Rx Required
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                      OTC
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {item.location}
                  </span>
                </div>
              </div>

              {/* Right Stock Status */}
              <div className="flex flex-col items-end gap-1">
                <span className={`text-sm font-bold ${
                  isOutOfStock ? 'text-rose-500' :
                  isLowStock ? 'text-amber-500' :
                  'text-slate-100'
                }`}>
                  {item.quantity} units
                </span>
                
                {isOutOfStock ? (
                  <span className="text-[10px] text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Out of stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Low stock
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Adequate
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
