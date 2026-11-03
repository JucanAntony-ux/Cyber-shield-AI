interface ParagraphsProps {
  text: string;
}

export default function Paragraphs({ text }: ParagraphsProps) {
  return (
    <div className="prose">
      {text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
    </div>
  );
}
