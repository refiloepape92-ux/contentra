import { ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, resolveMediaUrl } from '../lib/api.js';

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const videoTypes = new Set(['video/mp4', 'video/webm']);
const IMAGE_LIMIT = 8 * 1024 * 1024;
const VIDEO_LIMIT = 100 * 1024 * 1024;
const ACCEPTED_FILES = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm';

function friendlySize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 1024 * 1024 ? 2 : 1)} MiB`;
}

export default function DeviceMediaUpload({ role, mediaUrl, thumbnailUrl, contentType, onChange, onUploadStateChange }) {
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaPreviewKind, setMediaPreviewKind] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [mediaMessage, setMediaMessage] = useState('');
  const [coverMessage, setCoverMessage] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [coverError, setCoverError] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const mediaBlob = useRef(null);
  const coverBlob = useRef(null);
  const mediaResolvedBlob = useRef(null);
  const coverResolvedBlob = useRef(null);
  const initialMediaUrl = useRef(mediaUrl).current;
  const initialThumbnailUrl = useRef(thumbnailUrl).current;

  useEffect(() => {
    let active = true;
    const authToken = role === 'viewer'
      ? window.localStorage.getItem('creatorhub_viewer_token')
      : window.sessionStorage.getItem('creatorhub_token');
    Promise.all([
      resolveMediaUrl(initialMediaUrl, authToken),
      resolveMediaUrl(initialThumbnailUrl, authToken),
    ]).then(([media, cover]) => {
      if (!active) {
        if (media.startsWith('blob:')) URL.revokeObjectURL(media);
        if (cover.startsWith('blob:')) URL.revokeObjectURL(cover);
        return;
      }
      setMediaPreview(media);
      setCoverPreview(cover);
      if (media.startsWith('blob:')) mediaResolvedBlob.current = media;
      if (cover.startsWith('blob:')) coverResolvedBlob.current = cover;
    }).catch(() => {});
    return () => {
      active = false;
      for (const ref of [mediaBlob, coverBlob, mediaResolvedBlob, coverResolvedBlob]) {
        if (ref.current) URL.revokeObjectURL(ref.current);
        ref.current = null;
      }
    };
  }, [role, initialMediaUrl, initialThumbnailUrl]);

  useEffect(() => {
    onUploadStateChange?.(uploadingMedia || uploadingCover);
  }, [uploadingMedia, uploadingCover, onUploadStateChange]);

  function localPreview(file, setPreview, blobRef, resolvedRef) {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    if (resolvedRef.current) URL.revokeObjectURL(resolvedRef.current);
    resolvedRef.current = null;
    const url = URL.createObjectURL(file);
    blobRef.current = url;
    setPreview(url);
  }

  async function upload(file, purpose) {
    const isImage = imageTypes.has(file.type);
    const isVideo = videoTypes.has(file.type);
    const errorSetter = purpose === 'media' ? setMediaError : setCoverError;
    const messageSetter = purpose === 'media' ? setMediaMessage : setCoverMessage;
    if (purpose === 'cover' && !isImage) {
      errorSetter('Choose a JPEG, PNG, WebP or GIF image for the cover.');
      return;
    }
    if (!isImage && !isVideo) {
      errorSetter('Choose a JPEG, PNG, WebP or GIF image, or an MP4 or WebM video.');
      return;
    }
    const limit = isImage ? IMAGE_LIMIT : VIDEO_LIMIT;
    if (file.size > limit) {
      errorSetter(`${isImage ? 'Images' : 'Videos'} must be no larger than ${isImage ? '8 MiB' : '100 MiB'}.`);
      return;
    }

    errorSetter('');
    messageSetter('');
    if (purpose === 'media') {
      localPreview(file, setMediaPreview, mediaBlob, mediaResolvedBlob);
      setMediaPreviewKind(isImage ? 'image' : 'video');
      setUploadingMedia(true);
    } else {
      localPreview(file, setCoverPreview, coverBlob, coverResolvedBlob);
      setUploadingCover(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const authToken = role === 'viewer' ? window.localStorage.getItem('creatorhub_viewer_token') : undefined;
      const result = await api(`/api/uploads/${role}`, { method: 'POST', authToken, body: formData });
      if (purpose === 'media') {
        onChange('mediaUrl', result.url);
        if (isImage && !thumbnailUrl) onChange('thumbnailUrl', result.url);
        onChange('contentType', isImage ? 'Image' : 'Video');
        setMediaMessage(`${file.name} · ${friendlySize(result.bytes)} uploaded`);
      } else {
        onChange('thumbnailUrl', result.url);
        setCoverMessage(`${file.name} · ${friendlySize(result.bytes)} uploaded`);
      }
    } catch (error) {
      errorSetter(error.message || 'The file could not be uploaded. Try again.');
    } finally {
      if (purpose === 'media') setUploadingMedia(false);
      else setUploadingCover(false);
    }
  }

  const hasDeviceMedia = mediaPreview.startsWith('blob:') || mediaPreview.includes('/uploads/');
  const previewKind = mediaPreviewKind || (hasDeviceMedia && contentType === 'Video' ? 'video' : hasDeviceMedia && contentType === 'Image' ? 'image' : '');

  return (
    <section className="device-media-fields" aria-label="Upload images or video">
      <div className="device-media-heading"><div><span className="device-media-icon"><ImagePlus size={16} /></span><div><strong>Add media from your device</strong><small>Images up to 8 MiB · MP4/WebM videos up to 100 MiB</small></div></div></div>
      <div className="device-media-grid">
        <div className="device-media-slot">
          <label className="device-file-label">Main image or video<input type="file" accept={ACCEPTED_FILES} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file, 'media'); event.target.value = ''; }} disabled={uploadingMedia || uploadingCover} /></label>
          <p className="device-media-help">Images also become the story cover unless you choose a separate cover.</p>
          {uploadingMedia && <p className="device-upload-status" role="status"><LoaderCircle className="device-spinner" size={14} /> Uploading media…</p>}
          {mediaMessage && !uploadingMedia && <p className="device-upload-status" role="status">{mediaMessage}</p>}
          {mediaError && <p className="form-error device-upload-error" role="alert">{mediaError}</p>}
          {mediaPreview && <div className="device-media-preview">{previewKind === 'video' ? <video src={mediaPreview} controls playsInline preload="metadata" /> : previewKind === 'image' ? <img src={mediaPreview} alt="Selected story media preview" /> : <p>Current media link is set. Choose a file to replace it.</p>}</div>}
        </div>
        <div className="device-media-slot">
          <label className="device-file-label">Cover image (optional)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file, 'cover'); event.target.value = ''; }} disabled={uploadingMedia || uploadingCover} /></label>
          <p className="device-media-help">A separate image looks best on the home page and story cards.</p>
          {uploadingCover && <p className="device-upload-status" role="status"><LoaderCircle className="device-spinner" size={14} /> Uploading cover…</p>}
          {coverMessage && !uploadingCover && <p className="device-upload-status" role="status">{coverMessage}</p>}
          {coverError && <p className="form-error device-upload-error" role="alert">{coverError}</p>}
          {coverPreview && <div className="device-cover-preview"><img src={coverPreview} alt="Selected cover image preview" /></div>}
        </div>
      </div>
      <p className="device-storage-note"><Upload size={13} /> Files are stored by the local backend in its ignored <code>backend/uploads</code> folder.</p>
    </section>
  );
}
