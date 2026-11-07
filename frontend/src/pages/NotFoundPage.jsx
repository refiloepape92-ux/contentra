import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <main className="not-found-page"><span className="not-found-number">404</span><p className="eyebrow"><span className="eyebrow-rule" /> PAGE NOT FOUND</p><h1>This page went<br /><em>off-script.</em></h1><p>That link may have moved. The reading room is still right here.</p><Link className="button button-dark" to="/"><ArrowLeft size={16} /> Back to Creator Hub</Link></main>;
}
