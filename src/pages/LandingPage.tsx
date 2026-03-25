import Header from '../components/Header';
import Hero from '../components/Hero';
import SocialProof from '../components/SocialProof';
import Features from '../components/Features';
import Testimonial from '../components/Testimonial';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const RecentActivity = () => {
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiFetch('/api/blocks');
        if (response.ok) {
          setRecent(response.data?.blocks || []);
        }
      } catch (e) {
        console.warn('recent activity error', e);
      }
    })();
  }, []);

  if (!recent || recent.length === 0) return null;

  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {recent.map((row, idx) => {
            const s = typeof row.data === 'string' ? JSON.parse(row.data || '{}').public_summary || {} : row.data?.public_summary || {};
            return (
              <div key={idx} className="p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-sm text-slate-500 mb-1">{s.kind || 'activity'}</div>
                <div className="font-semibold">{s.crypto || s.kind || '—'}</div>
                {s.amountFiat !== undefined && (
                  <div className="text-sm text-slate-700 mt-2">{s.amountFiat} {s.fiatCurrency || ''}</div>
                )}
                <div className="text-xs text-slate-400 mt-3">{s.timestamp ? new Date(s.timestamp).toLocaleString() : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import { apiFetch } from '../lib/api';

const LandingPage = () => {
  return (
    <div className="bg-white text-slate-800 antialiased">
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Testimonial />
        <CallToAction />
        <RecentActivity />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
