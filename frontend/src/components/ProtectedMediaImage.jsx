import { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../lib/api.js';

export default function ProtectedMediaImage({ src, authToken, alt = '', className = '', loading = 'lazy' }) {
  const [resolved, setResolved] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let blobUrl = '';
    setResolved('');
    setFailed(false);
    resolveMediaUrl(src, authToken).then((url) => {
      if (url.startsWith('blob:')) blobUrl = url;
      if (active && url) setResolved(url);
      else if (active) setFailed(true);
      else if (blobUrl) URL.revokeObjectURL(blobUrl);
    }).catch(() => { if (active) setFailed(true); });
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src, authToken]);

  if (!src || failed) return <span className={`${className} protected-media-empty`} aria-hidden="true" />;
  if (!resolved) return <span className={`${className} protected-media-loading`} aria-label="Loading image" />;
  return <img className={className} src={resolved} alt={alt} loading={loading} onError={() => setFailed(true)} />;
}
