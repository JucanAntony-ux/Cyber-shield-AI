export interface ChecklistEntry {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistProps {
  items: ChecklistEntry[];
  onToggle: (id: string, completed: boolean) => void;
}

export default function Checklist({ items, onToggle }: ChecklistProps) {
  return (
    <ul className="checklist">
      {items.map((item) => (
        <li key={item.id}>
          <label>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(event) => onToggle(item.id, event.target.checked)}
            />
            <span className={item.completed ? 'done-text' : undefined}>{item.text}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
