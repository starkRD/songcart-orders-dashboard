import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// datepicker only on client
const DatePicker = dynamic(() => import('react-datepicker'), { ssr: false });
import 'react-datepicker/dist/react-datepicker.css';

export default function Home() {
  const [start, setStart]       = useState(new Date(new Date().setDate(1)));
  const [end,   setEnd]         = useState(new Date());
  const [language, setLanguage] = useState('All');
  const [plan,     setPlan]     = useState('All');
  const [data,    setData]      = useState({});

  // seed your dropdowns here
  const languages = ['All','Tamil','Telugu','Hindi'];
  const plans     = ['All','Basic','Standard','Premium','Beast'];

  // fetch whenever filters change
  useEffect(() => {
    async function fetchData() {
      const qs = new URLSearchParams({
        start: start.toISOString(),
        end:   end.toISOString(),
        language,
        plan,
      });
      const res  = await fetch(`/api/orders?${qs}`);
      const json = await res.json();
      setData(json);
    }
    fetchData();
  }, [start, end, language, plan]);

  return (
    <div className="container">
      <Head><title>SongCart Orders Dashboard</title></Head>
      <h1>SongCart Orders Dashboard</h1>

      <div className="filters">
        <div className="filter">
          <label>Start</label>
          <DatePicker 
            selected={start} 
            onChange={setStart} 
            showTimeSelect 
            dateFormat="yyyy-MM-dd HH:mm" 
          />
        </div>
        <div className="filter">
          <label>End</label>
          <DatePicker 
            selected={end} 
            onChange={setEnd} 
            showTimeSelect 
            dateFormat="yyyy-MM-dd HH:mm" 
          />
        </div>
        <div className="filter">
          <label>Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="filter">
          <label>Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)}>
            {plans.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Language</th>
            {plans.filter(p => p !== 'All').map(p => (
              <th key={p}>{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([langKey, planCounts]) => (
            <tr key={langKey}>
              <td>{langKey}</td>
              {plans.filter(p => p !== 'All').map(p => (
                <td key={p}>{planCounts[p] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
