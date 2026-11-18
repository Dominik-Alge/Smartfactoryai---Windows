import React, { useState, useEffect, useMemo } from 'react';
import Matrix from './Matrix';

// Vordefinierte Rollen-Ansichten
const ROLE_PRESETS = {
  pl: {
    label: 'Produktionsleiter',
    showCockpit: true,
    autoRotate: true
  },
  qs: {
    label: 'QS / Qualität',
    showCockpit: true,
    autoRotate: false
  },
  insel: {
    label: 'Fertigungsinsel (Team)',
    showCockpit: false,
    autoRotate: true
  }
};

export default function CockpitView({
  apiUrl,
  panels,
  onCellClick,
  onAddMachine,
  onAddCriterion,
  onDeleteMachine,
  onDeleteCriterion,
  onCloseView
}) {
  // Auswahl der Gruppen (alle echten Gruppen außer insel_ds)
  const availableGroups = useMemo(
    () => panels.filter((p) => p.id !== 'insel_ds'),
    [panels]
  );

  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [activeRole, setActiveRole] = useState('pl');
  const [showCockpit, setShowCockpit] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateIntervalSec] = useState(15);

  // Aktueller Slide-Index: 0 = Cockpit (falls aktiv), 1..N = gewählte Gruppen-Boards
  const [slideIndex, setSlideIndex] = useState(0);

  // Geladene Daten
  const [panelsMap, setPanelsMap] = useState({});
  const [tickets, setTickets] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Interaktives Popup für geklicktes Datum
  const [selectedDayModal, setSelectedDayModal] = useState(null);

  // Initial alle Gruppen auswählen
  useEffect(() => {
    if (availableGroups.length > 0 && selectedGroupIds.length === 0) {
      setSelectedGroupIds(availableGroups.map((g) => g.id));
    }
  }, [availableGroups]);

  // Live-Uhr für Header
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Daten aller gewählten Panels + Tickets laden (und alle 20 Sek. refreshen)
  const loadCockpitData = async () => {
    if (selectedGroupIds.length === 0) return;
    try {
      const panelPromises = selectedGroupIds.map((id) =>
        fetch(`${apiUrl}/api/panel/${id}`).then((r) => (r.ok ? r.json() : null))
      );
      const ticketsPromise = fetch(`${apiUrl}/api/tickets`).then((r) =>
        r.ok ? r.json() : []
      );

      const [loadedPanels, loadedTickets] = await Promise.all([
        Promise.all(panelPromises),
        ticketsPromise
      ]);

      const map = {};
      selectedGroupIds.forEach((id, idx) => {
        if (loadedPanels[idx]) map[id] = loadedPanels[idx];
      });
      setPanelsMap(map);
      setTickets(loadedTickets);
    } catch (err) {
      console.error('Fehler beim Laden der Cockpit-Daten:', err);
    }
  };

  useEffect(() => {
    loadCockpitData();
    const refresh = setInterval(loadCockpitData, 20000);
    return () => clearInterval(refresh);
  }, [selectedGroupIds, apiUrl]);

  // Slides zusammenstellen (Cockpit + Einzel-Boards)
  const slides = useMemo(() => {
    const list = [];
    if (showCockpit) list.push({ type: 'cockpit', id: 'cockpit', label: 'Gesamt-Cockpit' });
    selectedGroupIds.forEach((id) => {
      const p = panelsMap[id];
      if (p) list.push({ type: 'board', id, label: p.name || id });
    });
    return list.length > 0 ? list : [{ type: 'cockpit', id: 'cockpit', label: 'Gesamt-Cockpit' }];
  }, [showCockpit, selectedGroupIds, panelsMap]);

  // Auto-Rotation Timer
  useEffect(() => {
    if (!autoRotate || slides.length <= 1) return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, rotateIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoRotate, slides.length, rotateIntervalSec]);

  // Slide-Index absichern bei Änderung
  useEffect(() => {
    if (slideIndex >= slides.length) setSlideIndex(0);
  }, [slides.length, slideIndex]);

  // Rollen-Wechsel anwenden
  const applyRolePreset = (roleKey) => {
    const preset = ROLE_PRESETS[roleKey];
    setActiveRole(roleKey);
    setShowCockpit(preset.showCockpit);
    setAutoRotate(preset.autoRotate);
    setSlideIndex(0);
  };

  const toggleGroup = (id) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  };

  // --- DATEN-AGGREGATION FÜR DAS COCKPIT ---

  // 1. Alle aktuellen roten Alarme aus den gewählten Gruppen
  const activeAlarms = useMemo(() => {
    const alarms = [];
    selectedGroupIds.forEach((panelId) => {
      const panel = panelsMap[panelId];
      if (!panel?.cells) return;
      Object.entries(panel.cells).forEach(([cellKey, cellVal]) => {
        if (cellVal?.status === 'red') {
          const [machineId, criterion] = cellKey.split('-');
          const latestNote = cellVal.notes?.[cellVal.notes.length - 1];
          alarms.push({
            panelId,
            panelName: panel.name || panelId,
            machineId,
            criterion,
            latestNote
          });
        }
      });
    });
    return alarms;
  }, [selectedGroupIds, panelsMap]);

  // 2. Relevante Tickets für die gewählten Gruppen
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (t.panelId && selectedGroupIds.includes(t.panelId)) return true;
      return selectedGroupIds.some((pid) => panelsMap[pid]?.machines?.includes(t.machineId));
    });
  }, [tickets, selectedGroupIds, panelsMap]);

  // 3. Monats-Tage (1 bis 31) für die Kachel-Auswertung
  const currentMonthDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = now.getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTickets = filteredTickets.filter((t) => t.createdAt?.startsWith(dateStr));
      return {
        day,
        dateStr,
        isFuture: day > todayDate,
        tickets: dayTickets
      };
    });
  }, [filteredTickets]);

  // 4. Dynamische Auswertung nach Kriterium
  const criteriaStats = useMemo(() => {
    const counts = {};
    activeAlarms.forEach((a) => {
      counts[a.criterion] = (counts[a.criterion] || 0) + 1;
    });
    filteredTickets.forEach((t) => {
      if (t.criterion) counts[t.criterion] = (counts[t.criterion] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [activeAlarms, filteredTickets]);

  const currentSlide = slides[slideIndex] || slides[0];

  const formatDateTime = (d) =>
    d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 p-4 font-sans select-none">
      {/* OBERE STEUERUNGS- & ROLLENLEISTE */}
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Rollen-Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
            Ansicht / Rolle:
          </span>
          {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyRolePreset(key)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeRole === key
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Gruppen-Auswahl */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
            Abteilungen:
          </span>
          {availableGroups.map((grp) => {
            const active = selectedGroupIds.includes(grp.id);
            return (
              <button
                key={grp.id}
                onClick={() => toggleGroup(grp.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                  active
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {active ? '✓ ' : '+ '}
                {grp.name}
              </button>
            );
          })}
        </div>

        {/* Rotation & Schließen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCockpit(!showCockpit)}
            className={`px-2.5 py-1 rounded text-xs font-bold border ${
              showCockpit
                ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            Cockpit {showCockpit ? 'AN' : 'AUS'}
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded text-xs font-bold border ${
              autoRotate
                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            {autoRotate ? `▶ Rotation (${rotateIntervalSec}s)` : '❚❚ Manuell'}
          </button>

                    <button
            onClick={onCloseView}
            className="ml-2 px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold"
          >
            ✕ Beenden
          </button>
        </div>
      </div>

      {/* HAUPT-HEADER */}
      <div className="flex flex-wrap items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-amber-400 tracking-tight">
            Shopfloor Übersicht
          </h1>
          {/* Slide-Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0f172a] p-1 rounded-lg border border-slate-700">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSlideIndex(idx)}
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  slideIndex === idx
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-mono font-bold text-amber-400">
          {formatDateTime(currentTime)}
        </div>
      </div>

      {/* ANSICHT 1: DAS 3-SPALTEN-COCKPIT */}
      {currentSlide?.type === 'cockpit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LINKE SPALTE (5/12) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Status-Zusammenfassung oben links */}
            <div className="bg-[#273549] border border-slate-600/60 rounded-xl p-4 shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 border-b border-slate-600 pb-1.5">
                Abteilungs-Status ({selectedGroupIds.length} Gruppen aktiv)
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400">Maschinen</div>
                  <div className="text-2xl font-black text-white mt-0.5">
                    {selectedGroupIds.reduce(
                      (sum, id) => sum + (panelsMap[id]?.machines?.length || 0),
                      0
                    )}
                  </div>
                </div>
                <div className="bg-[#1e293b] p-3 rounded-lg border border-emerald-500/40">
                  <div className="text-xs text-emerald-300">Systeme OK</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    {selectedGroupIds.reduce((sum, id) => {
                      const p = panelsMap[id];
                      if (!p) return sum;
                      const total = p.machines.length * p.criteria.length;
                      const reds = Object.values(p.cells || {}).filter(
                        (c) => c.status === 'red'
                      ).length;
                      return sum + Math.max(0, total - reds);
                    }, 0)}
                  </div>
                </div>
                <div className="bg-[#1e293b] p-3 rounded-lg border border-red-500/50">
                  <div className="text-xs text-red-300">Aktive Störungen</div>
                  <div className="text-2xl font-black text-red-400 mt-0.5">
                    {activeAlarms.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Übersicht der Produktionslinien */}
            <div className="bg-[#273549] border border-slate-600/60 rounded-xl p-4 shadow-md flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 border-b border-slate-600 pb-1.5">
                Übersicht der Produktionslinien (Klick für Details)
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {selectedGroupIds.map((panelId) => {
                  const panel = panelsMap[panelId];
                  if (!panel) return null;
                  return (
                    <div key={panelId} className="bg-[#1e293b] p-3 rounded-lg border border-slate-700">
                      <div className="text-sm font-bold text-amber-300 mb-2">{panel.name}</div>
                      <div className="space-y-1.5">
                        {panel.machines.map((machineId) => (
                          <div key={machineId} className="flex items-center gap-2">
                            <span className="w-16 text-xs font-mono font-bold text-slate-300 shrink-0">
                              {machineId}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {panel.criteria.map((crit) => {
                                const cell = panel.cells?.[`${machineId}-${crit}`];
                                const isRed = cell?.status === 'red';
                                return (
                                  <button
                                    key={crit}
                                    title={`${panel.name} | Maschine ${machineId} | ${crit}`}
                                    onClick={() => onCellClick(machineId, crit, panelId)}
                                    className={`w-5 h-5 rounded-sm transition-transform hover:scale-125 ${
                                      isRed
                                        ? 'bg-red-500 ring-2 ring-red-300 animate-pulse'
                                        : 'bg-emerald-400/90 hover:bg-emerald-300'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tages-Verlauf (Letzte 14 Tage klickbar) */}
            <div className="bg-[#273549] border border-slate-600/60 rounded-xl p-4 shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 border-b border-slate-600 pb-1.5">
                Tages-Verlauf (Klick auf Tag zeigt Vorfälle)
              </div>
              <div className="flex items-center justify-between gap-1 pt-1">
                {currentMonthDays
                  .filter((d) => !d.isFuture)
                  .slice(-14)
                  .map((dayObj) => {
                    const hasIssues = dayObj.tickets.length > 0;
                    return (
                      <button
                        key={dayObj.dateStr}
                        onClick={() => setSelectedDayModal(dayObj)}
                        className="flex flex-col items-center group flex-1"
                        title={`${dayObj.dateStr}: ${dayObj.tickets.length} Vorfälle`}
                      >
                        <span
                          className={`w-full h-3 rounded-sm transition group-hover:scale-110 ${
                            hasIssues ? 'bg-red-500' : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-[10px] font-mono text-slate-400 mt-1">
                          {String(dayObj.day).padStart(2, '0')}.
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* MITTLERE SPALTE (4/12): Offene Punkte / Supervisor-Liste */}
          <div className="lg:col-span-4 bg-[#273549] border border-slate-600/60 rounded-xl p-4 shadow-md flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-600 pb-1.5 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Aktive Störungen & Aufgaben
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                {activeAlarms.length} Offen
              </span>
            </div>

            {activeAlarms.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="text-3xl mb-2">✓</div>
                <div className="text-base font-bold text-emerald-300">
                  Alle ausgewählten Bereiche im grünen Bereich!
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Keine offenen Störungen vorhanden.
                </div>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
                {activeAlarms.map((alarm, idx) => (
                  <div
                    key={`${alarm.panelId}-${alarm.machineId}-${alarm.criterion}-${idx}`}
                    onClick={() => onCellClick(alarm.machineId, alarm.criterion, alarm.panelId)}
                    className="bg-[#1e293b] hover:bg-slate-800 border-l-4 border-red-500 border border-slate-700 rounded-lg p-3.5 cursor-pointer transition shadow"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                        {alarm.criterion}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-300">
                        {alarm.panelName}
                      </span>
                    </div>
                                        <div className="text-base font-bold text-white mb-1">
                      Maschine {alarm.machineId}
                    </div>

                    <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-700/80">
                      "{alarm.latestNote?.text || 'Keine Schichtnotiz hinterlegt.'}"
                    </p>

                    <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
                      <span>{alarm.latestNote?.author || 'Shopfloor'}</span>
                      <span>{alarm.latestNote?.timestamp || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECHTE SPALTE (3/12): Interaktive Monats-Kacheln & Dynamische Auswertung */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Interaktives Monats-Kalender-Raster */}
            <div className="bg-[#273549] border border-slate-600/60 rounded-xl p-4 shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 border-b border-slate-600 pb-1.5">
                Monats-Tracker ({new Date().toLocaleDateString('de-CH', { month: 'long' })})
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Klicke auf einen Tag, um die Störungen dieses Datums anzuzeigen.
              </p>

              <div className="grid grid-cols-7 gap-1.5">
                {currentMonthDays.map((dayObj) => {
                  const count = dayObj.tickets.length;
                  let cellStyle = 'bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300';
                  if (dayObj.isFuture) {
                    cellStyle = 'bg-slate-800/80 text-slate-500 cursor-default';
                  } else if (count >= 2) {
                    cellStyle = 'bg-red-500 text-white font-bold hover:bg-red-400 ring-1 ring-red-300';
                  } else if (count === 1) {
                    cellStyle = 'bg-amber-400 text-slate-950 font-bold hover:bg-amber-300';
                  }

                  return (
                    <button
                      key={dayObj.dateStr}
                      disabled={dayObj.isFuture}
                      onClick={() => setSelectedDayModal(dayObj)}
                      className={`aspect-square rounded flex items-center justify-center text-xs transition ${cellStyle}`}
                      title={
                        dayObj.isFuture
                          ? 'Zukünftiger Tag'
                          : `${dayObj.dateStr}: ${count} Vorfall/Vorfälle`
                      }
                    >
                      {dayObj.day}
                    </button>
                  );
                })}
              </div>

              {/* Legende */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-700">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> 0 Fälle
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> 1 Fall
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> 2+ Fälle
                </span>
              </div>
            </div>

            {/* Dynamische Schwerpunkt-Auswertung */}
            <div className="bg-[#273549] border border-slate-600/60 rounded-xl p-4 shadow-md flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 border-b border-slate-600 pb-1.5">
                Schwerpunkt-Auswertung (Dynamisch)
              </div>

              {criteriaStats.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  Noch keine Auffälligkeiten im gewählten Bereich.
                </div>
              ) : (
                <div className="space-y-3">
                  {criteriaStats.map(([crit, count]) => {
                    const maxCount = criteriaStats[0]?.[1] || 1;
                    const widthPct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={crit}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-200">{crit}</span>
                          <span className="text-amber-400">{count}x</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ANSICHT 2: ALTERNIERENDES EINZEL-BOARD */
        <div className="bg-white text-slate-900 rounded-xl p-4 shadow-xl">
          {panelsMap[currentSlide.id] && (
            <Matrix
              data={panelsMap[currentSlide.id].cells || {}}
              machines={panelsMap[currentSlide.id].machines || []}
              criteria={panelsMap[currentSlide.id].criteria || []}
              currentPanelName={panelsMap[currentSlide.id].name}
              onCellClick={(m, c) => onCellClick(m, c, currentSlide.id)}
              onAddMachine={onAddMachine}
              onAddCriterion={onAddCriterion}
              onDeleteMachine={onDeleteMachine}
              onDeleteCriterion={onDeleteCriterion}
            />
          )}
        </div>
      )}

      {/* INTERAKTIVES POPUP FÜR GEKLICKTES DATUM */}
      {selectedDayModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDayModal(null)}
        >
          <div
            className="bg-[#0f172a] border border-slate-600 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-amber-400">
                  Vorfälle am {selectedDayModal.dateStr}
                </h3>
                <p className="text-xs text-slate-400">
                  Gefilterte Abteilungen ({selectedGroupIds.length})
                </p>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            {selectedDayModal.tickets.length === 0 ? (
              <div className="p-6 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm font-semibold">
                An diesem Datum wurden keine Störungen gemeldet. Alles lief planmäßig!
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {selectedDayModal.tickets.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#1e293b] border-l-4 border-red-500 p-3.5 rounded-lg border border-slate-700"
                  >
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-mono font-bold text-amber-400">{t.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          t.status === 'Geschlossen'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white">
                      Maschine {t.machineId} — {t.criterion}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">{t.title}</div>
                    {t.cause && (
                      <div className="text-xs text-emerald-300 mt-1.5 bg-slate-900/70 p-2 rounded">
                        <strong>Ursache:</strong> {t.cause}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



