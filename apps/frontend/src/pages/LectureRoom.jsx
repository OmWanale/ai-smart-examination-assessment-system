import { useParams } from 'react-router-dom';

export function LectureRoom() {
  const { roomId } = useParams();

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a2e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: '#16213e',
        color: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎥</span>
          <span style={{ fontWeight: 600 }}>Classyn AI — Live Lecture</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}#/lecture/${roomId}`;
              navigator.clipboard.writeText(url);
              alert('Link copied to clipboard!');
            }}
            style={{
              padding: '6px 14px',
              backgroundColor: '#0f3460',
              color: '#e0e0e0',
              border: '1px solid #1a4a7a',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            📋 Copy Link
          </button>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '6px 14px',
              backgroundColor: '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ← Leave
          </button>
        </div>
      </div>

      {/* Jitsi iframe */}
      <iframe
        src={`https://meet.jit.si/${roomId}`}
        title="Classyn AI Live Lecture"
        style={{ flex: 1, width: '100%', border: 'none' }}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        allowFullScreen
      />
    </div>
  );
}
