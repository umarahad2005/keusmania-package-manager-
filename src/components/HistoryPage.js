import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, where } from 'firebase/firestore';
import { runFirestoreDiagnostic } from '../services/FirestoreDiagnostics';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

const HistoryPage = () => {
  const [rows, setRows] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ client:'', packageType:'', from:'', to:'' });
  const [exhausted, setExhausted] = useState(false);

  const load = async (append=false) => {
    setLoading(true);
    try {
      let qRef = collection(db, 'invoices');
      const clauses = [];
      if (filters.client) clauses.push(where('clientName', '>=', filters.client), where('clientName', '<=', filters.client + '\uf8ff'));
      if (filters.packageType) clauses.push(where('packageType', '==', filters.packageType));
      // Date filtering using invoiceDate (string) fallback to createdAt timestamp
      if (filters.from) clauses.push(where('invoiceDate', '>=', filters.from));
      if (filters.to) clauses.push(where('invoiceDate', '<=', filters.to));
      if (clauses.length) {
        // Firestore requires orderBy for range queries on same field. We'll primarily rely on invoiceDate ordering.
      }
      let q = query(qRef, orderBy('invoiceDate', 'desc'), limit(PAGE_SIZE));
      if (lastDoc && append) q = query(qRef, orderBy('invoiceDate', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLastDoc(snap.docs[snap.docs.length -1]);
      setExhausted(list.length < PAGE_SIZE);
      setRows(prev => append ? [...prev, ...list] : list);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(()=>{ load(false); // eslint-disable-next-line
  }, []);

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters(f => ({...f, [name]: value }));
  };

  const applyFilters = () => { setLastDoc(null); load(false); };

  const exportAll = () => {
    const sheetRows = rows.map(r => ({
      Invoice: r.invoiceNumber,
      Date: r.invoiceDate,
      Client: r.clientName,
      Pax: r.perPaxCount || r.paxCount,
      Package: r.packageType,
      From: r.fromDate,
      To: r.toDate,
      PerPaxPKR: r.perPaxPkr,
      Airline: r.airlineName,
      AirlinePerPax: r.airlinePerPaxPkr,
      Created: r.createdAt? (r.createdAt.seconds? format(new Date(r.createdAt.seconds*1000), 'yyyy-MM-dd HH:mm') : '') : ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    wb.SheetNames.push('History');
    wb.Sheets['History'] = ws;
    XLSX.writeFile(wb, 'cloud_invoices.xlsx');
  };

  const runDiag = async () => {
    setLoading(true);
    const result = await runFirestoreDiagnostic();
    setLoading(false);
    if (!result.ok) {
      alert(`Firestore ERROR: ${result.message}\n${result.error || ''}`);
    } else {
      alert(`Firestore OK: ${result.message}\nDoc ID: ${result.id}\nRound Trip: ${result.roundTripMs}ms`);
    }
  };

  return (
    <div className="history-page">
      <h2>Invoice History</h2>
      <div className="filters" style={{display:'flex', flexWrap:'wrap', gap:'12px', marginBottom:'16px'}}>
        <input name="client" value={filters.client} onChange={handleFilter} placeholder="Client Name" />
        <select name="packageType" value={filters.packageType} onChange={handleFilter}>
          <option value="">All Packages</option>
          <option value="Double Bed">Double Bed</option>
          <option value="Triple Bed">Triple Bed</option>
          <option value="Quad Bed">Quad Bed</option>
          <option value="Suite">Suite</option>
        </select>
        <input type="date" name="from" value={filters.from} onChange={handleFilter} />
        <input type="date" name="to" value={filters.to} onChange={handleFilter} />
        <button onClick={applyFilters}>Apply</button>
        <button onClick={exportAll} disabled={!rows.length}>Download Visible</button>
        <button onClick={runDiag}>Test Firestore</button>
      </div>
      <div className="table-wrapper" style={{overflowX:'auto'}}>
        <table className="history-table" style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Client</th>
              <th>Pax</th>
              <th>Package</th>
              <th>Per Pax PKR</th>
              <th>Airline</th>
              <th>Airline / Pax</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.invoiceNumber}</td>
                <td>{r.invoiceDate}</td>
                <td>{r.clientName}</td>
                <td>{r.perPaxCount || r.paxCount}</td>
                <td>{r.packageType}</td>
                <td>{r.perPaxPkr}</td>
                <td>{r.airlineName}</td>
                <td>{r.airlinePerPaxPkr}</td>
                <td>{r.createdAt? (r.createdAt.seconds? format(new Date(r.createdAt.seconds*1000), 'MM-dd HH:mm') : '') : ''}</td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr><td colSpan={9} style={{textAlign:'center', padding:'30px'}}>No records</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:'18px', display:'flex', gap:'12px'}}>
        <button onClick={()=> load(true)} disabled={loading || exhausted}>{exhausted? 'No More' : loading? 'Loading...' : 'Load More'}</button>
        <button onClick={exportAll} disabled={!rows.length}>Download Visible</button>
      </div>
    </div>
  );
};

export default HistoryPage;
