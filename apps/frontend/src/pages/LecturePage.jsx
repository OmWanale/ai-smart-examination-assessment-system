import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = '2f580e6adf3140b4b38521076ec57da7';

export function LecturePage() {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const clientRef = useRef(null);
  const localTracksRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);

  useEffect(() => {
    if (!roomId) {
      setError('No room ID provided');
      setLoading(false);
      return;
    }

    let mounted = true;
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    const addRemoteUser = (uid) => {
      setRemoteUsers((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
    };

    const removeRemoteUser = (uid) => {
      setRemoteUsers((prev) => prev.filter((id) => id !== uid));
      remoteVideoRefs.current.delete(uid);
    };

    const playRemoteVideo = (user) => {
      const container = remoteVideoRefs.current.get(user.uid);
      if (container && user.videoTrack) {
        user.videoTrack.play(container);
      }
    };

    const handleUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        addRemoteUser(user.uid);
        setTimeout(() => playRemoteVideo(user), 0);
      }
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
    };

    const handleUserUnpublished = (user, mediaType) => {
      if (mediaType === 'video') removeRemoteUser(user.uid);
    };

    const handleUserLeft = (user) => removeRemoteUser(user.uid);

    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-left', handleUserLeft);

    const initAgora = async () => {
      try {
        await client.join(APP_ID, roomId, null, null);
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = [audioTrack, videoTrack];
        if (localVideoRef.current) videoTrack.play(localVideoRef.current);
        await client.publish([audioTrack, videoTrack]);
        if (mounted) setLoading(false);
      } catch (err) {
        console.error('[LecturePage] Agora init failed:', err);
        if (mounted) {
          setError('Failed to start video call. Check camera/microphone permissions and try again.');
          setLoading(false);
        }
      }
    };

    initAgora();

    return () => {
      mounted = false;
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-left', handleUserLeft);

      const [audioTrack, videoTrack] = localTracksRef.current;
      if (audioTrack) {
        audioTrack.stop();
        audioTrack.close();
      }
      if (videoTrack) {
        videoTrack.stop();
        videoTrack.close();
      }

      client.leave().catch((leaveErr) => {
        console.error('[LecturePage] Leave channel failed:', leaveErr);
      });
    };
  }, [roomId]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a2e' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#16213e', color: '#fff' }}>
        <div style={{ fontWeight: 600 }}>Classyn AI — Live Lecture</div>
        <button
          onClick={() => window.history.back()}
          style={{ padding: '6px 14px', backgroundColor: '#e94560', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          Leave
        </button>
      </div>

      {loading && (
        <div style={{ padding: '10px 16px', color: '#fff' }}>
          Connecting to lecture...
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 16px', color: '#ff8a8a' }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px' }}>
        <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#fff', marginBottom: '8px', fontWeight: 600 }}>Your Video</div>
          <div ref={localVideoRef} style={{ width: '100%', minHeight: '320px', height: 'calc(100vh - 180px)', maxHeight: '520px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }} />
        </div>

        <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#fff', marginBottom: '8px', fontWeight: 600 }}>Remote User Video</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {remoteUsers.length === 0 ? (
              <div style={{ width: '100%', minHeight: '320px', height: 'calc(100vh - 180px)', maxHeight: '520px', borderRadius: '8px', backgroundColor: '#000', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Waiting for remote user...
              </div>
            ) : (
              remoteUsers.map((uid) => (
                <div
                  key={uid}
                  ref={(el) => {
                    if (el) remoteVideoRefs.current.set(uid, el);
                  }}
                  style={{ width: '100%', minHeight: '320px', height: 'calc(100vh - 180px)', maxHeight: '520px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
