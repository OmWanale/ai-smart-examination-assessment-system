import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export function LectureRoom() {
  const { roomId } = useParams();
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useIframe, setUseIframe] = useState(false);

  console.log('[LectureRoom] roomId:', roomId);

  useEffect(() => {
    if (!roomId) {
      setError('No room ID provided');
      setLoading(false);
      return;
    }

    let api = null;

    const loadJitsi = () => {
      // Check if script is already loaded
      if (window.JitsiMeetExternalAPI) {
        console.log('[LectureRoom] Jitsi API already available');
        initJitsi();
        return;
      }

      console.log('[LectureRoom] Loading Jitsi External API script...');
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        console.log('[LectureRoom] Jitsi External API loaded successfully');
        console.log('[LectureRoom] JitsiMeetExternalAPI available:', !!window.JitsiMeetExternalAPI);
        initJitsi();
      };
      script.onerror = (e) => {
        console.error('[LectureRoom] Failed to load Jitsi API script, falling back to iframe', e);
        // Fallback to iframe instead of showing error
        setUseIframe(true);
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    const initJitsi = () => {
      if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
        console.warn('[LectureRoom] Container or API not ready, falling back to iframe');
        setUseIframe(true);
        setLoading(false);
        return;
      }

      try {
        console.log('[LectureRoom] Initializing Jitsi with room:', roomId);
        api = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: roomId,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'chat', 'raisehand', 'participants-pane',
              'tileview', 'hangup',
            ],
          },
        });

        jitsiApiRef.current = api;

        api.addListener('videoConferenceJoined', () => {
          console.log('[LectureRoom] Joined conference');
          setLoading(false);
        });

        api.addListener('readyToClose', () => {
          console.log('[LectureRoom] Conference ended');
          window.history.back();
        });

        // Fallback: hide loading after 5s even if event doesn't fire
        setTimeout(() => setLoading(false), 5000);
      } catch (err) {
        console.error('[LectureRoom] Jitsi init error, falling back to iframe:', err);
        setUseIframe(true);
        setLoading(false);
      }
    };

    loadJitsi();

    return () => {
      if (api) {
        try { api.dispose(); } catch (e) { /* ignore */ }
      }
      jitsiApiRef.current = null;
    };
  }, [roomId]);

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

      {/* Video container */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && !useIframe && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#1a1a2e', color: '#fff', zIndex: 10,
            flexDirection: 'column', gap: '12px',
          }}>
            <div style={{ fontSize: '32px' }}>🎥</div>
            <p>Connecting to lecture...</p>
          </div>
        )}

        {error && !useIframe && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#1a1a2e', color: '#e94560', zIndex: 10,
            flexDirection: 'column', gap: '12px',
          }}>
            <div style={{ fontSize: '32px' }}>❌</div>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '8px 20px', backgroundColor: '#0f3460', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Iframe fallback when External API fails to load */}
        {useIframe ? (
          <iframe
            src={`https://meet.jit.si/${roomId}`}
            title="Classyn AI Live Lecture"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            allowFullScreen
          />
        ) : (
          <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  );
}
