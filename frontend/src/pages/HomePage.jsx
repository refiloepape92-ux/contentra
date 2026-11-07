import { ArrowDown, ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ContentCard from '../components/ContentCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { api, assetUrl, formatDate } from '../lib/api.js';

const fallbackProfile = { displayName: 'Creator Studio', bio: 'A home for new stories, ideas, and conversations.', avatarUrl: '' };
const suggestedCategories = ['Education', 'Technology', 'Entertainment', 'Lifestyle'];

export default function HomePage() {
  const [profile, setProfile] = useState(fallbackProfile);
  const [contents, setContents] = useState([]);
  const [communityContents, setCommunityContents] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [communityNotice, setCommunityNotice] = useState('');

  useEffect(() => {
    api('/api/creator/profile').then((result) => setProfile({ ...fallbackProfile, ...result.profile })).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 180);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'All') params.set('category', category);
    setLoading(true);
    api(`/api/contents${params.size ? `?${params.toString()}` : ''}`)
      .then((result) => {
        if (!active) return;
        setContents(result.contents || []);
        setNotice('');
      })
      .catch((error) => {
        if (!active) return;
        setContents([]);
        setNotice(error.status === 503 ? 'Connect the MongoDB Atlas database to bring your published work online.' : 'We could not load the creator stories right now. Please try again in a moment.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, category]);

  useEffect(() => {
    let active = true;
    api('/api/contents/community')
      .then((result) => { if (active) { setCommunityContents(result.contents || []); setCommunityNotice(''); } })
      .catch(() => { if (active) { setCommunityContents([]); setCommunityNotice('Community stories are temporarily unavailable. Please try again soon.'); } })
      .finally(() => { if (active) setCommunityLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => {
    const available = [...suggestedCategories, ...contents.map((item) => item.category).filter(Boolean)];
    return ['All', ...new Map(available.map((item) => [item.toLowerCase(), item])).values()];
  }, [contents]);
  const featured = contents.find((item) => item.isFeatured) || contents[0];
  const listing = contents.filter((item) => item._id !== featured?._id);

  return (
    <div className="public-page">
      <div className="issue-strip"><span>INDEPENDENT CREATOR JOURNAL</span><span>{formatDate(new Date(), { month: 'long', year: 'numeric' }).toUpperCase()} <i /> VOL. 01</span></div>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-rule" /> A PLACE FOR IDEAS TO LAND</p>
          <div className="creator-intro">
            {profile.avatarUrl ? <img className="creator-avatar" src={assetUrl(profile.avatarUrl)} alt={`${profile.displayName} profile`} /> : <div className="creator-avatar creator-avatar-monogram" aria-hidden="true">{profile.displayName.slice(0, 1).toUpperCase()}</div>}
            <div><span className="small-label">CREATED BY</span><strong>{profile.displayName}</strong></div>
          </div>
          <h1>Stories worth<br /><em>staying for.</em></h1>
          <p className="hero-description">{profile.bio || fallbackProfile.bio}</p>
          <a className="text-cta" href="#stories">Explore my stories <ArrowDown size={17} /></a>
          <div className="hero-signature"><span>CURATED WITH CARE</span><i /><span>SHARED WITH YOU</span></div>
        </div>
        <div className="hero-feature-wrap">
          <div className="feature-topline"><span>THE CREATOR'S LATEST</span><span>001—∞</span></div>
          {featured ? (
            <Link className="feature-card" to={`/content/${featured._id}`}>
              {featured.thumbnailUrl ? <img src={assetUrl(featured.thumbnailUrl)} alt="" /> : <div className={`feature-art cover-${(featured.contentType || 'other').toLowerCase()}`}><span className="feature-art-word">{featured.category || 'IDEAS'}<br /><em>in motion</em></span><span className="feature-art-ring" /></div>}
              <div className="feature-overlay"><span className="feature-kicker">{featured.category} <i /> {featured.contentType}</span><h2>{featured.title}</h2><span className="feature-read">Read the feature <ArrowUpRight size={17} /></span></div>
              <span className="feature-corner">01<br /><i>FEATURE</i></span>
            </Link>
          ) : (
            <div className="feature-card feature-empty"><div className="feature-art"><span className="feature-art-word">A new story<br /><em>is on its way</em></span><span className="feature-art-ring" /></div><div className="feature-overlay"><span className="feature-kicker">THE FIRST EDITION</span><h2>Good things<br />are taking shape.</h2><span className="feature-read">Fresh work will appear here</span></div><span className="feature-corner">01<br /><i>FEATURE</i></span></div>
          )}
          <div className="hero-caption"><span>AN OPEN TAB FOR WHAT MATTERS</span><span>— {profile.displayName.toUpperCase()}</span></div>
        </div>
      </section>

      <section className="stories-section" id="stories">
        <div className="section-heading-row">
          <div><p className="eyebrow"><span className="eyebrow-rule" /> THE CREATOR'S READING ROOM</p><h2>Stories by<br /><em>{profile.displayName}.</em></h2></div>
          <p className="section-aside">This collection is for stories published by {profile.displayName}.<br />Viewer contributions have their own section below.</p>
        </div>
        <div className="discover-tools">
          <label className="search-box"><Search size={18} /><span className="visually-hidden">Search creator stories</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search my stories, ideas, topics…" /></label>
          <div className="category-scroll" aria-label="Filter creator stories by category"><SlidersHorizontal size={16} className="filter-symbol" />{categories.map((item) => <button key={item} type="button" className={`filter-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
        </div>
        {notice && <div className="connection-note" role="status">{notice}</div>}
        {loading ? <div className="loading-line">Gathering the creator's stories<span>···</span></div> : contents.length === 0 ? (
          <EmptyState title={search || category !== 'All' ? 'No creator stories found' : 'Your reading room is ready'} message={search || category !== 'All' ? 'Try a different search or category.' : notice || 'The creator’s published work will appear here. Community posts are shown separately below.'} />
        ) : (
          <div className="content-grid">{(featured ? [featured, ...listing] : contents).map((item) => <ContentCard key={item._id} content={item} />)}</div>
        )}
        <div className="section-endnote"><span>{contents.length.toString().padStart(2, '0')} CREATOR STORIES</span><span>MADE TO BE READ, WATCHED, AND SHARED <i /></span></div>
      </section>

      <section className="community-creators-section" id="other-creators">
        <div className="section-heading-row"><div><p className="eyebrow"><span className="eyebrow-rule" /> COMMUNITY SPOTLIGHT</p><h2>Other Content<br /><em>Creators.</em></h2></div><p className="section-aside">Stories shared by the viewer community,<br />published only after creator approval.</p></div>
        {communityLoading ? <div className="loading-line">Gathering community stories<span>···</span></div> : communityContents.length ? <div className="content-grid">{communityContents.map((item) => <ContentCard content={item} key={item._id} />)}</div> : <EmptyState title="Community stories are on their way" message={communityNotice || 'Viewer submissions will appear here under their authors’ names after the creator approves and publishes them.'} />}
        {communityContents.length > 0 && <div className="section-endnote"><span>{communityContents.length.toString().padStart(2, '0')} COMMUNITY STORIES</span><span>REVIEWED AND PUBLISHED BY THE CREATOR <i /></span></div>}
      </section>
      <section className="home-note"><span className="home-note-mark">C.</span><p>Good stories make room<br />for <em>good conversations.</em></p><Link to="/creator/login">Behind the scenes <ArrowUpRight size={17} /></Link></section>
    </div>
  );
}
