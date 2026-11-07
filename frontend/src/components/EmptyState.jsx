import { FilePlus2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ title = 'Nothing here yet', message = 'New work will appear here when it is ready.', action = false }) {
  return (
    <div className="empty-state">
      <div className="empty-mark"><FilePlus2 size={22} /></div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <Link className="button button-dark" to="/creator/content/new">Create your first post</Link>}
    </div>
  );
}
