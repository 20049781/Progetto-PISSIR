import { useState, useEffect } from 'react';

const GameAdminDashboard = () => {
  const [settings, setSettings] = useState({
    initialBalance: 1500,
    maxPlayers: 4,
    sensorModeActive: true
  });
  const [readingZones, setReadingZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    // Carica le impostazioni del gioco
    const loadSettings = fetch('/api/game-settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Errore caricamento regole gioco:", err));

    // Carica le zone di lettura sensori
    const loadZones = fetch('/api/reading-zones')
      .then(res => res.json())
      .then(data => setReadingZones(data))
      .catch(err => console.error("Errore caricamento sensori:", err));

    Promise.all([loadSettings, loadZones]).finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSuccess('');

    fetch('/api/game-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
      .then(res => {
        if (!res.ok) throw new Error("Impossibile salvare le regole.");
        return res.json();
      })
      .then(data => {
        setSettings(data);
        setSettingsSuccess("Regole di gioco aggiornate con successo!");
        setTimeout(() => setSettingsSuccess(''), 3000);
      })
      .catch(err => {
        setSettingsError(err.message || "Errore durante il salvataggio.");
      })
      .finally(() => setSettingsSaving(false));
  };

  if (loading) {
    return <div className="p-12 text-center text-on-surface-variant font-medium">Caricamento configurazioni sensori e regole...</div>;
  }

  // Filtra per mostrare SOLO i sensori del gioco (tabellone base, gameTableId = 1)
  // per evitare che lo stesso sensore venga visualizzato ripetutamente per ogni tavolo fisico
  const gameSensors = readingZones.filter(z => z.gameTableId === 1);

  return (
    <div className="p-8 lg:p-12 space-y-10 font-['Manrope'] antialiased">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-primary">Gestione Regole e Sensori del Gioco</h2>
          <p className="text-on-surface-variant mt-2">
            Definisci i parametri finanziari del Monopoly e configura i sensori RFID necessari sul tabellone per abilitare le funzionalità di gioco.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Sensori Configurati</span>
              <p className="text-3xl font-extrabold text-[#6f1a07] mt-1">{gameSensors.length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Requisito Minimo</span>
              <p className="text-3xl font-extrabold text-[#57423d] mt-1">8 Sensori</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Stato Tabellone</span>
              <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-tight uppercase ${
                gameSensors.length >= 8 
                  ? 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {gameSensors.length >= 8 ? 'PRONTO AL GIOCO' : 'INCOMPLETO'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-[#6f1a07]">Mappatura Sensori del Gioco</h4>
              <p className="text-xs text-on-surface-variant mt-1">Configura i tag RFID necessari sul tabellone per rilevare gli spostamenti e le transazioni dei giocatori.</p>
            </div>
          </div>

          <div className="overflow-x-auto bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-low text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Codice Sensore</th>
                  <th className="py-4 px-6">Nome Zona Tabellone</th>
                  <th className="py-4 px-6">Tipologia</th>
                  <th className="py-4 px-6">Slot Giocatore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {gameSensors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 px-6 text-center text-on-surface-variant opacity-60">
                      Nessun sensore registrato nel sistema. I sensori devono essere inseriti programmaticamente nel database dal programmatore della piattaforma.
                    </td>
                  </tr>
                ) : (
                  gameSensors.map((sensor) => (
                    <tr key={sensor.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-primary">{sensor.zoneCode}</td>
                      <td className="py-4 px-6 font-semibold">{sensor.zoneName}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                          sensor.zoneType === 'PLAYER_PROPERTY' 
                            ? 'bg-primary-container text-[#6f1a07] border border-primary-container'
                            : 'bg-surface-container-high text-on-surface-variant border'
                        }`}>
                          {sensor.zoneType}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-secondary">
                        {sensor.playerSlot !== null && sensor.playerSlot !== undefined ? `P${sensor.playerSlot}` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-[#6f1a07]">Regole del Gioco</h4>
            <span className="material-symbols-outlined text-secondary">tune</span>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm space-y-6">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Configura i parametri iniziali che verranno applicati automaticamente a tutte le nuove partite create ed iscritte sulla piattaforma.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Capitale Iniziale del Giocatore (₮)
              </label>
              <input
                type="number"
                value={settings.initialBalance}
                onChange={(e) => setSettings(prev => ({ ...prev, initialBalance: parseInt(e.target.value) }))}
                className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all font-semibold"
                placeholder="1500"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Numero Massimo Giocatori
              </label>
              <select
                value={settings.maxPlayers}
                onChange={(e) => setSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all font-semibold"
              >
                <option value={2}>2 Giocatori</option>
                <option value={3}>3 Giocatori</option>
                <option value={4}>4 Giocatori</option>
                <option value={5}>5 Giocatori</option>
                <option value={6}>6 Giocatori</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-outline-variant/5">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Modalità Sensori Attiva</span>
                <span className="text-[10px] text-on-surface-variant">Abilita la ricezione automatica RFID dei tavoli Live</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sensorModeActive}
                  onChange={(e) => setSettings(prev => ({ ...prev, sensorModeActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6f1a07]"></div>
              </label>
            </div>

            {settingsError && (
              <p className="text-xs text-error font-semibold">{settingsError}</p>
            )}
            {settingsSuccess && (
              <p className="text-xs text-[#2e7d32] font-semibold">{settingsSuccess}</p>
            )}

            <button
              type="submit"
              disabled={settingsSaving}
              className="w-full py-3.5 bg-[#6f1a07] text-white font-bold rounded-xl text-sm hover:bg-[#571405] transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{settingsSaving ? "Salvataggio..." : "Salva Regole"}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default GameAdminDashboard;
