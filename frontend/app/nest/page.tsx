"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Phone, MessageCircle, X, UserPlus, Clock } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BloomieChat } from "@/components/shared/bloomie-chat";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";
import { getBloomieUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import type { NestContact, FamilyView } from "@/lib/types";

function NestPage() {
  const user = getBloomieUser();
  const [contacts, setContacts] = useState<NestContact[]>([]);
  const [familyView, setFamilyView] = useState<FamilyView | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", relation: "", emoji: "❤️", phone: "", contact_frequency_days: 7 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsData, familyData] = await Promise.all([
          api.getNestContacts(),
          api.getFamilyView(),
        ]);
        if (contactsData) setContacts(contactsData as NestContact[]);
        if (familyData) setFamilyView(familyData as FamilyView);
      } catch {
        // Use demo data
        setContacts([
          { id: "1", user_id: "demo", name: "Mom", relation: "Mother", emoji: "❤️", phone: "+1-555-0123", email: null, last_contact_at: null, contact_frequency_days: 3, created_at: null },
          { id: "2", user_id: "demo", name: "Best Friend", relation: "Friend", emoji: "💜", phone: "+1-555-0456", email: null, last_contact_at: null, contact_frequency_days: 7, created_at: null },
          { id: "3", user_id: "demo", name: "Dad", relation: "Father", emoji: "💛", phone: "+1-555-0789", email: null, last_contact_at: null, contact_frequency_days: 5, created_at: null },
        ]);
      }
    };
    fetchData();
  }, []);

  const handleCheckIn = useCallback(async (contactId: string) => {
    try {
      await api.checkInContact(contactId);
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, last_contact_at: new Date().toISOString() } : c))
      );
    } catch {
      // Optimistic update
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, last_contact_at: new Date().toISOString() } : c))
      );
    }
  }, []);

  const handleAddContact = async () => {
    if (!addForm.name || !addForm.relation) return;
    try {
      const result = await api.addNestContact(addForm);
      setContacts((prev) => [result as NestContact, ...prev]);
    } catch {
      // Optimistic add
      const fakeContact: NestContact = {
        id: Date.now().toString(),
        user_id: "demo",
        ...addForm,
        email: null,
        last_contact_at: null,
        created_at: new Date().toISOString(),
      };
      setContacts((prev) => [fakeContact, ...prev]);
    }
    setShowAddModal(false);
    setAddForm({ name: "", relation: "", emoji: "❤️", phone: "", contact_frequency_days: 7 });
  };

  const needsCheckIn = (contact: NestContact): boolean => {
    if (!contact.last_contact_at) return true;
    const daysSince = (Date.now() - new Date(contact.last_contact_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= contact.contact_frequency_days;
  };

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-bloom-peach/20 to-bloom-cream px-6 pt-12 pb-8">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Your Nest 🪺</h1>
          <p className="text-sm text-bloom-deep/60 mt-1">People you love &amp; who love you</p>
        </BlurFade>
      </div>

      <div className="px-5 space-y-6 max-w-lg mx-auto">
        {/* Bloomie suggestion */}
        {contacts.some(needsCheckIn) && (
          <BlurFade delay={0.15}>
            <motion.div
              className="card-bloom p-4 bg-gradient-to-br from-white to-bloom-peach/10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">🐦</span>
                <div>
                  <p className="text-sm font-medium text-bloom-deep">
                    &ldquo;You haven&apos;t checked in with{" "}
                    <span className="font-bold">{contacts.find(needsCheckIn)?.name}</span> recently.&rdquo;
                  </p>
                  <button
                    onClick={() => {
                      const c = contacts.find(needsCheckIn);
                      if (c) handleCheckIn(c.id);
                    }}
                    className="mt-2 px-3 py-1.5 rounded-full bg-bloom-peach/30 text-xs font-semibold text-bloom-deep hover:bg-bloom-peach/50 transition-colors"
                  >
                    Send a hello 💌
                  </button>
                </div>
              </div>
            </motion.div>
          </BlurFade>
        )}

        {/* Contacts */}
        <BlurFade delay={0.2}>
          <div className="card-bloom p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">Your People</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 rounded-full bg-bloom-sage/10 hover:bg-bloom-sage/20 transition-colors"
              >
                <Plus size={16} className="text-bloom-forest" />
              </button>
            </div>

            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${needsCheckIn(contact) ? "bg-bloom-peach/10 border border-bloom-peach/20" : "bg-bloom-cream/30"}`}
                >
                  <span className="text-2xl">{contact.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-bloom-deep">{contact.name}</p>
                    <p className="text-[10px] text-bloom-deep/50">{contact.relation}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-bloom-deep/30" />
                      <span className="text-[10px] text-bloom-deep/40">
                        {contact.last_contact_at ? timeAgo(contact.last_contact_at) : "Never checked in"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-2 rounded-full bg-bloom-sage/10 hover:bg-bloom-sage/20 transition-colors"
                      >
                        <Phone size={14} className="text-bloom-forest" />
                      </a>
                    )}
                    <button
                      onClick={() => handleCheckIn(contact.id)}
                      className="p-2 rounded-full bg-bloom-peach/20 hover:bg-bloom-peach/30 transition-colors"
                      title="Mark as checked in"
                    >
                      <MessageCircle size={14} className="text-bloom-rose" />
                    </button>
                  </div>
                </div>
              ))}

              {contacts.length === 0 && (
                <div className="text-center py-8">
                  <span className="text-3xl mb-2 block">🪺</span>
                  <p className="text-sm text-bloom-deep/50">Your nest is empty. Add people you care about!</p>
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Family Dashboard View */}
        {familyView && (
          <BlurFade delay={0.3}>
            <div className="card-bloom p-5">
              <h2 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-3">Family View</h2>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                familyView.status === "green" ? "status-green" :
                familyView.status === "yellow" ? "status-yellow" : "status-red"
              }`}>
                <span className="text-2xl">
                  {familyView.status === "green" ? "🟢" : familyView.status === "yellow" ? "🟡" : "🔴"}
                </span>
                <div>
                  <p className="text-sm font-bold">
                    {familyView.status === "green" ? "Doing well" : familyView.status === "yellow" ? "Check in" : "Needs attention"}
                  </p>
                  <p className="text-xs opacity-80">{familyView.summary}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {Object.entries(familyView.categories).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-xs bg-bloom-cream/50 px-3 py-2 rounded-lg">
                    <span className="capitalize font-semibold text-bloom-deep">{key}</span>
                    <span className={`capitalize ${value === "normal" || value === "good" || value === "completed" ? "text-bloom-sage" : "text-bloom-rose"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BlurFade>
        )}
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="card-bloom p-6 max-w-sm w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-bloom-deep flex items-center gap-2">
                  <UserPlus size={16} className="text-bloom-sage" /> Add to Nest
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-bloom-sage/10">
                  <X size={16} className="text-bloom-deep/40" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={addForm.name}
                  onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-bloom-sage/20 bg-bloom-cream/30 text-sm outline-none focus:border-bloom-sage/40"
                />
                <input
                  type="text"
                  placeholder="Relation (Mom, Friend, etc.)"
                  value={addForm.relation}
                  onChange={(e) => setAddForm((p) => ({ ...p, relation: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-bloom-sage/20 bg-bloom-cream/30 text-sm outline-none focus:border-bloom-sage/40"
                />
                <div className="flex gap-2">
                  {["❤️", "💛", "💜", "💗", "💚", "🧡"].map((e) => (
                    <button
                      key={e}
                      onClick={() => setAddForm((p) => ({ ...p, emoji: e }))}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${addForm.emoji === e ? "bg-bloom-sage/20 scale-110" : "hover:bg-bloom-cream/50"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-bloom-sage/20 bg-bloom-cream/30 text-sm outline-none focus:border-bloom-sage/40"
                />
                <button
                  onClick={handleAddContact}
                  disabled={!addForm.name || !addForm.relation}
                  className="w-full py-2.5 rounded-xl bg-bloom-forest text-white font-semibold text-sm disabled:opacity-40 hover:bg-bloom-deep transition-colors"
                >
                  Add to Nest 🪺
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BloomieChat />
      <BottomNav />
    </main>
  );
}

export default NestPage;
