import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronDown, CircleHelp, Download, Grid2X2, Leaf, Maximize, MousePointer2, Plus, RotateCw, Save, Search, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { CATALOG, getEntry, GRID } from './catalog';
import { addItem, DEFAULT_LAYOUT, footprint, loadLayout, moveItem, parseLayout, PRESETS, removeItem, resizeRoom, rotateItem, saveLayout } from './model';
import type { FurnitureKind, Layout, LayoutResult } from './types';
import Scene from './Scene';
import Illustration from './Illustration';

type Notice = { text: string; error: boolean };
type Dialog = { title: string; description: string; action?: () => void };
const clone = (layout: Layout): Layout => JSON.parse(JSON.stringify(layout));

export default function App() {
  const [initial] = useState(loadLayout);
  const [layout, setLayout] = useState<Layout>(initial.layout);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(initial.error ? { text: initial.error, error: true } : null);
  const [saved, setSaved] = useState(false);
  const [cameraMode, setCameraMode] = useState<'perspective' | 'top'>('perspective');
  const [cameraReset, setCameraReset] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState('All pieces');
  const [search, setSearch] = useState('');
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [roomWidth, setRoomWidth] = useState(String(layout.room.width));
  const [roomDepth, setRoomDepth] = useState(String(layout.room.depth));
  const [positionX, setPositionX] = useState('');
  const [positionZ, setPositionZ] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = layout.items.find(item => item.id === selectedId);
  const entry = selected ? getEntry(selected.kind) : null;
  const sceneReady = useCallback(() => setReady(true), []);

  const notify = useCallback((text: string, error = false) => setNotice({ text, error }), []);
  const apply = useCallback((result: LayoutResult, message?: string) => {
    if (result.error) { notify(result.error, true); return false; }
    setLayout(result.layout);
    setSaved(false);
    if (message) notify(message);
    return true;
  }, [notify]);

  const handleMove = useCallback((id: string, x: number, z: number) => {
    apply(moveItem(layout, id, x, z), 'A fresh perspective. Piece moved.');
  }, [layout, apply]);
  function rotate() {
    if (selected) apply(rotateItem(layout, selected.id), 'Turned 90°. Looking good.');
  }
  function remove() {
    if (selected) {
      setLayout(removeItem(layout, selected.id));
      setSelectedId(null);
      setSaved(false);
      notify(`${getEntry(selected.kind).name} removed.`);
    }
  }
  function add(kind: FurnitureKind) {
    const result = addItem(layout, kind);
    if (apply(result, `${getEntry(kind).name} added. Make it feel at home.`)) {
      setSelectedId(result.layout.items.at(-1)!.id);
    }
  }
  function nudge(x: number, z: number) {
    if (selected) handleMove(selected.id, selected.x + x, selected.z + z);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const error = saveLayout(layout);
      setSaved(!error);
      if (error) notify(error, true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [layout, notify]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), notice.error ? 9000 : 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    setRoomWidth(String(layout.room.width));
    setRoomDepth(String(layout.room.depth));
  }, [layout.room.width, layout.room.depth]);
  useEffect(() => {
    setPositionX(selected ? String(selected.x) : '');
    setPositionZ(selected ? String(selected.z) : '');
  }, [selected?.id, selected?.x, selected?.z]);
  useEffect(() => {
    const element = dialogRef.current;
    if (dialog && element && !element.open) element.showModal();
    else if (!dialog && element?.open) element.close();
  }, [dialog]);

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]') || dialog) return;
      if (event.key === 'Escape') { setSelectedId(null); setPresetsOpen(false); return; }
      if (!selected || event.ctrlKey || event.metaKey || event.altKey) return;
      const directions: Record<string, [number, number]> = { ArrowLeft: [-GRID, 0], ArrowRight: [GRID, 0], ArrowUp: [0, -GRID], ArrowDown: [0, GRID] };
      if (directions[event.key]) { event.preventDefault(); nudge(...directions[event.key]); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); rotate(); }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); remove(); }
    }
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  });

  function switchLayout(next: Layout) {
    setLayout(clone(next));
    setSelectedId(null);
    setSaved(false);
    setPresetsOpen(false);
    setCameraReset(value => value + 1);
    notify('A fresh start. Your new room is ready.');
  }
  function confirmPreset(next: Layout) {
    setPresetsOpen(false);
    setDialog({ title: `Make room for ${next.name.toLowerCase()}?`, description: 'This replaces the current room and its saved layout. Export a copy first if you would like to keep it.', action: () => switchLayout(next) });
  }
  function exportLayout() {
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layout.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'room-remix'}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('A little room to take with you. JSON exported.');
  }
  async function importLayout(file: File | undefined) {
    if (!file) return;
    if (file.size > 200_000) { notify('This file is too big. Choose a Room Remix JSON export under 200 KB.', true); return; }
    try {
      const result = parseLayout(await file.text());
      if (result.error) { notify(result.error, true); return; }
      setDialog({ title: 'Bring this room home?', description: `Import “${result.layout.name}” with ${result.layout.items.length} pieces? This replaces your current saved room.`, action: () => switchLayout(result.layout) });
    } catch { notify('That file could not be read. Try a Room Remix JSON export.', true); }
  }
  const catalog = CATALOG.filter(item => (category === 'All pieces' || item.category === category) && `${item.name} ${item.kind} ${item.subtitle}`.toLowerCase().includes(search.toLowerCase()));
  const occupiedArea = layout.items.reduce((area, item) => { const size = footprint(item); return area + size.width * size.depth; }, 0);

  return <div className="app-shell">
    <header className="site-header">
      <a className="wordmark" href="./" aria-label="Room Remix home"><span className="brand-mark"><span /><span /><span /></span>room<span className="wordmark-light">remix</span><span className="brand-dot">®</span></a>
      <div className="header-note"><span className="tiny-line" /> A LITTLE SPACE. A LOT OF POSSIBILITY.</div>
      <div className="header-actions">
        <button className="text-button help-button" onClick={() => setDialog({ title: 'A little guidance', description: 'Add a piece from the collection. Click and drag furniture to move it in 0.25 m steps; red means that spot is blocked. Drag empty space to orbit, right-drag to pan, and scroll or pinch to zoom. On touch, use one finger to orbit and two to pan or zoom. Top view makes precise placement easier. Select any piece from the room list for button and numeric controls. Keyboard: arrows move a selected piece, R rotates, Delete removes, and Escape deselects. Room changes autosave in this browser. Export JSON for a portable backup. Resizing never removes furniture. Presets and reset ask before replacing your layout. WebGL and hardware acceleration are needed for the 3D view.' })}><CircleHelp size={17} /> How to play</button>
        <button className="button primary save-button" onClick={() => { const error = saveLayout(layout); setSaved(!error); notify(error || 'Room saved in this browser. Come back any time.', !!error); }}><Save size={16} /><span>Save room</span></button>
      </div>
    </header>

    <main>
      <section className="intro">
        <div><p className="eyebrow"><span /> YOUR PERSONAL SPACE, REIMAGINED</p><h1>A little rearranging.<span> A whole new feeling.</span></h1></div>
        <div className="intro-aside"><span className="leaf-circle"><Leaf size={20} strokeWidth={1.4} /></span><p>No heavy lifting.<br /><strong>Just a little imagination.</strong></p></div>
      </section>

      <div className="studio">
        <aside className="catalog-panel" aria-label="Furniture collection">
          <div className="panel-title"><div><p className="eyebrow">THE GOOD STUFF</p><h2>The collection<span className="count-badge">08</span></h2></div></div>
          <label className="search-field"><Search size={16} /><input aria-label="Search furniture" placeholder="Find your next favorite…" value={search} onChange={event => setSearch(event.target.value)} /><span>/</span></label>
          <div className="category-tabs" aria-label="Furniture category">
            {['All pieces', 'Living', 'Bedroom', 'Workspace', 'Finishing touches'].map(name => <button key={name} onClick={() => setCategory(name)} className={category === name ? 'active' : ''} aria-pressed={category === name}>{name}</button>)}
          </div>
          <div className="catalog-grid">
            {catalog.map(item => <button className="catalog-card" key={item.kind} onClick={() => add(item.kind)} aria-label={`Add ${item.name}`} data-testid={`add-${item.kind}`}>
              <span className={`catalog-art art-${item.kind}`}><Illustration kind={item.kind} /><span className="add-piece"><Plus size={14} /></span></span>
              <span className="catalog-name">{item.name}</span><span className="catalog-size">{item.width.toFixed(2)} × {item.depth.toFixed(2)} m</span>
            </button>)}
            {catalog.length === 0 && <p className="empty-search">Nothing here just yet. Try another word.</p>}
          </div>
          <div className="collection-note"><Sparkles size={16} /><p>A few well-chosen pieces.<br /><strong>Endless ways to make it yours.</strong></p></div>
        </aside>

        <section className="room-panel" aria-label="Room design studio">
          <div className="room-topbar">
            <div className="preset-picker">
              <button className="preset-button" onClick={() => setPresetsOpen(!presetsOpen)} aria-expanded={presetsOpen} aria-controls="preset-menu"><span className="preset-dot" />{layout.name}<ChevronDown size={14} /></button>
              {presetsOpen && <div className="preset-menu" id="preset-menu"><p className="eyebrow">START WITH A FEELING</p>{PRESETS.map(preset => <button key={preset.id} onClick={() => confirmPreset(preset.layout)}><span className={`preset-thumbnail ${preset.id}`}><Illustration kind={preset.id === 'living' ? 'sofa' : 'bed'} /></span><span><strong>{preset.name}</strong><small>{preset.description}</small></span><ArrowUpRight size={15} /></button>)}</div>}
            </div>
            <div className="camera-toggle" aria-label="Camera view"><button className={cameraMode === 'perspective' ? 'active' : ''} aria-pressed={cameraMode === 'perspective'} onClick={() => setCameraMode('perspective')}>3D view</button><button className={cameraMode === 'top' ? 'active' : ''} aria-pressed={cameraMode === 'top'} onClick={() => setCameraMode('top')}>Top view</button></div>
          </div>
          <div className="canvas-container" data-webgl={ready ? 'ready' : 'loading'} data-testid="room-scene">
            <div className="scene-kicker"><span className="scene-sparkle">✳</span> A SPACE TO CALL YOUR OWN</div>
            <Scene layout={layout} selectedId={selectedId} onSelect={setSelectedId} onMove={handleMove} cameraMode={cameraMode} cameraReset={cameraReset} showGrid={showGrid} onReady={sceneReady} />
            <div className="scene-stamp" aria-hidden="true"><span>MAKE YOURSELF</span><i>at home.</i></div>
            <div className="scene-corner-left"><span className="room-dimensions">{layout.room.width.toFixed(2)} <span>×</span> {layout.room.depth.toFixed(2)} <small>m</small></span><span className="scale-caption">BIG IDEAS WELCOME</span></div>
            <div className="scene-view-tools"><button className={showGrid ? 'icon-button active' : 'icon-button'} title="Toggle 0.25 m grid" aria-label="Toggle grid" aria-pressed={showGrid} onClick={() => setShowGrid(!showGrid)}><Grid2X2 size={17} /></button><button className="icon-button" title="Reset camera" aria-label="Reset camera" onClick={() => setCameraReset(value => value + 1)}><Maximize size={17} /></button></div>
          </div>
          <div className={`selection-bar ${selected ? 'has-selection' : ''}`}>
            {selected && entry ? <><div className="selection-name"><span className="selected-dot" /><span><strong>{entry.name}</strong><small>SELECTED · {selected.rotation}°</small></span></div><div className="selection-actions"><button onClick={rotate} aria-label={`Rotate ${entry.name}`}><RotateCw size={16} />Rotate <kbd>R</kbd></button><span className="toolbar-divider" /><button className="delete-action" onClick={remove} aria-label={`Remove ${entry.name}`}><Trash2 size={16} /><span>Remove</span></button></div></> : <><span className="selection-prompt"><MousePointer2 size={17} /><strong>Find your flow.</strong><span> Add a piece, then make it yours.</span></span><span className="grid-label"><span />0.25 m snap</span></>}
          </div>
          <div className="scene-instructions"><span><span className="mouse-icon" /> Drag to orbit</span><span><span className="hand-icon">↔</span> Right-drag to pan</span><span><span className="scroll-icon">↕</span> Scroll to zoom</span><button onClick={() => setDialog({ title: 'Make it yours, one move at a time', description: 'Click a piece to select it, then drag it to a new spot. All moves snap to a 0.25 m grid. A red footprint means the piece is outside the room or overlaps another piece; it will return to its last valid spot. Use the room list to select pieces on any screen, then the arrow buttons or X/Z position fields to move them precisely. Arrow keys move selected furniture, R turns it, and Delete removes it.' })}>A few pointers <ArrowUpRight size={12} /></button></div>
        </section>

        <aside className="details-panel" aria-label="Room settings and furniture">
          <div className="details-header"><p className="eyebrow">THE BIG PICTURE</p><h2>Your room</h2></div>
          <label className="field-label" htmlFor="room-name">Give it a name</label>
          <input id="room-name" className="room-name-input" value={layout.name} maxLength={80} onChange={event => { setLayout({ ...layout, name: event.target.value }); setSaved(false); }} onBlur={() => { if (!layout.name.trim()) setLayout({ ...layout, name: 'My little room' }); }} />
          <form className="dimensions-form" onSubmit={event => { event.preventDefault(); apply(resizeRoom(layout, Number(roomWidth), Number(roomDepth)), 'A little more room for possibility.'); }}>
            <div className="dimension-fields"><label>Width <span><input aria-label="Room width" type="number" min="3" max="10" step=".25" required value={roomWidth} onChange={event => setRoomWidth(event.target.value)} /><small>m</small></span></label><span className="dimension-times">×</span><label>Depth <span><input aria-label="Room depth" type="number" min="3" max="10" step=".25" required value={roomDepth} onChange={event => setRoomDepth(event.target.value)} /><small>m</small></span></label></div>
            <div className="area-row"><span>{(layout.room.width * layout.room.depth).toFixed(1)} m² of possibility</span><button type="submit">Apply size <ArrowRight size={12} /></button></div>
          </form>
          <div className="section-rule" />
          <div className="furniture-heading"><h3>In this room <span>{layout.items.length.toString().padStart(2, '0')}</span></h3><span>{Math.round(occupiedArea / (layout.room.width * layout.room.depth) * 100)}% filled</span></div>
          <div className="room-item-list" aria-label="Furniture in this room">
            {layout.items.map((item, index) => <button key={item.id} className={selectedId === item.id ? 'room-item selected' : 'room-item'} onClick={() => setSelectedId(selectedId === item.id ? null : item.id)} aria-pressed={selectedId === item.id} aria-label={`Select ${getEntry(item.kind).name}, piece ${index + 1}`} data-testid={`room-item-${item.kind}`}><span className="list-item-art"><Illustration kind={item.kind} small /></span><span>{getEntry(item.kind).name}<small>{item.rotation}° · {item.x.toFixed(2)}, {item.z.toFixed(2)} m</small></span><span className="list-select-dot">{selectedId === item.id ? <Check size={10} /> : null}</span></button>)}
            {layout.items.length === 0 && <p className="empty-room"><Leaf size={22} />A blank canvas.<br />Add something you love.</p>}
          </div>
          {selected && entry ? <div className="position-editor">
            <div className="position-heading"><h3>A little to the left?</h3><span>0.25 m / step</span></div>
            <div className="nudge-controls"><button aria-label="Move left" onClick={() => nudge(-GRID, 0)}><ArrowLeft size={16} /></button><div><button aria-label="Move toward back wall" onClick={() => nudge(0, -GRID)}><ArrowUp size={16} /></button><button aria-label="Move toward front" onClick={() => nudge(0, GRID)}><ArrowDown size={16} /></button></div><button aria-label="Move right" onClick={() => nudge(GRID, 0)}><ArrowRight size={16} /></button><span>Or use your<br /><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> keys</span></div>
            <form className="position-form" onSubmit={event => { event.preventDefault(); handleMove(selected.id, Number(positionX), Number(positionZ)); }}><label>X <input aria-label="Piece X position" type="number" step=".25" required value={positionX} onChange={event => setPositionX(event.target.value)} /></label><label>Z <input aria-label="Piece Z position" type="number" step=".25" required value={positionZ} onChange={event => setPositionZ(event.target.value)} /></label><button type="submit" aria-label="Apply furniture position"><Check size={16} /></button></form>
          </div> : <div className="room-tip"><span>GOOD TO KNOW</span><p>A little breathing room makes<br />every piece feel more at home.</p><div className="breathing-doodle"><span /><span /><span /></div></div>}
          <div className="layout-actions"><button onClick={exportLayout}><Download size={14} /> Export JSON</button><button onClick={() => fileInput.current?.click()}><Upload size={14} /> Import</button></div>
          <input className="sr-only" type="file" accept=".json,application/json" ref={fileInput} aria-label="Import room JSON" onChange={event => { void importLayout(event.target.files?.[0]); event.target.value = ''; }} />
          <div className="details-footer"><span className={`save-status ${saved ? 'saved' : ''}`} role="status">{saved ? <Check size={12} /> : <span className="saving-dot" />}{saved ? 'Saved on this device' : 'Saving your space…'}</span><button onClick={() => setDialog({ title: 'A fresh start?', description: 'Reset to Sunday living? This replaces your current room and its saved layout. Export a JSON copy first to keep your design.', action: () => switchLayout(DEFAULT_LAYOUT) })}>Reset room</button></div>
        </aside>
      </div>
      <footer className="site-footer"><span>A room is a feeling. <i>Make it a good one.</i></span><span>THOUGHTFULLY MADE FOR EVERYDAY SPACES <Leaf size={12} /></span></footer>
    </main>
    {notice && <div className={`notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.error ? <CircleHelp size={17} /> : <Check size={17} />}<span>{notice.text}</span><button aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={15} /></button></div>}
    <dialog ref={dialogRef} onCancel={() => setDialog(null)} onClose={() => setDialog(null)} className="app-dialog">
      {dialog && <><button className="dialog-close icon-button" aria-label="Close dialog" onClick={() => setDialog(null)}><X size={20} /></button><span className="dialog-leaf"><Leaf size={28} /></span><p className="eyebrow">ROOM FOR POSSIBILITY</p><h2>{dialog.title}</h2><p>{dialog.description}</p><div className="dialog-actions">{dialog.action ? <><button className="button secondary" onClick={() => setDialog(null)}>Keep my room</button><button className="button primary" onClick={() => { dialog.action?.(); setDialog(null); }}>Yes, make a fresh start <ArrowRight size={16} /></button></> : <button className="button primary" onClick={() => setDialog(null)}>Got it. Let’s make room. <ArrowRight size={16} /></button>}</div></>}
    </dialog>
  </div>;
}
