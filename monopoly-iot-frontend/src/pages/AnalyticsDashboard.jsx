import { useState, useEffect } from 'react';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/dashboard')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-on-surface-variant">Caricamento logiche globali in corso...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-primary font-headline tracking-tight">Prestazioni del Sistema</h2>
          <p className="text-on-surface-variant mt-1">Analisi olistica dell'ecosistema connesso a luglio 2024.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(43,33,24,0.03)] border border-outline-variant/10 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary-fixed rounded-xl group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-on-secondary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
            </div>
            <span className="text-xs font-bold bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20 px-2 py-1 rounded-lg">+12.4%</span>
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">Partite Totali</p>
          <p className="text-3xl font-black text-on-surface font-headline">{data.totalMatches}</p>
          <div className="mt-4 h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-secondary-container w-3/4"></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(43,33,24,0.03)] border border-outline-variant/10 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary-fixed rounded-xl group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-on-primary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>location_city</span>
            </div>
            <span className="text-xs font-bold bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20 px-2 py-1 rounded-lg">+4.1%</span>
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">Sedi Attive</p>
          <p className="text-3xl font-black text-on-surface font-headline">{data.activeVenues}</p>
          <div className="mt-4 h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-primary-container" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(43,33,24,0.03)] border border-outline-variant/10 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-tertiary-fixed rounded-xl group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
            <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-1 rounded-lg">Crescita Elevata</span>
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">Crescita della Piattaforma</p>
          <p className="text-3xl font-black text-on-surface font-headline">{data.platformGrowth}%</p>
          <div className="mt-4 h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-tertiary w-1/2"></div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(43,33,24,0.03)] border border-outline-variant/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-primary font-headline">Sedi più Attive</h3>
          </div>
          <div className="space-y-6">
            {data.mostActiveVenues.map((v, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface">{v.name}</span>
                  <span className="text-on-surface-variant">{v.activityScore} Punteggio Attività</span>
                </div>
                <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${v.activityScore}%`, opacity: 1 - (i * 0.2) }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container p-8 rounded-xl shadow-[0px_12px_32px_rgba(43,33,24,0.03)] border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-primary font-headline mb-4">Analisi Durata</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-on-surface">{data.avgMatchDuration}</span>
              <span className="text-xs font-bold text-on-surface-variant">/ Partita Media</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">La durata delle sessioni a livello di sistema si è stabilizzata, mostrando un aumento del 12% nella fidelizzazione degli utenti per ciclo.</p>
          </div>
          <div className="mt-8 pt-8 border-t border-outline-variant/20">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Proprietà Top</h4>
            <ul className="space-y-3">
              {data.topProperties.map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center border border-outline-variant/10 text-primary font-black text-xs">0{i+1}</div>
                  <span className="text-xs font-medium text-on-surface">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <footer className="pt-12 pb-8 border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Sensori Globali Operativi: 99,98% di Uptime</span>
          </div>
          <div className="flex gap-6">
            <a className="text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest" href="#">Informativa sulla Privacy</a>
            <a className="text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest" href="#">Documentazione di Sistema</a>
            <a className="text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest" href="#">Portale di Supporto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsDashboard;
