import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-datepicker/dist/react-datepicker.css';

const DatePicker = dynamic(() => import('react-datepicker'), { ssr: false });

export default function Dashboard() {
  const [start, setStart] = useState(new Date(new Date().setDate(1)));
  const [end,   setEnd]   = useState(new Date());
  const [lang,  setLang]  = useState('All');
  const [plan,  setPlan]  = useState('All');
  const [data,  setData]  = useState({});

  useEffect(() => {
    async function fetchData() {
      const qs = new URLSearchParams({
        start: start.toISOString(),
        end:   end.toISOString(),
        language: lang,
        plan:     plan,
      });
      const res = await fetch(`/api/orders?${qs}`);
      const json = await res.json();
      setData(json);
    }
    fetchData();
  }, [start, end, lang, plan]);

  const languages = ['All','Tamil','Telugu','Hindi']; // adjust as needed
  const plans     = ['All','Basic','Standard','Premium','Beast'];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>SongCart Orders</h1>
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem' }}>
        <label>
          From:<br/>
          <DatePicker selected={start} onChange={d=>setStart(d)} />
        </label>
        <label>
          To:<br/>
          <DatePicker selected={end} onChange={d=>setEnd(d)} />
        </label>
        <label>
          Language:<br/>
          <select value={lang} onChange={e=>setLang(e.target.value)}>
            {languages.map(l=> <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label>
          Plan:<br/>
          <select value={plan} onChange={e=>setPlan(e.target.value)}>
            {plans.map(p=> <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Language</th>
            {plans.filter(p=>p!=='All').map(p=> <th key={p}>{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([language, plansObj]) => (
            <tr key={language}>
              <td>{language}</td>
              {plans.filter(p=>p!=='All').map(p=> (
                <td key={p}>{plansObj[p]||0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
