import { ArrowUpRight, Headphones, Image as ImageIcon, Play, Type } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl, formatDate } from '../lib/api.js';

const iconByType = { Video: Play, Article: Type, Image: ImageIcon, Podcast: Headphones };

export default function ContentCard({ content }) {
  const Icon = iconByType[content.contentType] || Play;
  return (
    <article className="content-card">
      <Link className="content-cover" to={`/content/${content._id}`} aria-label={`Read ${content.title}`}>
        {content.thumbnailUrl ? <img src={assetUrl(content.thumbnailUrl)} alt="" loading="lazy" /> : <div className={`cover-placeholder cover-${(content.contentType || 'other').toLowerCase()}`}><span className="cover-watermark">{content.category || 'STORY'}</span><span className="cover-play"><Icon size={23} /></span><span className="cover-stamp">CH<br /><b>01</b></span></div>}
        {content.isFeatured && <span className="featured-flag">FEATURED</span>}
      </Link>
      <div className="content-card-copy">
        <div className="card-eyebrow"><span>{content.category}</span><i />{content.contentType}<span className="card-date">{formatDate(content.publishedAt, { month: 'short', day: 'numeric' })}</span></div>
        <h3><Link to={`/content/${content._id}`}>{content.title}</Link></h3>
        {content.authorType === 'viewer' && content.authorName && <p className="content-author-byline">By <strong>{content.authorName}</strong></p>}
        <p>{content.description || 'Open this piece to explore the full story.'}</p>
        <Link className="card-read-link" to={`/content/${content._id}`}>Read the story <ArrowUpRight size={15} /></Link>
      </div>
    </article>
  );
}
