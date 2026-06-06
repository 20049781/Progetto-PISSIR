import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);

    try {
      const newUser = {
        username: formData.username,
        email: formData.email,
        passwordHash: formData.password,
        status: 'ACTIVE',
        fullName: formData.fullName,
        active: true
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        throw new Error('Errore durante la registrazione. Username o email potrebbero essere già in uso.');
      }

      setSuccess('Registrazione completata con successo! Reindirizzamento al login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-0 overflow-hidden bg-surface-container-low rounded-xl shadow-[0px_12px_32px_rgba(43,33,24,0.06)]">
        
        <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-primary-container text-on-primary">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg fill="none" height="100%" viewBox="0 0 400 400" width="100%" xmlns="http://www.w3.org/2000/svg">
              <rect height="300" stroke="currentColor" strokeWidth="2" width="300" x="50" y="50"></rect>
              <path d="M50 150H350M50 250H350M150 50V350M250 50V350" stroke="currentColor" strokeWidth="1"></path>
              <circle cx="200" cy="200" r="40" stroke="currentColor" strokeWidth="1"></circle>
              <path d="M200 200L280 280M120 120L200 200M280 120L200 200M200 200L120 280" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1"></path>
              <rect fill="currentColor" height="10" width="10" x="195" y="195"></rect>
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-4xl text-inverse-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              <h1 className="text-headline text-2xl font-extrabold tracking-tighter uppercase">MONOPOLY</h1>
            </div>
            <h2 className="text-headline text-5xl font-extrabold tracking-tighter leading-tight mb-6">
              Inizia la tua avventura
            </h2>
            <p className="text-lg opacity-80 font-light max-w-md">
              Crea un account per partecipare ai tornei, scalare la classifica globale e gestire il tuo portafoglio di proprietà nel nostro ecosistema Monopoly Live.
            </p>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-3xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            <span className="text-headline text-xl font-bold tracking-tighter">MONOPOLY</span>
          </div>
          
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-headline text-3xl font-bold text-on-surface mb-2">Registrazione</h2>
              <p className="text-on-surface-variant text-sm">Crea un nuovo profilo giocatore.</p>
            </div>

            {error && <div className="p-4 mb-4 text-sm font-medium text-error bg-error-container rounded-lg">{error}</div>}
            {success && <div className="p-4 mb-4 text-sm font-medium text-primary bg-primary-container rounded-lg">{success}</div>}
            
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="fullName">Nome Completo</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">badge</span>
                  <input className="w-full bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary-container focus:ring-0 rounded-none px-12 py-3 text-on-surface transition-all placeholder:text-outline/50 text-sm" id="fullName" name="fullName" placeholder="Mario Rossi" required type="text" value={formData.fullName} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="username">Username</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">person</span>
                    <input className="w-full bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary-container focus:ring-0 rounded-none pl-10 pr-3 py-3 text-on-surface transition-all placeholder:text-outline/50 text-sm" id="username" name="username" placeholder="mario99" required type="text" value={formData.username} onChange={handleChange} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                    <input className="w-full bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary-container focus:ring-0 rounded-none pl-10 pr-3 py-3 text-on-surface transition-all placeholder:text-outline/50 text-sm" id="email" name="email" placeholder="nome@email.it" required type="email" value={formData.email} onChange={handleChange} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="password">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                  <input 
                    className="w-full bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary-container focus:ring-0 rounded-none pl-12 pr-12 py-3 text-on-surface transition-all placeholder:text-outline/50 text-sm" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••••••" 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={handleChange} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-lg transition-colors flex items-center justify-center"
                    title={showPassword ? "Nascondi password" : "Mostra password"}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="confirmPassword">Conferma Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">lock_reset</span>
                  <input 
                    className="w-full bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary-container focus:ring-0 rounded-none pl-12 pr-12 py-3 text-on-surface transition-all placeholder:text-outline/50 text-sm" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    placeholder="••••••••••••" 
                    required 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-lg transition-colors flex items-center justify-center"
                    title={showConfirmPassword ? "Nascondi password" : "Mostra password"}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              
              <button disabled={loading} className="w-full bg-primary-container text-on-primary py-3.5 rounded-xl font-bold text-headline tracking-tight hover:bg-primary transition-all shadow-[0px_4px_12px_rgba(111,26,7,0.2)] active:scale-[0.98] mt-2 disabled:opacity-70" type="submit">
                {loading ? 'Registrazione in corso...' : 'Registrati'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-on-surface-variant">
                Hai già un account? 
                <Link to="/login" className="font-bold text-primary hover:underline ml-1">Accedi ora</Link>
              </p>
            </div>
          </div>
          
          <div className="mt-auto pt-6 flex justify-center gap-6 text-[10px] uppercase tracking-widest text-outline">
            <a className="hover:text-on-surface transition-colors" href="#">Privacy</a>
            <a className="hover:text-on-surface transition-colors" href="#">Termini</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
